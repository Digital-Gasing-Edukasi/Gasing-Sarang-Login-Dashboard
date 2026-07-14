# Manajemen Akun — Dokumentasi Modul

Dokumentasi layar **Manajemen Akun** pada Dashboard Admin (`src/pages/AdminDashboardPage.jsx` + `src/pages/admin/`). Untuk arsitektur aplikasi secara umum lihat [`README.md`](../README.md) dan [`ARCHITECTURE.md`](../ARCHITECTURE.md); untuk aturan tinggi/scroll tabel lihat [`ADMIN_TABLE_LIMITS.md`](./ADMIN_TABLE_LIMITS.md) & [`ADMIN_TABLE_SCROLL.md`](./ADMIN_TABLE_SCROLL.md).

---

## 1. Ringkasan

Manajemen Akun adalah layar admin untuk mengelola akun yang **sudah selesai proses verifikasi**. Layar ini terdiri dari **4 tabel utama** (tab), masing‑masing menampilkan akun berdasarkan statusnya, dengan aksi berbeda per tab.

Layar ini **hanya menampung akun yang sudah diputus final**. Akun yang masih dalam proses verifikasi tetap berada di layar **Verifikasi Akun** (bukan Manajemen).

```
Verifikasi Akun  ──approve──►  (voucher)  ──konfirmasi──►  Manajemen Akun
  WAITING(0)                  PENDING_VOUCHER(3)              APPROVED(1)
  REVISE(2)                                                  REJECTED(-1)
```

---

## 2. Status Akun (`verifiedStatus`)

Enum backend (lihat `VERIFIED_STATUS` di `src/pages/admin/mappers.js`):

| Nilai | Konstanta | Arti |
|------:|-----------|------|
| `-1` | `REJECTED` | Ditolak final |
| `0` | `WAITING` | Menunggu diverifikasi |
| `1` | `APPROVED` | Kode voucher sudah diproses staff (selesai) |
| `2` | `REVISE` | Diminta perbaiki data |
| `3` | `PENDING_VOUCHER` | Sudah lolos verifikasi data, menunggu voucher |

### Syarat masuk Manajemen — `isManajemenEligible(u)`

Hanya akun ber‑keputusan **final** yang masuk tabel Manajemen manapun:

- `APPROVED (1)` → tab Disetujui / Ditangguhkan / Baru Dihapus
- `REJECTED (-1)` → tab Ditolak

`WAITING (0)`, `REVISE (2)`, dan `PENDING_VOUCHER (3)` **disaring keluar** (masih milik alur Verifikasi Akun). Filter diterapkan di `loadUsers()` sebelum `mapToManajemen`.

---

## 3. Empat Tabel (Tab)

Tab dirender oleh `ManajemenControls` (segmented control, tanpa opsi "Semua"). Status kanonik tiap baris dihitung `parseManajemenStatus(u)` dengan prioritas: **penghapusan → penangguhan → hasil verifikasi**.

| Tab | Sumber status | Kolom |
|-----|---------------|-------|
| **Disetujui** | `APPROVED`, tanpa suspend/deletion | Full |
| **Ditolak** | `REJECTED` | Reduced |
| **Ditangguhkan** | `suspendedUntil`/`suspended` truthy | Full |
| **Baru Dihapus** | `deletionPending`/`deletionScheduledAt`/`deletedAt` truthy | Reduced |

**Kolom Full** (Disetujui, Ditangguhkan): Nama Pengguna, Email, Status Member, Langganan, Jenis Paket, Tgl Berakhir, Kode Voucher, Role, Riwayat Pelatihan, Tgl Lahir, Lokasi, Alumni Pelatihan (Nama / Daerah / Tanggal Mulai), Asal Sekolah, Last Updated, Action.

**Kolom Reduced** (Ditolak, Baru Dihapus): Full **tanpa** Langganan, Jenis Paket, Tgl Berakhir, Kode Voucher, Role (`isReducedView` di `ManajemenTable.jsx`).

---

## 4. Pemetaan Data — `mapToManajemen(u, regions, discourseGroups)`

Satu user API → satu baris tabel. Mapper bersifat **defensif** (membaca beberapa kemungkinan nama field).

| Kolom | Sumber | Catatan |
|-------|--------|---------|
| Status Member | `parseManajemenStatus(u)` | Badge warna per status |
| Langganan | `activeSubscription.status` → Active/Not Active/Expired | |
| Jenis Paket | `parsePlan(sub)` → **Tahunan / Bulanan / -** | dari `package.durationUnit`/`duration` |
| Tgl Berakhir | `sub.expiresAt`/`endDate`/`currentPeriodEnd`/… | |
| Kode Voucher | `activeVoucher.code`/`voucherCode` | |
| Role | `resolveRole(u, discourseGroups)` | embedded name → fallback resolve `discourseGroupId` |
| Riwayat Pelatihan | `trainingHistoriesCount`/`_count`/array | angka + "Lihat Detail" |
| Lokasi | `resolveRegionLabel(u.region)` | "Kabupaten, Provinsi" |
| Alumni Nama | `lastTrainingSession.name` | |
| Alumni Daerah | region `lastTrainingSession.region` | |
| Alumni Tgl Mulai | `lastTrainingSession.startDate` | |
| Last Updated | `fmtLastUpdated24h(u.updatedAt)` | **≤24 jam → jam ("9:20 AM"); >24 jam → tanggal ("28 Mei 2026")** |

> ⚠️ **Gap backend**: sebagian field di atas belum dipastikan di‑embed pada `GET /admin/users`. Lihat [Bagian 9](#9-ketergantungan--gap-backend).

---

## 5. Tabel — Perilaku UI (`ManajemenTable.jsx`)

- **Kolom Action beku di kanan** (`sticky right-0`) + checkbox & Nama beku di kiri (`sticky left`), mengikuti scroll horizontal.
- **Maksimal 8 baris** terlihat, sisanya di‑scroll vertikal; header `sticky top-0` (helper `getTableScrollProps()` / `tableScroll.js`).
- Kolom teks panjang (Lokasi, Alumni, Asal Sekolah) **wrap** (`whitespace-normal`).
- **Empty state pencarian**: ikon `SearchX` + `Tidak bisa menemukan "<query>"` + saran.

### Menu aksi baris — `RowActionMenu`

Di‑**portal** ke `document.body` dengan posisi `fixed` agar tidak terpotong container scroll; membuka ke atas bila mepet bawah viewport. Isi menu **per tab**:

| Tab | Menu |
|-----|------|
| Disetujui | Ubah Role · Tangguhkan Akun · Hapus Akun |
| Ditolak | Setujui Akun · Hapus Akun |
| Ditangguhkan | Pulihkan Akun · Hapus Akun |
| Baru Dihapus | Pulihkan Akun |

---

## 6. Aksi & Modal

Semua aksi memakai pola **optimistic update + toast undo 5 detik + commit tertunda** (`scheduleAction`): perubahan state langsung, commit API dijalankan setelah 5 dtk; menekan **Batalkan** pada toast membatalkan timer (`executeActionRef.current=false` / `clearTimeout`) sehingga API tidak jadi dipanggil.

| Aksi | Modal | Efek | Endpoint (commit) |
|------|-------|------|-------------------|
| Ubah Role | `UbahRoleModal` (`RoleSelect`) | ganti role | `updateDiscourseGroup(id, gid)` |
| Setujui Akun | `SetujuiAkunModal` (role + pelatihan + voucher) | → Disetujui | `verifyUser(id, {status:'approved', discourseGroupId, lastTrainingSessionId})` |
| Tangguhkan Akun | `SuspendModal` (Preset/Manual) | → Ditangguhkan | `suspendUser(id, suspendedUntil)` |
| Hapus Akun | `HapusAkunModal` | → Baru Dihapus | `requestUserDeletion(id)` |
| Pulihkan Akun | `PulihkanAkunModal` | → Disetujui | `cancelUserDeletion(id)` (dari Baru Dihapus) / `unsuspendUser(id)` (dari Ditangguhkan) |

### `SuspendModal` — durasi penangguhan

- **Preset**: 6 Jam, 12 Jam, 24 Jam, 3 Hari, 1 Minggu, 1 Bulan (offset dari sekarang).
- **Manual**: kalender (hari lampau di‑disable) + input jam.
- Menghasilkan `suspendedUntil` format `"YYYY-MM-DD HH:mm:ss"`, plus `reason` (dropdown) dan `emailMessage` (opsional).

---

## 7. Seleksi & Aksi Bulk

Mengikuti pola Verifikasi Akun. Infra generik: `selectedIds`, `toggleSelect`, `toggleSelectAll`, `selectableIds`, `allSelected`, `selectedUsers`.

**Aturan:**
- Batas **`BULK_LIMIT = 10`** akun sekaligus. Percobaan memilih ke‑11 diblokir + tooltip "Maksimal 10 akun dapat dipilih sekaligus" (dismissable).
- "Pilih semua" hanya mencentang **10 baris teratas**; bila data > 10 → tooltip flash.
- Saat ada seleksi, toolbar (tab/search/filter) diganti **action‑bar** (`selectedCount/limit` + clear + tombol aksi per tab).
- Ganti tab/status → seleksi **auto‑clear**.

**Aksi bulk per tab** (`handleManajemenBulk` → `runBulkStatus`, undo via `bulkStatusUndo`, commit `Promise.all`):

| Tab | Tombol |
|-----|--------|
| Disetujui | Tangguhkan · Hapus |
| Ditolak | Setujui · Hapus |
| Ditangguhkan | Pulihkan · Hapus |
| Baru Dihapus | Pulihkan |

Bulk **Tangguhkan** membuka satu `SuspendModal`; `suspendedUntil` yang sama diterapkan ke semua akun terpilih.

---

## 8. Filter & Pencarian

- **Filter drawer** (panel kanan, `ManajemenControls`): **Langganan** (Aktif/Non‑Aktif), **Jenis Paket** (Tahunan/Bulanan), **Role** (4 role + ikon). Badge jumlah filter aktif pada tombol filter; filter diterapkan langsung.
- **Pencarian collapsible** (`ExpandableSearch`): default tombol bulat → klik melebar jadi input (auto‑focus) → menciut saat blur & kosong.
- **Sort**: klik header (`applySortToList`); `lastUpdated` di‑sort pakai `lastUpdatedMs`.
- **Export**: CSV via `handleExport`/`buildCsvContent`.

---

## 9. Ketergantungan & Gap Backend

### Endpoint (`src/lib/api.js` → `adminApi`)

`getUsers`, `verifyUser`, `updateDiscourseGroup`, `requestUserDeletion`, `cancelUserDeletion`, `suspendUser`, `unsuspendUser`.

### Perlu dikonfirmasi / di‑embed pada `GET /admin/users`

Beberapa kolom bergantung field yang belum dipastikan tersedia (mapper defensif, jika kosong → `-`):

- `trainingHistoriesCount` (Riwayat Pelatihan)
- `lastTrainingSession.region{regionName,parent}` (Alumni Daerah)
- `region.parent` / `parentId` (bagian Provinsi pada Lokasi & Alumni Daerah)
- `activeSubscription{status, expiresAt, package{name,duration,durationUnit}}` (Langganan/Jenis Paket/Tgl Berakhir)
- `activeVoucher.code` (Kode Voucher)
- `discourseGroupId` (Role)
- `suspendedUntil`, `deletionPending`/`deletionScheduledAt` (routing tab Ditangguhkan & Baru Dihapus)

### Catatan implementasi tertunda

- `suspendUser` saat ini hanya mengirim `suspendedUntil`; `reason` & `emailMessage` dari modal **belum dikirim** (endpoint `/suspend` per koleksi Postman hanya menerima `suspendedUntil`).
- Kode voucher pada `SetujuiAkunModal` masih **placeholder FE** (auto‑generate), belum dipersistensi backend.
- `RoleSelect` (Verifikasi) & `UbahRoleModal` (Manajemen) memakai gaya dropdown yang sama; daftar role dari `getRoleOptions(discourseGroups)` dengan pencocokan nama **ternormalisasi** (toleran casing/underscore) — jika hanya 1 role muncul, kemungkinan besar `GET /discourse/groups` memang hanya mengembalikan 1 grup.

---

## 10. Peta File

| File | Peran |
|------|-------|
| `pages/AdminDashboardPage.jsx` | Orkestrasi state, handler aksi (single/bulk), render tab |
| `pages/admin/ManajemenTable.jsx` | Tabel + kolom per tab + `RowActionMenu` + seleksi |
| `pages/admin/TableControls.jsx` | `ManajemenControls` (tab, filter drawer, action‑bar bulk, `ExpandableSearch`) |
| `pages/admin/mappers.js` | `mapToManajemen`, `parseManajemenStatus`, `isManajemenEligible`, `VERIFIED_STATUS` |
| `pages/admin/UbahRoleModal.jsx` | Modal ubah role |
| `pages/admin/AccountActionModals.jsx` | `HapusAkunModal`, `PulihkanAkunModal` (+ `ConfirmActionModal`) |
| `pages/admin/SuspendModal.jsx` | Tangguhkan (preset/manual) |
| `pages/admin/SetujuiAkunModal.jsx` | Setujui dari tab Ditolak |
| `pages/admin/RoleSelect.jsx` | Dropdown role bergaya (ikon + checkmark), shared |
| `pages/admin/roleOptions.js` | `getRoleOptions`, `resolveRoleValue`, `ALLOWED_ROLES` |
| `pages/admin/tableScroll.js` | `getTableScrollProps()` (batas 8 baris + sticky header) |
