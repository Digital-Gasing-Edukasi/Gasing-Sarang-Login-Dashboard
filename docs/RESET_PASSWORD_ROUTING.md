# Alur & Routing Reset Password

Dokumentasi routing halaman **Reset Password**: URL-nya sekarang, bagaimana link email
lama tetap jalan, dan riwayat bug urutan pengecekan path yang dulu bikin link email
mendarat di halaman signup.

- **Status:** Selesai. Diperbarui untuk migrasi React Router (v3.0.0, 15 Juli 2026).
- **Audiens:** Frontend & backend engineer Gasing Auth.
- **File terkait:** [`src/App.jsx`](../src/App.jsx), [`src/lib/routes.js`](../src/lib/routes.js),
  [`src/pages/auth/ForgotPasswordPage.jsx`](../src/pages/auth/ForgotPasswordPage.jsx),
  [`src/pages/auth/CheckEmailPage.jsx`](../src/pages/auth/CheckEmailPage.jsx),
  [`src/pages/auth/ResetPasswordPage.jsx`](../src/pages/auth/ResetPasswordPage.jsx),
  [`src/pages/auth/LoginPage.jsx`](../src/pages/auth/LoginPage.jsx).

> **Catatan mekanisme.** Aplikasi memakai **React Router v6** dengan `base: '/'`.
> Setiap halaman punya URL nyata. Query param dari link email (`?token=`) dibaca
> sekali di boot sequence `App.jsx`, disimpan ke state, lalu **dibuang dari URL**
> supaya token tidak bocor lewat history/log browser.

---

## 1. URL

| Halaman | URL | Page key |
| --- | --- | --- |
| Lupa password (isi email) | `/login/forgot-password` | `forgot-password` |
| Instruksi cek email | `/login/check-email` | `check-email` |
| Form password baru | `/login/reset-password` | `reset-password` |
| **Link email lama** | `/register/reset-password?token=…` | → redirect ke `/login/reset-password` |

Redirect kompatibilitas ada sebagai route di `App.jsx` — `search` (query string) ikut dibawa,
jadi `?token=` tidak hilang:

```jsx
<Route
  path="/register/reset-password"
  element={<Navigate to={{ pathname: "/login/reset-password", search: location.search }} replace />}
/>
```

---

## 2. Alur Lengkap

| Tahap | URL | Pemicu |
| --- | --- | --- |
| Klik "Lupa Password?" | `/login/forgot-password` | `onNavigate('forgot-password')` di `LoginPage` |
| Submit email | `/login/check-email` | `onEmailSent` → `handleEmailSent` di `App.jsx` |
| Buka link dari email | `/login/reset-password` | Boot sequence baca `?token=` |
| Submit password baru / batal | `/login` | `onNavigate('login')` di `ResetPasswordPage` |

```
LoginPage "Lupa Password?"
        │ onNavigate('forgot-password')
        ▼
ForgotPasswordPage  ──(submit email)──►  onEmailSent  ──►  /login/check-email
        │                                                    (tombol kirim ulang, countdown 30s)
        ▼
CheckEmailPage  ──(user klik link di email)──►  browser buka:
        https://<APP_DOMAIN>/login/reset-password?token=<JWT>
        │
        ▼  boot sequence App.jsx: simpan token ke state, bersihkan URL
ResetPasswordPage (form password baru)
        │ authApi.resetPassword(token, email, newPassword)
        ▼
/login
```

> **`skipSessionRestore` melindungi halaman ini.** `/login/reset-password`, `/login/forgot-password`,
> dan `/login/check-email` ada di daftar `NO_RESTORE_PREFIXES` (`lib/routes.js`) — jadi user yang
> masih menyimpan token akun lama di storage tidak dilempar ke dashboard saat membuka link reset.

---

## 3. Format Link Email

Backend mengirim link reset dengan bentuk:

```
https://<APP_DOMAIN>/login/reset-password?token=<JWT>
```

- **Hanya** parameter `token` (JWT) yang dikirim. Tidak ada `email` di query.
- Payload JWT memuat `jti`, `userId`, `type: "forgot_pass"`, `iat`, `exp`.
- Boot sequence membaca `token`, menyimpannya ke state `resetToken`, meneruskannya ke
  `ResetPasswordPage`, lalu menghapusnya dari URL (`navigate(path, { replace: true })`).

> **Field `email` opsional.** `ResetPasswordPage` menerima prop `email` (`resetEmail`), diisi hanya
> bila query menyertakan `&email=`. Karena link produksi tidak mengirimnya, halaman tetap berfungsi
> tanpa nilai tersebut.

**Untuk backend:** boleh langsung pakai path baru `/login/reset-password?token=<JWT>`. Path lama
`/register/reset-password?token=<JWT>` masih ditangani redirect, jadi template email yang sudah
terlanjur tersebar tidak perlu buru-buru diganti.

---

## 4. Riwayat Bug: Link Email Salah Arah ke Signup

> Sudah selesai — diarsipkan di sini karena akar masalahnya (urutan pengecekan path di boot
> sequence) masih relevan setiap kali menambah route baru yang path-nya bertumpuk.

**Gejala:** user klik link reset dari email → mendarat di halaman **Pendaftaran (signup)**.

**Akar masalah:** dulu `App.jsx` mengecek `pathname.includes("/register")` **sebelum** mengecek
`token`. Path `/register/reset-password` mengandung substring `/register`, jadi tertangkap cek
pertama → `page='signup'` → `return` sebelum blok token dieksekusi.

**Perbaikan (era state-router):** pengecekan reset-password dipindah ke atas cek `/register` generic.

**Sekarang (React Router):** masalahnya hilang secara struktural — `/register` dan
`/register/reset-password` adalah dua route berbeda yang dicocokkan **exact** oleh router, bukan
lewat `includes()`. Pola yang sama masih berlaku di boot sequence untuk **revisi data**: cek
`/register/revise?token=` harus tetap berada **sebelum** cek `?token=` generik (reset password),
karena keduanya sama-sama membawa `?token=`.

---

## 5. Cara Verifikasi

Jalankan `npm run dev`, lalu buka:

| URL | Hasil diharapkan |
| --- | --- |
| `/login/reset-password?token=<apapun>` | Render **ResetPasswordPage**, URL bersih jadi `/login/reset-password` |
| `/register/reset-password?token=<apapun>` | Redirect ke `/login/reset-password`, token terbawa |
| `/register` | Render **SignUp** (tidak berubah) |
| `/register/revise?token=<JWT>` | Render **FixDataPage**, bukan reset password |
| `/login/reset-password` (tanpa token) | Render **ResetPasswordPage** (submit akan gagal — tidak ada token) |

Regresi utama yang harus dijaga: link bertoken tidak boleh nyasar ke signup, dan link revisi tidak
boleh nyasar ke reset password.
