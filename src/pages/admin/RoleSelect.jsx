import { useState, useRef, useEffect } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ROLE_META } from './roleOptions'

// Dropdown role bergaya (ikon berwarna per role) — dipakai di Verifikasi (ApproveModal)
// & bisa dipakai ulang. options = [{ value, label }]; value dikirim balik apa adanya
// (di Verifikasi = discourseGroupId, jadi payload tetap kirim id).
export function RoleSelect({ value, onChange, options = [], placeholder = 'Pilih Role', className }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const current = options.find(o => String(o.value) === String(value))
  const curMeta = current ? ROLE_META[current.label] : null

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
          !current && 'text-gray-400'
        )}
        style={curMeta ? { color: curMeta.color } : undefined}
      >
        <span className="flex items-center gap-2">
          {curMeta && <curMeta.Icon size={16} />}
          {current ? current.label : placeholder}
        </span>
        <ChevronDown size={16} className={cn('transition-transform text-gray-400', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-gray-100 rounded-xl shadow-lg py-1.5 z-30 max-h-60 overflow-auto">
          {options.length === 0 && <div className="px-4 py-2 text-sm text-gray-400">Tidak ada role</div>}
          {options.map(o => {
            const meta = ROLE_META[o.label]
            const selected = String(o.value) === String(value)
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => { onChange(String(o.value)); setOpen(false) }}
                className={cn(
                  'w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-blue-50 active:bg-blue-100',
                  selected && 'bg-blue-50'
                )}
                style={meta ? { color: meta.color } : undefined}
              >
                {meta && <meta.Icon size={16} />}
                <span className="flex-1 text-left">{o.label}</span>
                {selected && <Check size={16} strokeWidth={3} className="shrink-0" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
