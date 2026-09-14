// src/lib/api/training-sessions.js — sesi pelatihan (form registrasi + admin).
import { BASE_URL, dedupeFetch, request, buildQuery } from "./client.js";

// ─── TRAINING SESSIONS ──────────────────────────────────────────────────────────
// list({ regionId }) returns sessions for a regency (used by the registration form).
// list({ page, limit, keyword }) paginates for admin browsing.
//
// TODO(auth): list() memakai dedupeFetch mentah — tanpa header Authorization,
// tanpa 401-refresh, tanpa TTL cache (lihat client.js). Disengaja dipertahankan
// saat split; migrasikan ke request() setelah dikonfirmasi backend (perubahan perilaku).
export const trainingSessionsApi = {
  list: (params = {}) => {
    const q = buildQuery(params);
    return dedupeFetch(`${BASE_URL}/training-sessions${q ? "?" + q : ""}`, {
      headers: { Accept: "application/json" },
    }).then((r) => r.json());
  },

  get: (id) => request(`/training-sessions/${id}`),
};
