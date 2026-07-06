import { useState, useEffect } from 'react'
import { X, Pencil, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { adminApi } from '@/lib/api'
import { mapToPeserta } from './mappers'
import { EditPesertaModal } from './EditPesertaModal'

const LANGGANAN_CLASSES = {
  Aktif:       'bg-green-50 text-green-600',
  'Non-Aktif': 'bg-gray-100 text-gray-400',
  Berakhir:    'bg-gray-100 text-gray-400',
}

// Daftar Peserta Guru 1 session (list + edit). Delete DISABLED sampai backend
// sediakan endpoint unenroll. List pakai filter existing lastTrainingSessionId
// (scope: session terakhir user, bisa tidak lengkap).
export function DaftarPesertaModal({ isOpen, session, onClose }) {
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null)

  const load = async () => {
    if (!session) return
    setLoading(true); setError('')
    try {
      const res = await adminApi.getSessionParticipants(session.id, { limit: 100 })
      const data = Array.isArray(res) ? res : (res?.data || [])
      setRows(data.map(mapToPeserta))
      setTotal(res?.meta?.total ?? data.length)
    } catch (err) {
      setError(err.message || 'Gagal memuat peserta.')
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && session) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, session])

  if (!isOpen || !session) return null

  const handleEditSave = async ({ name, email }) => {
    await adminApi.updateUser(editing.userId, { name, email })
    setRows((prev) => prev.map((r) => (r.userId === editing.userId ? { ...r, name, email } : r)))
    setEditing(null)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#0A1128]">Daftar Peserta Guru</h2>
              <span className="bg-blue-600 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">{total} Peserta</span>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              {session.nama}{session.daerah && session.daerah !== '-' ? ` · ${session.daerah}` : ''}{session.tglMulai && session.tglMulai !== '-' ? ` · ${session.tglMulai}` : ''}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#0A1128] text-white">
                <tr>
                  <th className="px-4 py-3 font-medium">Nama Peserta</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Langganan</th>
                  <th className="px-4 py-3 font-medium text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan="4" className="px-4 py-8 text-center text-gray-500">Memuat peserta...</td></tr>
                ) : rows.length > 0 ? (
                  rows.map((r) => (
                    <tr key={r.userId} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-[#0A1128]">{r.name}</td>
                      <td className="px-4 py-3 text-gray-600">{r.email}</td>
                      <td className="px-4 py-3">
                        <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold', LANGGANAN_CLASSES[r.langganan] || 'bg-gray-100 text-gray-400')}>
                          {r.langganan}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setEditing(r)}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-[#0A1128] transition-colors"
                            title="Edit peserta"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            disabled
                            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-300 cursor-not-allowed"
                            title="Hapus peserta belum tersedia (menunggu endpoint backend)"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="4" className="px-4 py-8 text-center text-gray-500">{error || 'Belum ada peserta.'}</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {error && rows.length > 0 && <p className="mt-3 text-xs text-red-500 font-medium">{error}</p>}
        </div>
      </div>

      <EditPesertaModal
        peserta={editing}
        onSave={handleEditSave}
        onCancel={() => setEditing(null)}
      />
    </div>
  )
}
