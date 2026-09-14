import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  tokenStorage,
  subscriptionApi,
  authApi,
  webAppApi,
} from "@/lib/api";
import { canAccessDiscourse, isSsoDisabled, isSuperAdmin } from "@/lib/roles";
import {
  evaluateLoginGate,
  evaluatePaymentGate,
  isPaymentGraceActive,
} from "@/lib/loginGate";

// Sesi auth + gate akun. Pure state + routing pasca-login; tidak tahu soal
// boot URL-params (itu urusan useAppBoot).
//
// `deps` menjembatani state milik useCheckoutFlow yang ikut berubah dari aksi
// modal gate: onRenew (retry) dan onReupload (langsung ke Transfer Bank).
export function useAuthSession({ setIsRetry, setCheckoutPlan, setManualPayment } = {}) {
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(null);
  // gate: status akun yang memblokir masuk app (suspended/pending/expired).
  // Berlaku untuk login manual DAN restore sesi (reload dgn token tersimpan).
  const [gate, setGate] = useState(null);
  // DEV: ?admin=true membuka dashboard admin tanpa sesi (preview UI tanpa backend).
  const [devAdmin, setDevAdmin] = useState(false);
  const [otpToken, setOtpToken] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [fpEmail, setFpEmail] = useState("");

  // Tentukan halaman tujuan setelah login berdasarkan peran user.
  // Aturan peran ada di src/lib/roles.js (sumber kebenaran tunggal).
  //   - Admin operasional  → /dashboard-admin
  //   - Superadmin         → /login/choice
  //   - User biasa         → /login/choice bila langganan aktif, else /login/subscription
  const handleLoginSuccess = useCallback(
    async (user) => {
      // Payment terakhir masih 'pending' → user dianggap boleh masuk walau
      // langganan belum aktif/expired (nunggu pembayaran diproses).
      // Dihitung sekali, dipakai di gate 'expired' + routing langganan di bawah.
      let paymentPending = false;
      let graceActive = false; // pending & MASIH < 24 jam → boleh akses web app
      let paymentRejected = null;
      try {
        const latest = await subscriptionApi.getLatestPayment();
        const p = latest?.payment || latest?.data || latest || {};
        paymentPending = p.status === "pending";
        // Akses sementara 24 jam sejak bayar (manual transfer) walau belum diverifikasi.
        graceActive = isPaymentGraceActive(p);
        // Payment terakhir ditolak admin (failed/rejected) → gate "Pembayaran Ditolak".
        paymentRejected = evaluatePaymentGate(p);
      } catch {
        // Gagal / belum pernah bayar → anggap tidak ada pending / tolakan.
      }

      // Staff/capability holder (superadmin, DISABLED-SSO admin, moderator
      // Discourse) TIDAK punya "langganan" / alur verifikasi member → gate
      // kondisi akun (suspended/pending/expired/payment) di bawah TIDAK berlaku
      // buat mereka. Cek ini duluan, sebelum gate.
      const isStaffCapabilityHolder =
        isSuperAdmin(user) || canAccessDiscourse(user) || isSsoDisabled(user);

      // Guard status akun sebelum masuk. Prioritas:
      //   suspended / pending akun → selalu menang (blokir mutlak).
      //   payment ditolak          → menang atas 'expired' (arahkan perbaiki bayar).
      //   expired                  → di-bypass bila ada payment pending.
      // Dilewati sepenuhnya untuk staff/capability holder (lihat komentar di atas).
      if (!isStaffCapabilityHolder) {
        const blocked = evaluateLoginGate(user);
        if (blocked && blocked.type !== "expired") {
          setGate({ ...blocked, profile: user });
          navigate("/login", { replace: true });
          return;
        }
        if (paymentRejected) {
          setGate({ ...paymentRejected, profile: user });
          navigate("/login", { replace: true });
          return;
        }
        if (blocked && blocked.type === "expired" && !paymentPending) {
          setGate({ ...blocked, profile: user });
          navigate("/login", { replace: true });
          return;
        }
      }

      setCurrentUser(user);

      // Superadmin → SELALU ke panel pilih tujuan (3 tombol: Dashboard + Moderator/
      // Discourse + Web App), walau dia juga punya capability DISABLED-SSO.
      // Superadmin bypass capability, TIDAK bypass kondisi akun (API_ACCESS_MATRIX.md).
      if (isSuperAdmin(user)) {
        navigate("/login/choice", { replace: true });
        return;
      }

      // HANYA yang punya capability USER/DISCOURSE/DISABLED-SSO (dan BUKAN
      // superadmin, sudah ditangani di atas) yang boleh masuk Dashboard Admin
      // langsung.
      if (isSsoDisabled(user)) {
        navigate("/dashboard-admin", { replace: true });
        return;
      }

      // Moderator (pemilik USER/DISCOURSE/MANAGE_EXTRA_GROUPS) → panel pilih
      // tujuan, 2 tombol (Moderator/Discourse + Web App). JANGAN auto redirect.
      if (canAccessDiscourse(user)) {
        navigate("/login/choice", { replace: true });
        return;
      }

      // User biasa: cek status langganan untuk menentukan halaman.
      try {
        const sub = await subscriptionApi.getStatus();
        const isActive =
          sub?.hasActiveSubscription === true ||
          sub?.subscription?.status === "active";
        // Boleh handoff ke web app bila: langganan aktif, ATAU masih dalam masa
        // grace 24 jam sejak bayar manual (graceActive) walau belum diverifikasi.
        // Payment 'pending' yang grace-nya HABIS (> 24 jam) TIDAK dilempar — web
        // app pasti menolak lalu bounce ke /login → loop layar putih. Tahan di
        // modal "Pembayaran Sedang Kami Tinjau" sampai admin verifikasi.
        if (isActive || graceActive) {
          webAppApi.redirectWithTokens();
        } else if (paymentPending) {
          setGate({ type: "payment_review", profile: user });
          navigate("/login", { replace: true });
        } else {
          navigate("/login/subscription", { replace: true });
        }
      } catch {
        // Gagal cek langganan → grace 24 jam masih lolos ke web app; pending yang
        // grace-nya habis tampil modal tinjau; selain itu halaman langganan.
        if (graceActive) {
          webAppApi.redirectWithTokens();
        } else if (paymentPending) {
          setGate({ type: "payment_review", profile: user });
          navigate("/login", { replace: true });
        } else {
          navigate("/login/subscription", { replace: true });
        }
      }
    },
    [navigate],
  );

  const handleSignOut = useCallback(() => {
    // Kabari backend biar sesi/token dibatalin. Fire-and-forget: jangan
    // blok UI, kalau gagal tetap lanjut bersihin sesi lokal.
    authApi.logout().catch(() => {});
    tokenStorage.clear();
    setCurrentUser(null);
    setDevAdmin(false);
    navigate("/login", { replace: true });
  }, [navigate]);

  const handleOtpToken = useCallback((token, email) => {
    setOtpToken(token);
    setRegEmail(email);
  }, []);

  const handleEmailSent = useCallback(
    (email) => {
      setFpEmail(email);
      navigate("/login/check-email");
    },
    [navigate],
  );

  // Tutup/logout/dismiss modal gate → bersihkan sesi, kembali ke login.
  const handleGateClose = useCallback(() => {
    tokenStorage.clear();
    setCurrentUser(null);
    setGate(null);
    navigate("/login", { replace: true });
  }, [navigate]);

  // "Perbarui Langganan" (expired) / "Ulang Pembayaran" (payment ditolak
  // varian amount/account) → pilih paket di halaman langganan.
  const handleGateRenew = useCallback(() => {
    // Retry hanya bila gate ini "Pembayaran Ditolak" (Attempt sebelumnya
    // gagal) — 'expired' (langganan habis, belum pernah gagal bayar)
    // BUKAN retry, tetap attempt pertama.
    if (gate?.type === "payment_rejected") setIsRetry?.(true);
    const p = gate?.profile;
    setGate(null);
    if (p) setCurrentUser(p);
    navigate("/login/subscription", { replace: true });
  }, [navigate, gate, setIsRetry]);

  // "Upload Bukti Pembayaran" (payment ditolak varian receipt) → langsung
  // ke TransferBankPage dgn paket terakhir (skip pilih paket). Tanpa paket
  // terkenal → fallback ke halaman langganan. Selalu dari gate
  // payment_rejected → selalu retry (Attempt ke-2+).
  const handleGateReupload = useCallback(() => {
    const p = gate?.profile;
    const plan = gate?.plan;
    setIsRetry?.(true);
    setGate(null);
    if (p) setCurrentUser(p);
    if (plan?.id) {
      setCheckoutPlan?.(plan);
      setManualPayment?.(null);
      navigate("/login/subscription/transfer", { replace: true });
    } else {
      navigate("/login/subscription", { replace: true });
    }
  }, [navigate, gate, setIsRetry, setCheckoutPlan, setManualPayment]);

  return {
    currentUser,
    setCurrentUser,
    gate,
    setGate,
    devAdmin,
    setDevAdmin,
    otpToken,
    regEmail,
    fpEmail,
    handleLoginSuccess,
    handleSignOut,
    handleOtpToken,
    handleEmailSent,
    handleGateClose,
    handleGateRenew,
    handleGateReupload,
  };
}
