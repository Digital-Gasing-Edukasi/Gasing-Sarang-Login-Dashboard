import { useState } from 'react'
import { Check, UserCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FIELD_DEFS } from '@/lib/fixLink'

export function RejectModal({ candidate, onConfirm, onCancel }) {
  // checked: { [fieldKey]: true } — field yang dicentang salah oleh admin.
  const [checked, setChecked] = useState({})
  // note: "Catatan Tambahan" — muncul saat 'Lainnya' dicentang. → rejectedReason.
  const [note, setNote] = useState('')

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
      <div className="bg-white rounded-[24px] w-full max-w-[480px] shadow-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-8 pb-5 overflow-y-auto">
          <h3 className="text-2xl font-bold text-red-500 mb-1.5">Tolak Akun</h3>
          <p className="text-gray-500 text-sm mb-5">
            Pilih alasan penolakan akun <span className="font-bold text-[#0A1128]">{candidate.name}</span>
          </p>

          <hr className="border-gray-100 mb-4" />

          <div className="space-y-1">
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
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => toggle(f.key)}
                    className="sr-only"
                  />
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

export function ApproveModal({ candidate, onConfirm, onCancel }) {
  if (!candidate) return null
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-[24px] p-8 max-w-[400px] w-full shadow-2xl flex flex-col items-center text-center mx-4">
        <div className="w-16 h-16 rounded-full border border-dashed border-green-500 flex items-center justify-center mb-6 bg-green-50">
          <UserCheck className="text-green-500" size={28} strokeWidth={1.5} />
        </div>
        <h3 className="text-xl font-bold text-[#0A1128] mb-3">Setujui verifikasi akun ini?</h3>
        <p className="text-gray-500 mb-8 text-sm px-4">
          Akun <span className="font-bold text-[#0A1128]">{candidate.name}</span> akan disetujui dan{' '}
          <span className="text-green-500">mendapatkan akses</span> ke GASING Circle.
        </p>
        <div className="flex items-center justify-center gap-6 w-full">
          <button onClick={onCancel} className="font-semibold text-[#0A1128] hover:text-gray-600 px-6 py-2 transition-colors">
            Batalkan
          </button>
          <button onClick={onConfirm} className="font-semibold px-8 py-3 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors">
            Setujui Akun
          </button>
        </div>
      </div>
    </div>
  )
}
