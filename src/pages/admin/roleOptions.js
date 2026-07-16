// Opsi Role (discourse group) untuk dropdown verifikasi akun.
// Dipakai bareng oleh VerifikasiTable, ApproveModal, dan BulkApproveModal
// supaya aturan filter role tidak diduplikasi di banyak tempat.

import { Sparkles, Building2, Presentation, BookOpen } from 'lucide-react'

// Hanya role ini yang boleh dipilih admin saat approve.
export const ALLOWED_ROLES = ['Trainer Utama', 'Trainer Kelas', 'Guru', 'Trainer Aula']

// Ikon + warna per role kanonik — SATU sumber untuk semua tampilan role
// (dropdown, filter drawer, kolom tabel). Lihat RoleTag.jsx & RoleSelect.jsx.
export const ROLE_META = {
  'Trainer Utama': { Icon: Sparkles,     color: '#2563EB' }, // biru
  'Trainer Aula':  { Icon: Building2,    color: '#16A34A' }, // hijau
  'Trainer Kelas': { Icon: Presentation, color: '#F97316' }, // oranye
  'Guru':          { Icon: BookOpen,     color: '#7C3AED' }, // ungu
}

// Normalisasi nama grup agar toleran casing/underscore/spasi/camelCase
// ("trainer_utama", "TRAINER-UTAMA", "TrainerUtama" → "trainer utama").
// Pecah camelCase harus sebelum lowercase, selagi batas hurufnya masih terlihat.
const norm = (s) =>
  String(s || '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const CANON = ALLOWED_ROLES.reduce((m, r) => { m[norm(r)] = r; return m }, {})

// Discourse memberi dua nama: `name` adalah slug tanpa spasi ("TrainerUtama"),
// `full_name`/`title` adalah label manusia ("Trainer Utama"). Coba yang paling
// deskriptif dulu — `name` terakhir, karena dia selalu terisi tapi paling kotor.
const NAME_FIELDS = ['full_name', 'fullName', 'title', 'displayName', 'groupName', 'name']

// Grup (objek atau string) → nama role kanonik, atau null kalau bukan role sah.
export function canonicalRole(group) {
  if (!group) return null
  if (typeof group === 'string') return CANON[norm(group)] || null
  for (const field of NAME_FIELDS) {
    const canonical = CANON[norm(group[field])]
    if (canonical) return canonical
  }
  return null
}

// discourseGroups (array of {id,name,...} atau string) → [{ value, label }].
// value = id grup (string), label = nama role kanonik.
export function getRoleOptions(discourseGroups = []) {
  return discourseGroups
    .map((g, idx) => {
      const isStr = typeof g === 'string'
      const value = isStr ? g : (g.id ?? g.groupId ?? idx)
      const canonical = canonicalRole(g)
      return { value: String(value), label: canonical, canonical }
    })
    .filter((o) => o.canonical) // hanya role sah yang lolos ("subscriber" dibuang)
}

// Cocokkan nilai role user (bisa berupa id ATAU nama) ke value opsi yang valid.
// mappers.js mengisi user.role dari nama grup, jadi prefill perlu toleran dua
// bentuk — termasuk slug mentah seperti "TrainerUtama".
export function resolveRoleValue(discourseGroups, role) {
  if (!role) return ''
  const opts = getRoleOptions(discourseGroups)
  const byValue = opts.find((o) => String(o.value) === String(role))
  if (byValue) return byValue.value
  const wanted = canonicalRole(role)
  const byLabel = wanted && opts.find((o) => o.label === wanted)
  return byLabel ? byLabel.value : ''
}
