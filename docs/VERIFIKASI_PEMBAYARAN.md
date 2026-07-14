# Verifikasi Pembayaran — Dokumentasi Modul

Dokumentasi sub-menu **Verifikasi Pembayaran** pada Dashboard Admin (`src/pages/AdminDashboardPage.jsx` + `src/pages/admin/`). Untuk arsitektur umum lihat [`README.md`](../README.md) & [`ARCHITECTURE.md`](../ARCHITECTURE.md); untuk aturan tinggi/scroll tabel lihat [`ADMIN_TABLE_LIMITS.md`](./ADMIN_TABLE_LIMITS.md) & [`ADMIN_TABLE_SCROLL.md`](./ADMIN_TABLE_SCROLL.md); modul sejenis lihat [`MANAJEMEN_AKUN.md`](./MANAJEMEN_AKUN.md).

---

## 1. Ringkasan

Layar admin untuk memverifikasi **bukti transfer manual** dari member yang berlangganan lewat Transfer Bank. Admin memeriksa bukti transfer lalu **mengonfirmasi** (aktifkan langganan) atau **menolak** (dengan alasan).

Terdiri dari **2 sub-tab**:

| Sub-tab | Isi | Aksi |
|---|---|---|
| **Menunggu Verifikasi** | Payment status `pending` + bukti sudah diunggah | Tombol **Konfirmasi** per baris |
| **Pembayaran Ditolak** | Payment yang sudah ditolak admin | (tanpa aksi) |

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
| `receipt_unreadable` | Bukti pembayaran tidak terbaca / salah |
| `wrong_amount` | Nominal transfer salah |
| `wrong_account` | Rekening tujuan salah |

Kedua aksi **optimistic + toast undo 5 detik** — commit API baru terjadi setelah toast hilang (pola sama dengan approve/reject di Verifikasi Akun; lihat `scheduleAction`). Klik **Batalkan** di toast → timer dibatalkan, API tak pernah dipanggil.

---

## 3. File

| File | Peran |
|---|---|
| `src/pages/admin/AdminSidebar.jsx` | Entri nav `verifikasi-pembayaran` (ikon `Wallet`) |
| `src/pages/admin/mappers.js` | `mapToPembayaran(p, regions, groups)` — payment → row tabel |
| `src/pages/admin/VerifikasiPembayaranTable.jsx` | Tabel (tanpa bulk-select) + tombol Konfirmasi |
| `src/pages/admin/TableControls.jsx` | `VerifikasiPembayaranControls` + sub-tab switcher |
| `src/pages/admin/PembayaranModals.jsx` | `KonfirmasiPembayaranModal` + `TolakPembayaranModal` |
| `src/pages/AdminDashboardPage.jsx` | State, load, handler, wiring |
| `src/lib/api.js` | `adminApi.getPayments/confirmPayment/rejectPayment` |

---

## 4. Kolom tabel

`Nama Pengguna · Email · Status Member · Jenis Paket · Tgl. Berakhir · Kode Voucher · Role · Riwayat Pelatihan · Tgl. Lahir · Lokasi · Alumni Pelatihan (Nama/Daerah/Tanggal Mulai) · Asal Sekolah · Last Updated · Action`

Kolom **Action** (tombol Konfirmasi) hanya muncul di sub-tab **Menunggu Verifikasi**. Sebagian besar kolom identitas di-map ulang dari logika `mapToManajemen` (reuse `parsePlan`, `resolveRole`, `resolveRegionLabel`, dst).

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
- **Tolak** → `POST /admin/payments/manual-transfer/:id/reject` body `{ notes }` (**wajib** = alasan; FE mengirim label alasan terpilih).

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
| 5 | Reject `notes` = label alasan terpilih | Endpoint mewajibkan `notes` teks bebas |
