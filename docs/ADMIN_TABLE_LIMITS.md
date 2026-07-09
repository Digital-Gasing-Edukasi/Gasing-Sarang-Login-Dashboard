# Admin Dashboard — Table Limits & Bulk Action

Panduan mengubah **jumlah data yang ditampilkan** di tabel admin dan **jumlah data yang bisa di-bulk action** (approve/reject/konfirmasi/tangguhkan sekaligus).

Berlaku untuk semua tabel di [`AdminDashboardPage.jsx`](../src/pages/AdminDashboardPage.jsx): Verifikasi (Pending & Pending Voucher), Manajemen Akun, dll.

---

## 1. Jumlah data yang ditampilkan di tabel

Tabel **tidak** memakai pagination di sisi klien — semua baris hasil `fetch` langsung dirender (dengan filter search/role/status di atasnya). Jadi jumlah baris maksimum = nilai `limit` saat memanggil API.

### Ubah global (semua pemanggil `getUsers`)

**File:** [`src/lib/api.js`](../src/lib/api.js) — fungsi `getUsers`

```js
getUsers: (params = {}) => {
  const q = buildQuery({ page: 1, limit: 100, ...params }); // ← ubah angka 100
  return request(`/admin/users${q ? "?" + q : ""}`);
},
```

Ganti `100` menjadi nilai yang diinginkan. Perubahan ini berlaku untuk **semua** tab yang memakai `getUsers` (Verifikasi + Manajemen).

### Ubah per-tab (tanpa mengganggu tab lain)

Kirim `limit` sebagai argumen di titik pemanggilan pada [`AdminDashboardPage.jsx`](../src/pages/AdminDashboardPage.jsx):

```js
// Tab Verifikasi (± baris 199)
const res = await adminApi.getUsers({ 'filter[verifiedStatus]': 'waiting', limit: 50 })

// Tab Manajemen (± baris 206)
const res = await adminApi.getUsers({})            // sebelum
const res = await adminApi.getUsers({ limit: 50 }) // sesudah
```

Argumen di call-site menimpa default `limit` karena spread `...params` ada di urutan terakhir pada `buildQuery`.

> **Catatan:** `getSessionParticipants` memakai fungsi & `limit` terpisah (default `20`) — tidak terpengaruh perubahan di atas.

---

## 2. Jumlah data yang bisa di-bulk action

Dibatasi satu konstanta: `BULK_LIMIT`.

**File:** [`AdminDashboardPage.jsx`](../src/pages/AdminDashboardPage.jsx) (± baris 160)

```js
const BULK_LIMIT = 100 // hard limit jumlah akun yang bisa diproses sekaligus
```

Ganti angka `100`. Satu konstanta ini otomatis dipakai di seluruh alur bulk:

| Perilaku | Lokasi | Keterangan |
| --- | --- | --- |
| "Pilih semua" | `sortedUsers.slice(0, BULK_LIMIT)` (± baris 875) | Checkbox header hanya memilih maksimal `BULK_LIMIT` baris teratas |
| Tambah pilih manual | guard di `toggleSelect` (± baris 348) | Melebihi limit → memanggil `flashLimit()` (feedback visual), pilihan tidak bertambah |
| Label kontrol | prop `bulkLimit={BULK_LIMIT}` (± baris 965 dst) | Angka limit yang ditampilkan di bar kontrol bulk tiap tab |

---

## Hubungan kedua limit

Bulk action **tidak bisa** melampaui data yang sudah di-fetch (poin #1).

Contoh: `BULK_LIMIT = 200` tetapi fetch `limit = 100` → "Pilih semua" tetap mentok di 100 baris, karena hanya 100 baris yang ada di memori.

**Aturan aman:** `BULK_LIMIT ≤ limit fetch`. Kalau butuh bulk lebih banyak, naikkan dulu `limit` fetch di poin #1.

---

## Ringkasan

| Yang diubah | File | Baris | Konstanta/nilai |
| --- | --- | --- | --- |
| Jumlah baris ditampilkan | `src/lib/api.js` | ~444 | `limit: 100` di `getUsers` |
| Jumlah baris ditampilkan (per-tab) | `src/pages/AdminDashboardPage.jsx` | ~199 / ~206 | argumen `{ limit: N }` |
| Jumlah bulk action | `src/pages/AdminDashboardPage.jsx` | ~160 | `BULK_LIMIT` |
