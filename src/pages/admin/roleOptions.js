// Opsi Role (discourse group) untuk dropdown verifikasi akun.
// Dipakai bareng oleh VerifikasiTable, ApproveModal, dan BulkApproveModal
// supaya aturan filter role tidak diduplikasi di banyak tempat.

// Hanya role ini yang boleh dipilih admin saat approve.
export const ALLOWED_ROLES = ['Trainer Utama', 'Trainer Kelas', 'Guru', 'Trainer Aula']

// Normalisasi nama grup agar toleran casing/underscore/spasi ("trainer_utama",
// "Trainer  Utama", "TRAINER-UTAMA" → "trainer utama").
const norm = (s) => String(s || '').toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim()
const CANON = ALLOWED_ROLES.reduce((m, r) => { m[norm(r)] = r; return m }, {})

// discourseGroups (array of {id,name,...} atau string) → [{ value, label }].
// value = id grup (string), label = nama role kanonik. Match toleran +
// baca beberapa kemungkinan field nama (Discourse pakai slug `name` + `full_name`).
export function getRoleOptions(discourseGroups = []) {
  return discourseGroups
    .map((g, idx) => {
      const isStr = typeof g === 'string'
      const rawLabel = isStr ? g : (g.name || g.full_name || g.fullName || g.displayName || g.title || g.groupName || '')
      const value = isStr ? g : (g.id ?? g.groupId ?? idx)
      const canonical = CANON[norm(rawLabel)]
      return { value: String(value), label: canonical || rawLabel, canonical }
    })
    .filter((o) => o.canonical) // hanya 4 role sah yang lolos
}

// Cocokkan nilai role user (bisa berupa id ATAU nama) ke value opsi yang valid.
// mappers.js mengisi user.role dari nama grup, jadi prefill perlu toleran dua bentuk.
export function resolveRoleValue(discourseGroups, role) {
  if (!role) return ''
  const opts = getRoleOptions(discourseGroups)
  const byValue = opts.find((o) => String(o.value) === String(role))
  if (byValue) return byValue.value
  const byLabel = opts.find((o) => o.label === role)
  return byLabel ? byLabel.value : ''
}
