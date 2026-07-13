# Halaman Legal — Ketentuan Layanan & Kebijakan Privasi

> Dokumen ini menjelaskan halaman legal (TOS & Privacy) yang dibuka dari halaman pendaftaran, cara routing-nya, file-file terkait, dan cara mengubah isinya. Untuk arsitektur umum aplikasi lihat [`../ARCHITECTURE.md`](../ARCHITECTURE.md).

**Status:** Selesai (per 2026-07-13). Isi teks masih **placeholder** — perlu diganti teks legal final.

---

## 1. Ringkasan

Dua halaman statis yang berisi teks legal, dibuka **di tab baru** saat user menyetujui syarat di halaman Pendaftaran (`SignUpPage`):

| URL | Halaman | Komponen |
| --- | ------- | -------- |
| `/register/id/TOS` | Ketentuan Layanan | `TermsPage` |
| `/register/id/privacy` | Kebijakan Privasi | `PrivacyPage` |

Tiap halaman punya tombol **"Kembali ke Pendaftaran"** yang mengarahkan tab ke `/register` (halaman signup).

---

## 2. Alur pengguna

```
SignUpPage (/register)
  │
  │  klik "Ketentuan Layanan" / "Kebijakan Privasi"  (target="_blank")
  ▼
TAB BARU → /register/id/TOS  atau  /register/id/privacy
  │
  │  klik "Kembali ke Pendaftaran"
  ▼
/register  → SignUpPage (URL tetap /register)
```

- Link dibuka di **tab baru** (`target="_blank" rel="noopener noreferrer"`), jadi tab pendaftaran asli tidak hilang.
- Tombol kembali memakai `window.location.href = "/register"` (navigasi penuh, bukan SPA switch) sehingga URL bar berubah jadi `/register` dan menampilkan halaman signup.

---

## 3. File terkait

Semua halaman legal ada di `src/pages/legal/` — **satu screen = satu file**:

| File | Peran |
| ---- | ----- |
| `LegalLayout.jsx` | Layout bersama: `LeftPanel` + area konten scrollable + tombol "Kembali ke Pendaftaran" (atas & bawah). Ekspor juga helper `Section`. |
| `TermsPage.jsx` | Isi Ketentuan Layanan. Membungkus `LegalLayout`. |
| `PrivacyPage.jsx` | Isi Kebijakan Privasi. Membungkus `LegalLayout`. |

File yang disentuh perubahan ini:

| File | Perubahan |
| ---- | --------- |
| `src/App.jsx` | Deteksi route legal + ubah perilaku `/register`. |
| `src/pages/auth/SignUpPage.jsx` | 4 anchor (blok desktop + mobile) menunjuk ke URL legal. |

---

## 4. Routing (cara kerja internal)

Aplikasi **tidak memakai react-router**. Routing dilakukan manual di `App.jsx` dalam `useEffect` init, dengan mencocokkan `window.location.pathname`. Urutan pengecekan penting.

### 4a. Deteksi halaman legal

Ditempatkan **paling awal** di init (sebelum blok `/register`), case-insensitive:

```jsx
const legalPath = pathname.toLowerCase();
if (legalPath.includes("/id/privacy")) {
  setPage("privacy");
  setSessionChecked(true);
  return;
}
if (legalPath.includes("/id/tos")) {
  setPage("terms");
  setSessionChecked(true);
  return;
}
```

Karena `/register/id/tos` mengandung `/id/tos`, ia cocok di sini lebih dulu dan **tidak** jatuh ke blok `/register`.

### 4b. Perilaku `/register`

```jsx
// /register → halaman Pendaftaran (signup). URL dibiarkan tetap /register.
if (pathname.includes("/register")) {
  setPage("signup");
  setSessionChecked(true);
  return;
}
```

> **Perubahan perilaku:** sebelumnya blok ini melakukan `setPage("login")` + `replaceState("/")` (redirect ke login dan membersihkan URL). Sekarang menampilkan **signup** dan **membiarkan URL tetap `/register`**, agar tombol "Kembali ke Pendaftaran" mendarat di halaman yang benar dengan URL yang benar.

### 4c. Render full-screen

```jsx
if (page === "privacy") return <PrivacyPage onNavigate={setPage} />;
if (page === "terms")   return <TermsPage onNavigate={setPage} />;
```

---

## 5. Link dari SignUpPage

Ada **4 anchor** — dua di blok desktop, dua di blok mobile (twin block, lihat [`MOBILE_RESPONSIVE.md`](./MOBILE_RESPONSIVE.md)). Semua absolut dan buka tab baru:

```jsx
<a href="/register/id/TOS" target="_blank" rel="noopener noreferrer" ...>
  Ketentuan Layanan
</a>
<a href="/register/id/privacy" target="_blank" rel="noopener noreferrer" ...>
  Kebijakan Privasi
</a>
```

> **Catat:** jika mengubah teks/link ini, ingat ada **dua salinan** (desktop & mobile). Ubah keduanya agar konsisten.

---

## 6. Cara mengubah isi teks

Isi ditulis sebagai JSX langsung di `TermsPage.jsx` / `PrivacyPage.jsx`, dikelompokkan pakai `<Section heading="...">`:

```jsx
<Section heading="1. Judul Bagian">
  <p>Isi paragraf…</p>
</Section>
```

Untuk mengganti teks placeholder dengan teks legal final:

1. Buka `src/pages/legal/TermsPage.jsx` atau `PrivacyPage.jsx`.
2. Ganti isi tiap `<Section>` (dan paragraf pembuka).
3. Perbarui prop `updatedAt` di `<LegalLayout>` bila tanggal berubah.

Untuk menambah halaman legal baru (mis. `/register/id/refund`):

1. Buat `src/pages/legal/RefundPage.jsx` yang membungkus `LegalLayout`.
2. Tambah branch deteksi path di `App.jsx` §4a dan render di §4c.
3. Tambah anchor di tempat yang relevan.

---

## 7. Catatan & keterbatasan

- **URL wajib mengandung `/id/tos` atau `/id/privacy`.** Pencocokan pakai `.includes()`, jadi prefiks (`/register`) tidak masalah, tapi salah ketik segmen `/id/` akan lolos ke fallback.
- **Isi masih placeholder** (Lorem ipsum). Jangan rilis ke produksi sebelum diganti teks legal asli.
- **Verifikasi lokal:** jalankan dev server, buka `http://localhost:5173/register/id/TOS` dan `.../register/id/privacy`, lalu uji tombol kembali → harus mendarat di `/register` (signup).
