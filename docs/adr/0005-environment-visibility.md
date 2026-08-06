# ADR-0005: Visibilitas Komponen Per-Environment (Staging vs Production)

**Status:** Accepted  
**Tanggal:** 2026-07-28  
**Konteks:** Beberapa komponen UI hanya relevan di lingkungan staging dan tidak boleh terlihat di production.

---

## Masalah

Dua komponen bersifat internal/debugging:

1. **Menu "Daftar User"** di sidebar admin — tabel read-only seluruh user. Berguna saat staging untuk cross-check data, tapi tidak perlu di production.
2. **Tulisan tanggal build** di halaman login — penanda build mana yang live. Berguna di staging, tapi membingungkan end-user di production.

Kedua komponen harus tampil di staging dan tersembunyi di production.

---

## Keputusan

### Mekanisme: `__APP_MODE__` via Vite `define`

Vite sudah menyediakan `mode` di `vite.config.js` — nilainya berasal dari flag `--mode`:

| Script            | Mode          | Env file          |
| ----------------- | ------------- | ----------------- |
| `npm run dev`     | `staging`     | `.env.staging`    |
| `build:staging`   | `staging`     | `.env.staging`    |
| `build` (default) | `production`  | `.env.production` |

Kami inject `__APP_MODE__` ke bundle via `define` di `vite.config.js` (berdampingan dengan `__BUILD_DATE__` yang sudah ada), lalu buat helper terpusat di `src/lib/env.js`:

```js
export const APP_MODE = typeof __APP_MODE__ !== 'undefined' ? __APP_MODE__ : 'staging'
export const isStaging    = () => APP_MODE !== 'production'
export const isProduction = () => APP_MODE === 'production'
```

### Komponen yang terpengaruh

| Komponen | File | Perilaku |
| -------- | ---- | -------- |
| Menu "Daftar User" | `src/pages/admin/AdminSidebar.jsx` | `stagingOnly: true` di array NAV → difilter di production |
| Tanggal build | `src/pages/auth/LoginPage.jsx` | Dibungkus `{isStaging() && (...)}` |

### Cara menambah komponen staging-only baru

1. Import `isStaging` atau `isProduction` dari `@/lib/env`.
2. Bungkus render dengan conditional: `{isStaging() && <Komponen />}`.
3. Untuk nav item, tambah `stagingOnly: true` pada objek NAV.

---

## Alternatif yang Dipertimbangkan

| Opsi | Alasan ditolak |
| ---- | -------------- |
| `import.meta.env.MODE` langsung | Tersebar, tidak ada satu sumber kebenaran. Susah di-grep. |
| `.env` variable baru (`VITE_SHOW_DEBUG`) | Perlu maintain satu variabel lagi per-env. Overkill untuk on/off sederhana. |
| Feature flag backend | Over-engineering — ini murni UI visibility. |

---

## Konsekuensi

- **Positif:** Satu helper (`lib/env.js`) untuk semua pengecekan environment. Mudah diperluas.
- **Positif:** Dead-code elimination Vite — di production build, branch `isStaging()` beserta kodenya bisa di-tree-shake.
- **Negatif:** Komponen masih ada di source code (tidak dihapus). Tapi ini disengaja karena akan dipakai di staging.
