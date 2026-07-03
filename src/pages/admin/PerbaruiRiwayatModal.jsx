import { useState, useRef } from 'react'
import { X, UploadCloud, FileText, Pencil, Trash2, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { trainingHistoriesApi, queueApi } from '@/lib/api'
import { EditEmailModal } from './EditEmailModal'

// Poll job sampai COMPLETED / FAILED (maks ~60 detik).
async function pollJob(trackId) {
  for (let i = 0; i < 60; i++) {
    const res = await queueApi.getJob(trackId)
    const job = res?.data || res
    if (job.status === 'COMPLETED') return job
    if (job.status === 'FAILED') throw new Error(job.error || 'Proses gagal di server.')
    await new Promise((r) => setTimeout(r, 1000))
  }
  throw new Error('Timeout menunggu proses server.')
}

const asRows = (res) => res?.rows?.data || res?.rows || []

export function PerbaruiRiwayatModal({ isOpen, session, onClose, onDone }) {
  const [phase, setPhase] = useState('upload') // upload | validating | review | pushing
  const [file, setFile] = useState(null)
  const [importId, setImportId] = useState(null)
  const [rows, setRows] = useState([])
  const [error, setError] = useState('')
  const [editingRow, setEditingRow] = useState(null)
  const [deletingRow, setDeletingRow] = useState(null)
  const fileRef = useRef(null)

  if (!isOpen || !session) return null

  const invalidCount = rows.filter((r) => !r.valid).length
  const validCount = rows.length - invalidCount

  const reset = () => {
    setPhase('upload'); setFile(null); setImportId(null); setRows([])
    setError(''); setEditingRow(null); setDeletingRow(null)
  }
  const handleClose = () => { reset(); onClose() }

  const pickFile = (f) => {
    if (!f) return
    if (!/\.csv$/i.test(f.name)) return setError('File harus berformat .csv')
    setError(''); setFile(f)
  }

  const handleUpload = async () => {
    if (!file) return setError('Pilih file CSV dulu.')
    setError(''); setPhase('validating')
    try {
      const { importId: id, trackId } = await trainingHistoriesApi.upload(file, session.id)
      await pollJob(trackId)
      const detail = await trainingHistoriesApi.getImport(id, { limit: 100 })
      setImportId(id)
      setRows(asRows(detail))
      setPhase('review')
    } catch (err) {
      setError(err.message || 'Gagal mengunggah CSV.')
      setPhase('upload')
    }
  }

  const refreshRows = async () => {
    const detail = await trainingHistoriesApi.getImport(importId, { limit: 100 })
    setRows(asRows(detail))
  }

  const handleEditSave = async (email) => {
    const updated = await trainingHistoriesApi.patchRow(importId, editingRow.id, email)
    const row = updated?.data || updated
    setRows((prev) => prev.map((r) => (r.id === row.id ? row : r)))
    setEditingRow(null)
  }

  const handleDeleteConfirm = async () => {
    try {
      await trainingHistoriesApi.deleteRow(importId, deletingRow.id)
      setRows((prev) => prev.filter((r) => r.id !== deletingRow.id))
      setDeletingRow(null)
    } catch (err) {
      setError(err.message || 'Gagal menghapus peserta.')
      setDeletingRow(null)
    }
  }

  const handlePush = async () => {
    setError(''); setPhase('pushing')
    try {
      const { trackId } = await trainingHistoriesApi.push(importId)
      await pollJob(trackId)
      onDone?.(session, validCount)
      handleClose()
    } catch (err) {
      setError(err.message || 'Gagal menyimpan data.')
      setPhase('review')
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className={cn('bg-white rounded-2xl w-full shadow-xl flex flex-col max-h-[90vh]', phase === 'review' ? 'max-w-2xl' : 'max-w-md')}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between shrink-0">
          <div>
            <h2 className="text-lg font-bold text-[#0A1128]">Perbarui Riwayat Pelatihan</h2>
            <p className="text-sm text-gray-500 mt-0.5">{session.nama}</p>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto">
          {(phase === 'upload' || phase === 'validating') && (
            <>
              <label
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); pickFile(e.dataTransfer.files?.[0]) }}
                className={cn(
                  'flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl py-10 px-4 text-center cursor-pointer transition-colors',
                  phase === 'validating' ? 'border-gray-200 opacity-60 pointer-events-none' : 'border-gray-300 hover:border-blue-500'
                )}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv"
                  className="sr-only"
                  onChange={(e) => pickFile(e.target.files?.[0])}
                />
                {file ? <FileText size={28} className="text-blue-600" /> : <UploadCloud size={28} className="text-gray-400" />}
                <span className="text-sm font-medium text-[#0A1128]">
                  {file ? file.name : 'Klik atau tarik file CSV ke sini'}
                </span>
                <span className="text-xs text-gray-400">Format: CSV berisi kolom email peserta</span>
              </label>

              {phase === 'validating' && (
                <p className="mt-4 text-sm text-blue-600 font-medium text-center animate-pulse">
                  Memvalidasi email peserta...
                </p>
              )}
              {error && <p className="mt-3 text-xs text-red-500 font-medium">{error}</p>}

              <button
                onClick={handleUpload}
                disabled={!file || phase === 'validating'}
                className="mt-6 w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-colors"
              >
                Unggah &amp; Validasi
              </button>
            </>
          )}

          {(phase === 'review' || phase === 'pushing') && (
            <>
              {invalidCount > 0 && (
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg px-4 py-3 mb-4 text-sm">
                  <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                  <span>
                    <b>{invalidCount}</b> email tidak valid akan <b>dilewati</b> saat menyimpan. Perbaiki email atau hapus barisnya.
                  </span>
                </div>
              )}

              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#0A1128] text-white">
                    <tr>
                      <th className="px-4 py-3 font-medium">Email</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {rows.map((r) => (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-[#0A1128]">{r.email}</td>
                        <td className="px-4 py-3">
                          {r.valid ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-50 text-green-600">Valid</span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-500" title={r.message || ''}>
                              Tidak valid
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setEditingRow(r)}
                              className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-[#0A1128] transition-colors"
                              title="Edit email"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              onClick={() => setDeletingRow(r)}
                              className="w-8 h-8 rounded-full flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors"
                              title="Hapus peserta"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {rows.length === 0 && (
                      <tr><td colSpan="3" className="px-4 py-8 text-center text-gray-500">Tidak ada baris.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {error && <p className="mt-3 text-xs text-red-500 font-medium">{error}</p>}

              <button
                onClick={handlePush}
                disabled={phase === 'pushing' || validCount === 0}
                className="mt-6 w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-colors"
              >
                {phase === 'pushing' ? 'Menyimpan...' : `Simpan Data (${validCount} valid)`}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Edit email 1 row */}
      <EditEmailModal
        row={editingRow}
        onSave={handleEditSave}
        onCancel={() => setEditingRow(null)}
      />

      {/* Konfirmasi hapus row */}
      {deletingRow && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl text-center">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="text-red-500" size={24} />
            </div>
            <h3 className="text-lg font-bold text-[#0A1128] mb-2">Yakin hapus peserta ini?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Email <span className="font-semibold text-[#0A1128]">{deletingRow.email}</span> akan dihapus dari daftar impor.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeletingRow(null)} className="flex-1 border border-gray-200 text-[#0A1128] font-semibold py-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                Batalkan
              </button>
              <button onClick={handleDeleteConfirm} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-lg transition-colors">
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
