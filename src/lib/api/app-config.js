// src/lib/api/app-config.js — key/value config store (mis. banner home).
import { BASE_URL, dedupeFetch, request } from "./client.js";

// ─── APP CONFIGS ──────────────────────────────────────────────────────────────
// Key/value config store. get() publik; set() butuh cap SETTING/WRITE (admin).
// Dipakai untuk banner Pendaftaran Trainer di Home (key: hero_banner-home-v2).
//
// TODO(auth): get() memakai dedupeFetch mentah — tanpa header Authorization,
// tanpa 401-refresh, tanpa TTL cache (lihat client.js). Disengaja dipertahankan
// saat split; migrasikan ke request() setelah dikonfirmasi backend (perubahan perilaku).
export const appConfigApi = {
  get: (key) =>
    dedupeFetch(`${BASE_URL}/app-configs/${key}`, { headers: { Accept: "application/json" } })
      .then((r) => r.json()),

  set: (key, value) =>
    request(`/admin/app-configs/${key}`, { method: "PUT", body: { value } }),
};
