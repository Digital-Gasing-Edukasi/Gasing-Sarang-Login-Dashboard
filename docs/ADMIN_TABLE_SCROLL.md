# Aturan Scroll Tabel Admin — `getTableScrollProps`

> Sumber kebenaran tunggal untuk **ukuran & perilaku scroll** semua tabel di dashboard admin. Pendamping [`ARCHITECTURE.md` §8](../ARCHITECTURE.md#8-dashboard-admin--arsitektur-internal).

**Lokasi:** [`src/pages/admin/tableScroll.js`](../src/pages/admin/tableScroll.js)

---

## 1. Tujuan

Semua tabel admin memakai aturan tampilan yang sama: **hanya menampilkan sejumlah baris tetap (default header + 12 baris), sisanya di-scroll di dalam tabel** — bukan mendorong seluruh halaman memanjang. Header tabel **menempel (sticky)** di atas saat body di-scroll.

Daripada menulis ulang `maxHeight` + konstanta tinggi di tiap komponen tabel, semua memanggil **satu fungsi** `getTableScrollProps()`. Ubah angka di satu tempat → berlaku ke semua tabel sekaligus.

---

## 2. API

```js
import { getTableScrollProps } from './tableScroll'
```

### Konstanta (bisa di-override per panggilan)

| Konstanta | Default | Arti |
| --------- | ------- | ---- |
| `TABLE_HEADER_H` | `56` | tinggi header tabel (px) |
| `TABLE_ROW_H` | `69` | tinggi rata-rata 1 baris (px) |
| `TABLE_MAX_ROWS` | `12` | jumlah baris terlihat sebelum scroll |

### `getTableScrollProps(options?)`

Mengembalikan props untuk `<div>` pembungkus `<table>`.

**Parameter (opsional):**

```js
getTableScrollProps({ maxRows, headerH, rowH })
```

Semua opsional; default-nya konstanta di atas. Berguna kalau satu tabel butuh jumlah baris berbeda (mis. `getTableScrollProps({ maxRows: 8 })`).

**Return:**

```js
{
  className: 'overflow-auto',
  style: { maxHeight: headerH + rowH * maxRows }, // default: 56 + 69*12 = 884px
}
```

`maxHeight` = tinggi header + (tinggi baris × jumlah baris). `overflow-auto` membuat kelebihan baris (dan lebar) di-scroll di dalam `<div>` ini.

---

## 3. Cara pakai

Bungkus `<table>` dengan `<div {...getTableScrollProps()}>`, lalu buat `<thead>` **sticky**:

```jsx
import { getTableScrollProps } from './tableScroll'

return (
  <div {...getTableScrollProps()}>
    <table className="w-full text-left text-sm whitespace-nowrap">
      <thead className="bg-[#0A1128] text-white sticky top-0 z-20">
        {/* ... */}
      </thead>
      <tbody>{/* ... */}</tbody>
    </table>
  </div>
)
```

### Wajib: `sticky top-0` di `<thead>`

`getTableScrollProps` cuma mengatur tinggi & scroll container. Agar header tetap terlihat saat body di-scroll, `<thead>` **harus** diberi `sticky top-0 z-20`. Tanpa ini, header ikut ter-scroll.

### Tabel dengan kolom kiri sticky (freeze column)

Untuk tabel yang punya kolom kiri yang menempel (checkbox + Nama Pengguna di Verifikasi & Pending Voucher), susunan `z-index`:

| Elemen | `z-index` | Alasan |
| ------ | --------- | ------ |
| `<thead>` | `z-20` | header di atas body |
| `<th>` sticky-left (header) | `z-30` | pojok kiri-atas menang atas header biasa & kolom kiri body |
| `<td>` sticky-left (body) | `z-10` | kolom kiri di atas body biasa, di bawah header |

---

## 4. Tabel yang memakainya

| Komponen | Kolom kiri sticky? |
| -------- | ------------------ |
| [`ManajemenTable`](../src/pages/admin/ManajemenTable.jsx) | ya |
| [`VerifikasiTable`](../src/pages/admin/VerifikasiTable.jsx) | ya |
| [`PendingVoucherTable`](../src/pages/admin/PendingVoucherTable.jsx) | ya |
| [`RiwayatPelatihanTable`](../src/pages/admin/RiwayatPelatihanTable.jsx) | tidak |
| [`PendaftaranTrainerTable`](../src/pages/admin/PendaftaranTrainerTable.jsx) | tidak |

---

## 5. Catatan & batasan

- **`ROW_H` bersifat perkiraan.** `maxHeight` dihitung dari tinggi baris rata-rata (69px). Baris yang lebih pendek/tinggi (mis. teks membungkus 2 baris) membuat jumlah baris terlihat sedikit meleset dari `TABLE_MAX_ROWS`. Ini disengaja — cukup "kira-kira N baris", bukan pixel-perfect.
- **Pembungkus ganda.** `AdminDashboardPage` sudah membungkus area tabel dengan `border … rounded-2xl overflow-hidden` + `overflow-x-auto`. Wrapper dari `getTableScrollProps` (`overflow-auto`) berada di dalamnya dan yang benar-benar menangani scroll vertikal + sticky. Wrapper luar aman/berdampingan.
- **Ubah tinggi/jumlah baris** cukup di [`tableScroll.js`](../src/pages/admin/tableScroll.js) — jangan hardcode `maxHeight` di komponen tabel lagi.

---

© 2026 Gasing Circle. Dokumen internal — pendamping [`ARCHITECTURE.md`](../ARCHITECTURE.md).
