// Opsi Role (discourse group) untuk dropdown verifikasi akun.
// Dipakai bareng oleh VerifikasiTable, ApproveModal, dan BulkApproveModal
// supaya aturan filter role tidak diduplikasi di banyak tempat.

// Hanya role ini yang boleh dipilih admin saat approve.
export const ALLOWED_ROLES = ['Trainer Utama', 'Trainer Kelas', 'Guru', 'Trainer Aula']

// discourseGroups (array of {id,name} atau string) → [{ value, label }].
// value = id grup (string), label = nama role.
export function getRoleOptions(discourseGroups = []) {
  return discourseGroups
    .map((g, idx) => {
      const isStr = typeof g === 'string'
      const label = isStr ? g : (g.name || g.title || g.groupName || '')
      const value = isStr ? g : (g.id || g.groupId || idx)
      return { value: String(value), label }
    })
    .filter((o) => ALLOWED_ROLES.includes(o.label))
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
