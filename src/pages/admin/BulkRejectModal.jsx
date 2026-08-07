import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { FIELD_DEFS, FIELD_LABEL } from '@/lib/fixLink'

// Modal tolak massal. Keputusan #3: alasan bisa BEDA tiap akun.
// Tiap user punya checklist sendiri (chip). Aturan status per user sama dengan
// RejectModal tunggal: 'Lainnya' dicentang → REJECTED (butuh catatan), selain itu
// → REVISE (butuh minimal 1 field).
export function BulkRejectModal({ candidates = [], onConfirm, onCancel }) {
  // state: { [id]: { checked: {key:bool}, note: '' } }
  const [state, setState] = useState({})

  useEffect(() => {
    const init = {}
    candidates.forEach((c) => { init[c.id] = { checked: {}, note: '' } })
    setState(init)
  }, [candidates])

  const toggle = (id, key) =>
    setState((prev) => {
      const cur = prev[id] || { checked: {}, note: '' }
      const nextChecked = { ...cur.checked, [key]: !cur.checked[key] }
      const nextNote = key === 'lainnya' && !nextChecked.lainnya ? '' : cur.note
      return { ...prev, [id]: { checked: nextChecked, note: nextNote } }
    })

  const setNote = (id, val) =>
    setState((prev) => ({ ...prev, [id]: { ...prev[id], note: val } }))

  const rowValid = (c) => {
    const s = state[c.id]
    if (!s) return false
    if (s.checked.lainnya) return s.note.trim().length > 0
    return FIELD_DEFS.some((f) => f.key !== 'lainnya' && s.checked[f.key])
  }

  const allValid = candidates.length > 0 && candidates.every(rowValid)

  const handleSubmit = () =>
    onConfirm(
      candidates.map((c) => {
        const s = state[c.id]
        if (s.checked.lainnya) {
          return { id: c.id, name: c.name, status: 'rejected', reason: s.note.trim(), invalidFields: [] }
        }
        const fields = FIELD_DEFS.filter((f) => f.key !== 'lainnya' && s.checked[f.key]).map((f) => f.key)
        const reason = fields.map((k) => FIELD_LABEL[k]).join(', ')
        return { id: c.id, name: c.name, status: 'revise', reason, invalidFields: fields }
      })
    )

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-[24px] w-full max-w-[720px] shadow-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-8 pb-4">
          <h3 className="text-2xl font-bold text-red-500 mb-1.5">Tolak Akun</h3>
          <p className="text-gray-500 text-sm">
            Pilih alasan penolakan untuk <span className="font-bold text-[#0A1128]">{candidates.length}</span> akun terpilih.
          </p>
        </div>

        <div className="px-8 overflow-y-auto divide-y divide-gray-100">
          {candidates.map((c, idx) => {
            const s = state[c.id] || { checked: {}, note: '' }
            return (
              <div key={c.id} className="py-4">
                <div className="flex items-center gap-3 mb-2.5">
                  <span className="w-6 h-6 shrink-0 rounded-full bg-gray-100 text-gray-500 text-xs font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="font-bold text-[#0A1128] truncate">{c.name}</div>
                    <div className="text-xs text-gray-400 truncate">{c.email}</div>
                  </div>
                </div>

                {/* Chip alasan */}
                <div className="flex flex-wrap gap-2 pl-9">
                  {FIELD_DEFS.map((f) => {
                    const on = !!s.checked[f.key]
                    return (
                      <button
                        key={f.key}
                        type="button"
                        onClick={() => toggle(c.id, f.key)}
                        className={cn(
                          'px-3.5 py-1.5 rounded-full text-sm border transition-colors',
                          on
                            ? 'border-blue-600 text-blue-600 bg-blue-50 font-medium'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        )}
                      >
                        {f.label}
                      </button>
                    )
                  })}
                </div>

                {s.checked.lainnya && (
                  <div className="pl-9 mt-2.5">
                    <textarea
                      value={s.note}
                      onChange={(e) => setNote(c.id, e.target.value)}
                      placeholder="Tulis alasan penolakan secara spesifik…"
                      rows={2}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-[#0A1128] placeholder:text-gray-400 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 outline-none resize-none"
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="flex items-center gap-4 p-6 bg-gray-50/70 border-t border-gray-100">
          <button
            onClick={onCancel}
            className="flex-1 font-semibold text-[#0A1128] border border-gray-200 bg-white hover:bg-gray-50 px-6 py-3.5 rounded-full transition-colors"
          >
            Batalkan
          </button>
          <button
            disabled={!allValid}
            onClick={handleSubmit}
            className="flex-1 font-semibold px-6 py-3.5 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Tolak {candidates.length} Akun
          </button>
        </div>
      </div>
    </div>
  )
}
