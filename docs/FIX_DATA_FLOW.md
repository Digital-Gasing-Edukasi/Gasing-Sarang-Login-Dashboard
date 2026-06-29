# Alur Perbaikan Data Akun Ditolak (Rejected Account → Fix Data)

Dokumentasi fitur penanganan akun yang ditolak admin: admin menandai data yang
salah, user menerima email berisi link untuk memperbaiki data tersebut, lalu
mengirim ulang data yang sudah dibetulkan.

- **Status:** Frontend selesai. Beberapa bagian menunggu backend (lihat
  [Tugas Backend](#tugas-backend)).
- **Audiens:** Frontend & backend engineer Gasing Auth.
- **Repo:** `gasing-auth` (React + Vite + Tailwind).
- **Keputusan desain:** lihat [ADR-0001](adr/0001-fix-data-flow.md).

---

## 1. Konteks & Tujuan

Sebelumnya, admin menolak akun dengan satu alasan teks bebas dan user tidak punya
jalur untuk memperbaiki datanya. Alur baru ini:

1. Admin memverifikasi data secara manual di tab **Verifikasi Akun**.
2. Jika ada data salah, admin **mencentang field yang salah** (bukan teks bebas)
   dan boleh menambah catatan per field.
3. Sistem mengirim email: *akun sudah dibuat, tapi ada data yang salah* — berisi
   daftar data yang salah + link perbaikan.
4. Link membawa user ke halaman **Perbaiki Data** dengan form yang **sudah terisi
   data lamanya**.
5. Field yang salah ditandai **border merah + bubble notifikasi** (dinamis: hilang
   begitu user mengedit field tersebut).

---

## 2. Alur End-to-End

```
┌──────────────────────────────────────────────────────────────────────┐
│ ADMIN (Verifikasi Akun)                                               │
│  RejectModal → centang field salah + catatan opsional per field        │
│  onConfirm({ invalidFields, notes, reason })                           │
└───────────────────────────────┬──────────────────────────────────────┘
                                │ adminApi.verifyUser(id, {
                                │   status: 'rejected',
                                │   rejectedReason,        // string readable
                                │   rejectedFields,        // ['name', ...]
                                │   correctionUrl,         // /?fix=<payload>
                                │ })
                                ▼
┌──────────────────────────────────────────────────────────────────────┐
│ BACKEND                                                                │
│  Simpan status + rejectedFields → kirim EMAIL berisi correctionUrl      │
└───────────────────────────────┬──────────────────────────────────────┘
                                │ user klik link di email
                                ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FRONTEND (App.jsx)                                                     │
│  Baca ?fix=<payload> → decodeFixPayload() → route page "fix-data"      │
└───────────────────────────────┬──────────────────────────────────────┘
                                ▼
┌──────────────────────────────────────────────────────────────────────┐
│ FixDataPage                                                            │
│  Prefill semua field dari payload                                       │
│  Field di payload.invalid → border merah + bubble (pesan dari notes)    │
│  User edit → bubble hilang → submit                                     │
└───────────────────────────────┬──────────────────────────────────────┘
                                │ authApi.submitCorrection({ uid, ...data })
                                ▼
┌──────────────────────────────────────────────────────────────────────┐
│ BACKEND  POST /auth/correct-data                                       │
│  Update data user → reset ke status pending untuk ditinjau ulang        │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 3. Kontrak Link (`?fix=<payload>`)

Link bersifat **self-contained** — semua data prefill + daftar field salah
di-encode langsung di URL, tanpa lookup ke backend. Sumber kebenaran kontrak ada
di [`src/lib/fixLink.js`](../src/lib/fixLink.js).

**Format:** `<origin>/?fix=<base64url(JSON)>`

`base64url` = base64 standar dengan `+`→`-`, `/`→`_`, padding `=` dibuang.
Encoding unicode-safe (`encodeURIComponent` sebelum `btoa`).

### Struktur payload

| Field                   | Tipe       | Keterangan                                   |
|-------------------------|------------|----------------------------------------------|
| `uid`                   | string     | Id user, dikirim balik saat resubmit         |
| `name`                  | string     | Nama lengkap                                 |
| `username`              | string     | Tanpa prefix `@`                             |
| `email`                 | string     | Email                                        |
| `birthdate`             | string     | `YYYY-MM-DD`                                 |
| `regionId`              | string     | Region lokasi saat ini (Kab/Kota)            |
| `provinceId`            | string     | Provinsi lokasi saat ini                     |
| `firstTrainingYear`     | number     | Tahun pelatihan pertama                      |
| `firstTrainingMonth`    | number     | Bulan pelatihan pertama (1–12)               |
| `lastTrainingSessionId` | string     | Id session pelatihan                         |
| `trainingRegionId`      | string     | Region pelatihan pertama                     |
| `schoolName`            | string     | Sekolah asal                                 |
| `invalid`               | string[]   | Daftar **key** field yang salah (lihat §4)   |
| `notes`                 | object     | `{ [key]: 'pesan bubble custom' }` (opsional)|

### Helper

```js
import { encodeFixPayload, decodeFixPayload, buildFixUrl } from '@/lib/fixLink'

const url = buildFixUrl(payload)          // → 'https://app/?fix=eyJ1aWQiOi...'
const data = decodeFixPayload(token)      // → payload | null (null kalau invalid)
```

`decodeFixPayload` mengembalikan `null` bila token rusak atau `invalid` bukan
array — pemanggil harus menangani kasus null (App.jsx fallback ke halaman login).

---

## 4. Registry Field (`FIELD_DEFS`)

Satu sumber kebenaran untuk **checklist admin** dan **bubble error user**.
Didefinisikan di [`src/lib/fixLink.js`](../src/lib/fixLink.js).

| key         | label              |
|-------------|--------------------|
| `name`      | Nama Lengkap       |
| `username`  | Username           |
| `email`     | Email              |
| `birthdate` | Tanggal Lahir      |
| `region`    | Lokasi Saat Ini    |
| `training`  | Data Pelatihan Gasing |
| `school`    | Sekolah Asal       |

> Menambah field baru cukup di `FIELD_DEFS`. Checklist admin & mapping bubble ikut
> otomatis. Pastikan FixDataPage punya kontrol form untuk key tersebut.

`region` menutupi 2 dropdown (provinsi + kab/kota); `training` menutupi 3 dropdown
(tahun + bulan + daerah). Satu key error → border merah di semua dropdown terkait.

---

## 5. File yang Terlibat

| File | Peran |
|------|-------|
| [`src/lib/fixLink.js`](../src/lib/fixLink.js) | Kontrak link: registry field, encode/decode, `buildFixUrl`, pesan default |
| [`src/pages/admin/ConfirmModal.jsx`](../src/pages/admin/ConfirmModal.jsx) | `RejectModal` dengan checklist field + catatan per field |
| [`src/pages/admin/mappers.js`](../src/pages/admin/mappers.js) | `mapToVerifikasi` menyimpan `raw` (id mentah) untuk prefill |
| [`src/pages/AdminDashboardPage.jsx`](../src/pages/AdminDashboardPage.jsx) | `handleConfirmReject` membangun `correctionUrl` & memanggil `verifyUser` |
| [`src/lib/api.js`](../src/lib/api.js) | `authApi.submitCorrection` (resubmit data) |
| [`src/pages/auth/FixDataPage.jsx`](../src/pages/auth/FixDataPage.jsx) | Form perbaikan: prefill + border merah + bubble dinamis |
| [`src/App.jsx`](../src/App.jsx) | Deteksi `?fix=` → decode → route `fix-data` |

---

## 6. Detail Komponen

### RejectModal
- State `checked` (`{ [key]: bool }`) + `notes` (`{ [key]: string }`).
- Submit aktif jika minimal 1 field dicentang.
- Menghasilkan `reason` string readable: `"Nama Lengkap: catatan; Email"`.
- Callback: `onConfirm({ invalidFields, notes, reason })`.

### FixDataPage — bubble dinamis
- `fieldErrors` di-init dari `payload.invalid` + `payload.notes`. Pesan default
  dari `defaultFieldMessage(key)` bila tidak ada catatan admin.
- Setiap `onChange` field memanggil `clearErr(key)` → menghapus key dari
  `fieldErrors` → border merah + bubble hilang.
- Tombol submit menolak kirim selama `fieldErrors` masih ada isinya.
- Komponen `<ErrorBubble>` = callout merah dengan ekor segitiga di bawah field.

---

## 7. Tugas Backend

Bagian yang **tidak bisa dikerjakan frontend** dan harus diselesaikan backend:

1. **Kirim email.** Baca `correctionUrl` dari body `PATCH /admin/users/:id/verify`
   lalu sisipkan ke email penolakan. (FE tidak bisa mengirim email.)
2. **Terima field baru** pada `verify`: `rejectedFields` (array) & `correctionUrl`
   (string). Disimpan + dipakai untuk email.
3. **Endpoint resubmit** `POST /auth/correct-data` — body `{ uid, name, username,
   email, birthdate, regionId, firstTrainingYear, firstTrainingMonth,
   firstTrainingRegionId, lastTrainingSessionId, schoolName }`. Update data user
   dan set kembali ke status *pending* untuk ditinjau ulang. Sesuaikan
   nama/route di [`src/lib/api.js`](../src/lib/api.js) bila berbeda.

---

## 8. Catatan Akurasi Prefill ⚠️

Tabel admin (`mapToVerifikasi`) hanya menyimpan data display. Untuk prefill,
ditambahkan objek `raw` yang mengambil id mentah dari respons `GET /admin/users`.
**Nama field di `raw` masih asumsi** dan perlu diverifikasi terhadap respons asli:

`u.regionId`, `u.provinceId`, `u.trainingRegionId`, `u.firstTrainingYear`,
`u.firstTrainingMonth`, `u.lastTrainingSessionId`.

- Jika nama field API berbeda → perbaiki di
  [`src/pages/admin/mappers.js`](../src/pages/admin/mappers.js).
- Field yang id-nya tidak tersedia → dropdown lokasi/pelatihan tampil kosong dan
  user memilih ulang. Field teks (nama, email, sekolah, tanggal lahir) tetap
  terisi karena tidak bergantung pada id.

---

## 9. Pengujian Manual

1. Login sebagai admin → tab **Verifikasi Akun**.
2. Klik tombol **X** pada satu user → centang beberapa field → **Tolak Akun**.
3. Di Network/console, ambil `correctionUrl` dari payload `verifyUser` (atau
   panggil `buildFixUrl` manual di console).
4. Buka URL tersebut → harus mendarat di **Perbaiki Data** dengan field terisi dan
   field yang dicentang bertanda merah + bubble.
5. Edit field merah → bubble hilang. Submit → muncul layar sukses.

> Selama backend belum siap, langkah 3 (email) digantikan dengan menyalin
> `correctionUrl` manual, dan submit (langkah 5) akan gagal di network sampai
> `POST /auth/correct-data` tersedia.
