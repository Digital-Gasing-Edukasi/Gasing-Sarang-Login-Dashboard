import { useState, useEffect } from 'react'
import { Check, ChevronDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FIELD_DEFS } from '@/lib/fixLink'
import { getRoleOptions, resolveRoleValue } from './roleOptions'
import { RoleSelect } from './RoleSelect'

export function RejectModal({ candidate, onConfirm, onCancel }) {
  // checked: { [fieldKey]: true } — field yang dicentang salah oleh admin.
  const [checked, setChecked] = useState({})
  // note: "Catatan Tambahan" — muncul saat 'Lainnya' dicentang. → rejectedReason.
  const [note, setNote] = useState('')

  // Reset saat kandidat berganti (modal dipakai ulang untuk user berbeda).
  useEffect(() => { setChecked({}); setNote('') }, [candidate])

  if (!candidate) return null

  const toggle = (key) =>
    setChecked((prev) => {
      const next = { ...prev, [key]: !prev[key] }
      if (key === 'lainnya' && !next.lainnya) setNote('') // reset note saat uncheck
      return next
    })

  // Aturan status: 'Lainnya' dicentang → REJECTED (final). Selain itu → REVISE.
  // 'lainnya' menang: kalau dicentang, checklist field diabaikan (jadi rejected).
  const isRejected = !!checked.lainnya
  const reviseFields = FIELD_DEFS
    .filter((f) => f.key !== 'lainnya' && checked[f.key])
    .map((f) => f.key)
  const trimmedNote = note.trim()
  const canSubmit = isRejected ? trimmedNote.length > 0 : reviseFields.length > 0

  const handleSubmit = () => {
    if (isRejected) {
      // Tolak final — alasan = Catatan Tambahan (teks bebas).
      onConfirm({ status: 'rejected', invalidFields: [], reason: trimmedNote })
      return
    }
    // Minta revisi — alasan = ringkas label field yang dicentang.
    const reason = reviseFields
      .map((k) => FIELD_DEFS.find((f) => f.key === k).label)
      .join(', ')
    onConfirm({ status: 'revise', invalidFields: reviseFields, reason })
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-[24px] w-full max-w-[560px] shadow-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-8 pb-5 overflow-y-auto">
          <h3 className="text-2xl font-bold text-red-500 mb-1.5">Tolak Akun</h3>
          <p className="text-gray-500 text-sm mb-5">
            Pilih alasan penolakan akun <span className="font-bold text-[#0A1128]">{candidate.name}</span>
          </p>

          <hr className="border-gray-100 mb-4" />

          {/* Checklist 1-kolom */}
          <div className="grid grid-cols-1 gap-y-1">
            {FIELD_DEFS.map((f) => {
              const on = !!checked[f.key]
              return (
                <label key={f.key} className="flex items-center gap-3 py-2 cursor-pointer select-none">
                  <span
                    className={cn(
                      'w-6 h-6 rounded-md flex items-center justify-center border transition-colors shrink-0',
                      on ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'
                    )}
                  >
                    {on && <Check size={15} className="text-white" strokeWidth={3} />}
                  </span>
                  <input type="checkbox" checked={on} onChange={() => toggle(f.key)} className="sr-only" />
                  <span className="text-[15px] text-[#0A1128]">{f.label}</span>
                </label>
              )
            })}
          </div>

          {checked.lainnya && (
            <div className="mt-3 animate-fade-in">
              <label className="block text-sm text-gray-500 mb-1.5">Catatan Tambahan</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Tulis alasan penolakan secara spesifik…"
                rows={4}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-[#0A1128] placeholder:text-gray-400 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 outline-none resize-none"
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 p-6 bg-gray-50/70 border-t border-gray-100">
          <button
            onClick={onCancel}
            className="flex-1 font-semibold text-[#0A1128] border border-gray-200 bg-white hover:bg-gray-50 px-6 py-3.5 rounded-full transition-colors"
          >
            Batalkan
          </button>
          <button
            disabled={!canSubmit}
            onClick={handleSubmit}
            className="flex-1 font-semibold px-6 py-3.5 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Tolak Akun
          </button>
        </div>
      </div>
    </div>
  )
}

// Dropdown kecil reusable (Pelatihan) dengan tampilan konsisten.
function Dropdown({ value, onChange, options, placeholder }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'w-full appearance-none bg-white border rounded-xl py-2.5 pl-4 pr-9 text-sm font-medium outline-none transition-colors',
          'border-gray-200 hover:border-gray-300 focus:border-blue-500',
          value ? 'text-[#0A1128]' : 'text-gray-400'
        )}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value} className="text-[#0A1128]">{o.label}</option>
        ))}
      </select>
      <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
    </div>
  )
}

export function ApproveModal({ candidate, discourseGroups = [], trainingSessions = [], onConfirm, onCancel }) {
  const roleOptions = getRoleOptions(discourseGroups)
  const sessionOptions = trainingSessions
    .map((s) => ({ value: String(s.id), label: s.name }))
    .sort((a, b) => String(a.label).localeCompare(String(b.label)))

  const [role, setRole] = useState('')
  const [session, setSession] = useState('')

  // Prefill dari data user tiap kali kandidat berganti.
  useEffect(() => {
    if (!candidate) return
    setRole(resolveRoleValue(discourseGroups, candidate.role))
    setSession(candidate.raw?.lastTrainingSessionId ? String(candidate.raw.lastTrainingSessionId) : '')
  }, [candidate, discourseGroups])

  if (!candidate) return null

  // Keputusan #1: Role DAN Pelatihan Terbaru wajib dipilih.
  const canSubmit = !!role && !!session

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[24px] w-full max-w-[480px] shadow-2xl p-7">
        <div className="flex items-start justify-between mb-7">
          <h3 className="text-xl font-bold text-[#0A1128]">Setujui Akun Ini?</h3>
          <button
            type="button" onClick={onCancel} aria-label="Tutup"
            className="text-gray-400 hover:text-[#0A1128] transition-colors"
          >
            <X size={22} />
          </button>
        </div>

        <div className="flex items-start gap-5">
          <span className="font-bold text-[#0A1128] pt-2.5 shrink-0">{candidate.name}</span>
          <div className="flex-1 space-y-3">
            <RoleSelect value={role} onChange={setRole} options={roleOptions} placeholder="Role" />
            <Dropdown
              value={session}
              onChange={setSession}
              options={sessionOptions}
              placeholder="Nama Pelatihan Pertama"
            />
          </div>
        </div>

        <button
          disabled={!canSubmit}
          onClick={() => onConfirm({ discourseGroupId: parseInt(role, 10), lastTrainingSessionId: session })}
          className={cn(
            'w-full mt-8 font-semibold px-6 py-3.5 rounded-full text-white transition-colors',
            canSubmit ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-300 cursor-not-allowed'
          )}
        >
          Konfirmasi
        </button>
      </div>
    </div>
  )
}
