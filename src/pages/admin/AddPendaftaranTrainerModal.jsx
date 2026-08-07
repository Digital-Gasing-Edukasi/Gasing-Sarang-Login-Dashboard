import { useState } from 'react'
import { X, Info } from 'lucide-react'

const EMPTY = { nama: '', url: '', periode: '', batasWaktu: '' }

export function AddPendaftaranTrainerModal({ isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState(EMPTY)

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
    setFormData(EMPTY)
    onClose()
  }

  const set = (k) => (e) => setFormData({ ...formData, [k]: e.target.value })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#0A1128]">Tambah Pendaftaran Pelatihan</h2>
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
                required
                placeholder="mis: Pelatihan Gasing Pondok Berhitung Gunung Mas"
                value={formData.nama}
                onChange={set('nama')}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
                Tautan Topik
                <span className="group relative inline-flex">
                  <Info size={14} className="text-gray-400" />
                  <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#0A1128] px-2.5 py-1.5 text-xs font-normal text-white opacity-0 transition-opacity group-hover:opacity-100">
                    Masukkan tautan topik pendaftaran pelatihan.
                  </span>
                </span>
              </label>
              <input
                type="url"
                required
                placeholder="https://dev-komunitas.gasingacademy.org/t/.../143"
                value={formData.url}
                onChange={set('url')}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Rentang Waktu</label>
              <input
                type="text"
                required
                placeholder="mis: 10 - 25 Maret 2026"
                value={formData.periode}
                onChange={set('periode')}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Batas Waktu Pendaftaran</label>
              <input
                type="datetime-local"
                required
                value={formData.batasWaktu}
                onChange={set('batasWaktu')}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <p className="text-xs text-orange-500 font-medium pt-2">
              ⚠️ Pastikan data sudah benar sebelum menyimpan.
            </p>
          </div>

          <div className="mt-8">
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors"
            >
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
