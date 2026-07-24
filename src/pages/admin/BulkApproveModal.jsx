import { useState, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getRoleOptions, resolveRoleValue } from './roleOptions'

// Dropdown inline untuk tiap baris user (Role / Pelatihan).
function RowSelect({ value, onChange, options, placeholder }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'w-full appearance-none bg-white border rounded-lg py-2 pl-3 pr-8 text-sm outline-none transition-colors',
          'border-gray-200 focus:border-[#0A1128]',
          value ? 'text-[#0A1128]' : 'text-gray-400'
        )}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value} className="text-[#0A1128]">{o.label}</option>
        ))}
      </select>
      <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
    </div>
  )
}

// Modal approve massal. Tiap user WAJIB punya Role + Pelatihan Terbaru (keputusan #1).
export function BulkApproveModal({ candidates = [], discourseGroups = [], trainingSessions = [], onConfirm, onCancel }) {
  const roleOptions = getRoleOptions(discourseGroups)
  const sessionOptions = trainingSessions.map((s) => ({ value: String(s.id), label: s.name }))

  // rows: { [id]: { role, session } }
  const [rows, setRows] = useState({})

  useEffect(() => {
    const init = {}
    candidates.forEach((c) => {
      init[c.id] = {
        role: resolveRoleValue(discourseGroups, c.role),
        session: c.raw?.firstTrainingSessionId ? String(c.raw.firstTrainingSessionId) : '',
      }
    })
    setRows(init)
  }, [candidates, discourseGroups])

  const setField = (id, field, val) =>
    setRows((prev) => ({ ...prev, [id]: { ...prev[id], [field]: val } }))

  const allFilled = candidates.length > 0 && candidates.every((c) => rows[c.id]?.role && rows[c.id]?.session)

  const handleSubmit = () =>
    onConfirm(
      candidates.map((c) => ({
        id: c.id,
        name: c.name,
        discourseGroupId: parseInt(rows[c.id].role, 10),
        firstTrainingSessionId: rows[c.id].session,
      }))
    )

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-[24px] w-full max-w-[860px] shadow-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-8 pb-4">
          <h3 className="text-2xl font-bold text-[#0A1128] mb-1.5">Setujui Akun ini?</h3>
          <p className="text-gray-500 text-sm">
            Atur role dan pelatihan untuk <span className="font-bold text-[#0A1128]">{candidates.length}</span> akun terpilih.
          </p>
        </div>

        <div className="px-8 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
          {candidates.map((c, idx) => (
            <div key={c.id} className="flex gap-3">
              <span className="w-6 h-6 shrink-0 rounded-full bg-gray-100 text-gray-500 text-xs font-bold flex items-center justify-center mt-1">
                {idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-[#0A1128] truncate">{c.name}</div>
                <div className="text-xs text-gray-400 mb-2 truncate">{c.email}</div>
                <div className="space-y-2">
                  <RowSelect
                    value={rows[c.id]?.role || ''}
                    onChange={(v) => setField(c.id, 'role', v)}
                    options={roleOptions}
                    placeholder="Pilih role"
                  />
                  <RowSelect
                    value={rows[c.id]?.session || ''}
                    onChange={(v) => setField(c.id, 'session', v)}
                    options={sessionOptions}
                    placeholder="Nama Pelatihan Terbaru"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-4 p-6 mt-4 bg-gray-50/70 border-t border-gray-100">
          <button
            onClick={onCancel}
            className="flex-1 font-semibold text-[#0A1128] border border-gray-200 bg-white hover:bg-gray-50 px-6 py-3.5 rounded-full transition-colors"
          >
            Batalkan
          </button>
          <button
            disabled={!allFilled}
            onClick={handleSubmit}
            className="flex-1 font-semibold px-6 py-3.5 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Setujui {candidates.length} Akun
          </button>
        </div>
      </div>
    </div>
  )
}
