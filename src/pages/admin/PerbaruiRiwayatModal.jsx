import { useState, useEffect } from 'react'
import { X, UploadCloud, FileText, Trash2 } from 'lucide-react'
import { regionsApi } from '@/lib/api'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { CalendarRangePicker, toYMD, formatIdDate } from './CalendarRangePicker'

const asList = (data) => (Array.isArray(data) ? data : data?.data || data?.items || [])
const regionLabel = (r) => r?.regionName || r?.name || ''

function downloadTemplate() {
  const csv = 'email\ncontoh1@email.com\ncontoh2@email.com\n'
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = 'template-peserta-guru.csv'
  document.body.appendChild(a); a.click(); document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Modal EDIT session (Perbarui Riwayat Pelatihan): prefill dari row, update via
// PATCH, ganti CSV peserta (opsional), atau Hapus Riwayat (ketik DELETE → DELETE).
export function PerbaruiRiwayatModal({ isOpen, session, onClose, onSave, onDelete }) {
  const [name, setName] = useState('')
  const [provinceId, setProvinceId] = useState('')
  const [regionId, setRegionId] = useState('')
  const [provinces, setProvinces] = useState([])
  const [regencies, setRegencies] = useState([])
  const [regencyLoading, setRegencyLoading] = useState(false)
  const [range, setRange] = useState({ startDate: null, endDate: null })
  const [pesertaFile, setPesertaFile] = useState(null)
  const [fileError, setFileError] = useState('')
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleteText, setDeleteText] = useState('')

  // Prefill saat modal dibuka: nama, tanggal, dan resolve provinsi dari regionId.
  useEffect(() => {
    if (!isOpen || !session) return
    setName(session.nama || '')
    setRange({
      startDate: session.startMs ? new Date(session.startMs) : null,
      endDate: session.endMs ? new Date(session.endMs) : null,
    })
    setPesertaFile(null); setFileError(''); setError(''); setConfirmDelete(false); setDeleteText('')

    regionsApi.list().then((d) => setProvinces(asList(d))).catch(() => setProvinces([]))

    if (session.regionId) {
      regionsApi.get(session.regionId).then((r) => {
        const reg = r?.data || r
        const parentId = reg?.parentId || ''
        setProvinceId(parentId)
        setRegionId(session.regionId)
        if (parentId) {
          setRegencyLoading(true)
          regionsApi.list({ type: 'REGENCY', parentId })
            .then((d) => setRegencies(asList(d)))
            .catch(() => setRegencies([]))
            .finally(() => setRegencyLoading(false))
        }
      }).catch(() => {})
    } else {
      setProvinceId(''); setRegionId(''); setRegencies([])
    }
  }, [isOpen, session])

  if (!isOpen || !session) return null

  const handleProvinceChange = (v) => {
    setProvinceId(v); setRegionId(''); setRegencies([]); setRegencyLoading(true)
    regionsApi.list({ type: 'REGENCY', parentId: v })
      .then((d) => setRegencies(asList(d)))
      .catch(() => setRegencies([]))
      .finally(() => setRegencyLoading(false))
  }

  const pickFile = (f) => {
    if (!f) return
    if (!/\.csv$/i.test(f.name)) return setFileError('Format file tidak didukung. Gunakan format .csv')
    setFileError(''); setPesertaFile(f)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    if (!name.trim()) return setError('Nama pelatihan wajib diisi.')
    if (!regionId) return setError('Daerah wajib dipilih.')
    if (!range.startDate || !range.endDate) return setError('Tanggal mulai & berakhir wajib diisi.')

    const provinceName = regionLabel(provinces.find((p) => p.id === provinceId))
    const regionName = regionLabel(regencies.find((r) => r.id === regionId))

    onSave({
      id: session.id,
      name: name.trim(),
      regionId,
      startDate: toYMD(range.startDate),
      endDate: toYMD(range.endDate),
      daerahLabel: [regionName, provinceName].filter(Boolean).join(', '),
      tglMulaiLabel: formatIdDate(range.startDate),
      pesertaFile,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      {fileError && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[120] bg-red-500 text-white text-sm font-medium px-5 py-3 rounded-full shadow-lg">
          {fileError}
        </div>
      )}

      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl max-h-[92vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#0A1128]">Perbarui Riwayat Pelatihan</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nama Pelatihan</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Masukkan nama pelatihan"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Daerah</label>
              <div className="grid grid-cols-2 gap-3">
                <Select value={provinceId} onValueChange={handleProvinceChange}>
                  <SelectTrigger><SelectValue placeholder="Pilih Provinsi" /></SelectTrigger>
                  <SelectContent>
                    {provinces.map((p) => <SelectItem key={p.id} value={p.id}>{regionLabel(p)}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={regionId} onValueChange={setRegionId} disabled={!provinceId || regencyLoading}>
                  <SelectTrigger><SelectValue placeholder={regencyLoading ? 'Memuat...' : 'Pilih Kab./Kota'} /></SelectTrigger>
                  <SelectContent>
                    {regencies.map((r) => <SelectItem key={r.id} value={r.id}>{regionLabel(r)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tanggal Mulai &amp; Berakhir</label>
              <CalendarRangePicker startDate={range.startDate} endDate={range.endDate} onChange={setRange} />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Daftar Peserta Guru</label>
              <label
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); pickFile(e.dataTransfer.files?.[0]) }}
                className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-blue-300 rounded-xl py-6 px-4 text-center cursor-pointer hover:border-blue-500 transition-colors"
              >
                <input type="file" accept=".csv" className="sr-only" onChange={(e) => pickFile(e.target.files?.[0])} />
                {pesertaFile ? <FileText size={24} className="text-blue-600" /> : <UploadCloud size={24} className="text-[#0A1128]" />}
                <span className="text-sm text-gray-600">
                  {pesertaFile
                    ? <span className="font-medium text-[#0A1128]">{pesertaFile.name}</span>
                    : <>Tarik file .CSV ke sini atau <span className="font-semibold text-blue-600">klik</span> untuk mengganti peserta</>}
                </span>
              </label>
              <div className="text-center mt-3">
                <button type="button" onClick={downloadTemplate} className="text-sm font-semibold text-blue-600 hover:underline">
                  Download Template Peserta Guru
                </button>
              </div>
            </div>

            {error && <p className="text-xs text-red-500 font-medium pt-1">{error}</p>}
          </div>

          <div className="mt-8 flex gap-3">
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="flex-1 border border-red-200 text-red-500 hover:bg-red-50 font-semibold py-2.5 rounded-lg transition-colors"
            >
              Hapus Riwayat
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors"
            >
              Simpan
            </button>
          </div>
        </form>
      </div>

      {/* Konfirmasi hapus session — ketik DELETE */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl text-center">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="text-red-500" size={24} />
            </div>
            <h3 className="text-lg font-bold text-[#0A1128] mb-2">Yakin Hapus Riwayat Pelatihan?</h3>
            <p className="text-sm text-gray-500 mb-4">
              Kamu akan menghapus <span className="font-semibold text-[#0A1128]">{session.nama}</span>. Seluruh data yang tersimpan akan hilang.
            </p>
            <p className="text-xs text-gray-500 mb-1.5 text-left">Ketik <b className="text-red-500">DELETE</b> untuk melanjutkan</p>
            <input
              value={deleteText}
              onChange={(e) => setDeleteText(e.target.value)}
              placeholder="DELETE"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm mb-5 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400"
            />
            <div className="flex gap-3">
              <button onClick={() => { setConfirmDelete(false); setDeleteText('') }} className="flex-1 border border-gray-200 text-[#0A1128] font-semibold py-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                Batalkan
              </button>
              <button
                disabled={deleteText !== 'DELETE'}
                onClick={() => { onDelete(session); onClose() }}
                className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-colors"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
