# Alur & Routing Konfirmasi Ubah Email

Dokumentasi halaman **Konfirmasi Ubah Email** yang dibuka dari link email: URL-nya,
bagaimana token diproses, dan kenapa urutan branch-nya penting.

- **Status:** Selesai. Ditambahkan 29 Juli 2026.
- **Audiens:** Frontend & backend engineer Gasing Auth.
- **File terkait:** [`src/App.jsx`](../src/App.jsx), [`src/lib/routes.js`](../src/lib/routes.js),
  [`src/lib/api.js`](../src/lib/api.js),
  [`src/pages/auth/ConfirmEmailChangePage.jsx`](../src/pages/auth/ConfirmEmailChangePage.jsx).
- **Keputusan desain:** [ADR-0006](adr/0006-confirm-email-change-flow.md).

> **Catatan mekanisme.** Query param `?token=` dari link email dibaca sekali di boot
> sequence `App.jsx`, disimpan ke state `confirmEmailToken`, lalu **dibuang dari URL** supaya
> tidak bocor lewat history/log. Halaman menembak `POST /profile/confirm-email` saat mount —
> user tidak mengisi apa pun.

---

## 1. URL

| Halaman | URL | Page key |
| --- | --- | --- |
| Konfirmasi ubah email (STAGING) | `/register/confirm-email-change?token=<token>` | `confirm-email-change` |
| Konfirmasi ubah email (PRODUCTION) | `/confirm-email-change?token=<token>` | `confirm-email-change` |

> **Path beda per-env.** Link email backend memakai prefix `/register/` di **staging**,
> tapi **tanpa** prefix di **production**. Path kanonik di `PAGE_PATHS` ikut `isProduction()`
> (`lib/env.js`), dan boot sequence mencocokkan **kedua** bentuk (`endsWith
> "/confirm-email-change"`) sehingga link jalan lintas-env. Kedua `<Route>` didaftarkan.

---

## 2. Alur Lengkap

```
Backend kirim email konfirmasi ubah email
        │  user klik link
        ▼
https://<APP_DOMAIN>/register/confirm-email-change?token=<token>
        │
        ▼  boot sequence App.jsx: simpan token ke state, bersihkan URL
ConfirmEmailChangePage (mount)
        │ profileApi.confirmEmailChange(token)   ← noAuth (token di body)
        ▼
   ┌────────────┬─────────────────┐
loading      success            error / no-token
 (spinner)   ✓ "Email Berhasil   ✕ "Gagal Mengubah Email"
             Diubah"             + pesan server
             │ auto-redirect 10s │
             ▼                    ▼
          /login              (tombol) /login
```

## 3. Format Link Email

Backend mengirim link dengan bentuk:

```
STAGING     https://<APP_DOMAIN>/register/confirm-email-change?token=<token>
PRODUCTION  https://<APP_DOMAIN>/confirm-email-change?token=<token>
```

Payload JWT (HS256) memuat `{ jti, userId, type: "email_change", newEmail, iat, exp }` —
berlaku ~2 jam (`exp - iat`).

- **Hanya** parameter `token`. Boot sequence membacanya, menyimpan ke state
  `confirmEmailToken`, meneruskan ke `ConfirmEmailChangePage`, lalu menghapusnya dari URL.
- Request ke `POST /profile/confirm-email` dikirim **`noAuth`** (tanpa Bearer) — auth lewat
  `token` di body, jadi link jalan walau dibuka tanpa sesi login. Lihat
  [ADR-0006](adr/0006-confirm-email-change-flow.md).

## 4. Urutan Branch (WAJIB dijaga)

Path `…/confirm-email-change?token=` membawa `?token=`, sama seperti reset-password. Di boot
sequence `App.jsx` ada cek `?token=` **generik** yang melempar ke `/login/reset-password`.
Branch `confirm-email-change` **harus diproses SEBELUM** cek generik itu — kalau tidak, link
ke-hijack ke reset-password (regresi identik dgn bug lama di
[RESET_PASSWORD_ROUTING.md §4](RESET_PASSWORD_ROUTING.md)).

`endsWith` dipakai (bukan `startsWith`) supaya cocok untuk staging (`/register/…`) maupun
production (`/…`). `clearUrlParams()` tanpa argumen mempertahankan pathname aktif — jadi
URL dibersihkan dari `?token=` sesuai env, tanpa hardcode prefix.

```js
// App.jsx boot sequence — SEBELUM `const token = params.get("token")`
if (pathname.toLowerCase().endsWith("/confirm-email-change")) {
  setConfirmEmailToken(params.get("token") || "");
  clearUrlParams(); // default = pathname aktif (env-aware)
  setSessionChecked(true);
  return;
}
```

## 5. State Halaman

`ConfirmEmailChangePage` punya 3 status: `loading` → `success` | `error`.

- **loading** — spinner "Memverifikasi Perubahan Email". API ditembak saat mount, di-guard
  `useRef` supaya StrictMode dev tidak dobel-tembak (token one-time).
- **success** — ✓ hijau "Email Berhasil Diubah" + auto-redirect ke `/login` (10 detik) + tombol.
- **error** — ✕ merah "Gagal Mengubah Email" + pesan dari server. Tanpa token → pesan "Link
  tidak valid atau sudah kedaluwarsa".

Layout ikut pola auth lain: desktop `AuthDarkLayout`, mobile gradient ungu (`lg:hidden`).

## 6. Cara Verifikasi

Jalankan `npm run dev`, lalu buka:

| URL | Hasil diharapkan |
| --- | --- |
| `/register/confirm-email-change?token=<valid>` (staging) | Loading → **Email Berhasil Diubah**, URL bersih |
| `/confirm-email-change?token=<valid>` (production) | Loading → **Email Berhasil Diubah**, URL bersih |
| `…/confirm-email-change?token=<invalid>` | Loading → **Gagal Mengubah Email** + pesan server |
| `…/confirm-email-change` (tanpa token) | **Gagal** — "Link tidak valid atau sudah kedaluwarsa" |
| `/login/reset-password?token=<x>` | Tetap render **ResetPasswordPage** (tidak ke-hijack) |

Regresi utama yang harus dijaga: link `confirm-email-change` bertoken **tidak boleh nyasar**
ke reset-password, dan sebaliknya.
