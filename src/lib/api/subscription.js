// src/lib/api/subscription.js — paket, langganan, pembayaran user.
import { BASE_URL, dedupeFetch, request } from "./client.js";

// ─── SUBSCRIPTION & PAYMENT ───────────────────────────────────────────────────
export const subscriptionApi = {
  // TODO(auth): getPlans()/getBankAccounts() memakai dedupeFetch mentah — tanpa
  // header Authorization, tanpa 401-refresh, tanpa TTL cache (lihat client.js).
  // Disengaja dipertahankan saat split; migrasikan ke request() setelah
  // dikonfirmasi backend (perubahan perilaku).
  getPlans: () =>
    dedupeFetch(`${BASE_URL}/packages`, { headers: { Accept: "application/json" } })
      .then((r) => r.json()),

  getStatus: () => request("/subscription/me"),

  checkout: (packageId) =>
    request("/subscription/checkout", { method: "POST", body: { packageId } }),

  // ── Manual Transfer (dipakai sementara selama Midtrans belum siap) ──────────
  // Idempotent per user: bila sudah ada payment pending tanpa bukti, endpoint ini
  // meng-update payment yang sama (bukan bikin baru). Balik detail payment.
  checkoutManual: (packageId) =>
    request("/subscription/checkout-manual", { method: "POST", body: { packageId } }),

  // Lampirkan bukti transfer ke sebuah payment. fileId didapat dari
  // fileManagerApi.upload(). Setelah ini payment menunggu verifikasi admin.
  // extra: { senderName, senderBank, transferDate } — opsional, dikirim kalau
  // ada. Blm terkonfirmasi backend simpan/balikin field ini (lihat API_ACCESS_MATRIX.md
  // §7 & docs/admin/VERIFIKASI_PEMBAYARAN.md §6 — body dokumentasi cuma { fileId }).
  uploadReceipt: (paymentId, fileId, extra = {}) =>
    request(`/subscription/payments/${paymentId}/upload-receipt`, {
      method: "POST",
      body: { fileId, ...extra },
    }),

  // Payment manual_transfer terakhir milik user (status apapun). 404 bila belum ada.
  getLatestPayment: () => request("/subscription/payments/latest"),

  // Detail satu payment milik user. 404 bila bukan milik user / tidak ada.
  getPayment: (paymentId) => request(`/subscription/payments/${paymentId}`),

  subscribe: (packageId) =>
    request("/subscription/subscribe", { method: "POST", body: { packageId } }),

  cancel: () => request("/subscription/cancel", { method: "POST" }),

  paymentHistory: (page = 1, limit = 20) =>
    request(`/subscription/history?page=${page}&limit=${limit}`),

  // Rekening tujuan transfer manual aktif. Dipakai TransferBankPage untuk
  // menampilkan info bank dinamis (menggantikan DEFAULT_BANK hardcoded).
  getBankAccounts: () =>
    dedupeFetch(`${BASE_URL}/bank-accounts`, { headers: { Accept: "application/json" } })
      .then((r) => r.json()),
};
