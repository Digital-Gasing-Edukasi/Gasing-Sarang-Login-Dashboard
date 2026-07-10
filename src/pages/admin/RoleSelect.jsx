import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check, Link2, Users, MonitorPlay, GraduationCap } from 'lucide-react'
import { cn } from '@/lib/utils'

// Ikon per role kanonik (sama dgn UbahRoleModal Manajemen).
const ICON_BY_LABEL = {
  'Trainer Utama': Link2,
  'Trainer Aula':  Users,
  'Trainer Kelas': MonitorPlay,
  'Guru':          GraduationCap,
}

// Dropdown role bergaya (ikon + checkmark) — dipakai di Verifikasi (ApproveModal)
// & bisa dipakai ulang. options = [{ value, label }]; value dikirim balik apa adanya
// (di Verifikasi = discourseGroupId, jadi payload tetap kirim id).
export function RoleSelect({ value, onChange, options = [], placeholder = 'Pilih Role', className }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const current = options.find(o => String(o.value) === String(value))
  const CurIcon = current ? ICON_BY_LABEL[current.label] : null

  useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  return (
    <div className={cn('relative', className)} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={cn(
          'flex items-center justify-between gap-3 w-full px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors',
          open ? 'border-blue-500 ring-2 ring-blue-500/15' : 'border-gray-200 hover:border-gray-300',
          current ? 'text-blue-600' : 'text-gray-400'
        )}
      >
        <span className="flex items-center gap-2">
          {CurIcon && <CurIcon size={16} className="text-blue-500" />}
          {current ? current.label : placeholder}
        </span>
        <ChevronDown size={16} className={cn('transition-transform text-gray-400', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-gray-100 rounded-xl shadow-lg py-1.5 z-30 max-h-60 overflow-auto">
          {options.length === 0 && <div className="px-4 py-2 text-sm text-gray-400">Tidak ada role</div>}
          {options.map(o => {
            const Icon = ICON_BY_LABEL[o.label]
            const selected = String(o.value) === String(value)
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => { onChange(String(o.value)); setOpen(false) }}
                className={cn(
                  'w-full flex items-center justify-between gap-2 px-4 py-2 text-sm transition-colors',
                  selected ? 'text-blue-600 font-medium' : 'text-[#0A1128] hover:bg-gray-50'
                )}
              >
                <span className="flex items-center gap-2">
                  {Icon && <Icon size={16} className={selected ? 'text-blue-500' : 'text-gray-400'} />}
                  {o.label}
                </span>
                {selected && <Check size={15} className="text-blue-500" strokeWidth={3} />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
