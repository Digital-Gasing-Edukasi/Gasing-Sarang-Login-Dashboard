# Guest Komunitas (Halaman Statis Tamu)

Halaman komunitas statis yang bisa dibuka **tanpa login** ("Lanjut Sebagai Tamu").
Konten pure statis (dummy, tanpa backend), mobile-first, meniru app `Komonitas`.
Keputusan arsitektur: [ADR-0004](adr/0004-guest-static-komunitas.md).

> **Reader:** FE dev Login-Dashboard. Buat nambah/ubah screen tamu, cek data
> dummy, atau nyambungin ke API beneran nanti.

---

## Ringkasan

| Aspek | Nilai |
|---|---|
| Entry point | Tombol **"Lanjut Sebagai Tamu"** di `LoginPage` |
| Auth | **Tidak ada** — guest tanpa token, route publik |
| Data | Statis/hardcoded di `src/pages/komunitas/data.js` |
| Layout | Mobile-first, frame terpusat `max-w-[480px]` |
| Stack | React 18 + react-router v6 + Tailwind v3 (native LD) |

Sumber (`Komonitas`) pakai Next.js 16 + react-query + Discourse API. Karena beda
stack total, halaman ini **ditulis ulang** jadi statis, bukan disalin. Detail
trade-off ada di ADR-0004.

---

## Cara buka (guest flow)

```
LoginPage  ──klik "Lanjut Sebagai Tamu"──▶  onNavigate("komunitas")
           ──▶  /komunitas  ──redirect──▶  /komunitas/home
```

- Tombol: [`src/pages/auth/LoginPage.jsx`](../src/pages/auth/LoginPage.jsx) —
  `text-[14px] font-bold text-[#424857]`, tampil sama di mobile & desktop
  (ada di `RightPanel` yang dipakai dua-duanya).
- Fake login = **tidak** panggil `authApi`, **tidak** set token. Cukup navigate.
- CTA "Daftar" di dalam halaman guest mengarah ke `/register` (ajakan daftar
  beneran).

### Kenapa guest lolos gate boot

`App.jsx` saat boot cek sesi untuk route app. Route `/komunitas` didaftarkan
sebagai **publik** supaya cek sesi dilewati:

- [`src/lib/routes.js`](../src/lib/routes.js) → `/komunitas` masuk
  `PUBLIC_PREFIXES` (dipakai `isPublicStaticPath()`), plus key `komunitas` di
  `PAGE_PATHS`.
- [`src/App.jsx`](../src/App.jsx) → `<Route path="/komunitas/*" element={<KomunitasPage/>} />`
  **tanpa** `requireAuth`.

---

## Routes

Semua di bawah `/komunitas/*`. Sub-routing di-handle di dalam
[`KomunitasPage.jsx`](../src/pages/komunitas/KomunitasPage.jsx) via nested
`<Routes>`.

| Path | Screen | Ket |
|---|---|---|
| `/komunitas` | → redirect `home` | index |
| `/komunitas/home` | `HomeScreen` | hero "Hai" + Konten Eksklusif |
| `/komunitas/ga-news` | `GANewsScreen` | Gasing Academy News |
| `/komunitas/konten-ekslusif` | `KontenEksklusifScreen` | daftar video |
| `/komunitas/virtual-meet-up` | `VirtualMeetUpScreen` | meet-up datang & lalu |
| `/komunitas/materi-gasing` | `MateriGasingScreen` | tab metode + kartu |
| `/komunitas/materi-gasing/:slug` | `MateriDetailScreen` | detail materi |
| `/komunitas/komunitas` | `KomunitasScreen` | Top 10 Trending + tab |
| `/komunitas/*` (lain) | → redirect `home` | fail-safe |

> **Catatan dev:** dev server jalan `--mode staging` dengan base URL `/register`,
> jadi URL lokal jadi `http://localhost:5173/register/komunitas/home`. Di
> produksi base `/` (lihat memory routing-base-root-migration).

---

## Struktur file

```
src/pages/komunitas/
├── KomunitasPage.jsx     # host nested <Routes> + <BottomNav>, frame mobile
├── BottomNav.jsx         # nav bawah 5 tab (+ sub-tab utk screen komunitas)
├── data.js               # SEMUA data dummy statis
├── assets.js             # barrel import aset (logo, karakter, header, thumb)
├── ui.jsx                # helper lama (CurvedHeader/Mascot) — sebagian tak dipakai
└── screens/
    ├── HomeScreen.jsx
    ├── GANewsScreen.jsx
    ├── KontenEksklusifScreen.jsx
    ├── VirtualMeetUpScreen.jsx
    ├── MateriGasingScreen.jsx
    ├── MateriDetailScreen.jsx
    └── KomunitasScreen.jsx
```

### Bottom nav

[`BottomNav.jsx`](../src/pages/komunitas/BottomNav.jsx) — 5 tab, urutan sesuai
mockup: **Home · Komunitas · Eksklusif · Meet-Up · Materi**. Ikon PNG punya state
`_normal` / `_selected` (aktif ditentukan `pathname.startsWith`). Saat screen
`komunitas` aktif, muncul **sub-navbar** (Forum / Challenge / All Members).

---

## Aset

Barrel: [`assets.js`](../src/pages/komunitas/assets.js). Semua di `src/assets/`.

| Kategori | Lokasi | Dipakai |
|---|---|---|
| Logo | `logo-saranggasing.png`, `icon_sg.png` | header Home |
| Karakter | `dark-mode/Copy of Character 8C {4,5,6}.png` | ungu/biru/oranye |
| Header banner | `guest/header-banner/*` | Komunitas, Materi, Virtual (bg+elements) |
| Ikon nav | `guest/nav-bar/icon-navbar-*_{normal,selected}.png` | BottomNav |
| Thumbnail | `guest/thumbnail/*` | Fun Math, video, Rubik, angka |
| Element materi | `guest/thumbnail/Materi Gasing/*` | kartu materi |

**Kuirk aset:** `icon-navbar-normal_selected.png` sebenarnya ikon virtual-meetup
state **normal** (salah nama di sumber). Sudah di-alias di `BottomNav.jsx`.

---

## Data dummy

[`data.js`](../src/pages/komunitas/data.js) — satu-satunya sumber konten. Export:

- `GUEST_NAME` — nama sapaan hero ("Tamu Gasing")
- `kontenEksklusif[]` — kartu video Konten Eksklusif
- `meetupUpcoming[]`, `meetupPast[]` — Virtual Meet-Up
- `materiTabs[]`, `materiList[]` — Materi Gasing (tiap item punya `slug` utk detail)
- `trendingTopics[]`, `komunitasTabs[]` — screen Komunitas

Gambar disematkan langsung ke item (import dari `assets.js`), jadi ganti konten =
cukup edit `data.js`.

---

## Nambah / ubah screen

1. Bikin komponen di `screens/NamaScreen.jsx` (React 18, Tailwind v3, statis).
2. Daftar route di `KomunitasPage.jsx` (`<Route path="..." .../>`).
3. Kalau perlu tab baru di nav bawah → tambah di `TABS` (`BottomNav.jsx`) + ikon
   PNG normal/selected.
4. Data → tambah di `data.js`, aset → daftar di `assets.js`.

---

## Nyambung ke API (nanti)

Halaman ini sengaja statis (ADR-0004). Kalau guest perlu data nyata:

- Ganti konstanta di `data.js` dengan fetch **read-only** (jangan kirim token).
- Auth endpoint LD pakai `noAuth` — jangan bocorin Bearer akun lama
  (lihat memory auth-noauth-cache-clear).

---

## Known gaps

- Konten Eksklusif: hanya 1 thumbnail video asli; kartu non-video pakai warna
  placeholder.
- `ui.jsx` (`CurvedHeader`, `Mascot`) sebagian tak terpakai setelah aset asli
  masuk — kandidat cleanup.
- Screen `Home` & `Konten` header pink/biru masih gradient CSS (belum ada file
  header khusus dari desain).
- Belum diverifikasi di preview (port 5173 dipakai proses lain saat build).
