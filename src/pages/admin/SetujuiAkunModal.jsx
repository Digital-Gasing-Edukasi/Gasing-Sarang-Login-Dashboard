import { useState, useEffect } from 'react'
import { ChevronDown, Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getRoleOptions, resolveRoleValue } from './roleOptions'

// Kode voucher placeholder FE (auto saat approve). TODO(be): dari backend.
function genVoucher() {
  return 'SUB' + Math.random().toString(36).slice(2, 8).toUpperCase()
}

function Select({ label, value, onChange, options, placeholder }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-[#0A1128] mb-1.5">{label}</label>
      <div className="relative">
        <select
          value={value} onChange={e => onChange(e.target.value)}
          className={cn('w-full appearance-none border border-gray-200 rounded-xl py-3 pl-4 pr-9 text-sm outline-none focus:border-blue-500', value ? 'text-[#0A1128]' : 'text-gray-400')}
        >
          <option value="" disabled>{placeholder}</option>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      </div>
    </div>
  )
}

// Setujui Akun (dari tab Ditolak) — atur role + pelatihan, tampilkan kode voucher.
// onConfirm({ discourseGroupId, lastTrainingSessionId, voucherCode }).
export function SetujuiAkunModal({ user, discourseGroups = [], trainingSessions = [], onConfirm, onCancel }) {
  const roleOptions = getRoleOptions(discourseGroups)
  const sessionOptions = trainingSessions
    .map(s => ({ value: String(s.id), label: s.name }))
    .sort((a, b) => String(a.label).localeCompare(String(b.label)))

  const [role, setRole]       = useState('')
  const [session, setSession] = useState('')
  const [voucher]             = useState(genVoucher)
  const [copied, setCopied]   = useState(false)

  useEffect(() => {
    if (!user) return
    setRole(resolveRoleValue(discourseGroups, user.role))
    setSession(user.raw?.lastTrainingSessionId ? String(user.raw.lastTrainingSessionId) : '')
  }, [user, discourseGroups])

  if (!user) return null

  const canSubmit = !!role && !!session
  const copy = () => {
    navigator.clipboard?.writeText(voucher)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[24px] w-full max-w-[440px] shadow-2xl overflow-hidden">
        <div className="p-7">
          <h3 className="text-xl font-bold text-[#0A1128] mb-1.5">Setujui Akun</h3>
          <p className="text-gray-500 text-sm mb-6">
            Atur role &amp; pelatihan untuk <span className="font-bold text-[#0A1128]">{user.name}</span> sebelum menyetujui.
          </p>

          <div className="space-y-4">
            <Select label="Role Pengguna" value={role} onChange={setRole} options={roleOptions} placeholder="Pilih role" />
            <Select label="Nama Pelatihan" value={session} onChange={setSession} options={sessionOptions} placeholder="Pilih pelatihan" />
            <div>
              <label className="block text-sm font-semibold text-[#0A1128] mb-1.5">Kode Voucher</label>
              <div className="flex items-center justify-between gap-2 border border-gray-200 rounded-xl py-3 px-4">
                <span className="text-sm font-bold text-blue-600">{voucher}</span>
                <button type="button" onClick={copy} className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#0A1128] transition-colors">
                  {copied ? <><Check size={14} className="text-green-500" /> Tersalin</> : <><Copy size={14} /> Salin</>}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-6 bg-gray-50/70 border-t border-gray-100">
          <button onClick={onCancel} className="flex-1 font-semibold text-[#0A1128] border border-gray-200 bg-white hover:bg-gray-50 px-6 py-3 rounded-full transition-colors">
            Batalkan
          </button>
          <button
            disabled={!canSubmit}
            onClick={() => onConfirm({ discourseGroupId: parseInt(role, 10), lastTrainingSessionId: session, voucherCode: voucher })}
            className="flex-1 font-semibold px-6 py-3 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Setujui
          </button>
        </div>
      </div>
    </div>
  )
}
