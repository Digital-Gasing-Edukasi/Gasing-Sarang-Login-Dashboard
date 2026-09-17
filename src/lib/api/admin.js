// src/lib/api/admin.js — seluruh endpoint admin (users, packages, subscriptions,
// manual-transfer payments, bank master data, regions, training sessions, skills,
// UAC/IAM, vouchers). Sengaja tetap satu file (satu domain "admin").
import { request, buildQuery } from "./client.js";

// ─── ADMIN ────────────────────────────────────────────────────────────────────
export const adminApi = {
  // ── Users ──
  getUsers: (params = {}) => {
    const q = buildQuery({ page: 1, limit: 100, ...params });
    return request(`/admin/users${q ? "?" + q : ""}`);
  },

  getUser: (userId) => request(`/admin/users/${userId}`),

  // Riwayat pelatihan 1 user (modal "Lihat Detail" di Manajemen Akun).
  // GET /admin/users/training-history/{userId}?page&limit → { data, meta }.
  listUserTrainingHistories: (userId, params = {}) => {
    const q = buildQuery({ page: 1, limit: 20, ...params });
    return request(`/admin/users/training-history/${userId}${q ? "?" + q : ""}`);
  },

  // @deprecated DB-005 #4 — filter[firstTrainingSessionId] cuma ke-set saat approve
  // akun satu-per-satu, TIDAK ke-update oleh import CSV, jadi peserta hasil CSV
  // tidak pernah muncul. Modal "Lihat peserta" sudah pindah ke
  // trainingHistoriesApi.listSessionParticipants (tabel training_session_participants).
  // Dibiarkan (tidak dipakai lagi di FE) buat referensi/kompat kalau ada pemanggil lain.
  getSessionParticipants: (sessionId, params = {}) => {
    const q = buildQuery({ page: 1, limit: 20, "filter[firstTrainingSessionId]": sessionId, ...params });
    return request(`/admin/users${q ? "?" + q : ""}`);
  },

  // Set/ganti sesi pelatihan pertama user (null = hapus). Butuh USER/MGMT.
  updateFirstTrainingSession: (userId, firstTrainingSessionId) =>
    request(`/admin/users/${userId}/first-training-session`, {
      method: "PATCH",
      body: { firstTrainingSessionId },
    }),

  updateUser: (userId, data) =>
    request(`/admin/users/${userId}`, { method: "PATCH", body: data }),

  setUserPassword: (userId, newPassword) =>
    request(`/admin/users/${userId}/password`, {
      method: "PATCH",
      body: { newPassword },
    }),

  // discourseGroupId dinormalisasi ke integer — BE menolak bentuk string. Field
  // dibuang kalau kosong supaya payload langkah-2 tidak mengirim null.
  verifyUser: (userId, data) => {
    const body = { ...data };
    if ("discourseGroupId" in body) {
      const n = Number(body.discourseGroupId);
      if (Number.isFinite(n) && body.discourseGroupId !== null && body.discourseGroupId !== "") {
        body.discourseGroupId = n;
      } else {
        delete body.discourseGroupId;
      }
    }
    return request(`/admin/users/${userId}/verify`, { method: "PATCH", body });
  },

  // Minta user memperbaiki data (status → REVISE). Backend generate token JWT +
  // kirim email berisi link revise. `fieldsToRevise` = array key field yang salah.
  reviseUser: (userId, { rejectedReason, fieldsToRevise }) =>
    request(`/admin/users/${userId}/verify`, {
      method: "PATCH",
      body: { status: "revise", rejectedReason, fieldsToRevise },
    }),

  // Tolak akun secara FINAL (status → REJECTED). User tidak bisa memperbaiki data.
  // Dipicu saat admin memilih "Lainnya" di RejectModal. `rejectedReason` = teks bebas.
  rejectUser: (userId, { rejectedReason }) =>
    request(`/admin/users/${userId}/verify`, {
      method: "PATCH",
      body: { status: "rejected", rejectedReason },
    }),

  // Kirim ulang email revise (token baru). Hanya untuk user berstatus REVISE.
  resendReviseEmail: (userId) =>
    request(`/admin/users/${userId}/resend-revise-email`, { method: "POST" }),

  // discourseGroupId dari dropdown selalu string (value di-String-kan buat compare).
  // Backend wajib number, jadi coerce di sini. Number("") → NaN, guard dulu.
  updateDiscourseGroup: (userId, discourseGroupId) =>
    request(`/admin/users/${userId}/discourse-group`, {
      method: "PATCH",
      body: { discourseGroupId: Number(discourseGroupId) },
    }),

  // ── Hapus / Pulihkan akun (soft delete via deletion-request) ──
  // Hapus akun → jadwalkan penghapusan (akun masuk tab "Baru Dihapus").
  requestUserDeletion: (userId) =>
    request(`/admin/users/${userId}/deletion-request`, { method: "POST" }),
  // Pulihkan akun dari "Baru Dihapus" → batalkan jadwal penghapusan.
  cancelUserDeletion: (userId) =>
    request(`/admin/users/${userId}/deletion-request`, { method: "DELETE" }),

  // Hapus akun PERMANEN (hard delete) dari tab "Baru Dihapus" — beda dari
  // deletion-request (soft delete). TODO(be): endpoint BELUM dikonfirmasi, user
  // akan input. Path/method di bawah cuma tebakan — GANTI saat endpoint asli ada.
  deleteUserPermanent: (userId) =>
    request(`/admin/users/${userId}`, { method: "DELETE" }),

  // ── Tangguhkan / Pulihkan akun (suspend) ──
  // Daftar alasan suspend: [{ code, title, desc }] — jarang berubah, di-cache
  // di zustand (src/stores/useSuspendReasons.js), bukan di-fetch tiap buka modal.
  getSuspendReasons: () => request("/admin/users/suspend-reasons"),

  // suspendedUntil: "YYYY-MM-DD HH:mm:ss". reason = ARRAY code alasan
  // (multi-select di SuspendModal). remarks = gabungan desc alasan terpilih
  // (join '. '). Akun masuk tab "Ditangguhkan".
  suspendUser: (userId, { suspendedUntil, reason, remarks }) =>
    request(`/admin/users/${userId}/suspend`, {
      method: "POST",
      body: { suspendedUntil, reason, remarks },
    }),
  // Pulihkan akun dari "Ditangguhkan" → cabut penangguhan.
  unsuspendUser: (userId) =>
    request(`/admin/users/${userId}/suspend`, { method: "DELETE" }),

  // ── Packages ──
  getPackages: () => request("/admin/packages"),

  getPackage: (id) => request(`/admin/packages/${id}`),

  createPackage: (data) =>
    request("/admin/packages", { method: "POST", body: data }),

  updatePackage: (id, data) =>
    request(`/admin/packages/${id}`, { method: "PATCH", body: data }),

  deactivatePackage: (id) =>
    request(`/admin/packages/${id}`, { method: "DELETE" }),

  // ── Subscriptions ──
  getSubscriptions: (params = {}) => {
    const q = buildQuery({ page: 1, limit: 20, ...params });
    return request(`/admin/subscriptions${q ? "?" + q : ""}`);
  },

  getSubscription: (id) => request(`/admin/subscriptions/${id}`),

  syncSubscriptions: () =>
    request("/admin/subscriptions/sync", { method: "POST" }),

  // ── Payments (Manual Transfer) ──
  // Scope: paymentMethod=manual_transfer saja. filter: all | pending |
  // receipt_uploaded | paid | rejected.
  //   - receipt_uploaded = bukti sudah diunggah, menunggu review admin (tab Menunggu).
  //   - rejected         = pembayaran ditolak admin (tab Pembayaran Ditolak).
  // Balik envelope { data, meta }.
  listManualPayments: (params = {}) => {
    const q = buildQuery({ page: 1, limit: 20, ...params });
    return request(`/admin/payments/manual-transfer/list${q ? "?" + q : ""}`);
  },

  // Setujui bukti transfer → aktifkan langganan. `notes` opsional.
  approveManualPayment: (paymentId, notes) =>
    request(`/admin/payments/manual-transfer/${paymentId}/approve`, {
      method: "POST",
      body: { notes },
    }),

  // Tolak bukti transfer. `reason` WAJIB — enum value dari TOLAK_REASONS
  // (insufficient_transfer | fund_not_retrieved | payment_receipt_unclear).
  // BE memakai `reason` untuk menentukan template notifikasi email penolakan.
  // `notes` opsional — catatan tambahan teks bebas.
  rejectManualPayment: (paymentId, reason, notes) =>
    request(`/admin/payments/manual-transfer/${paymentId}/reject`, {
      method: "POST",
      body: { reason, notes },
    }),

  // Statistik manual transfer (jumlah pending/receipt_uploaded/paid/rejected).
  getManualPaymentStats: () =>
    request(`/admin/payments/manual-transfer/stats`),

  // ── Bank Master Data ──
  // Master data rekening tujuan transfer. Admin mengelola daftar bank account
  // yang ditampilkan di halaman Transfer Bank user. Saat ini hardcoded di FE
  // (DEFAULT_BANK di TransferBankPage) — endpoint ini supaya bisa dikelola
  // dari dashboard tanpa deploy ulang.
  listBankAccounts: (params = {}) => {
    const q = buildQuery({ page: 1, limit: 20, ...params });
    return request(`/admin/bank-accounts${q ? "?" + q : ""}`);
  },

  getBankAccount: (id) => request(`/admin/bank-accounts/${id}`),

  createBankAccount: (data) =>
    request("/admin/bank-accounts", { method: "POST", body: data }),

  updateBankAccount: (id, data) =>
    request(`/admin/bank-accounts/${id}`, { method: "PATCH", body: data }),

  deleteBankAccount: (id) =>
    request(`/admin/bank-accounts/${id}`, { method: "DELETE" }),


  // ── Regions ──
  createRegion: (data) =>
    request("/admin/regions", { method: "POST", body: data }),

  updateRegion: (id, data) =>
    request(`/admin/regions/${id}`, { method: "PATCH", body: data }),

  deleteRegion: (id) =>
    request(`/admin/regions/${id}`, { method: "DELETE" }),

  // ── Training Sessions ──
  createTrainingSession: (data) =>
    request("/admin/training-sessions", { method: "POST", body: data }),

  updateTrainingSession: (id, data) =>
    request(`/admin/training-sessions/${id}`, { method: "PATCH", body: data }),

  deleteTrainingSession: (id) =>
    request(`/admin/training-sessions/${id}`, { method: "DELETE" }),

  // ── Skills ──
  getSkills: (params = {}) => {
    const q = buildQuery({ page: 1, limit: 20, ...params });
    return request(`/admin/skills${q ? "?" + q : ""}`);
  },

  createSkill: (data) =>
    request("/admin/skills", { method: "POST", body: data }),

  updateSkill: (id, data) =>
    request(`/admin/skills/${id}`, { method: "PATCH", body: data }),

  deleteSkill: (id) =>
    request(`/admin/skills/${id}`, { method: "DELETE" }),

  // ── UAC / IAM (requires superAdmin) ──
  getUacGroups: () => request("/admin/uac/groups"),

  getUacGroup: (id) => request(`/admin/uac/groups/${id}`),

  assignUacGroup: (userId, groupId) =>
    request("/admin/uac/assignments", {
      method: "POST",
      body: { userId, groupId },
    }),

  removeUacGroup: (userId, groupId) =>
    request("/admin/uac/assignments", {
      method: "DELETE",
      body: { userId, groupId },
    }),

  // ── Vouchers ──
  getVouchers: (params = {}) => {
    const q = buildQuery({ page: 1, limit: 20, ...params });
    return request(`/admin/vouchers${q ? "?" + q : ""}`);
  },

  getVoucher: (code) => request(`/admin/vouchers/${code}`),

  getVoucherUsage: (code, params = {}) => {
    const q = buildQuery({ page: 1, limit: 20, ...params });
    return request(`/admin/vouchers/${code}/usage${q ? "?" + q : ""}`);
  },

  createPoolVoucher: (data) =>
    request("/admin/vouchers/pool", { method: "POST", body: data }),

  grantPersonalVoucher: (data) =>
    request("/admin/vouchers/personal", { method: "POST", body: data }),

  revokeVoucher: (id) =>
    request(`/admin/vouchers/${id}/revoke`, { method: "PATCH" }),
};
