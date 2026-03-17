# GASING CIRCLE — Authentication SPA

> **Versi:** 1.0.0 · **Tanggal:** 17 Maret 2026 · **Stack:** React 18 + Vite + Tailwind CSS

---

## Daftar Isi

1. [Overview](#1-overview)
2. [Tech Stack](#2-tech-stack)
3. [Struktur Folder](#3-struktur-folder)
4. [Halaman & Alur Navigasi](#4-halaman--alur-navigasi)
5. [Instalasi & Menjalankan](#5-instalasi--menjalankan)
6. [Fitur Utama](#6-fitur-utama)
7. [Komponen & Arsitektur](#7-komponen--arsitektur)
8. [Kustomisasi](#8-kustomisasi)
9. [Panduan Integrasi Backend](#9-panduan-integrasi-backend)
10. [Referensi Scripts](#10-referensi-scripts)

---

## 1. Overview

Gasing Circle Auth SPA adalah aplikasi **Single Page Application (SPA)** berbasis React yang menyediakan alur autentikasi lengkap untuk platform komunitas Gasing Circle. Aplikasi ini mencakup halaman Login dan alur Sign Up 3 langkah yang dirancang untuk Trainer Guru GASING Academy.

Desain mengikuti prinsip **clean monochrome** dengan palet hitam-putih yang konsisten, tipografi DM Sans, dan animasi fade-in bertahap untuk pengalaman pengguna yang halus dan profesional.

---

## 2. Tech Stack

| Teknologi | Versi | Kegunaan |
|-----------|-------|----------|
| React | 18.2.0 | UI Library — core framework SPA |
| Vite | 5.2.0 | Build tool & dev server dengan HMR |
| Tailwind CSS | 3.4.3 | Utility-first CSS framework |
| Lucide React | 0.383.0 | Icon library (Mail, Lock, Eye, dll) |
| clsx | 2.1.0 | Utility untuk conditional className |
| DM Sans | Google Fonts | Font utama body text |
| Playfair Display | Google Fonts | Font display / branding |

---

## 3. Struktur Folder

```
gasing-auth/
├── index.html          # Entry point HTML
├── package.json        # Dependensi & scripts
├── vite.config.js      # Konfigurasi Vite
├── tailwind.config.js  # Konfigurasi Tailwind
├── postcss.config.js   # Konfigurasi PostCSS
└── src/
    ├── main.jsx        # Entry point React (mount ke #root)
    ├── App.jsx         # Komponen utama + semua halaman
    └── index.css       # Global styles + Tailwind directives
```

Seluruh logika halaman ditulis dalam satu file **App.jsx** mengikuti pola SPA ringan tanpa router eksternal. State navigasi dikelola dengan `useState` sederhana.

---

## 4. Halaman & Alur Navigasi

| Halaman | Route Key | Deskripsi |
|---------|-----------|-----------|
| Login | `'login'` | Halaman masuk dengan email & password |
| Daftar — Step 1 | `'signup-buat-akun'` | Buat akun: email, password, konfirmasi password |
| Daftar — Step 2 | `'signup-verifikasi-data'` | Verifikasi data diri: nama, username, tanggal lahir, daerah, sekolah |
| OTP | `'signup-otp'` | Input 6-digit OTP dari email dengan countdown 10 menit |
| Review | `'signup-review'` | Konfirmasi pendaftaran berhasil, menunggu review admin |

### Alur Sign Up

```
Login → Daftar Akun Baru → Verifikasi Data → OTP → Review (selesai)
```

---

## 5. Instalasi & Menjalankan

### Prasyarat

- **Node.js** versi 18 ke atas
- **npm** versi 9 ke atas

### Langkah Instalasi

**Step 1** — Ekstrak zip dan masuk ke folder project:

```bash
cd gasing-auth
```

**Step 2** — Install dependensi:

```bash
npm install
```

**Step 3** — Jalankan development server:

```bash
npm run dev
```

Buka browser dan akses **http://localhost:5173**

### Build untuk Produksi

Jika ingin men-deploy ke server atau hosting:

```bash
npm run build
```

Hasil build tersimpan di folder `dist/` dan siap di-upload ke hosting (Vercel, Netlify, VPS, dll).

---

## 6. Fitur Utama

### 6.1 Navigasi SPA

- Berpindah halaman tanpa reload menggunakan state management React
- Tidak membutuhkan library router eksternal (react-router tidak diperlukan)
- Navigasi dua arah: maju (next) dan kembali ke Login

### 6.2 Step Indicator

- Progress bar 3 langkah animasi di halaman Sign Up
- Step yang sudah selesai ditandai dengan ikon centang
- Koneksi antar step berubah warna sesuai progress

### 6.3 OTP Input

- 6 kotak input terpisah dengan auto-focus otomatis
- Mendukung paste 6 digit sekaligus dari clipboard
- Navigasi mundur dengan tombol Backspace
- Tombol Verifikasi aktif hanya setelah semua 6 digit terisi

### 6.4 Countdown Timer

- Timer 10 menit (10:00) berjalan real-time di halaman OTP
- Setelah expired, muncul tombol "Kirim ulang kode"
- Timer dapat di-reset dengan klik tombol kirim ulang

### 6.5 Form Elements

- Toggle show/hide password dengan ikon mata
- Custom checkbox "Ingatkan saya" di halaman Login
- Date picker native dengan ikon kalender
- Custom dropdown Pilih Daerah dengan animasi buka/tutup
- Semua input punya state focus, hover, dan disabled yang konsisten

### 6.6 Animasi

- Setiap halaman memiliki animasi `fadeInUp` saat pertama tampil
- Elemen-elemen muncul bertahap dengan delay 0.1s per elemen
- Transisi halus pada semua interaksi (hover, focus, klik)

---

## 7. Komponen & Arsitektur

### 7.1 Komponen UI Primitif

| Komponen | Deskripsi |
|----------|-----------|
| `<Input />` | Input text dengan ikon kiri/kanan, berbagai tipe (text, password, email) |
| `<Button />` | Tombol dengan dua varian: `primary` (hitam) dan `ghost` (transparan) |
| `<Label />` | Label form yang konsisten |
| `<Divider />` | Garis pemisah horizontal tipis |
| `<StepIndicator />` | Progress bar 3 langkah untuk alur Sign Up |
| `<LeftPanel />` | Panel dekoratif kiri dengan grid pattern dan logo |
| `<RightPanel />` | Wrapper panel kanan dengan layout dan footer copyright |
| `<OtpInput />` | 6-kotak input OTP dengan auto-focus dan paste support |

### 7.2 Komponen Halaman

| Komponen | Deskripsi |
|----------|-----------|
| `<LoginPage />` | Halaman login utama |
| `<SignUpBuatAkunPage />` | Sign Up Step 1 — buat akun |
| `<SignUpVerifikasiDataPage />` | Sign Up Step 2 — form data diri |
| `<SignUpOtpPage />` | Sign Up Step 2 sub — verifikasi OTP |
| `<SignUpReviewPage />` | Sign Up Step 3 — konfirmasi selesai |

### 7.3 Custom Hook

**`useCountdown(seconds)`** — hook untuk countdown timer yang mengembalikan:

| Return | Tipe | Keterangan |
|--------|------|------------|
| `display` | `string` | Format tampilan MM:SS |
| `expired` | `boolean` | `true` jika timer sudah habis |
| `reset()` | `function` | Restart timer ke nilai awal |

---

## 8. Kustomisasi

### 8.1 Mengganti Logo

Edit komponen `<LeftPanel />` dan `<LoginPage />` di `App.jsx`. Ganti huruf `G` dengan tag `<img>` yang merujuk ke file logo:

```jsx
// Sebelum
<span className="text-white font-display font-bold text-base">G</span>

// Sesudah
<img src="/logo.png" alt="Logo" className="w-6 h-6 object-contain" />
```

### 8.2 Menambah Pilihan Daerah

Edit array `DAERAH_OPTIONS` di bagian atas `App.jsx`:

```js
const DAERAH_OPTIONS = [
  'Jakarta', 'Bandung', 'Surabaya',
  // tambahkan daerah baru di sini
  'Manado', 'Kupang', 'Ternate',
]
```

### 8.3 Mengubah Durasi OTP

Ubah nilai detik pada pemanggilan `useCountdown` di `SignUpOtpPage`:

```js
// Default: 600 detik (10 menit)
const { display, expired, reset } = useCountdown(600)

// Contoh: 5 menit
const { display, expired, reset } = useCountdown(300)
```

### 8.4 Mengganti Warna Tema

Tema warna dikelola melalui kelas Tailwind. Untuk mengubah warna aksen utama, cari dan ganti `bg-gray-900`, `text-gray-900`, dan `border-gray-900` di `App.jsx` dengan kelas warna yang diinginkan. Contoh ganti ke biru:

```
bg-gray-900  →  bg-blue-700
text-gray-900  →  text-blue-700
border-gray-900  →  border-blue-700
```

---

## 9. Panduan Integrasi Backend

Saat ini form belum terhubung ke API. Berikut panduan untuk mengintegrasikan dengan backend.

### 9.1 Login

Tambahkan fetch di handler tombol **Masuk ke Komunitas**:

```js
const handleLogin = async () => {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  const data = await res.json()
  if (data.token) {
    localStorage.setItem('token', data.token)
    // redirect ke dashboard
  }
}
```

### 9.2 Registrasi & Kirim OTP

Panggil endpoint kirim OTP setelah user submit form Verifikasi Data (Step 2):

```js
const handleSubmitData = async () => {
  await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, nama, username, tgl, daerah, sekolah })
  })
  onNavigate('signup-otp')
}
```

### 9.3 Verifikasi OTP

Saat OTP lengkap terisi, callback `onComplete` dari `<OtpInput />` dipanggil. Tambahkan POST ke endpoint verifikasi:

```js
const handleOtpComplete = async (otpCode) => {
  const res = await fetch('/api/auth/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp: otpCode })
  })
  const data = await res.json()
  if (data.success) {
    onNavigate('signup-review')
  }
}
```

---

## 10. Referensi Scripts

| Command | Fungsi |
|---------|--------|
| `npm install` | Install semua dependensi project |
| `npm run dev` | Jalankan development server di `localhost:5173` dengan Hot Module Replacement |
| `npm run build` | Build project untuk produksi (output ke folder `dist/`) |
| `npm run preview` | Preview hasil build secara lokal sebelum deploy |

---

© 2026 Gasing Circle. All rights reserved.
