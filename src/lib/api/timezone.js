// src/lib/api/timezone.js — daftar timezone (publik).
import { BASE_URL, dedupeFetch } from "./client.js";

// ─── TIMEZONE ─────────────────────────────────────────────────────────────────
//
// TODO(auth): list() memakai dedupeFetch mentah — tanpa header Authorization,
// tanpa 401-refresh, tanpa TTL cache (lihat client.js). Disengaja dipertahankan
// saat split; migrasikan ke request() setelah dikonfirmasi backend (perubahan perilaku).
export const timezoneApi = {
  list: () =>
    dedupeFetch(`${BASE_URL}/timezones`, { headers: { Accept: "application/json" } })
      .then((r) => r.json()),
};
