# ADR-0002: Refactor agar Mudah Dipahami Junior & Dirawat dari Dokumentasi

**Status:** Accepted
**Date:** 2026-06-30
**Deciders:** Frontend lead (ery)

## Context

Tujuan: project `gasing-auth` (React + Vite SPA) harus (1) mudah dipahami programmer
level junior, dan (2) bisa dirawat orang baru **hanya bermodal dokumentasi yang ada**.

Kondisi awal (audit langsung dari kode + dokumen):

- **Dokumentasi sudah kuat.** [`README.md`](../../README.md) (setup/deploy/endpoint),
  [`ARCHITECTURE.md`](../../ARCHITECTURE.md) (layer, routing, alur data, utang teknis),
  [`DEPLOYMENT_GUIDE.md`](../../DEPLOYMENT_GUIDE.md), dan ADR-0001. Sudah dalam Bahasa
  Indonesia, terstruktur, dengan diagram. Ini aset utama dan tidak perlu dibongkar.
- **Struktur kode sudah modular & rapi.** `pages/`, `components/{ui,layout,shared}`,
  `hooks/`, `lib/`. Data layer terpusat di `lib/api.js`. File rata-rata < 200 baris.
- **Titik gesek nyata bagi junior** ada di `App.jsx → handleLoginSuccess`:
  - Logika peran (superadmin vs admin operasional vs user biasa) ditulis inline
    sebagai if-bercabang, dengan array `ADMIN_CAPABILITIES` dideklarasi di tengah fungsi.
  - Komentar penentu logika typo & ambigu: *"yang bisa masuk ke dashboard hanya yang
    bukan admin, tetapi, mempunya capabilieties tidak null"*.
  - 4 `console.log` membocorkan payload user (`capabilities`, `groups`, seluruh objek
    user) ke console browser — noise + kebocoran info minor.

Forces:
- Tim kecil, tanpa test otomatis → perubahan harus **berisiko rendah & non-breaking**.
- Dokumentasi adalah kontrak perawatan → kode harus selaras dengan dokumen, bukan
  menambah konsep baru yang tidak terdokumentasi.

## Decision

**Refactor terfokus, bukan rewrite.** Pertahankan arsitektur & dokumentasi yang ada;
perbaiki satu titik dengan rasio risiko-terhadap-manfaat terburuk: logika peran di `App.jsx`.

1. **Ekstrak aturan peran ke modul murni** [`src/lib/roles.js`](../../src/lib/roles.js):
   `ADMIN_CAPABILITIES`, `isSuperAdmin(user)`, `isOperationalAdmin(user)`. Fungsi murni,
   ber-JSDoc, satu sumber kebenaran — mudah dibaca dan diuji tanpa merender komponen.
2. **Sederhanakan `handleLoginSuccess`** menjadi early-return yang terbaca seperti aturan
   bisnis (admin → dashboard, superadmin → auth-choice, user → cek langganan).
3. **Hapus `console.log`** yang membocorkan data user.

Nilai string `page` (`"admin-dashboard"`, dll.) **tidak diubah** → perilaku routing identik,
komponen anak yang mengoper string via `onNavigate` tetap kompatibel.

## Options Considered

### Option A: Refactor terfokus + perkuat dokumen (DIPILIH)
| Dimension | Assessment |
|-----------|------------|
| Complexity | Low |
| Cost | Rendah — 1 file baru, 1 file disunting |
| Risk | Rendah — perilaku identik, build hijau |
| Manfaat junior | Tinggi — aturan peran jadi eksplisit & terdokumentasi |

**Pros:** Risiko minimal tanpa test; selaras dengan dokumen yang sudah ada; pola
"ekstrak ke `lib/` yang murni & ber-komentar" bisa diulang untuk perbaikan berikutnya.
**Cons:** Tidak menyelesaikan semua utang teknis (lihat ARCHITECTURE §11) sekaligus.

### Option B: Rewrite besar (React Router, `PAGES` constants di semua file, TypeScript)
| Dimension | Assessment |
|-----------|------------|
| Complexity | High |
| Cost | Tinggi — menyentuh 12+ file |
| Risk | Tinggi — tanpa test, mudah regresi routing/auth |
| Manfaat junior | Sedang — tapi menambah konsep baru di luar dokumen saat ini |

**Pros:** URL benar, magic-string hilang total, type-safety.
**Cons:** Memperkenalkan dependensi & konsep yang belum terdokumentasi → melanggar syarat
"dirawat hanya dari dokumentasi yang ada"; berisiko tinggi tanpa jaring test.

### Option C: Hanya tulis dokumentasi, tidak sentuh kode
**Pros:** Nol risiko kode. **Cons:** Titik gesek nyata (logika peran inline + log bocor)
tetap ada; dokumentasi malah harus menjelaskan kode yang berantakan.

## Trade-off Analysis

Pendorong utama: **tanpa test + tim kecil → utamakan perubahan non-breaking yang terbukti
(build hijau)**. Option B unggul jangka panjang tapi melanggar batasan "dirawat dari dokumen
yang ada" dan berisiko tinggi. Option C tidak memperbaiki akar masalah keterbacaan.
Option A memberi manfaat keterbacaan terbesar per unit risiko, dan menetapkan **pola yang
bisa diulang**: pindahkan logika bisnis ke `lib/` murni yang ber-JSDoc, sisakan komponen
untuk orkestrasi UI.

## Consequences

**Lebih mudah:**
- Junior membaca `handleLoginSuccess` seperti daftar aturan, bukan if bersarang.
- Mengubah hak akses dashboard cukup di `ADMIN_CAPABILITIES` (satu tempat).
- Aturan peran bisa diuji unit tanpa merender React.

**Lebih sulit / utang tersisa (tidak berubah oleh ADR ini):**
- Utang di [ARCHITECTURE.md §11](../../ARCHITECTURE.md) masih berlaku: `AuthContext` tak
  terpakai, routing tanpa URL, endpoint `TODO(backend)`, data dummy admin.

**Perlu ditinjau ulang:**
- Bila nanti diputuskan menambah test, mulai dari `roles.js` (murni, mudah).
- Pertimbangkan menerapkan pola ekstraksi yang sama ke logika boot-routing `App.jsx`.

## Action Items

1. [x] Buat `src/lib/roles.js` (`isSuperAdmin`, `isOperationalAdmin`, `ADMIN_CAPABILITIES`).
2. [x] Sederhanakan `handleLoginSuccess`; hapus `console.log` pembocor data.
3. [x] Verifikasi `npx vite build` hijau (perilaku tidak berubah).
4. [ ] (Opsional) Tambah unit test untuk `roles.js`.
5. [ ] (Opsional) Terapkan pola ekstraksi serupa ke boot sequence `App.jsx`.

## Lihat Juga

- [ARCHITECTURE.md](../../ARCHITECTURE.md) — §4 Manajemen State, §11 Utang Teknis.
- [ADR-0001](0001-fix-data-flow.md) — pola "satu sumber kebenaran" (`FIELD_DEFS`).
