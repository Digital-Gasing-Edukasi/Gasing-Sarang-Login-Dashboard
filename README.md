# GASING CIRCLE — Authentication SPA (shadcn/ui)

> **Versi:** 1.1.0 · **Tanggal:** 18 Maret 2026 · **Stack:** React 18 + Vite + Tailwind CSS + shadcn/ui

---

## Daftar Isi

1. [Overview](#1-overview)
2. [Tech Stack](#2-tech-stack)
3. [Struktur Folder](#3-struktur-folder)
4. [Komponen shadcn/ui](#4-komponen-shadcnui)
5. [Halaman & Alur Navigasi](#5-halaman--alur-navigasi)
6. [Instalasi & Menjalankan](#6-instalasi--menjalankan)
7. [Fitur Utama](#7-fitur-utama)
8. [Arsitektur Komponen](#8-arsitektur-komponen)
9. [Kustomisasi](#9-kustomisasi)
10. [Panduan Integrasi Backend](#10-panduan-integrasi-backend)
11. [Referensi Scripts](#11-referensi-scripts)
12. [Changelog](#12-changelog)

---

## 1. Overview

Gasing Circle Auth SPA versi **1.1.0** adalah versi yang telah diperbarui menggunakan **shadcn/ui** sebagai design system utama. Aplikasi ini menyediakan alur autentikasi lengkap untuk platform komunitas Gasing Circle, mencakup halaman Login dan alur Sign Up 3 langkah untuk Trainer Guru GASING Academy.

Dibandingkan versi sebelumnya (v1.0.0), versi ini mengganti komponen UI primitif custom dengan komponen shadcn/ui yang dibangun di atas **Radix UI** — memberikan aksesibilitas, keyboard navigation, dan konsistensi desain yang lebih baik secara out-of-the-box.

---

## 2. Tech Stack

| Teknologi                    | Versi        | Kegunaan                                |
| ---------------------------- | ------------ | --------------------------------------- |
| React                        | 18.2.0       | UI Library — core framework SPA         |
| Vite                         | 5.2.0        | Build tool & dev server dengan HMR      |
| Tailwind CSS                 | 3.4.3        | Utility-first CSS framework             |
| **shadcn/ui**                | manual copy  | Design system berbasis Radix UI         |
| **Radix UI**                 | latest       | Headless UI primitives (aksesibel)      |
| **class-variance-authority** | latest       | Variant styling untuk shadcn components |
| **@radix-ui/react-slot**     | latest       | Polymorphic component support           |
| **@radix-ui/react-label**    | latest       | Accessible label primitive              |
| **@radix-ui/react-checkbox** | latest       | Accessible checkbox primitive           |
| **@radix-ui/react-select**   | latest       | Accessible select/dropdown primitive    |
| Lucide React                 | 0.383.0      | Icon library                            |
| clsx                         | 2.1.0        | Utility untuk conditional className     |
| DM Sans                      | Google Fonts | Font utama body text                    |
| Playfair Display             | Google Fonts | Font display / branding                 |

---

## 3. Struktur Folder

```
gasing-auth-shadcn/
├── index.html
├── package.json
├── vite.config.js          # Path alias @ → ./src
├── tailwind.config.js      # Shadcn CSS variables + color tokens
├── postcss.config.js
└── src/
    ├── main.jsx            # Entry point React
    ├── App.jsx             # Semua halaman & logika navigasi
    ├── index.css           # Global styles + CSS variables shadcn
    ├── lib/
    │   └── utils.js        # Helper cn() untuk merge class names
    └── components/
        └── ui/             # Shadcn UI components (manual install)
            ├── button.jsx
            ├── input.jsx
            ├── label.jsx
            ├── checkbox.jsx
            └── select.jsx
```

> **Catatan:** Berbeda dengan npm package biasa, shadcn/ui di-_copy_ langsung ke `src/components/ui/` sehingga bisa dikustomisasi penuh sesuai kebutuhan project.

---

## 4. Komponen shadcn/ui

Berikut daftar komponen shadcn yang digunakan beserta penjelasan perubahannya dari versi sebelumnya.

### 4.1 Button — `components/ui/button.jsx`

Menggunakan **class-variance-authority (CVA)** untuk variant styling dan **Radix Slot** untuk polymorphic rendering.

```jsx
import { Button } from '@/components/ui/button'

// Variant default (hitam)
<Button onClick={handleSubmit}>Masuk ke Komunitas</Button>

// Variant outline
<Button variant="outline">Batal</Button>

// Disabled — styling opacity otomatis
<Button disabled>Lanjutkan</Button>

// Dengan icon
<Button><LogIn size={16} /> Back To Login</Button>
```

**Variants yang tersedia:**

| Variant   | Tampilan                               |
| --------- | -------------------------------------- |
| `default` | Background hitam, teks putih (primary) |
| `outline` | Border tipis, background transparan    |
| `ghost`   | Transparan, hover dengan accent        |
| `link`    | Tampil seperti hyperlink               |

**Sizes yang tersedia:** `default` (h-11), `sm` (h-9), `lg` (h-12), `icon` (h-10 w-10)

---

### 4.2 Input — `components/ui/input.jsx`

Input standar dengan styling konsisten dari design system shadcn.

```jsx
import { Input } from '@/components/ui/input'

<Input type="email" placeholder="Masukkan email" />
<Input type="password" placeholder="Masukkan password" />
<Input type="date" />
```

> **Catatan:** Untuk input dengan ikon, digunakan wrapper `<IconInput />` di `App.jsx` yang membungkus `<Input>` shadcn dengan ikon Lucide di posisi kiri/kanan.

---

### 4.3 Label — `components/ui/label.jsx`

Label aksesibel menggunakan **Radix Label primitive** yang secara otomatis terhubung ke input via `htmlFor`.

```jsx
import { Label } from '@/components/ui/label'

<Label htmlFor="email">Email</Label>
<Input id="email" type="email" />
```

---

### 4.4 Checkbox — `components/ui/checkbox.jsx`

Checkbox aksesibel menggunakan **Radix Checkbox primitive**. Menggantikan custom `div` checkbox pada versi v1.0.0.

```jsx
import { Checkbox } from '@/components/ui/checkbox'

<Checkbox
  id="remember"
  checked={remember}
  onCheckedChange={setRemember}   // bukan onChange biasa
/>
<Label htmlFor="remember">Ingatkan saya</Label>
```

> **Perhatian:** Gunakan `onCheckedChange` (bukan `onChange`) untuk menangkap perubahan nilai.

---

### 4.5 Select — `components/ui/select.jsx`

Dropdown aksesibel menggunakan **Radix Select primitive**. Menggantikan custom dropdown daerah pada versi v1.0.0. Mendukung keyboard navigation, screen reader, dan portal rendering otomatis.

```jsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

<Select value={daerah} onValueChange={setDaerah}>
  <SelectTrigger>
    <SelectValue placeholder="Pilih Daerah" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="Jakarta">Jakarta</SelectItem>
    <SelectItem value="Bandung">Bandung</SelectItem>
  </SelectContent>
</Select>;
```

---

## 5. Halaman & Alur Navigasi

| Halaman         | Route Key                  | Deskripsi                                                            |
| --------------- | -------------------------- | -------------------------------------------------------------------- |
| Login           | `'login'`                  | Halaman masuk dengan email & password                                |
| Daftar — Step 1 | `'signup-buat-akun'`       | Buat akun: email, password, konfirmasi password                      |
| Daftar — Step 2 | `'signup-verifikasi-data'` | Verifikasi data diri: nama, username, tanggal lahir, daerah, sekolah |
| OTP             | `'signup-otp'`             | Input 6-digit OTP dari email dengan countdown 10 menit               |
| Review          | `'signup-review'`          | Konfirmasi pendaftaran berhasil, menunggu review admin               |

### Alur Sign Up

```
Login → Daftar Akun Baru → Verifikasi Data → OTP → Review (selesai)
```

---

## 6. Instalasi & Menjalankan

### Prasyarat

- **Node.js** versi 18 ke atas
- **npm** versi 9 ke atas

### Langkah Instalasi

**Step 1** — Ekstrak zip dan masuk ke folder project:

```bash
cd gasing-auth-shadcn
```

**Step 2** — Install dependensi (termasuk Radix UI packages):

```bash
npm install
```

**Step 3** — Jalankan development server:

```bash
npm run dev
```

Buka browser dan akses **http://localhost:5173**

### Build untuk Produksi

```bash
npm run build
```

Hasil build tersimpan di folder `dist/` dan siap di-deploy ke hosting.

---

## 7. Fitur Utama

### 7.1 Navigasi SPA

- Berpindah halaman tanpa reload menggunakan `useState` React
- Tidak membutuhkan react-router
- Navigasi dua arah: maju (next) dan kembali ke Login

### 7.2 Step Indicator

- Progress bar 3 langkah animasi di halaman Sign Up
- Step selesai ditandai ikon centang (`CheckCircle2`)
- Garis penghubung berubah warna sesuai progress

### 7.3 OTP Input (custom)

- 6 kotak input terpisah dengan auto-focus otomatis
- Mendukung paste 6 digit sekaligus dari clipboard
- Navigasi mundur dengan tombol Backspace
- Tombol Verifikasi aktif (`disabled={false}`) hanya setelah semua digit terisi

### 7.4 Countdown Timer (custom)

- Timer 10 menit berjalan real-time di halaman OTP
- Setelah expired, muncul tombol "Kirim ulang kode"
- Timer dapat di-reset

### 7.5 Aksesibilitas (peningkatan dari v1.0.0)

- Semua komponen shadcn dibangun di atas Radix UI yang **WAI-ARIA compliant**
- Checkbox dan Select mendukung **keyboard navigation** penuh
- Label terhubung ke input via `htmlFor` / `id`
- Focus ring konsisten di semua elemen interaktif
- Select menggunakan **portal rendering** — tidak terpotong overflow container

### 7.6 Animasi

- Animasi `fadeInUp` per halaman saat pertama tampil
- Elemen muncul bertahap dengan delay 0.1s
- Transisi halus pada semua interaksi

---

## 8. Arsitektur Komponen

### 8.1 Komponen shadcn/ui (baru di v1.1.0)

| Komponen     | File              | Menggantikan                              |
| ------------ | ----------------- | ----------------------------------------- |
| `<Button>`   | `ui/button.jsx`   | Custom `<Button />` dengan manual variant |
| `<Input>`    | `ui/input.jsx`    | Custom `<Input />`                        |
| `<Label>`    | `ui/label.jsx`    | Custom `<Label />`                        |
| `<Checkbox>` | `ui/checkbox.jsx` | Custom `div` checkbox                     |
| `<Select>`   | `ui/select.jsx`   | Custom dropdown dengan `useState`         |

### 8.2 Komponen Custom (tetap)

| Komponen            | Deskripsi                                                 |
| ------------------- | --------------------------------------------------------- |
| `<IconInput />`     | Wrapper `<Input>` shadcn dengan ikon Lucide di kiri/kanan |
| `<StepIndicator />` | Progress bar 3 langkah — tidak ada padanan di shadcn      |
| `<LeftPanel />`     | Panel dekoratif kiri dengan grid pattern                  |
| `<RightPanel />`    | Wrapper panel kanan dengan footer copyright               |
| `<OtpInput />`      | 6-kotak OTP — tidak ada padanan di shadcn                 |

### 8.3 Custom Hook

**`useCountdown(seconds)`** — hook countdown timer:

| Return    | Tipe       | Keterangan                  |
| --------- | ---------- | --------------------------- |
| `display` | `string`   | Format MM:SS                |
| `expired` | `boolean`  | `true` jika timer habis     |
| `reset()` | `function` | Restart timer ke nilai awal |

### 8.4 Helper

**`src/lib/utils.js`** — fungsi `cn()` untuk menggabungkan class names Tailwind secara kondisional:

```js
import { cn } from "@/lib/utils";

cn("base-class", condition && "conditional-class", "another-class");
```

---

## 9. Kustomisasi

### 9.1 Mengganti Tema Warna

Semua warna shadcn dikontrol lewat **CSS variables** di `src/index.css`. Cukup ubah nilai HSL untuk mengganti seluruh tema sekaligus:

```css
:root {
  --primary: 0 0% 9%; /* hitam — ganti ke misal 221 83% 53% untuk biru */
  --primary-foreground: 0 0% 98%;
  --accent: 0 0% 96.1%;
  --border: 0 0% 89.8%;
}
```

Contoh tema biru:

```css
:root {
  --primary: 221 83% 53%;
  --primary-foreground: 0 0% 100%;
  --ring: 221 83% 53%;
}
```

### 9.2 Menambah Variant Button

Edit `src/components/ui/button.jsx`, tambahkan variant baru di dalam objek `variants`:

```js
const buttonVariants = cva("...", {
  variants: {
    variant: {
      default: "bg-primary text-primary-foreground ...",
      // tambahkan variant baru:
      danger: "bg-red-600 text-white hover:bg-red-700",
    },
  },
});
```

Lalu gunakan:

```jsx
<Button variant="danger">Hapus Akun</Button>
```

### 9.3 Menambah Pilihan Daerah

Edit array `DAERAH_OPTIONS` di `App.jsx`:

```js
const DAERAH_OPTIONS = [
  "Jakarta",
  "Bandung",
  // tambahkan daerah baru:
  "Manado",
  "Kupang",
];
```

### 9.4 Mengubah Durasi OTP

```js
// Default 600 detik (10 menit)
const { display, expired, reset } = useCountdown(600);

// Ubah ke 5 menit
const { display, expired, reset } = useCountdown(300);
```

### 9.5 Menambah Komponen shadcn Baru

Karena shadcn di-copy manual, untuk menambah komponen baru (misal `Toast`, `Dialog`, `Popover`):

1. Kunjungi [ui.shadcn.com](https://ui.shadcn.com)
2. Pilih komponen yang dibutuhkan
3. Copy kode ke file baru di `src/components/ui/`
4. Install Radix dependency-nya jika belum ada:

```bash
npm install @radix-ui/react-toast
```

---

## 10. Panduan Integrasi Backend

### 10.1 Login

```js
const handleLogin = async () => {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (data.token) {
    localStorage.setItem("token", data.token);
    // redirect ke dashboard
  }
};
```

### 10.2 Registrasi & Kirim OTP

```js
const handleSubmitData = async () => {
  await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password,
      nama,
      username,
      tgl,
      daerah,
      sekolah,
    }),
  });
  onNavigate("signup-otp");
};
```

### 10.3 Verifikasi OTP

```js
const handleOtpComplete = async (otpCode) => {
  const res = await fetch("/api/auth/verify-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp: otpCode }),
  });
  const data = await res.json();
  if (data.success) onNavigate("signup-review");
};
```

---

## 11. Referensi Scripts

| Command           | Fungsi                                                     |
| ----------------- | ---------------------------------------------------------- |
| `npm install`     | Install semua dependensi termasuk Radix UI packages        |
| `npm run dev`     | Jalankan development server di `localhost:5173` dengan HMR |
| `npm run build`   | Build untuk produksi (output ke `dist/`)                   |
| `npm run preview` | Preview hasil build secara lokal                           |

---

## 12. Changelog

### v1.1.0 — 18 Maret 2026

- ✅ Migrasi ke **shadcn/ui** design system
- ✅ `<Button>` menggunakan CVA + Radix Slot
- ✅ `<Input>` menggunakan shadcn Input primitive
- ✅ `<Label>` menggunakan Radix Label (aksesibel)
- ✅ Custom `div` checkbox → **shadcn `<Checkbox>`** (Radix, WAI-ARIA)
- ✅ Custom dropdown daerah → **shadcn `<Select>`** (Radix, keyboard nav, portal)
- ✅ Tambah `src/lib/utils.js` dengan helper `cn()`
- ✅ Tambah path alias `@` → `./src` di `vite.config.js`
- ✅ Update `tailwind.config.js` dengan shadcn color tokens

### v1.0.0 — 17 Maret 2026

- ✅ Initial release dengan komponen UI custom
- ✅ 5 halaman auth: Login, Sign Up Step 1–3, OTP
- ✅ Animasi fadeInUp, countdown timer, OTP input

---

© 2026 Gasing Circle. All rights reserved.
