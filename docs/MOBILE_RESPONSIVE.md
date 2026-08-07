# Mobile / Responsive — GASING CIRCLE Auth & Payment

> Dokumen ini menjelaskan **versi mobile** dari halaman auth & pembayaran, cara kerjanya, dan cara menambah/mengubahnya. Untuk arsitektur umum aplikasi lihat [`../ARCHITECTURE.md`](../ARCHITECTURE.md).

**Status:** Flow 1–3 selesai (per 2026-07-10). Flow 4–10 belum. Lihat [Status per-flow](#status-per-flow).

---

## 1. Pendekatan

**Responsive satu codebase.** Tidak ada folder/route/entry mobile terpisah — komponen yang sama beradaptasi lewat breakpoint Tailwind:

| Prefix | Arti |
| ------ | ---- |
| _(default)_ | Mobile-first (< 1024px) |
| `lg:` | Desktop (≥ 1024px) |
| `lg:hidden` | Hanya mobile |
| `hidden lg:block` / `hidden lg:flex` | Hanya desktop |

Breakpoint pemisah mobile↔desktop adalah **`lg` (1024px)**, konsisten dengan `LeftPanel` yang memang `hidden lg:flex`.

**Prinsip:** hanya **layout & styling** yang bercabang mobile/desktop. **Logika** (state, handler, validasi, panggilan API) tetap tunggal dan dipakai bersama. Untuk halaman yang tema mobile-nya berbeda drastis (mis. gelap vs terang), dipakai **twin block** — dua blok markup (`lg:hidden` dan `hidden lg:block`) yang berbagi state dari komponen yang sama.

---

## 2. Pola shell mobile (PENTING)

Layar auth "terang" (Login, Lupa Password, Cek Email) memakai satu pola visual:

```
┌───────────────────────────┐
│  HERO UNGU (full-bleed)    │  ← background penuh, TANPA sudut membulat
│  "Ayo, bergabung ..."      │
│  🟣🔵🟠 maskot             │
│ ╭─────────────────────────╮│  ← KARTU PUTIH "popup": rounded-top,
│ │  Selamat Datang!         ││    naik menutupi hero (-mt-6) + shadow atas
│ │  [ form ]                ││
│ ╰─────────────────────────╯│
└───────────────────────────┘
```

Aturan yang **tidak boleh kebalik**:

- **Ungu = background penuh** (hero square, tanpa `rounded-b`).
- **Putih = kartu popup** yang naik menutupi ungu (`rounded-t-[28px] -mt-6` + shadow atas), seperti bottom-sheet.

> Kesalahan umum: membuat hero ungu jadi kartu membulat di atas latar putih. Itu **kebalik** dari desain yang benar.

Di desktop pola ini di-reset (`lg:mt-0 lg:rounded-none lg:shadow-none`) sehingga kembali ke split-panel biasa.

---

## 3. Komponen & file kunci

| File | Peran mobile |
| ---- | ------------ |
| [`components/layout/MobileHero.jsx`](../src/components/layout/MobileHero.jsx) | Hero ungu (wallpaper + bintang + blob + maskot). `lg:hidden`. Dipakai Login & AuthFullLayout. |
| [`components/layout/RightPanel.jsx`](../src/components/layout/RightPanel.jsx) | Shell Login/SignUp. Terima prop `mobileHero`; konten putih jadi kartu popup di mobile. |
| [`components/layout/AuthFullLayout.jsx`](../src/components/layout/AuthFullLayout.jsx) | Shell Lupa Password/Cek Email/Ubah Password (desktop). Header & dekorasi `hidden lg:block`, inject `MobileHero`, konten jadi kartu popup. |
| [`pages/auth/LoginPage.jsx`](../src/pages/auth/LoginPage.jsx) | `mobileHero={<MobileHero/>}`; logo `hidden lg:flex`; heading "Selamat Datang!" (mobile) / "Selamat Datang Kembali" (desktop). |
| [`pages/auth/ResetPasswordPage.jsx`](../src/pages/auth/ResetPasswordPage.jsx) | **Twin block**: mobile = layar gelap penuh ("Ubah Password"); desktop = `AuthFullLayout`. |
| [`pages/SubscriptionPage.jsx`](../src/pages/SubscriptionPage.jsx) | **Twin block**: mobile = section gelap "Ada apa di Sarang Gasing?" + `MobilePlanCard`; desktop = grid 2 kolom terang. |
| [`pages/PaymentSuccessPage.jsx`](../src/pages/PaymentSuccessPage.jsx) | **Twin block**: mobile = gelap "Pembayaran Kamu Berhasil!"; desktop = terang dengan wave. |
| [`pages/TransferBankPage.jsx`](../src/pages/TransferBankPage.jsx) | Sudah dark + responsive sejak awal (`grid lg:grid-cols-2`). Tidak diubah. |

### MobileHero

Hero ungu di puncak layar auth. Menyusun 4 aset berlapis (z-index):

1. `hero_bg.png` — wallpaper ungu (`object-cover`)
2. `stars.png` — taburan bintang
3. Judul (default: "Ayo, bergabung bersama Sarang Gasing")
4. `blobs.png` + `hero_mascot.png` — blob & maskot menempel di dasar

Props: `title?` (ReactNode) untuk override judul.

---

## 4. Aset mobile

Lokasi: [`src/assets/Mobile/`](../src/assets/Mobile/) — **perhatikan huruf kapital `M`** (case-sensitive di build produksi Linux).

| File | Isi | Dipakai |
| ---- | --- | ------- |
| `hero_mascot.png` | Maskot trio (ungu/biru/oranye) | MobileHero |
| `hero_bg.png` | Wallpaper ungu | MobileHero |
| `stars.png` | Bintang warna-warni | MobileHero |
| `blobs.png` | Blob ungu | MobileHero |
| `fade_bottom.png` | Gradien putih→ungu | _belum dipakai_ |
| `glow.png` | Lingkaran glow | _belum dipakai_ |
| `thumbs_up.png` | Ikon jempol | _belum dipakai_ |

File sudah di-rename tanpa spasi agar aman di-`import` (spasi di specifier ESM rawan).

---

## 5. Cara menambah mobile ke halaman baru

**Kasus A — halaman auth terang (mirip Login):**
1. Bungkus dengan `RightPanel` (via `App.jsx`/`LeftPanel`) atau `AuthFullLayout`.
2. Pola popup-sheet + hero sudah otomatis. Sembunyikan elemen khusus desktop dengan `hidden lg:...`.

**Kasus B — halaman tema mobile berbeda drastis (gelap):** pakai twin block:
```jsx
return (
  <>
    {/* MOBILE */}
    <div className="lg:hidden ...gelap...">{/* markup mobile, pakai state yang sama */}</div>
    {/* DESKTOP */}
    <div className="hidden lg:block">{/* markup desktop existing */}</div>
  </>
)
```
State & handler tetap didefinisikan sekali di komponen, dipakai kedua blok.

**Warna gelap standar** (subscription/payment/reset): gradient
`radial-gradient(ellipse at 50% 0%, #4c1d95 0%, #2e1065 40%, #1a0b3d 75%, #120833 100%)`,
tombol CTA putih (`bg-white text-[#1a0b3d]` pill).

---

## 6. Status per-flow

10 flow diminta; dikerjakan bertahap.

| # | Flow | Status | Layar mobile |
| - | ---- | ------ | ------------ |
| 1 | Normal (Midtrans) | ✅ | Login → Subscription → PaymentSuccess |
| 2 | Normal + Transfer Bank | ✅ | Login → Subscription → TransferBank → sukses |
| 3 | Forgot password | ✅ | Login → Lupa Password → Cek Email → Ubah Password (gelap) |
| 4 | Error login | ✅ | Field error (existing) + modal "Terjadi Kesalahan" (5xx) |
| 5 | No connection | ✅ | Banner "Tidak Ada Koneksi" (kegagalan jaringan) |
| 6 | Expired | ✅ | Bottom-sheet "Masa Berlangganan Berakhir" + konfirmasi "Yakin Log Out?" |
| 7 | Pending verification email | ✅ | Bottom-sheet "Kami Sedang Meninjau Akunmu" |
| 8 | Revise (Perbaikan Data) | ✅ | Form + X close; sukses gelap "Akunmu Sedang Ditinjau Kembali" |
| 9 | Signup | ✅ | Data Akun → Data Pribadi (+X close) → OTP → sukses gelap "Terima Kasih Telah Mendaftar!" |
| 10 | Cancel payment verification | ⬜ | belum (belum ada reference) |

---

## 6b. Status akun & error di Login (flow 4–7)

Semua ditangani di [`LoginPage.jsx`](../src/pages/auth/LoginPage.jsx) + [`LoginStatusModal.jsx`](../src/components/shared/LoginStatusModal.jsx):

| Kondisi | Deteksi | Tampilan |
| ------- | ------- | -------- |
| Kredensial salah / validasi | error 4xx / field kosong | Error di bawah field (merah) |
| **Server error (flow 4)** | `err.status >= 500` | Modal tengah "Terjadi Kesalahan" + "Coba Lagi" |
| **Tidak ada koneksi (flow 5)** | `TypeError` / `!navigator.onLine` / "failed to fetch" | `NoConnectionBanner` (toast atas) |
| **Pending (flow 7)** | `evaluateLoginGate` → `pending` (`verifiedStatus` waiting) | Bottom-sheet "Kami Sedang Meninjau Akunmu" |
| **Expired (flow 6)** | `evaluateLoginGate` → `expired` (`subscription.status`) | Bottom-sheet "Masa Berlangganan Berakhir" → "Log Out" memicu konfirmasi "Yakin Log Out?" |
| Suspended | `evaluateLoginGate` → `suspended` | Bottom-sheet "Akun Kamu Ditangguhkan" |

Catatan:
- `handleResponse` di [`lib/api.js`](../src/lib/api.js) menempelkan `err.status` agar UI bisa bedakan 5xx vs 4xx.
- `LoginStatusModal` kini **bottom-sheet di mobile** (handle + rounded-top) dan **kartu tengah di desktop** (`variant='sheet'`); modal error pakai `variant='center'` (kartu tengah di semua ukuran).
- Flow 6 secara arsitektur dipicu di **gate login** (bukan di layar komunitas seperti mockup), karena status langganan dicek saat login.

## 6c. Signup & Perbaikan Data (flow 8–9)

- Halaman `SignUpPage`, `SignUpOtpPage`, `SignUpReviewPage`, `FixDataPage` pakai `RightPanel` **tanpa** `mobileHero` → tampil form putih polos (bukan popup-sheet). Ini disengaja: reference tak menampilkan hero ungu di layar form ini.
- **X close** (pojok kanan-atas) ditambahkan di `SignUpPage` & `FixDataPage` → kembali ke login.
- Judul step signup: **"Data Akun"** (step 1) & **"Data Pribadi"** (step 2), sesuai reference.
- **Layar sukses gelap** dipakai bersama via [`MobileReviewNotice.jsx`](../src/components/shared/MobileReviewNotice.jsx) (`lg:hidden`, gradient ungu, ikon lingkaran dashed, tombol putih):
  - Perbaikan Data → "Akunmu Sedang Ditinjau Kembali" (ikon `UserSearch`)
  - Signup → "Terima Kasih Telah Mendaftar!" (ikon `CheckCircle2` hijau)
  - Desktop tetap versi terang existing (twin block `hidden lg:block`).

## 7. Utang teknis / catatan

- Aset `fade_bottom.png`, `glow.png`, `thumbs_up.png` belum terpakai.
- Subscription & PaymentSuccess mobile memakai gradient (bukan `hero_bg`) agar teks tetap kontras.
- Verifikasi visual belum berjalan lewat preview otomatis (port 5173 dipakai instance dev user; proxy preview tidak stabil). Validasi via `npm run build` + cek manual di DevTools mobile / perangkat.
- Angka yang mungkin perlu penyetelan setelah cek visual: overlap sheet `-mt-6`, radius `rounded-t-[28px]`, ukuran/posisi maskot di `MobileHero` (`w-[80%]`, `h-[150px]`, `-translate`).

---

## 8. Verifikasi

```bash
npm run build      # harus lulus tanpa error
npm run dev        # cek di DevTools → toggle device toolbar (≤ 1023px)
```

Layar yang diperiksa untuk flow 1–3: Login, Lupa Password, Cek Email, Ubah Password, Subscription, Transfer Bank, Payment Success — semua pada viewport mobile **dan** desktop (pastikan `lg:` tidak rusak).
