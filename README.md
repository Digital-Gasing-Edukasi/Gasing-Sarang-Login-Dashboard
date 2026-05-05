# GASING CIRCLE — Frontend SPA

> **Versi:** 2.3.0 · **Tanggal:** 5 Mei 2026 · **Stack:** React 18 + Vite + Tailwind CSS + shadcn/ui

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
11. [Halaman Test Midtrans](#11-halaman-test-midtrans)
12. [Discourse SSO](#12-discourse-sso)
13. [Deployment & Infrastruktur](#13-deployment--infrastruktur)
14. [CI/CD — GitHub Actions](#14-cicd--github-actions)
15. [Kustomisasi](#15-kustomisasi)
16. [Referensi Scripts](#16-referensi-scripts)
17. [Changelog](#17-changelog)

---

## 1. Overview

Gasing Circle Frontend SPA adalah aplikasi **Single Page Application** berbasis React yang mencakup:

- Alur autentikasi lengkap (Register, OTP, Login, Forgot Password, Reset Password)
- Halaman pemilihan paket berlangganan (data dari API, fallback ke dummy)
- Integrasi pembayaran via **Midtrans Snap** (popup mode)
- Halaman konfirmasi pembayaran berhasil dengan link ke komunitas Discourse
- Dashboard Admin untuk Verifikasi Akun dan Manajemen Pengguna
- **Discourse SSO** — login via Discourse langsung terhubung ke akun app
- **MidtransTestPage** — halaman developer untuk verifikasi konfigurasi Midtrans Sandbox

Aplikasi terhubung ke backend **NestJS + Prisma + PostgreSQL** melalui `VITE_API_URL`. Vite proxy tersedia sebagai opsional untuk dev lokal.

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
Login page/
├── .env                    ← variabel environment lokal (buat dari template di bawah)
├── .env.staging            ← variabel environment untuk build staging
├── index.html              ← entry HTML + Midtrans Snap script
├── package.json
├── vite.config.js          ← path alias + Vite proxy config
├── tailwind.config.js
├── postcss.config.js
├── Reference/              ← dokumen referensi / Postman collection (diabaikan git)
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
        ├── AdminDashboardPage.jsx  ← dashboard admin (Verifikasi & Manajemen)
        ├── SubscriptionPage.jsx    ← halaman pilih paket
        ├── PaymentSuccessPage.jsx  ← halaman pembayaran berhasil
        └── MidtransTestPage.jsx    ← halaman test konfigurasi Midtrans (dev only)
```

---

## 4. Alur Halaman

```
┌─────────────┐
│    Login    │──────────────────────────────────────────────┐
└─────────────┘                                              │
       │ Belum punya akun                                    │ Login berhasil
       ▼                                                     ▼
┌─────────────────┐                            ┌──────────────────────┐
│ Sign Up Step 1  │                            │   Subscription Page  │
│ (Buat Akun)     │                            │  (Pilih paket)       │
└─────────────────┘                            └──────────────────────┘
       │                                                     │ Klik Berlangganan
       ▼                                                     ▼
┌─────────────────┐                            ┌──────────────────────┐
│ Sign Up Step 2  │                            │  Midtrans Snap Popup │
│ (Verifikasi OTP)│                            │                      │
└─────────────────┘                            └──────────────────────┘
       │                                                     │ Bayar berhasil
       ▼                                                     ▼
┌─────────────────┐                            ┌──────────────────────┐
│ Sign Up Step 3  │                            │  Payment Success     │
│ (Review/Selesai)│                            │  (konfirmasi)        │
└─────────────────┘                            └──────────────────────┘
       │
       ▼
┌─────────────────┐       ┌──────────────────┐
│ Forgot Password │──────▶│   Check Email    │
└─────────────────┘       └──────────────────┘
                                   │ Klik link di email
                                   ▼
                          ┌──────────────────┐
                          │  Reset Password  │
                          └──────────────────┘

Discourse SSO:
/?sso=...&sig=... ──▶ SSO Callback ──▶ Subscription Page
```

### Route Keys (dikelola via `useState` di App.jsx)

| Route Key           | Halaman                                        |
| ------------------- | ---------------------------------------------- |
| `'login'`           | Halaman login                                  |
| `'signup'`          | Sign Up Step 1 — buat akun                    |
| `'signup-otp'`      | Sign Up Step 2 — verifikasi OTP                |
| `'signup-review'`   | Sign Up Step 3 — review selesai                |
| `'forgot-password'` | Lupa password                                  |
| `'check-email'`     | Cek email — instruksi setelah kirim reset link |
| `'reset-password'`  | Reset password — form ubah password baru       |
| `'subscription'`    | Pilih paket berlangganan                       |
| `'payment-success'` | Pembayaran berhasil                            |
| `'admin-dashboard'` | Dashboard Admin (Verifikasi & Manajemen Akun)  |
| `'sso-callback'`    | Proses verifikasi SSO dari Discourse           |
| `'midtrans-test'`   | Halaman test Midtrans (dev only)               |

### Query Params yang Dideteksi App.jsx

| Query Param       | Nilai      | Efek                                               |
| ----------------- | ---------- | -------------------------------------------------- |
| `?payment=success`| —          | Tampilkan PaymentSuccessPage                       |
| `?plan=`          | nama paket | Nama paket ditampilkan di PaymentSuccessPage       |
| `?token=`         | reset token| Buka ResetPasswordPage                             |
| `?email=`         | email      | Prefill email di ResetPasswordPage                 |
| `?admin=true`     | —          | Langsung buka AdminDashboardPage                   |
| `?sso=&sig=`      | —          | Proses SSO Callback dari Discourse                 |
| `?midtrans-test=true` | —      | Buka MidtransTestPage (halaman test dev)           |

---

## 5. Instalasi & Menjalankan

### Prasyarat

- **Node.js** versi 18+
- **npm** versi 9+

### Langkah

```bash
# 1. Masuk ke folder project
cd "Login page"

# 2. Install dependencies
npm install

# 3. Buat file .env
cp .env.staging .env   # lalu sesuaikan nilainya

# 4. Isi .env (lihat bagian Konfigurasi Environment)

# 5. Jalankan dev server
npm run dev
```

Buka **http://localhost:5173** di browser.

---

## 6. Konfigurasi Environment

Buat file `.env` di root folder (sejajar dengan `package.json`):

```env
# URL backend API (langsung, tanpa trailing slash)
VITE_API_URL=http://localhost:3000

# URL komunitas Discourse
VITE_DISCOURSE_URL=https://dev-komunitas.gasingacademy.org

# Nomor WhatsApp perusahaan (format internasional tanpa + dan spasi)
VITE_WA_NUMBER=6287788000305

# ─── Midtrans ─────────────────────────────────────────────────────────────────
# Client Key → untuk frontend (Snap script di index.html)
# Sandbox: Mid-client-... | Production: Mid-client-...
VITE_MIDTRANS_CLIENT_KEY=Mid-client-xxxxxxxxxxxxxxxx

# Server Key → HANYA untuk MidtransTestPage (halaman test dev lokal).
# JANGAN gunakan di production.
# Sandbox: Mid-server-... | Production: Mid-server-...
VITE_MIDTRANS_SERVER_KEY=Mid-server-xxxxxxxxxxxxxxxx
```

> **Penting:** Setelah mengubah `.env`, selalu restart dev server (`Ctrl+C` lalu `npm run dev`).

### File .env.staging

Tersedia `.env.staging` untuk build ke environment staging:

```bash
npm run build:staging
```

---

## 7. Vite Proxy

Vite proxy dikonfigurasi di `vite.config.js` sebagai bantuan dev lokal (menghindari CORS saat backend belum support CORS ke localhost):

```js
server: {
  proxy: {
    '/api': {
      target: 'https://dev-dge-comunity.baka.work',
      changeOrigin: true,
      secure: true,
    }
  }
}
```

> Catatan: `src/lib/api.js` menggunakan `VITE_API_URL` secara langsung — bukan prefix `/api/`. Proxy ini hanya aktif jika `VITE_API_URL` mengarah ke path yang diawali `/api`.

---

## 8. Komponen & Arsitektur

### 8.1 Halaman (Pages)

| File                           | Halaman                                      | Keterangan                                   |
| ------------------------------ | -------------------------------------------- | -------------------------------------------- |
| `App.jsx`                      | Login, Sign Up, OTP, Review, Forgot Password, Check Email, Reset Password, SSO Callback | Semua halaman auth + routing utama |
| `pages/SubscriptionPage.jsx`   | Subscription                                 | Pilih paket Tahunan / Bulanan (data API + fallback dummy) |
| `pages/PaymentSuccessPage.jsx` | Payment Success                              | Konfirmasi bayar + link Discourse + WhatsApp |
| `pages/AdminDashboardPage.jsx` | Admin Dashboard                              | Verifikasi & Manajemen Akun pengguna         |
| `pages/MidtransTestPage.jsx`   | Midtrans Test                                | Tool verifikasi Midtrans Sandbox (dev only)  |

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
| `<EnvelopeCluster />` | Ilustrasi SVG dekoratif di halaman forgot password |
| `<AuthFullLayout />` | Layout full-width untuk halaman forgot/reset password |
| `<SuccessToast />`  | Toast notifikasi hijau (auto-dismiss)           |

### 8.4 Custom Hook

**`useCountdown(seconds)`**

| Return    | Tipe       | Keterangan              |
| --------- | ---------- | ----------------------- |
| `display` | `string`   | Format MM:SS            |
| `expired` | `boolean`  | `true` jika timer habis |
| `reset()` | `function` | Restart timer           |

---

## 9. API Layer

Semua HTTP call terpusat di `src/lib/api.js`. Base URL diambil dari `VITE_API_URL`.

### Token Management

```js
tokenStorage.getAccess();       // ambil access token
tokenStorage.getRefresh();      // ambil refresh token
tokenStorage.setTokens(a, r);  // simpan kedua token
tokenStorage.clear();           // hapus semua token (logout)
```

Token disimpan di `localStorage`. Request otomatis attach `Authorization: Bearer <token>`. Jika response `401`, otomatis coba refresh token sebelum logout.

### Endpoint Summary

#### Auth (`authApi`)

| Method | Path                      | Keterangan                                   |
| ------ | ------------------------- | -------------------------------------------- |
| POST   | `/auth/register`          | Daftar akun baru                             |
| POST   | `/auth/confirm-email`     | Verifikasi OTP                               |
| POST   | `/auth/login`             | Login → dapat `accessToken` + `refreshToken` |
| POST   | `/auth/logout`            | Logout sesi ini                              |
| POST   | `/auth/logout-all`        | Logout semua sesi                            |
| POST   | `/auth/refresh`           | Refresh access token                         |
| POST   | `/auth/forgot-password`   | Kirim email reset password                   |
| POST   | `/auth/reset-password`    | Reset password dengan token                  |

#### Profile (`profileApi`)

| Method | Path                      | Keterangan                                   |
| ------ | ------------------------- | -------------------------------------------- |
| GET    | `/profile/me`             | Ambil data profil                            |
| PATCH  | `/profile`                | Update profil                                |
| PATCH  | `/profile/password`       | Ganti password                               |
| PATCH  | `/profile/picture`        | Update foto profil (via fileId)              |
| POST   | `/profile/confirm-email`  | Konfirmasi perubahan email                   |

#### Training Regions (`regionsApi`)

| Method | Path                              | Keterangan               |
| ------ | --------------------------------- | ------------------------ |
| GET    | `/training-regions`               | List semua daerah (public)|
| GET    | `/training-regions/:id`           | Detail satu daerah       |
| GET    | `/training-regions/by-area/:id`   | Filter by area ID        |

#### Timezone (`timezoneApi`)

| Method | Path         | Keterangan        |
| ------ | ------------ | ----------------- |
| GET    | `/timezones` | List semua timezone (public) |

#### Subscription & Payment (`subscriptionApi`)

| Method | Path                       | Keterangan                         |
| ------ | -------------------------- | ---------------------------------- |
| GET    | `/packages`                | List paket tersedia (public)       |
| GET    | `/subscription/me`         | Status langganan aktif user        |
| POST   | `/subscription/checkout`   | Buat transaksi Midtrans            |
| POST   | `/subscription/subscribe`  | Subscribe paket (tanpa Midtrans)   |
| POST   | `/subscription/cancel`     | Batalkan langganan aktif           |
| GET    | `/subscription/history`    | Riwayat pembayaran                 |

#### Voucher (`voucherApi`)

| Method | Path                | Keterangan                    |
| ------ | ------------------- | ----------------------------- |
| GET    | `/vouchers`         | List voucher user             |
| POST   | `/vouchers/validate`| Validasi kode voucher         |
| POST   | `/vouchers/redeem`  | Redeem kode voucher           |

#### Discourse & SSO (`discourseApi`)

| Method | Path                 | Keterangan                              |
| ------ | -------------------- | --------------------------------------- |
| GET    | `/discourse/groups`  | List Discourse groups                   |
| GET    | `/discourse/sso-login` | Inisiasi alur SSO login ke Discourse  |
| POST   | `/discourse/gateway` | Verifikasi `sso` + `sig` dari callback  |

#### File Manager (`fileManagerApi`)

| Method | Path                            | Keterangan                    |
| ------ | ------------------------------- | ----------------------------- |
| POST   | `/file-manager/upload`          | Upload file (multipart)       |
| PATCH  | `/file-manager/commit/:fileId`  | Commit file yang diupload     |
| GET    | `/file-manager/download/:fileId`| URL download file             |

#### Admin (`adminApi`)

**Users**

| Method | Path                              | Keterangan                          |
| ------ | --------------------------------- | ----------------------------------- |
| GET    | `/admin/users`                    | Daftar pengguna (support filter)    |
| GET    | `/admin/users/:id`                | Detail satu pengguna                |
| PATCH  | `/admin/users/:id`                | Update data pengguna                |
| PATCH  | `/admin/users/:id/password`       | Set password pengguna               |
| PATCH  | `/admin/users/:id/verify`         | Approve / Reject akun               |
| PATCH  | `/admin/users/:id/discourse-group`| Ubah role (Discourse Group)         |

**Packages**

| Method | Path                  | Keterangan                   |
| ------ | --------------------- | ---------------------------- |
| GET    | `/admin/packages`     | List semua paket             |
| GET    | `/admin/packages/:id` | Detail paket                 |
| POST   | `/admin/packages`     | Buat paket baru              |
| PATCH  | `/admin/packages/:id` | Update paket                 |
| DELETE | `/admin/packages/:id` | Nonaktifkan paket            |

**Subscriptions**

| Method | Path                            | Keterangan                     |
| ------ | ------------------------------- | ------------------------------ |
| GET    | `/admin/subscriptions`          | List semua langganan           |
| GET    | `/admin/subscriptions/:id`      | Detail langganan               |
| POST   | `/admin/subscriptions/sync`     | Sinkronisasi status Midtrans   |

**Payments**

| Method | Path              | Keterangan              |
| ------ | ----------------- | ----------------------- |
| GET    | `/admin/payments` | List semua transaksi    |

**Training Regions**

| Method | Path                          | Keterangan             |
| ------ | ----------------------------- | ---------------------- |
| POST   | `/admin/training-regions`     | Tambah daerah baru     |
| PATCH  | `/admin/training-regions/:id` | Update daerah          |
| DELETE | `/admin/training-regions/:id` | Hapus daerah           |

**Vouchers**

| Method | Path                               | Keterangan                     |
| ------ | ---------------------------------- | ------------------------------ |
| GET    | `/admin/vouchers`                  | List semua voucher             |
| GET    | `/admin/vouchers/:code`            | Detail voucher                 |
| GET    | `/admin/vouchers/:code/usage`      | Riwayat pemakaian voucher      |
| POST   | `/admin/vouchers/pool`             | Buat pool voucher              |
| POST   | `/admin/vouchers/personal`         | Grant voucher personal         |
| PATCH  | `/admin/vouchers/:id/revoke`       | Cabut voucher                  |

### JWT Token

Login menghasilkan dua token:

```json
{
  "accessToken":  "...",
  "refreshToken": "...",
  "tokenType":    "Bearer",
  "expiresIn":    "2h"
}
```

---

## 10. Integrasi Midtrans

Metode yang digunakan: **Snap Popup** — popup Midtrans muncul di atas halaman (bukan redirect ke halaman lain).

### Konfigurasi index.html

Script Midtrans Snap dimuat dari `index.html`:

```html
<!-- Gunakan app.midtrans.com/snap/snap.js untuk Production -->
<script type="text/javascript"
        src="https://app.sandbox.midtrans.com/snap/snap.js"
        data-client-key="%VITE_MIDTRANS_CLIENT_KEY%">
</script>
```

Ganti URL script saat deploy ke production:

```
https://app.midtrans.com/snap/snap.js
```

### Flow

```
1. User pilih paket → klik "Berlangganan"
2. Frontend: POST /subscription/checkout { packageId }
3. Backend: buat transaksi Midtrans → return { snapToken }
4. Frontend: window.snap.pay(snapToken, { onSuccess, onPending, onError })
5. User bayar via popup Midtrans
6. onSuccess → navigasi ke PaymentSuccessPage
7. onPending → navigasi ke AdminDashboard (lihat status)
```

### Endpoint Checkout

Di `src/lib/api.js`:

```js
checkout: (packageId) =>
  request('/subscription/checkout', { method: 'POST', body: { packageId } }),
```

---

## 11. Halaman Test Midtrans

Akses via: **`http://localhost:5173/?midtrans-test=true`**

Halaman khusus developer untuk memverifikasi konfigurasi Midtrans Sandbox **tanpa backend**. Tidak perlu deploy atau jalankan server backend.

### Fitur

| Fitur                      | Keterangan                                               |
| -------------------------- | -------------------------------------------------------- |
| Status Check               | Cek `window.snap`, Client Key, dan Server Key            |
| **Cara 1 — Direct Test**   | Generate token langsung ke Midtrans Sandbox API, lalu buka popup otomatis |
| **Cara 2 — Manual Token**  | Paste Snap Token dari Postman / backend, lalu buka popup |
| Hasil popup                | Tampilkan status: success / pending / error / closed     |
| Kartu simulasi             | Informasi nomor kartu kredit simulasi Sandbox            |

### Requirement

```env
VITE_MIDTRANS_CLIENT_KEY=Mid-client-...   # wajib (untuk window.snap)
VITE_MIDTRANS_SERVER_KEY=Mid-server-...   # wajib untuk Cara 1 (Direct Test)
```

> **Perhatian:** `VITE_MIDTRANS_SERVER_KEY` hanya boleh ada di `.env` lokal. Jangan commit ke repository atau deploy ke production.

---

## 12. Discourse SSO

Aplikasi mendukung login melalui Discourse SSO. Saat user login di Discourse dan diarahkan kembali ke app:

```
/register?sso=<payload>&sig=<signature>
```

App.jsx mendeteksi param tersebut, memproses melalui `discourseApi.gateway()`, menyimpan token, dan mengarahkan user ke SubscriptionPage.

### URL yang perlu didaftarkan ke Discourse / Backend

| Keperluan | URL |
| --- | --- |
| **SSO Callback URL** | `https://dev-komunitas.gasingacademy.org/register` |
| **Midtrans Finish URL** | `https://dev-komunitas.gasingacademy.org/register?payment=success` |

### Flow

```
1. User klik "Login with Discourse" di Discourse
2. Discourse redirect ke app: /register?sso=...&sig=...
3. App.jsx deteksi param → tampilkan SsoCallbackPage (loading)
4. discourseApi.gateway(sso, sig) → POST /discourse/gateway
5. Backend verifikasi → return { accessToken, refreshToken, user }
6. Token disimpan → navigasi ke Subscription
```

---

## 13. Deployment & Infrastruktur

### URL yang Aktif

| Environment | URL | Status |
| --- | --- | --- |
| **Staging (domain)** | `https://dev-komunitas.gasingacademy.org/register/` | ✅ Live |
| **Staging (IP)** | `http://34.101.34.59` | ✅ Live |
| **Lokal** | `http://localhost:5173` | via `npm run dev` |

### Infrastruktur GCE

| Komponen | Detail |
| --- | --- |
| **GCP Project** | `sacred-octagon` |
| **VM Instance** | `discourse-01` |
| **Zone** | `asia-southeast2-a` (Jakarta) |
| **IP Publik** | `34.101.34.59` |
| **OS** | Ubuntu 24.04 LTS |
| **Machine Type** | `e2-medium` (2 vCPU, 4GB RAM) |
| **Web Server** | Nginx |
| **File Lokasi** | `/var/www/gasing-auth/` |

### Nginx Config

App di-serve melalui dua Nginx config:

**1. `gasing-auth`** — akses via IP langsung (port 80)
```nginx
server {
    listen 80;
    server_name 34.101.34.59;
    root /var/www/gasing-auth;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

**2. `dev-komunitas`** — akses via domain Discourse (port 443 HTTPS)
```nginx
# Tambahkan di dalam server block dev-komunitas, SEBELUM location /
location /register {
    alias /var/www/gasing-auth;
    index index.html;
    try_files $uri $uri/ /register/index.html;
}
```

### Cara Deploy / Update

Untuk update build ke staging secara manual:

```powershell
# 1. Build di lokal
npm run build:staging

# 2. Upload ke VM
scp -r "dist\*" ksatriagaberdevelopment@34.101.34.59:/tmp/gasing-upload/
```

```bash
# 3. Di SSH VM — deploy file
sudo rm -rf /var/www/gasing-auth/*
sudo cp -r /tmp/gasing-upload/* /var/www/gasing-auth/
sudo chown -R www-data:www-data /var/www/gasing-auth
# Tidak perlu restart Nginx
```

> 📘 Panduan lengkap ada di `DEPLOYMENT_GUIDE.md` (tersimpan di brain/scratch).

---

## 14. CI/CD — GitHub Actions

Tersedia workflow otomatis di `.github/workflows/production.yml`.

### Trigger

```
Push ke branch: production
```

### Steps

| Step | Keterangan |
| --- | --- |
| Checkout | Clone repository |
| Setup Node.js 20 | Install runtime dengan cache npm |
| `npm ci` | Install dependencies secara deterministik |
| `npm run build` | Build production ke `dist/` |
| GCP Auth | Autentikasi ke Google Cloud via `GCP_CREDENTIALS_PRODUCTION` |
| SCP ke GCE | Transfer `dist/*` ke `/var/www/gasingcircle.com` di VM production |

### GitHub Secrets yang Diperlukan

| Secret | Keterangan |
| --- | --- |
| `GCP_CREDENTIALS_PRODUCTION` | Service account JSON GCP |
| `GCE_INSTANCE_PRODUCTION` | Nama instance VM production |
| `GCE_USER` | Username SSH ke VM |

> ⚠️ Workflow ini untuk **production** (bukan staging). Staging masih deploy manual via SCP.

---

## 15. Kustomisasi

### 13.1 Mengganti Data Paket

Paket diambil dari API `/packages`. Jika API tidak tersedia, fallback ke `DUMMY_PLANS` di `src/pages/SubscriptionPage.jsx`.

Untuk mengubah data dummy:

```js
const DUMMY_PLANS = [
  {
    id: "dummy-annual",
    name: "Tahunan",
    priceMonthly: 33000,
    priceTotal: 400000,
    originalPrice: 39900,
    discount: 20,
    label: "Kamu Hemat 20%",
    recommended: true,
    planLabel: "Tahunan",
  },
  // tambah paket lain di sini
];
```

### 13.2 Mengganti Nomor WhatsApp

Update `.env`:

```
VITE_WA_NUMBER=628111222333
```

### 13.3 Mengganti URL Discourse

Update `.env`:

```
VITE_DISCOURSE_URL=https://komunitas.gasingcircle.id
```

### 13.4 Mengganti Tema Warna

Ubah CSS variables di `src/index.css`:

```css
:root {
  --primary: 0 0% 9%; /* hitam → ganti ke warna lain */
  --primary-foreground: 0 0% 98%;
}
```

### 13.5 Midtrans Production

1. Ganti script di `index.html`:
   ```
   https://app.midtrans.com/snap/snap.js
   ```
2. Ganti Client Key di `.env` ke Production key (tanpa prefix `SB-`).
3. Hapus `VITE_MIDTRANS_SERVER_KEY` dari `.env`.

---

## 16. Referensi Scripts

| Command                | Fungsi                                            |
| ---------------------- | ------------------------------------------------- |
| `npm install`          | Install semua dependencies                        |
| `npm run dev`          | Dev server di `localhost:5173` dengan HMR + proxy |
| `npm run build`        | Build produksi ke folder `dist/`                  |
| `npm run build:staging`| Build dengan mode staging (pakai `.env.staging`)  |
| `npm run preview`      | Preview hasil build secara lokal                  |

---

## 17. Changelog

### v2.3.0 — 5 Mei 2026 *(Staging Deployment Live)*

Sesi ini berfokus pada penyelesaian deployment ke environment staging di GCE dan memastikan app dapat diakses publik via domain Discourse.

**🚀 Deployment**

- App **berhasil live** di `https://dev-komunitas.gasingacademy.org/register/` ✅
- App juga dapat diakses via IP langsung: `http://34.101.34.59` ✅
- VM: `discourse-01` · Zone: `asia-southeast2-a` · Project: `sacred-octagon`
- File di-serve dari `/var/www/gasing-auth/` via Nginx

**⚙️ Konfigurasi Nginx**

- Tambah Nginx config `gasing-auth` untuk serve app via IP publik (port 80)
- Tambah `location /register` di config `dev-komunitas` untuk serve app di path `/register` domain Discourse (port 443 HTTPS)
- Fix: Hapus `location /register/assets/` yang terpisah (konflik dengan `alias`) — cukup satu block `location /register`
- Fix `try_files`: `=404` diganti `/register/index.html` agar React Router berfungsi

**🔧 Perbaikan Konfigurasi**

- **[MidtransTestPage.jsx]** Validasi prefix key diperbarui:
  - Client Key: `SB-Mid-client-` → `Mid-client-` (mendukung key non-sandbox)
  - Server Key: `SB-Mid-server-` → `Mid-server-` (mendukung key non-sandbox)
- **[vite.config.js]** `base: '/register'` dikonfirmasi — assets di-build ke path `/register/assets/...`

**📋 Yang Masih Perlu Dilakukan**
- CORS backend: izinkan origin `https://dev-komunitas.gasingacademy.org` dan `http://34.101.34.59`
- Konfigurasi SSO Discourse: daftarkan `https://dev-komunitas.gasingacademy.org/register` sebagai callback URL
- Upload gambar ilustrasi (`illustration.png`, `illustrasi_forgotPassword.png`) ke `/var/www/gasing-auth/` jika belum ada

---

### v2.2.1 — 4 Mei 2026 *(Staging Build Preparation)*

Sesi ini berfokus pada perbaikan bug dan konfigurasi agar project siap dinaikkan ke environment **Staging**.

**🐛 Bug Fix**

- **[App.jsx]** Halaman awal (`useState`) dikembalikan dari `'subscription'` (sisa testing) ke `'login'` (production-ready)
- **[SubscriptionPage.jsx]** Perbaikan redirect setelah pembayaran Midtrans — `window.location.href` diganti dengan callback props karena app menggunakan state-based router (bukan URL router):
  - `onSuccess` → memanggil `onPaymentSuccess(planLabel)` → navigasi ke `PaymentSuccessPage`
  - `onPending` → memanggil `onPaymentPending()` → navigasi ke `AdminDashboardPage`
- **[App.jsx]** Perbaikan endpoint SSO — `authApi.ssoVerify()` (endpoint tidak ada) diganti `discourseApi.gateway()` sesuai spesifikasi backend (`POST /discourse/gateway`)
- **[App.jsx]** Import `discourseApi` ditambahkan ke baris import `api.js`

**⚙️ Konfigurasi Staging**

- Tambah file `.env.staging` dengan variabel khusus environment staging
- Tambah script `build:staging` di `package.json` → menjalankan `vite build --mode staging`
- Dokumentasi URL yang perlu didaftarkan ke Backend/Discourse/Midtrans:
  - **SSO Callback URL:** `https://dev-komunitas.gasingacademy.org/register`
  - **Midtrans Finish URL:** `https://dev-komunitas.gasingacademy.org/register?payment=success`

---

### v2.2.0 — 4 Mei 2026

- ✅ Tambah `MidtransTestPage` — tool verifikasi Midtrans Sandbox tanpa backend (`/?midtrans-test=true`)
- ✅ Discourse SSO — `SsoCallbackPage` + `discourseApi.gateway()` untuk login via Discourse
- ✅ Halaman `CheckEmailPage` & `ResetPasswordPage` — flow Forgot Password kini lengkap end-to-end
- ✅ Query param `?admin=true` untuk akses langsung AdminDashboardPage
- ✅ API layer (`api.js`) diperluas besar-besaran:
  - Tambah `timezoneApi` (list timezone)
  - Tambah `voucherApi` (validate, redeem)
  - Tambah `discourseApi` (groups, ssoLogin, gateway)
  - Tambah `fileManagerApi` (upload, commit, download)
  - `subscriptionApi` diperbarui — endpoint `/packages`, `/subscription/me`, `subscribe`, `cancel`, `paymentHistory`
  - `adminApi` diperluas — manajemen package, subscription, payment, training region, dan voucher
- ✅ Midtrans mode berubah dari **Snap Redirect** ke **Snap Popup** (`window.snap.pay`)
- ✅ Tambah `VITE_MIDTRANS_CLIENT_KEY` & `VITE_MIDTRANS_SERVER_KEY` di environment
- ✅ `index.html` — Midtrans Snap script dengan `data-client-key` dari env
- ✅ Tambah `.env.staging` + script `build:staging` di `package.json`
- ✅ `SubscriptionPage` — paket diambil dari API `/packages`, `DUMMY_PLANS` sebagai fallback
- ✅ `AdminDashboardPage` — UX approve/reject: undo toast 5 detik + modal konfirmasi

### v2.1.0 — 30 April 2026

- ✅ Tambah `AdminDashboardPage` — Interface utama admin
- ✅ Dual Tab Sistem — Mendukung navigasi antara *Verifikasi Akun* dan *Manajemen Akun*
- ✅ Custom Filter Popover — Filter interaktif berdasarkan Role dan Status Berlangganan
- ✅ Export Data CSV — Fitur export terpisah sesuai dengan struktur kolom tab yang aktif
- ✅ Sticky Column & Layout Fixed — Sidebar tidak bergeser saat scrolling pada tabel data
- ✅ Persiapan `adminApi` — Ekstraksi API endpoints dari Postman ke `api.js`

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
