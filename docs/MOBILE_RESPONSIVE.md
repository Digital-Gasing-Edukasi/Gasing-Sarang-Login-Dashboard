# Mobile / Responsive — GASING CIRCLE Auth & Payment

> Dokumen ini menjelaskan **versi mobile** dari halaman auth & pembayaran, cara kerjanya, dan cara menambah/mengubahnya. Untuk arsitektur umum aplikasi lihat [`../ARCHITECTURE.md`](../ARCHITECTURE.md).

**Status:** Flow 1–9 selesai (per 2026-07-27). Flow 10 belum (belum ada reference). Lihat [Status per-flow](#status-per-flow).

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

**Desktop punya 2 resolusi base** (custom screen `fhd` di `tailwind.config.js`):

| Prefix | Base | Lebar form |
| ------ | ---- | ---------- |
| `lg:` (≥ 1024px) | 1366×768 | **380px** |
| `fhd:` (≥ 1728px) | 1920×1080 | **480px** |

Ambang `fhd` sengaja **1728px** (bukan 1920) supaya monitor 1920 yang viewport-nya menyusut oleh scrollbar (~1903px) tetap kena base FHD; layar 1600/1680 tetap base 1366. Lebar form diatur di default `maxWidth` [`RightPanel`](../src/components/layout/RightPanel.jsx) (split-screen) & container [`AuthFullLayout`](../src/components/layout/AuthFullLayout.jsx) (full-screen). Footer: split → hanya panel kanan; full → center full-width (sudah sesuai, tak berubah).

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
| [`components/layout/StepIndicator.jsx`](../src/components/layout/StepIndicator.jsx) | `StepBar` = header flow signup (back opsional + judul tengah + X tutup); `StepHeader` = pembungkus subtitle. Dipakai `SignUpPage` & `SignUpOtpPage`. |
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

**Bentuk kontrol = pill di semua ukuran.** Karena 1 codebase, field/dropdown/calendar/CTA memakai `rounded-full` yang sama di mobile & desktop; komponen tema-gelap (`DarkAuth`) memang sudah pill sejak awal. Detail: [PILL_SHAPE_INPUTS.md](PILL_SHAPE_INPUTS.md).

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
- **Header step** (`StepIndicator.jsx` → `StepBar`) mengikuti reference mobile: **back opsional (kiri) + judul di tengah + X tutup (kanan)**. Progress bar segmen + counter "1/3" **dihapus**; spacer `w-9` menjaga judul tetap center saat back/X absen. X → kembali ke login.
  - **Data Akun** (step 1): tanpa back · judul "Data Akun" · X.
  - **Data Pribadi** (step 2): back → step 1 · judul "Data Pribadi" · X.
  - **Verifikasi OTP** (dulu "Verifikasi Email"): back → step 2 · X. Subtitle ("Masukkan kode…" + email) pindah ke `StepHeader` yang kini **hanya** membungkus subtitle (judul sudah di `StepBar`).
- **Spacing form Data Akun (mobile-only, `lg:` mempertahankan nilai desktop):**
  - Antar-field **24px** (`space-y-6 lg:space-y-4`).
  - Label → input **16px** (`space-y-4 lg:space-y-1.5`).
  - Username & Email **ditumpuk full-width** di mobile, tetap 2 kolom di desktop (`grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-3`).
  - Checkbox persetujuan → tombol Lanjutkan **65px** (`!mt-[65px] lg:!mt-8`).
- **Layar sukses gelap** dipakai bersama via [`MobileReviewNotice.jsx`](../src/components/shared/MobileReviewNotice.jsx) (`lg:hidden`, gradient ungu, ikon lingkaran dashed, tombol putih):
  - Perbaikan Data → "Akunmu Sedang Ditinjau Kembali" (ikon `UserSearch`)
  - Signup → "Terima Kasih Telah Mendaftar!" (ikon `CheckCircle2` hijau)
  - Desktop tetap versi terang existing (twin block `hidden lg:block`).

## 6d. Scroll layout auth (JEBAKAN 100vh — WAJIB BACA)

Form auth yang panjang (signup) **HARUS pakai document scroll**, bukan container scroll. Bug ini sudah kambuh 2×; jangan diulang.

**Gejala kalau salah** (mobile signup): abis ketik 1 input tidak bisa scroll · header (`StepBar`) tidak ikut fixed di atas · tombol CTA "Lanjutkan" hilang di bawah fold.

**Biang:**
1. `SplitLayout` ([`App.jsx`](../src/App.jsx)) pakai `h-screen overflow-hidden` → di mobile `100vh` = tinggi besar (abaikan address bar) → container lebih tinggi dari area kelihatan, isi ke-clip.
2. `RightPanel` mengunci `h-[100dvh] overflow-hidden` + area scroll dalam. Nested overflow + 100vh = jebakan klasik: `sticky` nempel ke container yang ke-clip → tidak fixed.
3. Varian lama pernah **lupa render `stickyFooter`** → CTA tidak pernah tampil sama sekali.

**Aturan (benar):**
- `SplitLayout` = `flex min-h-screen` (JANGAN `h-screen`/`overflow-hidden`). Biar **dokumen** yang scroll natural — tahan keyboard & address bar mobile.
- `RightPanel` outer = `min-h-screen` (JANGAN `h-[100dvh]`/`overflow-hidden`, JANGAN `overflow-y-auto` di area konten).
- Header: `topBar` `sticky top-0` → nempel VIEWPORT = header beneran fixed.
- CTA: `stickyFooter` **harus dirender** dan `sticky bottom-0` → selalu kelihatan walau form panjang.
- Edge-blur (strip fade bawah-header & atas-CTA) baca **`window.scrollY` + `document.documentElement.scrollHeight`** (bukan `el.scrollTop`), karena yang scroll adalah dokumen. `atTop` matiin blur header, `atBottom` matiin blur CTA.
- `LeftPanel` desktop `sticky top-0 h-screen` sendiri → tetap diam saat dokumen scroll.

**Jangan** patok tinggi viewport (`h-screen`/`h-[100dvh]`) di container luar yang membungkus form panjang.

## 7. Utang teknis / catatan

- Aset `fade_bottom.png`, `glow.png`, `thumbs_up.png` belum terpakai.
- Subscription & PaymentSuccess mobile memakai gradient (bukan `hero_bg`) agar teks tetap kontras.
- **Kartu paket (`SubscriptionPage`):** paket **Tahunan selalu di atas** (`sortAnnualFirst`) & tampil *featured* (gradient ungu, `billingCycle === "annual"`) di mobile + desktop. Deteksi annual tahan-banting (`durationUnit` **atau** nama "Yearly/Annual/Tahunan") + clamp `months ≥ 12` supaya harga `/bln` = total ÷ 12 (bukan total mentah); badge "Kamu Hemat X%" dihitung dari selisih vs harga bulanan pakai `Math.ceil`. Lihat `transformPlan`/`withComparison`.
- Verifikasi visual belum berjalan lewat preview otomatis (port 5173 dipakai instance dev user; proxy preview tidak stabil). Validasi via `npm run build` + cek manual di DevTools mobile / perangkat.
- Angka yang mungkin perlu penyetelan setelah cek visual: overlap sheet `-mt-6`, radius `rounded-t-[28px]`, ukuran/posisi maskot di `MobileHero` (`w-[80%]`, `h-[150px]`, `-translate`).

---

## 8. Verifikasi

```bash
npm run build      # harus lulus tanpa error
npm run dev        # cek di DevTools → toggle device toolbar (≤ 1023px)
```

Layar yang diperiksa untuk flow 1–3: Login, Lupa Password, Cek Email, Ubah Password, Subscription, Transfer Bank, Payment Success — semua pada viewport mobile **dan** desktop (pastikan `lg:` tidak rusak).
