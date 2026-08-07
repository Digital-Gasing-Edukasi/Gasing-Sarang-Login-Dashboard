# Pill-Shape — Field & Tombol Bentuk Kapsul

> Dokumen ini menjelaskan perubahan style **input user, dropdown, calendar, dan tombol CTA** dari sudut membulat (`rounded-lg`) menjadi **kapsul / pill** (`rounded-full`) — bulat penuh di sisi kiri & kanan. Untuk arsitektur umum lihat [`../ARCHITECTURE.md`](../ARCHITECTURE.md), untuk versi mobile lihat [`MOBILE_RESPONSIVE.md`](MOBILE_RESPONSIVE.md).

**Status:** Selesai (per 2026-07-21). Berlaku desktop & mobile (1 codebase responsive).

---

## 1. Ringkasan

Kontrol yang diisi/ditekan user dibuat **pill** (`border-radius: 9999px`) supaya kedua sisinya membulat penuh, mengikuti referensi desain tombol CTA. **Pengecualian: OTP box** — pakai kotak sudut membulat `12px` (bukan pill), karena kotak kecil (48×56) kalau di-pill jadi lonjong/oval.

| Kontrol | Sebelum | Sesudah |
| ------- | ------- | ------- |
| Text input (email, password, nama, dll.) | `rounded-lg` | `rounded-full` |
| Dropdown (trigger tertutup) | `rounded-lg` | `rounded-full` |
| Calendar / date field (trigger tertutup) | `rounded-lg` | `rounded-full` |
| Tombol CTA | `rounded-lg` | `rounded-full` |
| OTP box | `var(--radius)` | `12px` (kotak, sudut membulat — **bukan** pill) |

**Prinsip penting:** yang dibulatkan **hanya bagian trigger / tombol (state tertutup)**. Panel dropdown yang terbuka dan popup roda tanggal **tetap** `rounded-lg`/`rounded-2xl` — kalau ikut pill malah jelek.

---

## 2. File yang diubah

Perubahan dilakukan di **komponen dasar (shared)**, jadi otomatis berlaku di semua tempat pemakaian — bukan per-halaman.

| # | File | Baris | Perubahan |
| - | ---- | ----- | --------- |
| 1 | [`src/components/ui/input.jsx`](../src/components/ui/input.jsx) | base class | `rounded-lg px-3` → `rounded-full px-4` |
| 2 | [`src/components/ui/select.jsx`](../src/components/ui/select.jsx) | `TRIGGER_CLS` | `rounded-lg px-3` → `rounded-full px-4` |
| 3 | [`src/components/shared/DateField.jsx`](../src/components/shared/DateField.jsx) | tombol trigger | `rounded-lg px-3` → `rounded-full px-4` |
| 4 | [`src/components/ui/button.jsx`](../src/components/ui/button.jsx) | base + size `sm`/`lg` | `rounded-lg`/`rounded-md` → `rounded-full` |
| 5 | [`src/index.css`](../src/index.css) | `.otp-input` | `border-radius: var(--radius)` → `12px` (kotak, bukan pill) |
| 6 | [`src/pages/auth/ResetPasswordPage.jsx`](../src/pages/auth/ResetPasswordPage.jsx) | input reset password (raw) | `rounded-2xl` → `rounded-full` |

> Catatan `px`: padding horizontal dinaikkan dari `px-3` → `px-4` supaya teks tidak terlalu mepet ke tepi yang sekarang membulat.

---

## 3. Cakupan halaman

Karena diubah di komponen dasar, semua halaman ikut. Kontrol user yang terpengaruh:

- **Auth:** Login, Sign Up (langkah 1 & 2), Forgot Password, OTP, Reset Password, Fix Data.
- **Dropdown & Calendar:** dipakai di Sign Up (provinsi, kab./kota, tanggal lahir, riwayat pelatihan) dan Fix Data.
- **CTA:** semua tombol `<Button>` di seluruh aplikasi.

### Efek ke Admin (disengaja)

Karena `Input`, `Select`, `DateField`, dan `Button` adalah komponen **shared**, panel **Admin Dashboard** ikut menjadi pill. Ini **konsisten** dengan design language baru. Kalau suatu saat Admin perlu dikembalikan ke bentuk kotak, opsinya adalah scoping per-halaman (override className), bukan mengubah komponen dasar.

---

## 4. Versi mobile

Project ini **1 codebase responsive** (breakpoint `lg:`), jadi mobile dan desktop memakai komponen yang sama — perubahan pill otomatis ikut. Komponen tema-gelap mobile (`DarkAuth`) sejak awal **sudah** pill:

| Komponen mobile | File | Status |
| --------------- | ---- | ------ |
| `DarkInput` | [`src/components/shared/DarkAuth.jsx`](../src/components/shared/DarkAuth.jsx) | sudah `rounded-full` |
| `DarkPrimaryButton` / `DarkGhostButton` | `DarkAuth.jsx` | sudah `rounded-full` |
| Dropdown bottom-sheet (cabang mobile) | `select.jsx` | pakai `TRIGGER_CLS` yang sama → pill |
| Item dropdown mobile | `select.jsx` | sudah `rounded-full` |

Verifikasi di viewport 375px: input & tombol login terukur `border-radius: 9999px`.

---

## 5. Catatan teknis

### `cn()` = `clsx`, bukan `tailwind-merge`

Helper [`cn()`](../src/lib/utils.js) hanya membungkus `clsx` (menggabungkan string), **tanpa** dedup Tailwind. Artinya jika sebuah elemen punya `rounded-lg` (dari base) **dan** `rounded-full` (dari override className), **kedua** class ikut ter-render.

Yang menentukan pemenang adalah **urutan di CSS hasil compile**. Di config ini `borderRadius.full` didefinisikan setelah `lg`, sehingga `.rounded-full` menang. Karena itu:

- Override per-instance (`className="rounded-full"`) **bekerja** — tapi rapuh.
- **Lebih aman** mengubah langsung class dasar komponen (pendekatan yang dipakai di sini), supaya tidak ada dua class `rounded-*` yang bertabrakan.

### `borderRadius` di Tailwind config

[`tailwind.config.js`](../tailwind.config.js) hanya meng-override `lg`/`md`/`sm` (memakai `var(--radius)`). Key `full` tetap default Tailwind (`9999px`), jadi `rounded-full` selalu tersedia dan konsisten.

---

## 6. Cara mengubah / mengembalikan

- **Ganti radius semua kontrol:** ubah `rounded-full` di 5 file komponen dasar di [Bagian 2](#2-file-yang-diubah).
- **Kembalikan Admin ke kotak tanpa mengubah user:** jangan ubah komponen dasar; tambahkan override `className` (mis. `rounded-lg`) di tiap pemakaian pada halaman Admin.
- **OTP:** atur `.otp-input { border-radius }` di [`src/index.css`](../src/index.css).
