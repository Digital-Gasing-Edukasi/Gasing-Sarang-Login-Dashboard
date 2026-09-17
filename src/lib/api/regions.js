// src/lib/api/regions.js — hierarki Provinsi → Kabupaten.
import { BASE_URL, dedupeFetch, request, buildQuery } from "./client.js";

// ─── REGIONS (Province → Regency hierarchy) ─────────────────────────────────────
// list() defaults to provinces. Pass { type: "REGENCY", parentId, keyword } for regencies.
//
// TODO(auth): list() memakai dedupeFetch mentah — tanpa header Authorization,
// tanpa 401-refresh, tanpa TTL cache (lihat client.js). Disengaja dipertahankan
// saat split; migrasikan ke request() setelah dikonfirmasi backend (perubahan perilaku).
export const regionsApi = {
  list: (params = {}) => {
    const q = buildQuery(params);
    return dedupeFetch(`${BASE_URL}/regions${q ? "?" + q : ""}`, {
      headers: { Accept: "application/json" },
    }).then((r) => r.json());
  },

  get: (id) => request(`/regions/${id}`),
};
