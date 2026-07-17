import { cn } from '@/lib/utils'
import { canonicalRole, ROLE_META } from './roleOptions'

// Tampilan role standar: ikon berwarna + label warna sama (sesuai referensi).
// Toleran bentuk role mentah (slug/underscore) via canonicalRole.
export function RoleTag({ role, size = 16, className, onClick }) {
  const canon = canonicalRole(role)
  const meta = canon ? ROLE_META[canon] : null
  const label = canon || role
  if (!meta) return <span className={className} onClick={onClick}>{label}</span>
  const { Icon, color } = meta
  return (
    <span
      className={cn('inline-flex items-center gap-2 font-medium', className)}
      style={{ color }}
      onClick={onClick}
    >
      <Icon size={size} />
      {label}
    </span>
  )
}
