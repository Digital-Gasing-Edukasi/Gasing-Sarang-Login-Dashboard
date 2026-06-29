import { useState } from 'react'
import { UserX, UserCheck } from 'lucide-react'
import { FIELD_DEFS } from '@/lib/fixLink'

export function RejectModal({ candidate, onConfirm, onCancel }) {
  // checked: { [fieldKey]: true } — field yang dicentang salah oleh admin.
  const [checked, setChecked] = useState({})
  // notes: { [fieldKey]: 'catatan' } — pesan custom per field (opsional).
  const [notes, setNotes] = useState({})

  if (!candidate) return null

  const toggle = (key) =>
    setChecked((prev) => {
      const next = { ...prev, [key]: !prev[key] }
      if (!next[key]) setNotes((n) => ({ ...n, [key]: '' }))
      return next
    })

  const invalidFields = FIELD_DEFS.filter((f) => checked[f.key]).map((f) => f.key)
  const canSubmit = invalidFields.length > 0

  const handleSubmit = () => {
    const cleanNotes = {}
    invalidFields.forEach((k) => {
      const v = (notes[k] || '').trim()
      if (v) cleanNotes[k] = v
    })
    // reason readable buat dashboard/email backend.
    const reason = invalidFields
      .map((k) => {
        const label = FIELD_DEFS.find((f) => f.key === k).label
        return cleanNotes[k] ? `${label}: ${cleanNotes[k]}` : label
      })
      .join('; ')
    onConfirm({ invalidFields, notes: cleanNotes, reason })
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-[24px] p-8 max-w-[440px] w-full shadow-2xl flex flex-col items-center text-center mx-4 max-h-[90vh] overflow-y-auto">
        <div className="w-16 h-16 rounded-full border border-dashed border-red-500 flex items-center justify-center mb-6 bg-red-50 shrink-0">
          <UserX className="text-red-500" size={28} strokeWidth={1.5} />
        </div>
        <h3 className="text-xl font-bold text-[#0A1128] mb-3">Tolak verifikasi akun ini?</h3>
        <p className="text-gray-500 mb-6 text-sm px-4">
          Centang data <span className="font-bold text-[#0A1128]">{candidate.name}</span> yang salah.
          User akan menerima email berisi link untuk memperbaiki data tersebut.
        </p>

        <div className="w-full text-left mb-8">
          <label className="block text-sm font-semibold text-[#0A1128] mb-2">
            Data yang salah <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2">
            {FIELD_DEFS.map((f) => (
              <div
                key={f.key}
                className={`rounded-xl border transition-colors ${
                  checked[f.key] ? 'border-red-300 bg-red-50/60' : 'border-gray-200'
                }`}
              >
                <label className="flex items-center gap-3 px-3 py-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={!!checked[f.key]}
                    onChange={() => toggle(f.key)}
                    className="w-4 h-4 rounded border-gray-300 text-red-500 focus:ring-red-500/30 accent-red-500"
                  />
                  <span className="text-sm font-medium text-[#0A1128]">{f.label}</span>
                </label>
                {checked[f.key] && (
                  <div className="px-3 pb-3">
                    <input
                      type="text"
                      value={notes[f.key] || ''}
                      onChange={(e) => setNotes((n) => ({ ...n, [f.key]: e.target.value }))}
                      placeholder="Catatan untuk user (opsional)…"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center gap-6 w-full shrink-0">
          <button onClick={onCancel} className="font-semibold text-[#0A1128] hover:text-gray-600 px-6 py-2 transition-colors">
            Batalkan
          </button>
          <button
            disabled={!canSubmit}
            onClick={handleSubmit}
            className="font-semibold px-8 py-3 rounded-full bg-[#FEE2E2] text-[#EF4444] hover:bg-white hover:border-[#EF4444] border border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
