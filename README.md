# GASING CIRCLE — Frontend SPA

> **Versi:** 2.9.0 · **Tanggal:** 25 Juni 2026 · **Stack:** React 18 + Vite + Tailwind CSS + shadcn/ui

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
├── .env                    ← variabel environment lokal
├── .env.staging            ← variabel environment untuk build staging
├── index.html              ← entry HTML + Midtrans Snap script
├── package.json
├── vite.config.js          ← path alias + Vite proxy config
├── tailwind.config.js
├── postcss.config.js
└── src/
    ├── main.jsx            ← entry point React
    ├── App.jsx             ← router utama (state-based, ~100 baris)
    ├── index.css           ← global styles + CSS variables shadcn
    ├── lib/
    │   ├── api.js          ← semua HTTP calls ke backend
    │   └── utils.js        ← helper cn()
    ├── hooks/
    │   └── useCountdown.js ← countdown timer hook (OTP & resend)
    ├── context/
    │   └── AuthContext.jsx ← global auth state (opsional)
    ├── components/
    │   ├── ui/             ← shadcn/ui primitives
    │   │   ├── button.jsx
    │   │   ├── input.jsx
    │   │   ├── label.jsx
    │   │   ├── checkbox.jsx
    │   │   └── select.jsx
    │   ├── layout/         ← komponen layout & struktur halaman
    │   │   ├── LeftPanel.jsx       ← panel kiri (ilustrasi + branding)
    │   │   ├── RightPanel.jsx      ← panel kanan + Divider
    │   │   ├── AuthFullLayout.jsx  ← layout full-width (forgot/reset password)
    │   │   └── StepIndicator.jsx   ← progress bar 3-langkah Sign Up
    │   └── shared/         ← komponen UI reusable lintas halaman
    │       ├── IconInput.jsx       ← input dengan ikon + TogglePassword
    │       ├── ErrorAlert.jsx      ← alert error dari API
    │       ├── SuccessToast.jsx    ← toast notifikasi sukses
    │       └── OtpInput.jsx        ← 6-kotak OTP dengan auto-focus & paste
    └── pages/
        ├── auth/           ← halaman-halaman autentikasi
        │   ├── LoginPage.jsx
        │   ├── SignUpPage.jsx
        │   ├── SignUpOtpPage.jsx
        │   ├── SignUpReviewPage.jsx
        │   ├── ForgotPasswordPage.jsx
        │   ├── CheckEmailPage.jsx
        │   ├── ResetPasswordPage.jsx
        │   └── SsoCallbackPage.jsx
        ├── admin/          ← komponen dashboard admin
        │   ├── mappers.js                  ← fungsi transform data API → UI
        │   ├── AdminSidebar.jsx            ← sidebar navigasi admin
        │   ├── ConfirmModal.jsx            ← modal approve & reject
        │   ├── AdminToast.jsx              ← toast undo (5 detik)
        │   ├── TableControls.jsx           ← toolbar per tab (search, filter, export, add)
        │   ├── VerifikasiTable.jsx         ← tabel tab Verifikasi Akun
        │   ├── ManajemenTable.jsx          ← tabel tab Manajemen Akun
        │   ├── UbahRoleModal.jsx           ← modal ubah role (Manajemen Akun)
        │   ├── KirimVoucherModal.jsx       ← modal kirim voucher (Manajemen Akun)
        │   ├── PendaftaranTrainerTable.jsx ← tabel tab Pendaftaran Trainer
        │   ├── AddPendaftaranTrainerModal.jsx ← modal tambah pendaftaran trainer
        │   ├── RiwayatPelatihanTable.jsx   ← tabel tab Riwayat Pelatihan (sort + action)
        │   └── HapusRiwayatModal.jsx       ← modal konfirmasi hapus riwayat (ketik DELETE)
        ├── AdminDashboardPage.jsx  ← dashboard admin (orchestrator)
        ├── SubscriptionPage.jsx    ← halaman pilih paket
        ├── PaymentSuccessPage.jsx  ← halaman pembayaran berhasil
        └── MidtransTestPage.jsx    ← tool test Midtrans (dev only)
```

---

## 4. Alur Halaman

```
┌─────────────┐
│    Login    │──────────────────────────────────────────────┐
└─────────────┘                                              │
       │ Belum punya akun                                    │ Login berhasil
       ▼                                                     ▼
┌─────────────────┐                            ┌────────────────────────┐
│ Sign Up Step 1  │                            │   Auth Choice Page     │
│ (Buat Akun)     │                            │(Gasing / SSO Callback) │
└─────────────────┘                            └────────────────────────┘
       │                                                 │
       ▼                                                 ▼
┌─────────────────┐                            ┌──────────────────────┐
│ Sign Up Step 2  │                            │ Redirect ke Discourse│
│ (Verifikasi OTP)│                            │ (VITE_DISCOURSE_URL) │
└─────────────────┘                            └──────────────────────┘
       │                                       
       ▼                                       
┌─────────────────┐                            
│ Sign Up Step 3  │                            
│ (Review/Selesai)│                            
└─────────────────┘                            
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

Alur Discourse SSO & Pembayaran:
/register?sso=...&sig=... ──▶ SSO Callback ──▶ Subscription Page ──▶ Midtrans Popup ──▶ Payment Success
```

### Route Keys (dikelola via `useState` di App.jsx)

| Route Key           | Halaman                                        |
| ------------------- | ---------------------------------------------- |
| `'login'`           | Halaman login                                  |
| `'signup'`          | Sign Up Step 1 — buat akun                    |
| `'signup-otp'`      | Sign Up Step 2 — verifikasi OTP                |
| `'signup-review'`   | Sign Up Step 3 — review selesai                |
| `'auth-choice'`     | Pilihan navigasi (Gasing / SSO) setelah login  |
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
VITE_DISCOURSE_URL=https://<APP_DOMAIN>

# Nomor WhatsApp perusahaan (format internasional tanpa + dan spasi)
VITE_WA_NUMBER=62XXXXXXXXXXX

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
      target: 'https://<BACKEND_API_HOST>',
      changeOrigin: true,
      secure: true,
    }
  }
}
```

> Catatan: `src/lib/api.js` menggunakan `VITE_API_URL` secara langsung — bukan prefix `/api/`. Proxy ini hanya aktif jika `VITE_API_URL` mengarah ke path yang diawali `/api`.

---

## 8. Komponen & Arsitektur

### 8.1 Halaman Auth (`src/pages/auth/`)

Setiap halaman auth berdiri sendiri sebagai file terpisah. `App.jsx` hanya bertugas sebagai router.

| File                    | Halaman                                          |
| ----------------------- | ------------------------------------------------ |
| `LoginPage.jsx`         | Login dengan email & password                    |
| `AuthChoicePage.jsx`    | Pilihan navigasi (Gasing / SSO) setelah login    |
| `SignUpPage.jsx`        | Register 2-step (buat akun → verifikasi data)    |
| `SignUpOtpPage.jsx`     | Verifikasi OTP 6 digit                           |
| `SignUpReviewPage.jsx`  | Konfirmasi pendaftaran selesai                   |
| `ForgotPasswordPage.jsx`| Form kirim email reset password                  |
| `CheckEmailPage.jsx`    | Instruksi cek email + tombol kirim ulang         |
| `ResetPasswordPage.jsx` | Form ubah password baru                          |
| `SsoCallbackPage.jsx`   | Proses verifikasi SSO dari Discourse             |

### 8.2 Dashboard Admin (`src/pages/admin/`)

| File                  | Keterangan                                              |
| --------------------- | ------------------------------------------------------- |
| `mappers.js`          | Fungsi `mapToVerifikasi` & `mapToManajemen` (API → UI)  |
| `AdminSidebar.jsx`    | Sidebar navigasi (logo, tab, profil, logout)            |
| `ConfirmModal.jsx`    | Modal konfirmasi: `<RejectModal>` & `<ApproveModal>`    |
| `AdminToast.jsx`      | Toast undo 5 detik setelah approve/reject               |
| `TableControls.jsx`   | `<VerifikasiControls>`, `<ManajemenControls>`, `<PendaftaranTrainerControls>`, `<RiwayatPelatihanControls>` (toolbar per tab) |
| `VerifikasiTable.jsx` | Tabel tab Verifikasi Akun dengan role select & action   |
| `ManajemenTable.jsx`  | Tabel tab Manajemen Akun dengan status, voucher, dst.   |
| `UbahRoleModal.jsx`   | Modal ubah role pengguna (Manajemen Akun)               |
| `KirimVoucherModal.jsx` | Modal kirim voucher personal (Manajemen Akun)         |
| `PendaftaranTrainerTable.jsx` | Tabel tab Pendaftaran Trainer + toggle status   |
| `AddPendaftaranTrainerModal.jsx` | Modal tambah pendaftaran pelatihan trainer   |
| `RiwayatPelatihanTable.jsx` | Tabel tab Riwayat Pelatihan: sort per-kolom, badge status & langganan, action edit/download/hapus |
| `HapusRiwayatModal.jsx` | Modal konfirmasi hapus riwayat (wajib ketik `DELETE`) + undo via toast |

`AdminDashboardPage.jsx` adalah orchestrator yang menggabungkan semua komponen admin di atas.

#### Tab Riwayat Pelatihan

Tabel menampilkan kolom: **Nama Pelatihan** (+ badge `New`), **Daerah Pelatihan**, **Tgl. Mulai**, **Status**, grup **Peserta Guru Pelatihan** (Nama Peserta + link `50+ lainnya`, Email, Langganan), **Last Updated**, dan **Action**.

| Elemen | Nilai / Perilaku |
| ------ | ---------------- |
| Badge **Status** | `Saved` (hijau), `Processing` (amber), `Pending` (ungu), `Error` (merah) |
| Badge **Langganan** | `Aktif` (hijau), `Non-Aktif` / `Berakhir` (abu) |
| **Sort** | Per-kolom via ikon ↕ (state lokal di komponen tabel); kolom tanggal di-parse format Indonesia (`15 Mar 2026`) |
| **Search** | Toolbar `Cari riwayat pelatihan...` — cari di nama, daerah, nama/email peserta |
| **Action — Edit** | Ikon pensil (flow update riwayat — belum tersambung) |
| **Action — Download** | Ekspor CSV satu baris riwayat |
| **Action — Hapus** | Buka `<HapusRiwayatModal>`; setelah hapus muncul toast "Berhasil menghapus riwayat pelatihan" dengan **Batalkan** (undo mengembalikan baris ke posisi semula) |

> Data masih dummy (`riwayatPelatihanData` di `AdminDashboardPage.jsx`) — belum terhubung ke endpoint backend.

### 8.3 Komponen shadcn/ui (`src/components/ui/`)

| Komponen     | File              | Kegunaan                                        |
| ------------ | ----------------- | ----------------------------------------------- |
| `<Button>`   | `ui/button.jsx`   | Tombol dengan variant (default, outline, ghost) |
| `<Input>`    | `ui/input.jsx`    | Input field                                     |
| `<Label>`    | `ui/label.jsx`    | Label form aksesibel                            |
| `<Checkbox>` | `ui/checkbox.jsx` | Checkbox "Ingatkan saya"                        |
| `<Select>`   | `ui/select.jsx`   | Dropdown daerah pelatihan GASING                |

### 8.4 Komponen Layout (`src/components/layout/`)

| Komponen              | Deskripsi                                               |
| --------------------- | ------------------------------------------------------- |
| `<LeftPanel />`       | Panel kiri biru-ungu (ilustrasi + branding), hidden mobile |
| `<RightPanel />`      | Panel kanan putih + footer copyright                    |
| `<Divider />`         | Garis pemisah horizontal tipis                          |
| `<AuthFullLayout />`  | Layout full-width untuk halaman forgot/reset password   |
| `<StepIndicator />`   | Progress bar 3 langkah Sign Up                          |

### 8.5 Komponen Shared (`src/components/shared/`)

| Komponen            | Deskripsi                                       |
| ------------------- | ----------------------------------------------- |
| `<IconInput />`     | Wrapper `<Input>` dengan ikon kiri/kanan        |
| `<TogglePassword />` | Tombol show/hide password (dipakai di IconInput) |
| `<OtpInput />`      | 6-kotak OTP dengan auto-focus dan paste support |
| `<ErrorAlert />`    | Alert merah untuk error dari API                |
| `<SuccessToast />`  | Toast notifikasi hijau (reset password)         |

### 8.6 Custom Hook (`src/hooks/`)

**`useCountdown(initialSeconds)`** — `src/hooks/useCountdown.js`

| Return    | Tipe       | Keterangan              |
| --------- | ---------- | ----------------------- |
| `display` | `string`   | Format MM:SS            |
| `expired` | `boolean`  | `true` jika timer habis |
| `reset()` | `function` | Restart timer ke nilai awal |

Digunakan di `SignUpOtpPage` (OTP 10 menit) dan `CheckEmailPage` (resend 30 detik).

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

#### Regions (`regionsApi`)

Hierarki **Province → Regency**. Tanpa query → daftar provinsi. Untuk kabupaten/kota: `?type=REGENCY&parentId=<provinceId>` (+ `&keyword=` untuk search).

| Method | Path             | Keterangan                                         |
| ------ | ---------------- | -------------------------------------------------- |
| GET    | `/regions`       | List region (public). Param: `type`, `parentId`, `keyword` |
| GET    | `/regions/:id`   | Detail satu region                                 |

#### Training Sessions (`trainingSessionsApi`)

| Method | Path                      | Keterangan                                             |
| ------ | ------------------------- | ------------------------------------------------------ |
| GET    | `/training-sessions`      | List sesi (public). `?regionId=` → sesi per kota (tanpa paginasi); tanpa `regionId` → paginasi `{ data, meta }` |
| GET    | `/training-sessions/:id`  | Detail satu sesi pelatihan                             |

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

#### Skills & Endorsements (`skillsApi`)

| Method | Path                       | Keterangan                                  |
| ------ | -------------------------- | ------------------------------------------- |
| GET    | `/users/:username/skills`  | List skill milik user + status endorsement  |
| POST   | `/skills/:skillId/endorse` | Toggle endorse skill `{ user_id }`          |

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

**Regions**

| Method | Path                  | Keterangan            |
| ------ | --------------------- | --------------------- |
| POST   | `/admin/regions`      | Tambah region (Province/Regency) |
| PATCH  | `/admin/regions/:id`  | Update region         |
| DELETE | `/admin/regions/:id`  | Hapus region          |

**Training Sessions**

| Method | Path                            | Keterangan                |
| ------ | ------------------------------- | ------------------------- |
| POST   | `/admin/training-sessions`      | Tambah sesi pelatihan     |
| PATCH  | `/admin/training-sessions/:id`  | Update sesi pelatihan     |
| DELETE | `/admin/training-sessions/:id`  | Hapus sesi pelatihan      |

**Skills**

| Method | Path                | Keterangan          |
| ------ | ------------------- | ------------------- |
| GET    | `/admin/skills`     | List skill (paginasi) |
| POST   | `/admin/skills`     | Tambah skill        |
| PATCH  | `/admin/skills/:id` | Update skill        |
| DELETE | `/admin/skills/:id` | Hapus skill         |

**UAC / IAM** (butuh `superAdmin`)

| Method | Path                       | Keterangan                       |
| ------ | -------------------------- | -------------------------------- |
| GET    | `/admin/uac/groups`        | List grup capability             |
| GET    | `/admin/uac/groups/:id`    | Detail grup + capability         |
| POST   | `/admin/uac/assignments`   | Assign grup ke user `{ userId, groupId }` |
| DELETE | `/admin/uac/assignments`   | Lepas grup dari user `{ userId, groupId }` |

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

Metode yang digunakan pada alur produksi: **Snap Redirect** — browser diarahkan ke halaman pembayaran Midtrans, lalu kembali ke salah satu landing page `/payment/finish`, `/payment/unfinish`, atau `/payment/error`.

> **Catatan:** `window.snap.pay` (Snap **Popup**) hanya dipakai di **MidtransTestPage** (tool dev, lihat §11), bukan di alur checkout produksi. Script `snap.js` tetap dimuat di `index.html` karena dibutuhkan oleh halaman test tersebut.

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
1. User pilih paket → klik "Mulai Berlangganan"
2. Frontend: subscriptionApi.checkout(packageId) → POST /subscription/checkout
3. Backend: buat transaksi Midtrans → return { redirectUrl } (atau { token })
4. Frontend (SubscriptionPage.handleCheckout):
     - jika ada redirectUrl/redirect_url → window.location.href = redirectUrl
     - jika hanya token/snapToken       → bangun snap URL (sandbox/prod) → redirect
5. User bayar di halaman Midtrans
6. Midtrans redirect kembali ke:
     /payment/finish    → PaymentFinishPage
     /payment/unfinish  → PaymentUnfinishPage
     /payment/error     → PaymentErrorPage
   (App.jsx mendeteksi path ini di boot sequence)
```

> Diagram sequence lengkap alur ini ada di [`ARCHITECTURE.md` §7.5](ARCHITECTURE.md#75-pembayaran-subscription--midtrans).

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
| **SSO Callback URL** | `https://<APP_DOMAIN>/register` |
| **Midtrans Finish URL** | `https://<APP_DOMAIN>/register?payment=success` |

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
| **Staging (domain)** | `https://<APP_DOMAIN>/register/` | ✅ Live |
| **Staging (IP)** | `http://<SERVER_IP>/register` | ✅ Live |
| **Lokal** | `http://localhost:5173` | via `npm run dev` |

### Infrastruktur GCE

| Komponen | Detail |
| --- | --- |
| **GCP Project** | `sacred-octagon` |
| **VM Instance** | `discourse-01` |
| **Zone** | `asia-southeast2-a` (Jakarta) |
| **IP Publik** | `<SERVER_IP>` |
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
    server_name <SERVER_IP>;
    location = / {
        return 301 /register;
    }
    location /register {
        alias /var/www/gasing-auth;
        index index.html;
        try_files $uri $uri/ /register/index.html;
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
scp -r "dist\*" ksatriagaberdevelopment@<SERVER_IP>:/tmp/gasing-upload/
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
VITE_WA_NUMBER=62XXXXXXXXXXX
```

### 13.3 Mengganti URL Discourse

Update `.env`:

```
VITE_DISCOURSE_URL=https://<PROD_DOMAIN>
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

### v2.9.0 — 25 Juni 2026

- ✅ **Redesain tab Riwayat Pelatihan** (`RiwayatPelatihanTable.jsx`) menyesuaikan referensi Figma "Dashboard Riwayat Pelatihan":
  - Kolom baru: **Nama Pelatihan** (+ badge `New`), **Daerah Pelatihan**, **Tgl. Mulai**, **Status**, grup **Peserta Guru Pelatihan** (Nama Peserta + link `50+ lainnya`, Email, Langganan), **Last Updated**, **Action**.
  - Badge **Status**: `Saved` / `Processing` / `Pending` / `Error`; badge **Langganan**: `Aktif` / `Non-Aktif` / `Berakhir`.
  - **Sort per-kolom** (state lokal) dengan parsing tanggal format Indonesia.
  - **Action** per baris: edit (pensil), download (ekspor CSV satu baris), hapus (trash merah).
- ✅ **Flow Hapus Riwayat** (`HapusRiwayatModal.jsx`, baru): modal konfirmasi dengan input wajib ketik `DELETE`; setelah hapus muncul toast sukses + **Batalkan** (undo mengembalikan baris ke posisi semula).
- ✅ **`RiwayatPelatihanControls`** (`TableControls.jsx`): tambah tombol **`+ Tambah Pelatihan Baru`** dan placeholder search `Cari riwayat pelatihan...`; `SearchInput` kini menerima prop `placeholder`.
- ✅ **`AdminDashboardPage.jsx`**: struktur data `riwayatPelatihanData` diperbarui ke field baru, handler `handleDeleteRiwayat` / `handleDownloadRiwayat`, dan dukungan undo riwayat di `handleUndoToast`.

**Yang perlu ditindaklanjuti:**

- Flow **Tambah Pelatihan Baru** (Opsi A & B + date picker) dan **Update Riwayat Pelatihan** (modal multi-step + daftar peserta) belum tersambung — tombol & ikon edit sudah tampil sesuai desain.
- Pop-up **Lihat Nama Peserta**, **Edit/Hapus Peserta**, dan **Edit Email** belum diimplementasikan.
- Data riwayat masih dummy — belum terhubung ke endpoint backend.

### v2.8.0 — 02 Juni 2026

- ✅ **Custom Routing Paths**: Konfigurasi ulang struktur routing aplikasi di `App.jsx` dengan memisahkan path Admin Dashboard agar dapat diakses melalui `/admin-dashboard/` dan tetap mempertahankan halaman registrasi pada endpoint `/register/`.
- ✅ **UI Enhancements pada SignUpPage**:
  - Menyembunyikan daftar pengecekan (rule) password hingga pengguna fokus (klik) pada field password.
  - Memperbarui gaya indikator pengecekan password yang belum terpenuhi menjadi lingkaran bergaris putus-putus (`border-dashed`), menyesuaikan dengan desain referensi.
  - Menyelaraskan skala tipografi (ukuran font) di seluruh halaman SignUp (judul, deskripsi, form label, dan teks lisensi) dengan spesifikasi desain (contoh: judul ke ukuran `text-[22px]`, label form ke `text-[13px] font-semibold`).

### v2.7.0 — 29 Mei 2026 *(Sync API Collection 29/05/26)*

Menyelaraskan `src/lib/api.js` dengan Postman collection terbaru. **Catatan:** hanya API layer + README; UI (SignUp & admin) belum disesuaikan — lihat "Yang perlu ditindaklanjuti".

- ✅ **Password requirement checklist** ditambah di `SignUpPage` (Buat Akun Baru) & `ResetPasswordPage` (Ubah Password): min 8 karakter, min 1 huruf kapital, min 1 angka & 1 karakter spesial — indikator live.
- ✅ **`regionsApi`** — endpoint `/training-regions` → `/regions` (hierarki Province→Regency, param `type`/`parentId`/`keyword`).
- ✅ **`trainingSessionsApi`** (baru) — `/training-sessions` (`?regionId=` untuk sesi per kota di form registrasi).
- ✅ **`authApi.resetPassword`** — kembali ke `POST /auth/reset-password` `{ token, email, newPassword }` sesuai collection.
- ✅ **`adminApi`** — `/admin/training-regions` → `/admin/regions`; tambah CRUD `/admin/training-sessions`, `/admin/skills`, dan UAC/IAM `/admin/uac/*`.
- ✅ **`skillsApi`** (baru) — `/users/:username/skills` & `POST /skills/:skillId/endorse`.
- ✅ **`SignUpPage` "Verifikasi Data"** disesuaikan desain terbaru:
  - "Nama Lengkap" dipindah ke step 1 (Buat Akun Baru).
  - "Lokasi kamu saat ini" cascade **Provinsi → Kab/Kota** (`/regions`); Kab/Kota = `regionId`.
  - "Kapan kamu mendapat pelatihan?" = filter; "Dimana?" = sesi hasil filter (`/training-sessions`); sesi terpilih = `lastTrainingSessionId`.
  - Payload register: `trainingRegionId` → `regionId` + `lastTrainingSessionId`.

**Yang perlu ditindaklanjuti (UI, di luar scope sesi ini):**

- ✅ ~~`pages/admin/mappers.js` masih membaca `u.trainingRegionId`~~ — sudah diselaraskan ke `firstTrainingRegionId` (nama kanonik) dengan fallback ke `trainingRegionId` lama. Lihat [FIX_DATA_FLOW §8](docs/FIX_DATA_FLOW.md) & [ARCHITECTURE §11](ARCHITECTURE.md).
- Link reset password dari email hanya membawa `?token=`, tanpa `&email=`; collection mewajibkan `email` di body. Pastikan template email menambahkan `&email=` atau backend mengambil email dari token.

### v2.6.0 — 18 Mei 2026

- ✅ Tambah `AuthChoicePage` — halaman pilihan navigasi (Gasing / SSO Callback) setelah login berhasil.
- ✅ Update `App.jsx` — memisahkan alur Admin Dashboard berdasar cek `capabilities`.
- ✅ Integrasi redirect callback URL JWT token.

### v2.5.0 — 12 Mei 2026 *(Refactoring)*

**Tujuan:** Memecah file-file besar agar mudah dibaca dan di-maintain. Tidak ada perubahan fungsional.

**Sebelum refactoring:**

| File | Baris |
| ---- | ----- |
| `App.jsx` | 1.059 |
| `AdminDashboardPage.jsx` | 962 |

**Sesudah refactoring — semua file di bawah 200 baris:**

| File baru | Baris |
| --------- | ----- |
| `App.jsx` | ~100 |
| `pages/auth/LoginPage.jsx` | ~95 |
| `pages/auth/SignUpPage.jsx` | ~130 |
| `pages/auth/SignUpOtpPage.jsx` | ~50 |
| `pages/auth/SignUpReviewPage.jsx` | ~40 |
| `pages/auth/ForgotPasswordPage.jsx` | ~55 |
| `pages/auth/CheckEmailPage.jsx` | ~70 |
| `pages/auth/ResetPasswordPage.jsx` | ~70 |
| `pages/auth/SsoCallbackPage.jsx` | ~45 |
| `components/layout/LeftPanel.jsx` | ~40 |
| `components/layout/RightPanel.jsx` | ~15 |
| `components/layout/AuthFullLayout.jsx` | ~65 |
| `components/layout/StepIndicator.jsx` | ~40 |
| `components/shared/IconInput.jsx` | ~30 |
| `components/shared/OtpInput.jsx` | ~45 |
| `components/shared/ErrorAlert.jsx` | ~10 |
| `components/shared/SuccessToast.jsx` | ~10 |
| `hooks/useCountdown.js` | ~15 |
| `pages/AdminDashboardPage.jsx` | ~130 |
| `pages/admin/mappers.js` | ~50 |
| `pages/admin/AdminSidebar.jsx` | ~50 |
| `pages/admin/ConfirmModal.jsx` | ~55 |
| `pages/admin/AdminToast.jsx` | ~12 |
| `pages/admin/TableControls.jsx` | ~120 |
| `pages/admin/VerifikasiTable.jsx` | ~100 |
| `pages/admin/ManajemenTable.jsx` | ~140 |

---

### v2.4.0 — 11 Mei 2026

- ✅ Update Nginx configuration guidelines di `DEPLOYMENT_GUIDE.md` dan `README.md` untuk sepenuhnya mendukung React Router dengan `base: '/register'`.
- ✅ Penambahan input field Username pada flow pendaftaran (`SignUpPage`).
- ✅ **Perbaikan Asset:** Pindah file `illustration.png` dan `illustrasi_forgotPassword.png` dari `public/` ke `src/assets/` agar path build Vite bisa resolve dengan benar (`/register/assets/...`).
- ✅ **Perubahan Alur (Flow):** Setelah login berhasil, pengguna kini **langsung dialihkan (redirect)** ke url komunitas (`VITE_DISCOURSE_URL`), melewati halaman Subscription (yang kini dikhususkan untuk alur SSO Callback).
- ✅ **Perbaikan API:** `discourseApi.ssoLogin` di `api.js` kini secara otomatis melakukan *redirect* ketika API me-return `redirectUrl`.

### v2.3.0 — 5 Mei 2026 *(Staging Deployment Live)*

Sesi ini berfokus pada penyelesaian deployment ke environment staging di GCE dan memastikan app dapat diakses publik via domain Discourse.

**🚀 Deployment**

- App **berhasil live** di `https://<APP_DOMAIN>/register/` ✅
- App juga dapat diakses via IP langsung: `http://<SERVER_IP>` ✅
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
- CORS backend: izinkan origin `https://<APP_DOMAIN>` dan `http://<SERVER_IP>`
- Konfigurasi SSO Discourse: daftarkan `https://<APP_DOMAIN>/register` sebagai callback URL
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
  - **SSO Callback URL:** `https://<APP_DOMAIN>/register`
  - **Midtrans Finish URL:** `https://<APP_DOMAIN>/register?payment=success`

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
