import { useState, useEffect, useRef, useCallback } from "react";
import { subscriptionApi } from "@/lib/api";
import {
  interpretXenditStatus,
  normalizeXenditCheckout,
  normalizeXenditConflict,
  XENDIT_POLL_INTERVAL_MS,
  XENDIT_MAX_POLLS,
} from "@/lib/xendit";

// Alur Xendit one-time (dipindah dari SubscriptionPage yang sudah 800+ baris).
// UI (tombol + status box) tetap di page; hook ini murni state + network.
//
// Kontrak:
//   getSelectedPlan() → plan { id, name } | null — paket terpilih saat klik.
//   onPaymentSuccess(planName?) — dipanggil saat poll membaca status paid.
//   onError(message) — error checkout/terminal non-retry (409 ditangani sendiri).
//
// State xendit: null | waiting | conflict | declined | expired | not-found | timeout.
//   waiting/conflict = polling jalan (tombol checkout dikunci via xenditBusy).
export function useXenditCheckout({ getSelectedPlan, onPaymentSuccess, onError }) {
  const [xenditLoading, setXenditLoading] = useState(false);
  const [xendit, setXendit] = useState(null);
  const pollRef = useRef({ timer: null, attempts: 0, paymentId: null });

  // Bersihkan timer poll saat unmount (pindah halaman di tengah polling).
  useEffect(() => () => {
    if (pollRef.current.timer) clearTimeout(pollRef.current.timer);
    pollRef.current = { timer: null, attempts: 0, paymentId: null };
  }, []);

  const stopXenditPoll = useCallback(() => {
    if (pollRef.current.timer) clearTimeout(pollRef.current.timer);
    pollRef.current = { timer: null, attempts: 0, paymentId: null };
  }, []);

  // Poll GET /subscription/payments/:paymentId sampai terminal (paid/expired/
  // declined/not-found) atau batas MAX_POLLS. Interval > TTL GET-cache (4s)
  // supaya tiap poll benar-benar nembak backend.
  // showWaiting=false (kasus 409): kartu resume dipertahankan selama polling
  // latar, hanya hasil terminal yang menimpanya.
  const startXenditPoll = useCallback((paymentId, redirectUrl, plan, showWaiting = true) => {
    if (pollRef.current.timer) clearTimeout(pollRef.current.timer);
    pollRef.current = { timer: null, attempts: 0, paymentId };
    const tick = async () => {
      const cur = pollRef.current;
      if (!cur.paymentId || cur.paymentId !== paymentId) return; // dihentikan/diganti
      try {
        const res = await subscriptionApi.getPayment(cur.paymentId);
        if (pollRef.current.paymentId !== paymentId) return;
        const { outcome, payment } = interpretXenditStatus(res);
        if (outcome === 'paid') {
          if (pollRef.current.timer) clearTimeout(pollRef.current.timer);
          pollRef.current = { timer: null, attempts: 0, paymentId: null };
          onPaymentSuccess?.(plan?.name);
          return;
        }
        if (outcome === 'expired') {
          if (pollRef.current.timer) clearTimeout(pollRef.current.timer);
          pollRef.current = { timer: null, attempts: 0, paymentId: null };
          setXendit({ status: 'expired', paymentId });
          return;
        }
        if (outcome === 'declined') {
          if (pollRef.current.timer) clearTimeout(pollRef.current.timer);
          pollRef.current = { timer: null, attempts: 0, paymentId: null };
          setXendit({ status: 'declined', paymentId, failureReason: payment.failureReason, redirectUrl });
          return;
        }
        // pending → lanjut (atau timeout bila cap tercapai).
        cur.attempts += 1;
        if (cur.attempts >= XENDIT_MAX_POLLS) {
          if (pollRef.current.timer) clearTimeout(pollRef.current.timer);
          pollRef.current = { timer: null, attempts: 0, paymentId: null };
          setXendit({ status: 'timeout', paymentId, redirectUrl });
          return;
        }
        cur.timer = setTimeout(tick, XENDIT_POLL_INTERVAL_MS);
      } catch (e) {
        if (pollRef.current.paymentId !== paymentId) return;
        // 404 = payment tak ada → stop + retry. Error lain (jaringan/5xx)
        // dianggap transient → poll lagi sampai cap.
        if (e?.status === 404) {
          if (pollRef.current.timer) clearTimeout(pollRef.current.timer);
          pollRef.current = { timer: null, attempts: 0, paymentId: null };
          setXendit({ status: 'not-found', paymentId });
          return;
        }
        cur.attempts += 1;
        if (cur.attempts >= XENDIT_MAX_POLLS) {
          if (pollRef.current.timer) clearTimeout(pollRef.current.timer);
          pollRef.current = { timer: null, attempts: 0, paymentId: null };
          setXendit({ status: 'timeout', paymentId, redirectUrl });
          return;
        }
        cur.timer = setTimeout(tick, XENDIT_POLL_INTERVAL_MS);
      }
    };
    if (showWaiting) setXendit({ status: 'waiting', paymentId, redirectUrl });
    tick(); // poll pertama langsung (tangkap sukses instan)
  }, [onPaymentSuccess]);

  const openXenditTab = (url) => {
    try {
      return window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      return null;
    }
  };

  // Checkout Xendit: POST payment → buka redirectUrl di tab baru → poll status.
  // 409 (masih ada pending lama) → tampilkan resume + poll payment itu.
  const handleXendit = useCallback(async () => {
    const plan = getSelectedPlan?.() || null;
    if (!plan) {
      onError?.("Pilih paket langganan terlebih dahulu.");
      return;
    }
    if (String(plan.id).startsWith("dummy-")) {
      onError?.("Paket tidak tersedia dari server. Coba lagi nanti.");
      return;
    }
    if (pollRef.current.timer) clearTimeout(pollRef.current.timer);
    pollRef.current = { timer: null, attempts: 0, paymentId: null };
    onError?.("");
    setXendit(null);
    setXenditLoading(true);
    try {
      const checkout = normalizeXenditCheckout(await subscriptionApi.checkoutXendit(plan.id));
      if (!checkout) throw new Error("Respons checkout tak lengkap, coba lagi.");
      // Tab dibuka SETELAH redirectUrl tiba (jangan tab kosong dulu).
      // Bila popup diblokir (null), user tetap bisa lewat tombol di status box.
      openXenditTab(checkout.redirectUrl);
      startXenditPoll(checkout.paymentId, checkout.redirectUrl, plan);
    } catch (e) {
      if (e?.status === 409) {
        const pp = normalizeXenditConflict(e?.data);
        if (pp) {
          setXendit({
            status: 'conflict',
            message: e.message,
            paymentId: pp.paymentId,
            invoiceNumber: pp.invoiceNumber,
            amount: pp.amount,
            redirectUrl: pp.redirectUrl,
          });
          startXenditPoll(pp.paymentId, pp.redirectUrl, plan, false);
          return;
        }
      }
      onError?.(e.message || "Gagal memproses pembayaran Xendit, coba lagi");
    } finally {
      setXenditLoading(false);
    }
  }, [getSelectedPlan, onPaymentSuccess, onError, startXenditPoll]);

  // Retry terminal (expired/not-found/timeout): reset → user checkout ulang.
  const handleXenditRetry = useCallback(() => {
    if (pollRef.current.timer) clearTimeout(pollRef.current.timer);
    pollRef.current = { timer: null, attempts: 0, paymentId: null };
    setXendit(null);
    onError?.("");
  }, [onError]);

  // Cek ulang manual (declined/timeout): poll lagi payment yang sama.
  const handleXenditRecheck = useCallback(() => {
    if (!xendit?.paymentId) return;
    const plan = getSelectedPlan?.() || null;
    startXenditPoll(xendit.paymentId, xendit.redirectUrl, plan);
  }, [getSelectedPlan, startXenditPoll, xendit]);

  const xenditBusy =
    xenditLoading || xendit?.status === 'waiting' || xendit?.status === 'conflict';

  return {
    xenditLoading,
    xendit,
    xenditBusy,
    handleXendit,
    handleXenditRetry,
    handleXenditRecheck,
    stopXenditPoll,
  };
}
