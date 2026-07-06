import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check, Link2, Users, MonitorPlay, GraduationCap } from 'lucide-react'
import { cn } from '@/lib/utils'

// Role + ikon (urutan sesuai desain "Komponen"). Ikon lucide mendekati referensi.
export const ROLE_META = [
  { label: 'Trainer Utama', Icon: Link2 },
  { label: 'Trainer Aula',  Icon: Users },
  { label: 'Trainer Kelas', Icon: MonitorPlay },
  { label: 'Guru',          Icon: GraduationCap },
]

function RoleSelect({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const current = ROLE_META.find(r => r.label === value)

  useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={cn(
          'flex items-center justify-between gap-3 min-w-[190px] px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors',
          open ? 'border-blue-500 ring-2 ring-blue-500/15' : 'border-gray-200 hover:border-gray-300',
          current ? 'text-blue-600' : 'text-gray-400'
        )}
      >
        <span className="flex items-center gap-2">
          {current ? <current.Icon size={16} className="text-blue-500" /> : null}
          {current ? current.label : 'Pilih Role'}
        </span>
        <ChevronDown size={16} className={cn('transition-transform text-gray-400', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-full min-w-[190px] bg-white border border-gray-100 rounded-xl shadow-lg py-1.5 z-20">
          {ROLE_META.map(({ label, Icon }) => {
            const selected = label === value
            return (
              <button
                key={label}
                type="button"
                onClick={() => { onChange(label); setOpen(false) }}
                className={cn(
                  'w-full flex items-center justify-between gap-2 px-4 py-2 text-sm transition-colors',
                  selected ? 'text-blue-600 font-medium' : 'text-[#0A1128] hover:bg-gray-50'
                )}
              >
                <span className="flex items-center gap-2">
                  <Icon size={16} className={selected ? 'text-blue-500' : 'text-gray-400'} />
                  {label}
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

export function UbahRoleModal({ user, onConfirm, onCancel }) {
  const [selectedRole, setSelectedRole] = useState(user?.role || '')

  useEffect(() => { setSelectedRole(user?.role || '') }, [user])

  if (!user) return null

  const changed = !!selectedRole && selectedRole !== (user.role || '')

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-[24px] p-7 w-full max-w-[420px] shadow-2xl mx-4 overflow-visible">
        <h3 className="text-xl font-bold text-[#0A1128] mb-6">Ubah Role?</h3>

        <div className="flex items-center justify-between gap-4 mb-8">
          <span className="font-semibold text-[#0A1128]">{user.name}</span>
          <RoleSelect value={selectedRole} onChange={setSelectedRole} />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="flex-1 font-semibold text-[#0A1128] border border-gray-200 bg-white hover:bg-gray-50 px-6 py-3 rounded-full transition-colors"
          >
            Batalkan
          </button>
          <button
            disabled={!changed}
            onClick={() => onConfirm(selectedRole)}
            className="flex-1 font-semibold px-6 py-3 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Simpan
          </button>
        </div>
      </div>
    </div>
  )
}
