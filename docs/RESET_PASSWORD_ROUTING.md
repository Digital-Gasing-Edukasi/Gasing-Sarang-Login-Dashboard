# Alur & Routing Reset Password

Dokumentasi routing halaman **Reset Password** dan perbaikan bug urutan pengecekan
path yang menyebabkan link email salah arah ke halaman signup.

- **Status:** Selesai (bugfix routing diterapkan).
- **Audiens:** Frontend & backend engineer Gasing Auth.
- **Repo:** `gasing-auth` (React + Vite + Tailwind).
- **File terkait:** [`src/App.jsx`](../src/App.jsx),
  [`src/pages/auth/ForgotPasswordPage.jsx`](../src/pages/auth/ForgotPasswordPage.jsx),
  [`src/pages/auth/CheckEmailPage.jsx`](../src/pages/auth/CheckEmailPage.jsx),
  [`src/pages/auth/ResetPasswordPage.jsx`](../src/pages/auth/ResetPasswordPage.jsx),
  [`src/pages/auth/LoginPage.jsx`](../src/pages/auth/LoginPage.jsx).

> **Catatan mekanisme.** Aplikasi ini memakai **state-based routing** (`page`
> state di `App.jsx`), bukan React Router. "Route" = nilai variabel `page`.
> Transisi antar halaman dipicu oleh handler (`onNavigate`, `setPage`) atau oleh
> parameter URL yang dibaca sekali saat init di `App.jsx`.

---

## 1. Alur Lengkap

| Tahap | `page` (state) | Pemicu | Sumber |
| --- | --- | --- | --- |
| Klik "Lupa Password?" | `forgot-password` | `onNavigate('forgot-password')` | `LoginPage.jsx:117` |
| Submit email | `check-email` | `onEmailSent` → `setPage('check-email')` | `App.jsx` (`handleEmailSent`) |
| Buka link dari email | `reset-password` | URL berisi `?token=` **atau** path `/reset-password` | `App.jsx` (init effect) |
| Submit password baru / batal | `login` | `onNavigate('login')` | `ResetPasswordPage.jsx:54,117,192` |

Diagram alur:

```
LoginPage "Lupa Password?"
        │ onNavigate('forgot-password')
        ▼
ForgotPasswordPage  ──(submit email)──►  onEmailSent  ──►  page='check-email'
        │
        ▼
CheckEmailPage  ──(user klik link di email)──►  browser buka:
        https://dev-komunitas.gasingacademy.org/register/reset-password?token=<JWT>
        │
        ▼  App.jsx init effect membaca URL
page='reset-password'  ──►  ResetPasswordPage (form password baru)
        │ sukses / batal → onNavigate('login')
        ▼
LoginPage
```

---

## 2. Format Link Email

Backend mengirim link reset dengan bentuk:

```
https://dev-komunitas.gasingacademy.org/register/reset-password?token=<JWT>
```

- **Hanya** parameter `token` (JWT) yang dikirim. Tidak ada `email` di query.
- Payload JWT memuat `jti`, `userId`, `type: "forgot_pass"`, `iat`, `exp`.
- `App.jsx` membaca `token` dari query string, menyimpannya ke state `resetToken`,
  lalu meneruskannya ke `ResetPasswordPage` untuk dikirim balik saat submit.

> **Catatan.** Field `email` di `ResetPasswordPage` bersifat opsional
> (`resetEmail`); diisi hanya bila query menyertakan `email`. Karena link produksi
> saat ini tidak mengirim `email`, halaman tetap berfungsi tanpa nilai tersebut.

---

## 3. Bug: Link Email Salah Arah ke Signup

### Gejala

User klik link reset dari email → mendarat di halaman **Pendaftaran (signup)**,
bukan halaman **Reset Password**.

### Akar Masalah

`App.jsx` membaca URL sekali saat init dan mengevaluasi kondisi secara berurutan.
Pengecekan `/register` generic berada **sebelum** pengecekan `token`:

```js
// (urutan LAMA — bermasalah)
if (pathname.includes("/register")) {   // ← cocok utk /register/reset-password
  setPage("signup");
  return;                               // ← keluar sebelum cek token
}
...
if (token) {                            // ← tidak pernah tercapai
  setPage("reset-password");
  return;
}
```

Path link email `/register/reset-password` **mengandung** substring `/register`,
sehingga tertangkap oleh cek pertama → `page='signup'` → `return`. Blok
pengecekan `token` di bawahnya tidak pernah dieksekusi.

### Perbaikan

Pengecekan reset-password dipindah **sebelum** cek `/register` generic, dan
memicu bila path mengandung `/reset-password` **atau** ada `token` di query:

```js
// (urutan BARU — benar)
// Link reset password dari email: /register/reset-password?token=...
// Harus dicek SEBELUM /register generic (yang mengandung "/register").
if (pathname.includes("/reset-password") || token) {
  if (token) {
    setResetToken(token);
    if (emailParam) setResetEmail(decodeURIComponent(emailParam));
  }
  setPage("reset-password");
  clearUrlParams();
  setSessionChecked(true);
  return;
}

// /register → halaman Pendaftaran (signup).
if (pathname.includes("/register")) {
  setPage("signup");
  ...
}
```

Blok `if (token)` lama yang berada setelah cek `/register` dihapus karena menjadi
dead code (token kini selalu tertangkap lebih awal).

---

## 4. Cara Verifikasi

Jalankan dev server (`npm run dev`), lalu buka di browser:

| URL | Hasil diharapkan |
| --- | --- |
| `/register/reset-password?token=<apapun>` | Render **ResetPasswordPage** |
| `/register` | Render **Signup** (tidak berubah) |
| `/register/reset-password` (tanpa token) | Render **ResetPasswordPage** |

Regresi utama: pastikan `/register` biasa tetap mengarah ke signup, dan link
bertoken mengarah ke reset-password.

---

## 5. Catatan untuk Backend

Link email cukup memakai path `/register/reset-password?token=<JWT>` seperti saat
ini. Frontend juga akan menangani path lain yang mengandung `/reset-password`
atau query `?token=`, sehingga perubahan base path tidak akan memutus alur selama
salah satu penanda tersebut tetap ada.
