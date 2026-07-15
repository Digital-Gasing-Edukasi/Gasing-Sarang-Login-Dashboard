# Alur Perbaikan Data / Revisi Akun (Revise Flow)

Dokumentasi fitur penanganan akun yang perlu perbaikan data: admin menandai data
yang salah, backend mengirim email berisi link revisi (token JWT), user membuka
form yang sudah terisi data lamanya, memperbaiki, lalu mengirim ulang.

- **Status:** Frontend selesai (admin + user + route + prefill). Token-based.
- **Audiens:** Frontend & backend engineer Gasing Auth.
- **Repo:** `gasing-auth` (React + Vite + Tailwind).
- **Keputusan desain:** [ADR-0003](adr/0003-revise-token-flow.md) (menggantikan
  [ADR-0001](adr/0001-fix-data-flow.md) yang memakai link self-contained `?fix=`).

> **Catatan mekanisme.** Sejak ADR-0003, alur memakai **token JWT** yang di-generate
> backend, bukan payload yang di-encode di URL. Bagian legacy `?fix=` (`buildFixUrl`,
> `decodeFixPayload`, `submitCorrection`) masih ada di kode sebagai fallback tetapi
> **deprecated** — akan dihapus setelah alur token stabil. Lihat §10.

---

## 1. Konteks & Tujuan

Admin memverifikasi pendaftar di tab **Verifikasi Akun**. Bila ada data salah,
admin punya dua aksi (satu modal, `RejectModal`):

- **Minta revisi** (centang field yang salah) → status `revise`. User mendapat
  email berisi link untuk memperbaiki field tersebut, lalu kirim ulang.
- **Tolak final** (centang **"Lainnya"** + tulis catatan) → status `rejected`.
  Penolakan final dengan alasan bebas; user tidak diberi jalur perbaikan.

Fokus dokumen ini adalah alur **revise**.

---

## 2. Alur End-to-End (Revise)

```
┌──────────────────────────────────────────────────────────────────────┐
│ ADMIN (Verifikasi Akun → RejectModal)                                 │
│  Centang field salah (tanggalLahir/lokasi/riwayatPelatihan/namaSekolah)│
│  → onConfirm({ status:'revise', invalidFields, reason })               │
└───────────────────────────────┬──────────────────────────────────────┘
                                │ adminApi.reviseUser(id, {
                                │   rejectedReason,        // ringkas label field
                                │   fieldsToRevise,        // ['tanggalLahir', ...]
                                │ })  → PATCH /admin/users/:id/verify {status:'revise'}
                                ▼
┌──────────────────────────────────────────────────────────────────────┐
│ BACKEND                                                                │
│  Set status REVISE (verifiedStatus=2) → generate token JWT →           │
│  kirim EMAIL berisi link: https://[host]/register/revise?token=<JWT>   │
└───────────────────────────────┬──────────────────────────────────────┘
                                │ user klik link di email
                                ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FRONTEND (App.jsx boot)                                               │
│  pathname includes '/revise' + ?token= → authApi.getRevise(token)     │
│  → POST /auth/revise {token} → { user, reviseReason, reviseFields }    │
│  → normalizeRevise + enrich provinsi → route page 'fix-data'          │
│  (token invalid/expired → page 'revise-error')                        │
└───────────────────────────────┬──────────────────────────────────────┘
                                ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FixDataPage                                                           │
│  Prefill field dari respons; field di reviseFields → border+teks merah │
│  User edit → penanda hilang → "Kirim Perbaikan Data" (langsung submit) │
└───────────────────────────────┬──────────────────────────────────────┘
                                │ authApi.submitRevise({ token, ...data })
                                ▼
┌──────────────────────────────────────────────────────────────────────┐
│ BACKEND  POST /auth/revise/submit                                      │
│  Update data user → set status WAITING → notifikasi admin USER/VERIFY   │
│  Token di-revoke (one-time)                                            │
└───────────────────────────────┬──────────────────────────────────────┘
                                ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FRONTEND (FixDataPage — layar sukses)                                 │
│  "Akunmu Sedang Ditinjau Kembali" (estimasi 24-48 jam + cek email)     │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 3. Kontrak Link & Endpoint

### Link email (route FE)

```
https://[host]/register/revise?token=<JWT>
```

- Route React Router: `/register/revise` (lihat `PAGE_PATHS` di [`src/lib/routes.js`](../src/lib/routes.js)).
  Sejak v3.0.0 `base` Vite = `/`, jadi ini path absolut dari root domain — **bukan** lagi
  turunan dari `base: '/register'` yang lama.
- Boot sequence mendeteksinya lewat `pathname.startsWith('/register/revise')`, lalu menukar
  `?token=` (revise JWT) ke `authApi.getRevise()` untuk prefill. Token gagal/kadaluarsa →
  `/register/revise/invalid`.
- URL email disusun **backend** (config `[routes]` mereka).
- Tidak bentrok dengan reset-password (`/login/reset-password?token=`): cek `/register/revise`
  berada **sebelum** cek `?token=` generik di boot sequence, dan path-nya beda.

### Endpoint

| Aksi | Endpoint | Body |
|------|----------|------|
| Admin minta revisi | `PATCH /admin/users/:id/verify` | `{ status:'revise', rejectedReason, fieldsToRevise[] }` |
| Admin tolak final | `PATCH /admin/users/:id/verify` | `{ status:'rejected', rejectedReason }` |
| Admin kirim ulang email | `POST /admin/users/:id/resend-revise-email` | — |
| User ambil prefill | `POST /auth/revise` | `{ token }` |
| User submit revisi | `POST /auth/revise/submit` | `{ token, name, birthdate, regionId, firstTrainingYear, firstTrainingMonth, firstTrainingRegionId, lastTrainingSessionId, schoolName }` |

Auth `/auth/revise*` lewat `token` di body (bukan access token). Token
**one-time** — di-revoke setelah `submit` sukses.

### Respons `POST /auth/revise`

```jsonc
{
  "user": {
    "id", "username", "email", "name",
    "birthdate": { "date": "2018-06-06", "formatted": "06 Jun 2018" },
    "regionId": "019e…", "region": { "id": "019e…", "regionName": "Kabupaten Bangli" },
    "lastTrainingSessionId": null, "lastTrainingSession": null,
    "schoolName": "SD 01 Gasing", "verifiedStatus": 2, …
  },
  "reviseReason": "Nama dan tanggal lahir tidak sesuai dengan KTP",
  "reviseFields": ["tanggalLahir", "lokasi", "riwayatPelatihan", "namaSekolah"]
}
```

`reviseReason` & `reviseFields` berada di **top-level** (sibling `user`).

---

## 4. Registry Field (`FIELD_DEFS`)

Sumber kebenaran tunggal untuk **checklist admin** (`RejectModal`) dan **penanda
error user** (`FixDataPage`). Didefinisikan di [`src/lib/fixLink.js`](../src/lib/fixLink.js).

| key                | label              |
|--------------------|--------------------|
| `tanggalLahir`     | Tanggal Lahir      |
| `lokasi`           | Lokasi             |
| `riwayatPelatihan` | Riwayat Pelatihan  |
| `namaSekolah`      | Nama Sekolah       |
| `lainnya`          | Lainnya            |

> Key ini **wajib sama** dengan kosakata `reviseFields` backend (dikonfirmasi dari
> respons `/auth/revise`) karena admin mengirim `fieldsToRevise` dengan key ini dan
> user-side menandai field merah dengan key yang sama.
>
> - **`lainnya`** bukan field form. Mencentangnya mengubah aksi jadi **tolak final**
>   (`status:'rejected'`): memunculkan textarea "Catatan Tambahan" → `rejectedReason`,
>   dan checklist field lain diabaikan.
> - **Identity (Nama/Username/Email)** tidak ada di registry — form perbaikan tidak
>   menampilkannya (hanya dikirim ulang apa adanya). `FIELD_DEFS` (minus `lainnya`)
>   harus sama dengan `CORRECTABLE_KEYS` di `FixDataPage.jsx`.

`lokasi` menutupi 2 dropdown (provinsi + kab/kota); `riwayatPelatihan` menutupi 3
dropdown (tahun + bulan + daerah). Satu key error → border merah di semua dropdown
terkait.

`verifiedStatus` (numerik): `1`=Approved, `2`=Revise, `-1`=Rejected, lainnya=Waiting.

---

## 5. File yang Terlibat

| File | Peran |
|------|-------|
| [`src/lib/api.js`](../src/lib/api.js) | `adminApi.reviseUser/rejectUser/resendReviseEmail`, `authApi.getRevise/submitRevise` |
| [`src/lib/fixLink.js`](../src/lib/fixLink.js) | `FIELD_DEFS` (registry field). Legacy: encode/decode `?fix=` |
| [`src/pages/admin/ConfirmModal.jsx`](../src/pages/admin/ConfirmModal.jsx) | `RejectModal` — checklist + "Lainnya" (rejected) vs field (revise) |
| [`src/pages/AdminDashboardPage.jsx`](../src/pages/AdminDashboardPage.jsx) | `handleConfirmReject` → `reviseUser`/`rejectUser`; list `filter[verifiedStatus]=waiting` |
| [`src/pages/admin/mappers.js`](../src/pages/admin/mappers.js) | `parseVerifiedStatus` (2→Revise), map tabel |
| [`src/App.jsx`](../src/App.jsx) | Deteksi `/revise` → `getRevise` → `normalizeRevise` + enrich provinsi → route |
| [`src/pages/auth/FixDataPage.jsx`](../src/pages/auth/FixDataPage.jsx) | Form perbaikan: prefill + field merah + `submitRevise` |

---

## 6. Detail Komponen

### RejectModal (`ConfirmModal.jsx`)
- Checklist `FIELD_DEFS` dengan checkbox biru; state `checked`.
- **"Lainnya" dicentang** → `isRejected = true`: tampilkan textarea "Catatan
  Tambahan", checklist field diabaikan.
- Submit aktif jika: minimal 1 field (mode revise) **atau** Lainnya + catatan terisi
  (mode rejected).
- Callback `onConfirm({ status, invalidFields, reason })`:
  - `status:'revise'` → `reason` = ringkas label field, `invalidFields` = key field.
  - `status:'rejected'` → `reason` = Catatan Tambahan, `invalidFields` = `[]`.

### FixDataPage (`FixDataPage.jsx`)
- **Field yang bisa diperbaiki** (`CORRECTABLE_KEYS`): Tanggal lahir, Lokasi
  (provinsi+kab/kota), Pelatihan (tahun/bulan/daerah), Sekolah. Nama/Username/Email
  tidak ditampilkan (dikirim ulang apa adanya).
- `fieldErrors` di-init dari `invalid` (reviseFields), difilter ke `CORRECTABLE_KEYS`.
  Pesan default `"Data kurang sesuai."`. Setiap `onChange` → `clearErr(key)`.
- Penanda error = **border merah + teks merah** (`<FieldError>`).
- Submit **langsung** (tanpa modal): `handleSubmit` (validasi) → `doSubmit`. Bila
  `reviseToken` ada → `submitRevise`, else legacy `submitCorrection`.
- Sukses → **"Akunmu Sedang Ditinjau Kembali"** (estimasi 24-48 jam + callout cek
  email berkala).

---

## 7. Prefill (`normalizeRevise` di App.jsx)

Respons `/auth/revise` dipetakan ke bentuk prefill FixDataPage:

- `birthdate` = object `{date, formatted}` → ambil `.date` (`YYYY-MM-DD`).
- `regionId` langsung; **provinsi tidak ada di respons** → boot memanggil
  `regionsApi.get(regionId)` untuk mengambil `parentId` agar cascade lokasi prefill.
- Tahun/bulan pelatihan diturunkan dari `lastTrainingSession.startDate.unix` bila ada.
- `invalid` = `reviseFields`; `reviseReason` disimpan untuk konteks.

Bila sebuah id tidak tersedia, dropdown terkait tampil kosong dan user memilih ulang;
field teks (nama, sekolah, tanggal lahir) tetap terisi.

---

## 8. Status Backend

Sudah tersedia (Postman `komunitas-api`): `verify {revise|rejected}`,
`resend-revise-email`, `/auth/revise`, `/auth/revise/submit`, list
`filter[verifiedStatus]=waiting`.

Perlu dipastikan backend:
1. **Set `[routes]` email** = `/register/revise` (agar link mendarat di FE).
2. Email revisi memuat link + `reviseReason`/`reviseFields`.
3. Email notifikasi saat status berubah (opsional, jejak untuk user).

---

## 9. Pengujian Manual

1. Dapatkan `reviseToken` (dari respons admin `verify {status:'revise'}` atau minta
   backend generate).
2. `npm run dev`, lalu buka:
   ```
   http://localhost:5173/register/revise?token=<JWT>
   ```
3. Harus mendarat di **Perbaikan Data** dengan field terisi dan field di
   `reviseFields` bertanda **merah + "Data kurang sesuai."**.
4. Edit field merah → penanda hilang → **Kirim Perbaikan Data** → layar **"Akunmu
   Sedang Ditinjau Kembali"**.

> `getRevise` (langkah 2–3) bisa diulang. `submitRevise` (langkah 4) **one-time** —
> token mati setelah sukses; untuk tes ulang minta token baru. Pastikan CORS backend
> mengizinkan origin dev (`localhost:5173`); bila diblok → halaman "Link Tidak Valid".

---

## 10. Legacy `?fix=` (Deprecated)

Mekanisme lama (ADR-0001): link self-contained `?fix=<base64url(JSON)>`, prefill
dari URL, submit `POST /auth/correct-data`. Masih ada di kode sebagai fallback
(`buildFixUrl`, `encodeFixPayload`, `decodeFixPayload`, `authApi.submitCorrection`,
deteksi `?fix=` di App.jsx) tetapi **tidak dipakai lagi**.

**Rencana pembersihan** setelah alur token stabil di produksi: hapus helper `?fix=`
di `fixLink.js`, blok `?fix=` di `App.jsx`, dan `submitCorrection` di `api.js`.
