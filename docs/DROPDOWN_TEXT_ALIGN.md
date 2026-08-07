# Dropdown — Perbaikan Teks Value Ke-indent (`text-align`)

> Dokumen ini menjelaskan bug **teks value dropdown yang bergeser ke kanan saat dipilih** (hanya di desktop) dan perbaikannya. Terkait komponen dropdown lihat [`PILL_SHAPE_INPUTS.md`](PILL_SHAPE_INPUTS.md), untuk versi mobile lihat [`MOBILE_RESPONSIVE.md`](MOBILE_RESPONSIVE.md).

**Status:** Selesai (per 2026-07-21). Fix 1 baris di komponen dasar `select.jsx`. Berlaku desktop & mobile.

---

## 1. Gejala

Di **Sign Up langkah 2** (dan setiap `<Select>` yang dipakai dalam panel ber-`text-center`):

- Saat dropdown masih placeholder → teks rata kiri normal.
- Setelah **memilih value dari dropdown** → huruf pertama value **ke-indent ke kanan** (jarak dari tepi kiri bertambah).
- Makin **panjang** teks value, makin besar geserannya.
- Hanya muncul di **desktop**. Di **mobile tidak** muncul.

| Value | Geseran glyph vs tepi span (sebelum fix) |
| ----- | ---------------------------------------- |
| `Daerah Istimewa Yogyakarta` | +15px |
| `Kabupaten Gunungkidul` | +29px |
| `2026` / `April` (pendek) | 0 |

---

## 2. Akar masalah

Rantai penyebabnya tiga lapis:

1. **Panel auth center-aligned.** Container form (`RightPanel` / step 2) memusatkan konten (judul "Data Pribadi", dll), sehingga `text-align: center` **diwariskan** turun ke trigger `<Select>`.
2. **Value desktop pakai `line-clamp-1`.** Di cabang desktop, `<SelectValue>` render lewat Radix dengan class `[&>span]:line-clamp-1` → span menjadi berbasis `-webkit-box`. Elemen berbasis teks ini **menghormati `text-align`**, jadi value ikut ter-center → tergeser.
3. **Trigger tidak meng-override alignment.** `TRIGGER_CLS` tidak menyetel `text-align`, jadi nilai warisan `center` menang.

**Kenapa mobile aman:** cabang mobile me-render value pakai `<span className="line-clamp-1 text-left">` — sudah eksplisit `text-left`, jadi tidak terpengaruh warisan center. Ini yang bikin "mobile tidak, desktop iya".

---

## 3. Perbaikan

Tambah `text-left` ke `TRIGGER_CLS` supaya trigger **selalu** rata kiri, apa pun konteks `text-align` leluhurnya.

| # | File | Lokasi | Perubahan |
| - | ---- | ------ | --------- |
| 1 | [`src/components/ui/select.jsx`](../src/components/ui/select.jsx) | `TRIGGER_CLS` | tambah `text-left` pada base class trigger |

```diff
 const TRIGGER_CLS = cn(
-  "flex h-11 w-full items-center justify-between rounded-full border border-input bg-background px-4 py-2 text-sm",
+  "flex h-11 w-full items-center justify-between rounded-full border border-input bg-background px-4 py-2 text-sm text-left",
   ...
 )
```

Karena diubah di **komponen dasar**, otomatis berlaku untuk semua `<Select>` di seluruh aplikasi (desktop popper + mobile bottom-sheet), bukan per-halaman.

**Verifikasi:** setelah fix, `glyphLeft == spanLeft` untuk semua value (offset 0), diukur via `Range.getBoundingClientRect()` di viewport desktop 1280px.

---

## 4. Cakupan & komponen dropdown lain

Semua `<Select>` mengimpor dari satu file `ui/select.jsx`, jadi fix ini menutup **semua** dropdown berbasis `<Select>`.

Dropdown **custom** lain tidak terpengaruh bug ini dan **tidak perlu** diubah:

| Komponen | Kenapa kebal |
| -------- | ------------ |
| [`RoleSelect.jsx`](../src/pages/admin/RoleSelect.jsx) | Value pakai `<span className="flex items-center">` (flex), bukan `line-clamp`/`-webkit-box`. `text-align` tidak mempengaruhi posisi flex item. Plus konteks Admin rata kiri. |
| Filter/aksi di `TableControls.jsx`, dll | Tombol berbasis flex + berada di halaman Admin yang left-aligned. |

**Aturan umum:** hanya trigger yang menampilkan value berbasis **teks + `line-clamp`/`-webkit-box`** yang rentan terhadap warisan `text-align`. Trigger berbasis **flex** aman.

---

## 5. Catatan / regresi ke depan

- Jangan hapus `text-left` dari `TRIGGER_CLS`; ia yang mengunci alignment terlepas dari container.
- Jika membuat dropdown custom baru yang value-nya berbasis teks + `line-clamp`, sertakan `text-left` eksplisit — jangan mengandalkan warisan.
- Jika suatu trigger memang perlu rata tengah, override eksplisit dengan `text-center` di instance tersebut.
