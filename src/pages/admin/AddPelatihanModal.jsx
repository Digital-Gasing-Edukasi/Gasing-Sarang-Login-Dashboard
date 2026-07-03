import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { regionsApi } from '@/lib/api'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { CalendarRangePicker, toYMD, formatIdDate } from './CalendarRangePicker'

const asList = (data) => (Array.isArray(data) ? data : data?.data || data?.items || [])
const regionLabel = (r) => r?.regionName || r?.name || ''

export function AddPelatihanModal({ isOpen, onClose, onSave }) {
  const [name, setName] = useState('')
  const [provinceId, setProvinceId] = useState('')
  const [regionId, setRegionId] = useState('')
  const [provinces, setProvinces] = useState([])
  const [provincesLoading, setProvincesLoading] = useState(false)
  const [regencies, setRegencies] = useState([])
  const [regencyLoading, setRegencyLoading] = useState(false)
  const [range, setRange] = useState({ startDate: null, endDate: null })
  const [error, setError] = useState('')

  // Load provinces the first time the modal opens (mirror of the signup flow).
  useEffect(() => {
    if (!isOpen || provinces.length > 0) return
    setProvincesLoading(true)
    regionsApi
      .list()
      .then((d) => setProvinces(asList(d)))
      .catch(() => setProvinces([]))
      .finally(() => setProvincesLoading(false))
  }, [isOpen, provinces.length])

  if (!isOpen) return null

  const handleProvinceChange = (v) => {
    setProvinceId(v)
    setRegionId('')
    setRegencies([])
    setRegencyLoading(true)
    regionsApi
      .list({ type: 'REGENCY', parentId: v })
      .then((d) => setRegencies(asList(d)))
      .catch(() => setRegencies([]))
      .finally(() => setRegencyLoading(false))
  }

  const reset = () => {
    setName('')
    setProvinceId('')
    setRegionId('')
    setRegencies([])
    setRange({ startDate: null, endDate: null })
    setError('')
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  // Validasi field di modal; upload-nya optimistic di parent (row Processing →
  // Saved/Error), jadi modal langsung ditutup setelah data valid dikirim.
  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    if (!name.trim()) return setError('Nama pelatihan wajib diisi.')
    if (!regionId) return setError('Daerah pelatihan wajib dipilih.')
    if (!range.startDate || !range.endDate) return setError('Tanggal mulai & selesai pelatihan wajib diisi.')

    const provinceName = regionLabel(provinces.find((p) => p.id === provinceId))
    const regionName = regionLabel(regencies.find((r) => r.id === regionId))

    onSave({
      name: name.trim(),
      regionId,
      startDate: toYMD(range.startDate),
      endDate: toYMD(range.endDate),
      daerahLabel: [regionName, provinceName].filter(Boolean).join(', '),
      tglMulaiLabel: formatIdDate(range.startDate),
    })
    reset()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#0A1128]">Tambah Pelatihan Baru</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nama Pelatihan</label>
              <input
                type="text"
                placeholder="Masukkan nama pelatihan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Daerah Pelatihan</label>
              <div className="grid grid-cols-2 gap-3">
                <Select value={provinceId} onValueChange={handleProvinceChange} disabled={provincesLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder={provincesLoading ? 'Memuat...' : 'Pilih Provinsi'} />
                  </SelectTrigger>
                  <SelectContent>
                    {provinces.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{regionLabel(p)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={regionId} onValueChange={setRegionId} disabled={!provinceId || regencyLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder={regencyLoading ? 'Memuat...' : 'Pilih Kab./Kota'} />
                  </SelectTrigger>
                  <SelectContent>
                    {regencies.map((r) => (
                      <SelectItem key={r.id} value={r.id}>{regionLabel(r)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tanggal Mulai &amp; Selesai Pelatihan</label>
              <CalendarRangePicker
                startDate={range.startDate}
                endDate={range.endDate}
                onChange={setRange}
              />
            </div>

            {error && <p className="text-xs text-red-500 font-medium pt-1">{error}</p>}
          </div>

          <div className="mt-8">
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors"
            >
              Tambah Pelatihan Baru
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
