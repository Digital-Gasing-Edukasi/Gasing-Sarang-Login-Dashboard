# Verifikasi Pembayaran — Dokumentasi Modul

Dokumentasi sub-menu **Verifikasi Pembayaran** pada Dashboard Admin (`src/pages/AdminDashboardPage.jsx` + `src/pages/admin/`). Untuk arsitektur umum lihat [`README.md`](../README.md) & [`ARCHITECTURE.md`](../ARCHITECTURE.md); untuk aturan tinggi/scroll tabel lihat [`ADMIN_TABLE_LIMITS.md`](./ADMIN_TABLE_LIMITS.md) & [`ADMIN_TABLE_SCROLL.md`](./ADMIN_TABLE_SCROLL.md); modul sejenis lihat [`MANAJEMEN_AKUN.md`](./MANAJEMEN_AKUN.md).

---

## 1. Ringkasan

Layar admin untuk memverifikasi **bukti transfer manual** dari member yang berlangganan lewat Transfer Bank. Admin memeriksa bukti transfer lalu **mengonfirmasi** (aktifkan langganan) atau **menolak** (dengan alasan).

Terdiri dari **3 sub-tab**:

| Sub-tab | Isi | Aksi |
|---|---|---|
| **Belum Langganan** | User `APPROVED` tapi belum aktif langganan (read-only) — komponen terpisah `BelumLanggananTable` | (tanpa aksi) |
| **Menunggu Verifikasi** | Payment `receipt_uploaded` (bukti sudah diunggah, menunggu review) | Tombol **Konfirmasi** per baris + kolom **Reminded Time** (§4.1) |
| **Pembayaran Ditolak** | Payment yang sudah ditolak admin | Menu `...` per baris (Setujui Pembayaran / Hapus Akun) |

Tab **Belum Langganan** dirender oleh `BelumLanggananTable` (bukan `VerifikasiPembayaranTable`); dua tab lain berbagi `VerifikasiPembayaranTable` via prop `subTab`.

Sub-menu ini berada di posisi **ke-2** pada sidebar, setelah Verifikasi Akun.

---

## 2. Alur (Flow)

```
[Menunggu Verifikasi] ──klik "Konfirmasi"──► Modal "Konfirmasi Pembayaran?"
                                              (detail bukti transfer + Unduh)
                                                     │
                        ┌────────────────────────────┴───────────────────────────┐
                        ▼                                                          ▼
             "Konfirmasi Pembayaran"                                    "Tolak Pembayaran"
                        │                                                          │
                        ▼                                                          ▼
         baris hilang + toast undo 5s                        Modal "Tolak Pembayaran?"
         "Berhasil konfirmasi pembayaran…"                   (radio pilih alasan)
                                                                        │
                                                              "Tolak Pembayaran"
                                                                        │
                                                                        ▼
                                            baris pindah ke [Pembayaran Ditolak]
                                            + toast undo 5s "…telah ditolak"
```

Alasan penolakan (`TOLAK_REASONS` di `PembayaranModals.jsx`):

| value | label |
|---|---|
| `insufficient_transfer` | Transfer tidak mencukupi |
| `fund_not_retrieved` | Dana tidak diterima |
| `payment_receipt_unclear` | Bukti pembayaran tidak jelas |

Value alasan = enum BE, dipakai untuk menentukan **template notifikasi email penolakan** ke user.

Kedua aksi **optimistic + toast undo 5 detik** — commit API baru terjadi setelah toast hilang (pola sama dengan approve/reject di Verifikasi Akun; lihat `scheduleAction`). Klik **Batalkan** di toast → timer dibatalkan, API tak pernah dipanggil.

---

## 3. File

| File | Peran |
|---|---|
| `src/pages/admin/AdminSidebar.jsx` | Entri nav `verifikasi-pembayaran` (ikon `Wallet`) |
| `src/pages/admin/mappers.js` | `mapToPembayaran(p, regions, groups)` — payment → row tabel |
| `src/pages/admin/VerifikasiPembayaranTable.jsx` | Tabel (tanpa bulk-select) + tombol Konfirmasi + kolom Reminded Time (tab Menunggu & Ditolak) |
| `src/pages/admin/BelumLanggananTable.jsx` | Tabel read-only sub-tab **Belum Langganan** |
| `src/pages/admin/TableControls.jsx` | `VerifikasiPembayaranControls` + sub-tab switcher |
| `src/pages/admin/PembayaranModals.jsx` | `KonfirmasiPembayaranModal` + `TolakPembayaranModal` |
| `src/pages/AdminDashboardPage.jsx` | State, load, handler, wiring |
| `src/lib/api.js` | `adminApi.getPayments/confirmPayment/rejectPayment` |

---

## 4. Kolom tabel

`Nama Pengguna · Email · Reminded Time · Status Member · Jenis Paket · Tgl. Berakhir · Kode Voucher · Role · Riwayat Pelatihan · Tgl. Lahir · Lokasi · Alumni Pelatihan (Nama/Daerah/Tanggal Mulai) · Asal Sekolah · Last Verified · Action`

Kolom **Action** (tombol Konfirmasi) hanya muncul di sub-tab **Menunggu Verifikasi**; di sub-tab **Pembayaran Ditolak** Action = menu `...` (Setujui Pembayaran / Hapus Akun). Sebagian besar kolom identitas di-map ulang dari logika `mapToManajemen` (reuse `parsePlan`, `resolveRole`, `resolveRegionLabel`, dst).

### 4.1 Reminded Time (countdown 24 jam)

Kolom **Reminded Time** = countdown **hidup** (turun tiap detik) dari batas 24 jam sejak user submit request verifikasi. Hanya relevan di sub-tab **Menunggu Verifikasi**.

| Kondisi | Tampilan |
|---|---|
| `now - createdMs >= 24 jam` (lewat batas) atau `createdMs` kosong | `-` (abu-abu) |
| `now - createdMs < 24 jam` | sisa waktu `HH:MM:SS` (merah), turun tiap detik |
| Sub-tab **Pembayaran Ditolak** | selalu `-` |

- Sumber waktu submit = `createdMs` dari `mapToPembayaran` (= `payStartMs` = `pay.createdAt`, fallback `transferDate`/`paidAt`). Field yang sama dipakai proyeksi Tgl. Berakhir (§8.3).
- Tick pakai **1 `setInterval` global** di `VerifikasiPembayaranTable` (bukan per-baris), hanya aktif saat `subTab === 'menunggu'`. Helper `fmtReminded(createdMs, nowMs)`.
- Angka pakai `tabular-nums` biar lebar digit stabil (tidak goyang tiap detik).
- Kalau BE ternyata pakai field waktu-submit lain (bukan `createdAt`/`transferDate`/`paidAt`), `createdMs` → null → kolom tampil `-`.

---

## 5. Sumber data (endpoint asli — Postman collection)

Scope: **manual_transfer saja** (payment Midtrans tidak pernah masuk). Balik envelope `{ data, meta }`.

```
loadPembayaran()
  ├── GET /admin/payments/manual-transfer/list?filter=receipt_uploaded → pembayaranMenunggu
  │      (status=pending DAN bukti sudah diunggah — menunggu review admin)
  └── GET /admin/payments/manual-transfer/list?filter=rejected         → pembayaranDitolak
```

Nilai `filter`: `all | pending | receipt_uploaded | paid | rejected`. Catatan: `pending` = belum ada bukti (tidak relevan untuk verifikasi); yang direview admin adalah `receipt_uploaded`.

Aksi:
- **Konfirmasi** → `POST /admin/payments/manual-transfer/:id/approve` body `{ notes }` (opsional).
- **Tolak** → `POST /admin/payments/manual-transfer/:id/reject` body `{ reason, notes }` (**reason wajib** = enum value; notes opsional = catatan tambahan).

Method di `adminApi`: `listManualPayments`, `approveManualPayment`, `rejectManualPayment`, `getManualPaymentStats`.

`loadPembayaran()` (full list) dipanggil **hanya saat tab dibuka** (`activeTab === 'verifikasi-pembayaran'`), bukan di mount — biar burst request mount kecil.

**Titik biru navbar** (sebelum tab pernah dibuka) pakai `getManualPaymentStats()` di mount (1 request ringan, ambil count `receipt_uploaded`), bukan full list. Setelah tab dibuka, `pembayaranLoaded=true` → titik biru pindah ke list live:

```
navFlags['verifikasi-pembayaran'] =
  pembayaranLoaded ? pembayaranMenunggu.length > 0 : pembayaranMenungguCount > 0
```

**Dedupe request (`api.js`):** ada 3 lapis anti-429 — concurrency limiter (`MAX_CONCURRENT=4`), in-flight GET dedupe (request barengan → 1 network), dan TTL cache GET (`RESPONSE_TTL=4000ms`, request identik berdekatan reuse hasil; mutasi non-GET membuang cache). `clearApiCache()` di-export untuk pembersihan manual bila perlu.

---

## 6. Catatan Backend

Endpoint list/approve/reject **sudah ada** di collection. Yang **belum terkonfirmasi = bentuk field record payment** (collection tidak menyertakan contoh response). `mapToPembayaran` membaca field ini dengan fallback berlapis — sesuaikan begitu ada payload asli:

| Kebutuhan UI | Field yang dicoba (urutan fallback) |
|---|---|
| Nama pengirim | `senderName` · `accountName` |
| Bank asal | `bankName` · `senderBank` · `bank` |
| Nominal | `amount` · `total` · `grossAmount` |
| Tanggal transfer | `transferDate` · `paidAt` · `createdAt` |
| Bukti (URL unduh) | `receiptUrl` · `receipt.url` · `proofUrl` |
| Paket | `package.name` · `packageName` |
| Data user (identitas) | `payment.user` / `payment.member` (embed) |

Aksi memakai **optimistic + toast undo 5 detik** (`scheduleAction`) — commit API terjadi setelah toast hilang.

---

## 7. Keputusan desain

| # | Keputusan | Alasan |
|---|---|---|
| 1 | Optimistic + toast undo | Ikut pola approve/reject Verifikasi Akun |
| 2 | **Tanpa bulk-select** | Tidak ada di desain referensi; aksi per baris |
| 3 | "Lihat Detail" Riwayat = teks statis | Modal detail belum ada (sama gap Manajemen Akun) |
| 4 | Tab "Menunggu" = `filter=receipt_uploaded` (bukan `pending`) | `pending` belum ada bukti → tidak bisa diverifikasi |
| 5 | Reject `reason` = enum value; `notes` = label alasan | BE pakai `reason` untuk template email penolakan; `notes` sebagai catatan tambahan |
| 6 | Kolom identitas di-**enrich** dari data user, bukan hanya dari response payment | Response payment tidak meng-embed relasi lengkap → banyak kolom `-` |
| 7 | Tgl. Berakhir **dihitung manual** (tgl payment + durasi) | Payment pending/ditolak belum punya `subscription.endDate` asli |

---

## 8. Enrichment kolom identitas (join dengan data user)

### 8.1 Masalah

Response `GET /admin/payments/manual-transfer/list` **tidak meng-embed relasi user secara lengkap** (subscription, region, training session, voucher, dst). Akibatnya baris tabel muncul, tapi kolom **Role, Riwayat Pelatihan, Tgl. Lahir, Lokasi, Alumni Pelatihan, Asal Sekolah, Kode Voucher** tampil `-` walau datanya ada di database.

### 8.2 Solusi — 1 hit, dipakai bareng

Data user diambil dari endpoint yang **sudah dipakai tabel Manajemen Akun** (`GET /admin/users`), disimpan sekali sebagai lookup, lalu di-join ke baris payment via `userId`.

```
buka tab Pembayaran
  → payment list          (kolom milik payment: status, plan, detail transfer)
  → enrich dari usersById (join by userId → isi kolom identitas yang bolong)
  → user belum ada di lookup? → fetch GET /admin/users/{id} on-demand → merge
  → kolom keisi lengkap
```

**Komponen** (semua di `AdminDashboardPage.jsx`):

| Bagian | Peran |
|---|---|
| `usersById` (state) | Map `id → row mapToManajemen`, diisi saat load Manajemen dari **seluruh** raw user (belum disaring `isManajemenEligible`) |
| `enrichFromUser(row)` | Timpa kolom identitas baris payment dengan nilai dari `usersById[row.userId]` |
| Effect enrich on-demand | Untuk `userId` yang tidak ada di `usersById` (mis. di luar 20 user paginasi Manajemen), fetch `adminApi.getUser(id)`, map, merge ke `usersById`. Di-guard `fetchedUserIdsRef` agar tidak menembak ulang (termasuk yang gagal) |

**Aturan merge** (`enrichFromUser`): nilai user dipakai **hanya jika "berisi"** (`!= null && != '' && != '-'`); kalau kosong, nilai dari payment dipertahankan. Contoh: `plan` "Yearly"/"Monthly" dari payment tidak tertimpa `-`.

Kolom yang **tidak** di-enrich (tetap milik payment): `id`, `statusMember`, detail transfer (`payment`), `lastUpdated`, dan **`endDate`** (lihat §8.3).

> **Catatan paginasi:** `GET /admin/users` dipaginasi (limit 20). `usersById` awal hanya berisi 20 user pertama; sisanya ditambal per-baris lewat fetch on-demand `getUser(id)`. Jadi enrichment tidak bergantung pada isi 20 user itu.

### 8.3 Tgl. Berakhir — hitung manual

Payment pending/ditolak belum tentu punya `subscription.endDate` asli, jadi kolom **Tgl. Berakhir** dihitung sebagai **proyeksi**:

```
endMs = dateFieldMs(pay.createdAt) + durasiHari * 86400000
fallback → subscription.endDate  (bila tgl payment / durasi tak terbaca)
```

Durasi dari `planDurationDays(sub, planLabel)` — dibaca dari nama paket karena payload `package` hanya `{ id, name }` (tanpa field `duration`):

| Paket | Durasi |
|---|---|
| `Yearly` / `Tahunan` (`year`, `dur≥12`) | **+365 hari** |
| `Monthly` / `Bulanan` (`month`, `dur≥1`) | **+30 hari** |

`endDate` **sengaja tidak** di-enrich dari user — supaya proyeksi ini (bukan `endDate` subscription user saat ini) yang tampil. Angka 30/365 bersifat flat (bukan kalender kabisat).

### 8.4 Robustness tanggal (`mappers.js`)

Field tanggal dari API bisa berbentuk objek `{ unix, utc:{raw,iso,formatted}, local:{…} }`, bukan string ISO.

- `dateFieldMs` sudah menangani `{ unix }` dan `{ utc.raw }` → dipakai `endDate` & `alumniTanggal`.
- `parseBirthdate` (kolom **Tgl. Lahir**) diperbaiki: setelah cek `{ formatted }` / `{ date }`, jatuh ke `dateFieldMs` agar bentuk `{ unix, utc }` tidak menjadi `-`.

### 8.5 File tersentuh

| File | Perubahan |
|---|---|
| `src/pages/AdminDashboardPage.jsx` | State `usersById`, ref `fetchedUserIdsRef`, `enrichFromUser`, effect enrich on-demand, populate `usersById` di `loadUsers` |
| `src/pages/admin/mappers.js` | `planDurationDays` (baru), `mapToPembayaran` endDate manual + expose `createdMs`, `parseBirthdate` robust |
| `src/pages/admin/VerifikasiPembayaranTable.jsx` | Kolom **Reminded Time**: helper `fmtReminded`, tick 1 detik (`nowMs` state, hanya tab menunggu), header + cell (§4.1) |
