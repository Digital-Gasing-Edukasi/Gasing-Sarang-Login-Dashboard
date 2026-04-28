# GASING CIRCLE — Frontend SPA

> **Versi:** 2.0.0 · **Tanggal:** 26 Maret 2026 · **Stack:** React 18 + Vite + Tailwind CSS + shadcn/ui

---

## Daftar Isi

1. [Overview](#1-overview)
2. [Tech Stack](#2-tech-stack)
3. [Struktur Folder](#3-struktur-folder)
4. [Alur Halaman](#4-alur-halaman)
5. [Instalasi & Menjalankan](#5-instalasi--menjalankan)
6. [Konfigurasi Environment](#6-konfigurasi-environment)
7. [Vite Proxy](#7-vite-proxy)
8. [Komponen & Arsitektur](#8-komponen--arsitektur)
9. [API Layer](#9-api-layer)
10. [Integrasi Midtrans](#10-integrasi-midtrans)
11. [Kustomisasi](#11-kustomisasi)
12. [Referensi Scripts](#12-referensi-scripts)
13. [Changelog](#13-changelog)

---

## 1. Overview

Gasing Circle Frontend SPA adalah aplikasi **Single Page Application** berbasis React yang mencakup:

- Alur autentikasi lengkap (Register, OTP, Login, Forgot Password)
- Halaman pemilihan paket berlangganan
- Integrasi pembayaran via **Midtrans Snap Redirect**
- Halaman konfirmasi pembayaran berhasil dengan link ke komunitas Discourse

Aplikasi terhubung ke backend **Express.js + Prisma + PostgreSQL** melalui Vite proxy untuk menghindari CORS, sehingga bisa diakses dari komputer lain dalam jaringan yang sama (DEV-MODE ONLY).

---

## 2. Tech Stack

| Teknologi                | Versi        | Kegunaan                                               |
| ------------------------ | ------------ | ------------------------------------------------------ |
| React                    | 18.2.0       | UI Library                                             |
| Vite                     | 5.2.0        | Build tool + dev server + proxy                        |
| Tailwind CSS             | 3.4.3        | Utility-first CSS                                      |
| shadcn/ui                | manual       | Design system (Button, Input, Label, Checkbox, Select) |
| Radix UI                 | latest       | Headless UI primitives                                 |
| class-variance-authority | latest       | Variant styling                                        |
| Lucide React             | 0.383.0      | Icon library                                           |
| clsx                     | 2.1.0        | Conditional className                                  |
| DM Sans                  | Google Fonts | Font utama                                             |
| Playfair Display         | Google Fonts | Font branding                                          |

---

## 3. Struktur Folder

```
Dev-Gasing-Circle-AuthPage/
├── .env.example            ← template environment variables
├── index.html
├── package.json
├── vite.config.js          ← path alias + Vite proxy config
├── tailwind.config.js
├── postcss.config.js
└── src/
    ├── main.jsx            ← entry point React
    ├── App.jsx             ← router utama + semua halaman auth
    ├── index.css           ← global styles + CSS variables shadcn
    ├── lib/
    │   ├── api.js          ← semua HTTP calls ke backend
    │   └── utils.js        ← helper cn()
    ├── context/
    │   └── AuthContext.jsx ← global auth state (opsional)
    ├── components/
    │   └── ui/             ← shadcn/ui components
    │       ├── button.jsx
    │       ├── input.jsx
    │       ├── label.jsx
    │       ├── checkbox.jsx
    │       └── select.jsx
    └── pages/
        ├── SubscriptionPage.jsx   ← halaman pilih paket
        └── PaymentSuccessPage.jsx ← halaman pembayaran berhasil
```

---

## 4. Alur Halaman

```
┌─────────────┐
│    Login    │──────────────────────────────────────┐
└─────────────┘                                      │
       │ Belum punya akun                            │ Login berhasil
       ▼                                             ▼
┌─────────────────┐                      ┌──────────────────────┐
│ Sign Up Step 1  │                      │   Subscription Page  │
│ (Buat Akun)     │                      │  (Pilih paket)       │
└─────────────────┘                      └──────────────────────┘
       │                                             │ Klik Berlangganan
       ▼                                             ▼
┌─────────────────┐                      ┌──────────────────────┐
│ Sign Up Step 2  │                      │  Midtrans Payment    │
│ (Verifikasi OTP)│                      │  (redirect external) │
└─────────────────┘                      └──────────────────────┘
       │                                             │ Bayar berhasil
       ▼                                             ▼
┌─────────────────┐                      ┌──────────────────────┐
│ Sign Up Step 3  │                      │  Payment Success     │
│ (Review/Selesai)│                      │  (konfirmasi)        │
└─────────────────┘                      └──────────────────────┘
       │
       ▼
┌─────────────────┐
│ Forgot Password │
│ (opsional)      │
└─────────────────┘
```

### Route Keys (dikelola via `useState` di App.jsx)

| Route Key           | Halaman                         |
| ------------------- | ------------------------------- |
| `'login'`           | Halaman login                   |
| `'signup'`          | Sign Up Step 1 — buat akun      |
| `'signup-otp'`      | Sign Up Step 2 — verifikasi OTP |
| `'signup-review'`   | Sign Up Step 3 — review selesai |
| `'forgot-password'` | Lupa password                   |
| `'subscription'`    | Pilih paket berlangganan        |
| `'payment-success'` | Pembayaran berhasil             |

---

## 5. Instalasi & Menjalankan

### Prasyarat

- **Node.js** versi 18+
- **npm** versi 9+

### Langkah

```bash
# 1. Masuk ke folder project
cd Dev-Gasing-Circle-AuthPage

# 2. Install dependencies
npm install

# 3. Buat file .env dari template
cp .env.example .env

# 4. Isi .env (lihat bagian Konfigurasi Environment)

# 5. Jalankan dev server
npm run dev
```

Buka **http://localhost:5173** di browser.

Untuk akses dari komputer lain di jaringan yang sama, gunakan URL Network yang muncul di terminal:

```
➜  Local:   http://localhost:5173/
➜  Network: http://192.168.1.x:5173/   ← bagikan URL ini
```

---

## 6. Konfigurasi Environment

Buat file `.env` di root folder (sejajar dengan `package.json`):

```env
# Kosongkan — request ke backend ditangani Vite proxy
VITE_API_URL=

# URL komunitas Discourse
VITE_DISCOURSE_URL=https://komunitas.gasingcircle.id

# Nomor WhatsApp perusahaan (format internasional tanpa + dan spasi)
VITE_WA_NUMBER=628123456789
```

> **Penting:** Setelah mengubah `.env`, selalu restart dev server (`Ctrl+C` lalu `npm run dev`).

---

## 7. Vite Proxy

Semua request ke `/api/*` otomatis diteruskan ke backend oleh Vite, sehingga tidak ada CORS error baik dari `localhost` maupun dari IP jaringan lokal.

Konfigurasi ada di `vite.config.js`:

```js
server: {
  host: true,        // izinkan akses dari jaringan lokal
  port: 5173,
  proxy: {
    '/api': {
      target: 'https://dev-dge-comunity.baka.work',
      changeOrigin: true,
      secure: true,
    }
  }
}
```

Seluruh request di `src/lib/api.js` menggunakan prefix `/api/v1/reg` tanpa domain:

```js
const BASE_PATH = "/api/v1/reg";
```

Sehingga bekerja dari komputer mana pun yang mengakses app ini.

---

## 8. Komponen & Arsitektur

### 8.1 Halaman (Pages)

| File                           | Halaman                                      | Keterangan                                   |
| ------------------------------ | -------------------------------------------- | -------------------------------------------- |
| `App.jsx`                      | Login, Sign Up, OTP, Review, Forgot Password | Semua halaman auth dalam satu file           |
| `pages/SubscriptionPage.jsx`   | Subscription                                 | Pilih paket Tahunan / Bulanan                |
| `pages/PaymentSuccessPage.jsx` | Payment Success                              | Konfirmasi bayar + link Discourse + WhatsApp |

### 8.2 Komponen shadcn/ui

| Komponen     | File              | Kegunaan                                        |
| ------------ | ----------------- | ----------------------------------------------- |
| `<Button>`   | `ui/button.jsx`   | Tombol dengan variant (default, outline, ghost) |
| `<Input>`    | `ui/input.jsx`    | Input field                                     |
| `<Label>`    | `ui/label.jsx`    | Label form aksesibel                            |
| `<Checkbox>` | `ui/checkbox.jsx` | Checkbox "Ingatkan saya"                        |
| `<Select>`   | `ui/select.jsx`   | Dropdown daerah pelatihan GASING                |

### 8.3 Komponen Custom (tetap)

| Komponen            | Deskripsi                                       |
| ------------------- | ----------------------------------------------- |
| `<IconInput />`     | Wrapper `<Input>` dengan ikon kiri/kanan        |
| `<StepIndicator />` | Progress bar 3 langkah Sign Up                  |
| `<OtpInput />`      | 6-kotak OTP dengan auto-focus dan paste support |
| `<PlanCard />`      | Card pilihan paket di SubscriptionPage          |
| `<Avatar />`        | Avatar initials user di navbar                  |
| `<ErrorAlert />`    | Alert merah untuk error dari API                |

### 8.4 Custom Hook

**`useCountdown(seconds)`**

| Return    | Tipe       | Keterangan              |
| --------- | ---------- | ----------------------- |
| `display` | `string`   | Format MM:SS            |
| `expired` | `boolean`  | `true` jika timer habis |
| `reset()` | `function` | Restart timer           |

---

## 9. API Layer

Semua HTTP call terpusat di `src/lib/api.js`.

### Token Management

```js
tokenStorage.getAccess(); // ambil access token
tokenStorage.getRefresh(); // ambil refresh token
tokenStorage.setTokens(a, r); // simpan kedua token
tokenStorage.clear(); // hapus semua token (logout)
```

Token disimpan di `localStorage`. Request otomatis attach `Authorization: Bearer <token>` di setiap call. Jika response `401`, otomatis coba refresh token sebelum logout.

### Endpoint Summary

| Grup         | Method | Path                      | Keterangan                                   |
| ------------ | ------ | ------------------------- | -------------------------------------------- |
| Auth         | POST   | `/auth/register`          | Daftar akun baru                             |
| Auth         | POST   | `/auth/confirm-email`     | Verifikasi OTP                               |
| Auth         | POST   | `/auth/login`             | Login → dapat `accessToken` + `refreshToken` |
| Auth         | POST   | `/auth/logout`            | Logout                                       |
| Auth         | POST   | `/auth/refresh`           | Refresh access token                         |
| Auth         | POST   | `/auth/forgot-password`   | Kirim email reset password                   |
| Auth         | POST   | `/auth/reset-password`    | Reset password dengan token                  |
| Profile      | GET    | `/profile/me`             | Ambil data profil                            |
| Profile      | PATCH  | `/profile`                | Update profil                                |
| Profile      | PATCH  | `/profile/password`       | Ganti password                               |
| Regions      | GET    | `/training-regions`       | List daerah pelatihan (public)               |
| Subscription | GET    | `/subscriptions/plans`    | List paket (belum aktif)                     |
| Subscription | POST   | `/subscriptions/checkout` | Buat transaksi Midtrans                      |
| Subscription | GET    | `/subscriptions/status`   | Status langganan aktif                       |

### JWT Token

Login menghasilkan dua token:

```json
{
  "accessToken": "...", // expires: 2 jam
  "refreshToken": "...", // expires: ~60 hari
  "tokenType": "Bearer",
  "expiresIn": "2h"
}
```

---

## 10. Integrasi Midtrans

Metode yang digunakan: **Snap Redirect** (user diarahkan ke halaman Midtrans, bukan popup).

### Flow

```
1. User pilih paket → klik "Berlangganan"
2. Frontend: POST /subscriptions/checkout { planId }
3. Backend: buat transaksi Midtrans → return { redirectUrl }
4. Frontend: window.location.href = redirectUrl
5. User bayar di halaman Midtrans
6. Midtrans redirect balik ke app: /?payment=success&plan=Annual+Visionary
7. App.jsx deteksi query param → tampilkan PaymentSuccessPage
```

### Menyesuaikan Endpoint Checkout

Saat ini endpoint masih dummy. Setelah backend siap, update di `src/lib/api.js`:

```js
// Sesuaikan path dan field body dengan backend kamu
checkout: (planId) => request('/subscriptions/checkout', {
  method: 'POST',
  body: { planId },   // ← ganti field sesuai kebutuhan backend
}),
```

### Bypass Sementara (Development)

Selama endpoint belum siap, ada bypass di `src/pages/SubscriptionPage.jsx` yang mensimulasikan redirect Midtrans:

```js
// ⚠️ BYPASS SEMENTARA — hapus block ini kalau endpoint sudah siap
const params = new URLSearchParams({
  payment: "success",
  plan: encodeURIComponent(activePlan?.planLabel || ""),
});
window.location.href = `${window.location.pathname}?${params.toString()}`;
return;
// ⚠️ END BYPASS
```

Hapus 4 baris di atas saat endpoint sudah tersedia.

### Redirect URL untuk Midtrans

Daftarkan URL ini di dashboard Midtrans sebagai **Finish Redirect URL**:

```
https://domain-kamu.com/?payment=success&plan={PLAN_NAME}
```

Untuk development:

```
http://localhost:5173/?payment=success
```

---

## 11. Kustomisasi

### 11.1 Mengganti Data Paket

Edit array `DUMMY_PLANS` di `src/pages/SubscriptionPage.jsx`:

```js
const DUMMY_PLANS = [
  {
    id: "annual",
    name: "Tahunan",
    priceMonthly: 33000,
    priceTotal: 400000,
    originalPrice: 39900,
    discount: 20,
    label: "Kamu Hemat 20%",
    planLabel: "Annual Visionary", // ← nama yang tampil di PaymentSuccess
    recommended: true,
  },
  // tambah paket lain di sini
];
```

Atau uncomment fetch dari API di `useEffect` dalam `SubscriptionPage.jsx` kalau backend sudah siap.

### 11.2 Mengganti Nomor WhatsApp

Update `.env`:

```
VITE_WA_NUMBER=628111222333
```

### 11.3 Mengganti URL Discourse

Update `.env`:

```
VITE_DISCOURSE_URL=https://dev-komunitas.gasingacademy.org
```

### 11.4 Mengganti Tema Warna

Ubah CSS variables di `src/index.css`:

```css
:root {
  --primary: 0 0% 9%; /* hitam → ganti ke warna lain */
  --primary-foreground: 0 0% 98%;
}
```

Untuk SubscriptionPage dan PaymentSuccessPage yang pakai warna biru langsung (Tailwind class `bg-blue-600`), cari dan ganti `blue-600` dengan warna yang diinginkan.

---

## 12. Referensi Scripts

| Command           | Fungsi                                            |
| ----------------- | ------------------------------------------------- |
| `npm install`     | Install semua dependencies                        |
| `npm run dev`     | Dev server di `localhost:5173` dengan HMR + proxy |
| `npm run build`   | Build produksi ke folder `dist/`                  |
| `npm run preview` | Preview hasil build secara lokal                  |

---

## 13. Changelog

### v2.0.0 — 26 Maret 2026

- ✅ Tambah `SubscriptionPage` — pilih paket Tahunan / Bulanan
- ✅ Integrasi Midtrans Snap Redirect
- ✅ Tambah `PaymentSuccessPage` — konfirmasi bayar + link Discourse + WhatsApp
- ✅ Bypass mode untuk development sebelum endpoint subscription siap
- ✅ Tambah `VITE_DISCOURSE_URL` dan `VITE_WA_NUMBER` di environment
- ✅ Post-login flow: Login → Subscription → Midtrans → Payment Success
- ✅ Deteksi query param `?payment=success` dari Midtrans redirect

### v1.1.0 — 18 Maret 2026

- ✅ Migrasi ke shadcn/ui (Button, Input, Label, Checkbox, Select)
- ✅ Path alias `@` → `./src`
- ✅ shadcn CSS color tokens di Tailwind config

### v1.0.0 — 17 Maret 2026

- ✅ Initial release
- ✅ Auth flow: Login, Register, OTP, Forgot Password
- ✅ Vite proxy untuk bypass CORS
- ✅ Dropdown daerah dari API `/training-regions`
- ✅ Dual JWT (access + refresh token)
- ✅ Auto retry dengan refresh token saat `401`

---

© 2026 Gasing Circle. All rights reserved.
