// Helpers Pendaftaran Trainer (sumber: app-config hero_banner-home-v2).
// Murni (tanpa React), dipindah verbatim dari AdminDashboardPage.jsx.
import { computeIsNew } from './mappers'

// ─── Pendaftaran Trainer (app-config hero_banner-home-v2) ───────────────────────
export const PENDAFTARAN_KEY = 'hero_banner-home-v2'
export const HEADER_BASE = 'Apa kamu mau daftar menjadi Trainer di pelatihan Gasing tanggal '
export const DEFAULT_SHARED = {
  modalBody: 'Tim Gasing akan menghubungi members yang terpilih menjadi Trainer untuk pengimbasan, berikut informasi lainnya. Pastikan nomor HP kamu aktif ya!',
  modalTitle: 'Yuk, daftar jadi Trainer pengimbasan Gasing!',
  modalSuccess: 'Terima kasih sudah mendaftar sebagai Trainer!',
}

// Batas waktu pendaftaran sudah lewat? String kosong / tanggal invalid = belum lewat
// (jangan auto-matikan baris yang datanya memang tidak punya batas waktu).
export function isPastDeadline(batasWaktu) {
  if (!batasWaktu) return false
  const t = new Date(batasWaktu).getTime()
  if (isNaN(t)) return false
  return t <= Date.now()
}

// Matikan semua baris aktif yang batas waktunya sudah lewat.
// Balikin { rows, changed } supaya caller tahu perlu persist atau tidak.
export function autoOffExpired(rows) {
  let changed = false
  const next = rows.map(r => {
    if (r.isActive && isPastDeadline(r.batasWaktu)) {
      changed = true
      return { ...r, isActive: false }
    }
    return r
  })
  return { rows: changed ? next : rows, changed }
}

// Ambil id topik dari URL Discourse (mis .../t/slug/143 atau .../t/slug/143/5 → 143).
export function parseThreadId(url) {
  if (!url) return null
  const s = String(url)
  const m = s.match(/\/t\/[^/]+\/(\d+)/)
  if (m) return m[1]
  const nums = s.match(/\d+/g)
  return nums ? nums[nums.length - 1] : null
}

// value.threads (object) → array baris untuk table.
export function threadsToRows(value) {
  const threads = value?.threads || {}
  return Object.entries(threads).map(([id, t]) => ({
    id,
    threadId: id,
    nama: t.namaPelatihan || '-',
    url: t.url || '',
    periode: t.periode || '-',
    batasWaktu: t.batasWaktu || '',
    isActive: !!t.enabled,
    headerText: t.headerText || '',
    createdAt: t.createdAt || null,
    isNew: computeIsNew(t.createdAt),
  }))
}

// array baris → value untuk PUT (pertahankan shared_content).
export function rowsToValue(rows, sharedContent) {
  const threads = {}
  rows.forEach(r => {
    threads[r.threadId] = {
      enabled: r.isActive,
      headerText: r.headerText,
      namaPelatihan: r.nama,
      periode: r.periode,
      batasWaktu: r.batasWaktu,
      url: r.url,
      createdAt: r.createdAt || null,
    }
  })
  return { threads, shared_content: sharedContent || DEFAULT_SHARED }
}
