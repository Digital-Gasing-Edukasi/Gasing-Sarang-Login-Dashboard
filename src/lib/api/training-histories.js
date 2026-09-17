// src/lib/api/training-histories.js — import peserta via CSV (admin).
import { request, requestMultipart, buildQuery } from "./client.js";

// ─── TRAINING HISTORIES (import peserta via CSV) ────────────────────────────────
// Alur: upload CSV → poll job validasi → review/koreksi rows → push (commit).
// Semua butuh capability TRAINING_HISTORY/MGMT.
export const trainingHistoriesApi = {
  // multipart: file (CSV kolom `email`) + trainingSessionId → { importId, trackId }
  upload: (file, trainingSessionId) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("trainingSessionId", trainingSessionId);
    return requestMultipart("/admin/training-histories/imports", fd);
  },

  listImports: (params = {}) => {
    const q = buildQuery({ page: 1, limit: 20, ...params });
    return request(`/admin/training-histories/imports${q ? "?" + q : ""}`);
  },

  // → { data: {header, status}, rows: { data:[{id,email,userId,valid,message}], meta } }
  getImport: (id, params = {}) => {
    const q = buildQuery({ page: 1, limit: 50, ...params });
    return request(`/admin/training-histories/imports/${id}${q ? "?" + q : ""}`);
  },

  getRow: (id, rowId) =>
    request(`/admin/training-histories/imports/${id}/rows/${rowId}`),

  // Update email 1 row → auto re-validate, balik row terbaru (valid+message).
  patchRow: (id, rowId, email) =>
    request(`/admin/training-histories/imports/${id}/rows/${rowId}`, {
      method: "PATCH",
      body: { email },
    }),

  deleteRow: (id, rowId) =>
    request(`/admin/training-histories/imports/${id}/rows/${rowId}`, {
      method: "DELETE",
    }),

  // Commit ke tabel training_histories (hanya saat status SAVED) → { trackId }.
  // Row invalid + duplikat di-skip otomatis.
  push: (id) =>
    request(`/admin/training-histories/imports/${id}/push`, { method: "POST" }),

  // DB-005 #4 fix: peserta 1 session, langsung dari tabel training_session_participants
  // (bukan dari filter[firstTrainingSessionId] di /admin/users — field itu cuma ke-set
  // saat approve akun satu-per-satu, TIDAK ke-update oleh import CSV, jadi peserta hasil
  // CSV tidak pernah muncul di modal "Lihat peserta" via jalur lama).
  // status per row: active (terdaftar + subscription aktif) | nonactive (terdaftar,
  // tanpa subscription) | unreg (belum terdaftar / email invalid).
  listSessionParticipants: (sessionId, params = {}) => {
    const q = buildQuery({ page: 1, limit: 20, ...params });
    return request(`/admin/training-histories/sessions/${sessionId}/participants${q ? "?" + q : ""}`);
  },
};
