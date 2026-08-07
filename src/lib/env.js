// ─────────────────────────────────────────────────────────────────────────────
// Environment helpers
//
// `__APP_MODE__` di-inject oleh Vite (lihat vite.config.js `define`).
// Nilainya "staging" atau "production" — sesuai `--mode` saat build.
//
// Pakai helper ini di komponen mana pun yang perlu behavior beda per-env.
// Contoh: sembunyikan fitur debug/internal di production.
// ─────────────────────────────────────────────────────────────────────────────

/* eslint-disable no-undef */

/** Mode build aktif: "staging" | "production" (fallback "staging" saat dev). */
export const APP_MODE = typeof __APP_MODE__ !== 'undefined' ? __APP_MODE__ : 'staging'

/** true jika build staging / dev lokal. */
export const isStaging    = () => APP_MODE !== 'production'

/** true jika build production. */
export const isProduction = () => APP_MODE === 'production'
