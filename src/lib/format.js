// src/lib/format.js
// Util format bersama — sebelumnya di-copy di banyak file (Rupiah, nama paket,
// jam AM/PM, nama bulan, prefix BASE_URL, download CSV). Satu sumber kebenaran.

// Nama bulan Indonesia (index 0 = Januari).
export const ID_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

// Angka → "500.000" (tanpa prefix "Rp"). Non-valid → "0".
export function formatRp(n) {
  return new Intl.NumberFormat('id-ID').format(Number(n) || 0)
}

// Nominal → "Rp 500.000". Angka non-valid / kosong → "-".
export function fmtRupiah(raw) {
  const n = Number(raw)
  if (!raw || isNaN(n)) return '-'
  return 'Rp ' + n.toLocaleString('id-ID')
}

// Nama paket bahasa Inggris backend → Indonesia.
// "Yearly"/"Annual"/"Annually" → "Tahunan", "Monthly" → "Bulanan". Lainnya apa adanya.
export function localizePlanName(name) {
  const n = String(name || '').trim()
  if (/^(yearly|annual|annually)$/i.test(n)) return 'Tahunan'
  if (/^monthly$/i.test(n)) return 'Bulanan'
  return n
}

// Date → "9:20 AM" (jam 12-an + AM/PM, menit 2-digit).
export function fmtTimeAmPm(date) {
  const d = date instanceof Date ? date : new Date(date)
  let h = d.getHours()
  const ampm = h >= 12 ? 'PM' : 'AM'
  h = h % 12 || 12
  return `${h}:${String(d.getMinutes()).padStart(2, '0')} ${ampm}`
}

// Prepend BASE_URL ke path absolut. base '/' → tanpa prefix (hindari "//path").
export function withBase(path) {
  const base = import.meta.env.BASE_URL
  return (base === '/' ? '' : base) + path
}

// Unduh string sebagai file CSV. Bikin <a> sementara lalu bersihkan object URL
// (dulu tersebar & tidak pernah revokeObjectURL → memory leak tiap export).
export function downloadCsv(filename, content) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
