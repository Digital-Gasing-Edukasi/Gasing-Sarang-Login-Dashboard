// Satu sumber ukuran & perilaku scroll untuk SEMUA tabel admin.
// Aturan (samakan dengan Manajemen Akun): header + 8 baris terlihat, sisanya di-scroll.
// Pakai bareng <thead className="... sticky top-0 z-20"> agar header tetap menempel
// saat body di-scroll. Ubah angka di sini = berlaku ke semua tabel sekaligus.
export const TABLE_HEADER_H = 56 // tinggi header (px)
export const TABLE_ROW_H    = 69 // tinggi rata-rata 1 baris (px)
export const TABLE_MAX_ROWS = 11  // baris terlihat sebelum scroll

// Props untuk <div> pembungkus <table>: { className, style }.
// Contoh: <div {...getTableScrollProps()}><table>…</table></div>
export function getTableScrollProps({
  maxRows = TABLE_MAX_ROWS,
  headerH = TABLE_HEADER_H,
  rowH = TABLE_ROW_H,
} = {}) {
  return {
    className: 'overflow-auto',
    style: { maxHeight: headerH + rowH * maxRows },
  }
}
