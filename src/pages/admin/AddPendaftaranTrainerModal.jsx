import { useState } from 'react'
import { X } from 'lucide-react'

export function AddPendaftaranTrainerModal({ isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({
    nama: '',
    kuota: '',
    periodeStart: '',
    periodeEnd: '',
    batasDaftar: ''
  })

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
    setFormData({ nama: '', kuota: '', periodeStart: '', periodeEnd: '', batasDaftar: '' })
    onClose()
  }

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
                placeholder="mis: Pelatihan Gasing Daerah A..."
                value={formData.nama}
                onChange={e => setFormData({ ...formData, nama: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Target Kuota</label>
              <input
                type="number"
                required
                placeholder="Masukkan angka saja, mis: 200"
                value={formData.kuota}
                onChange={e => setFormData({ ...formData, kuota: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Periode Mulai</label>
                <input
                  type="date"
                  required
                  value={formData.periodeStart}
                  onChange={e => setFormData({ ...formData, periodeStart: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Periode Selesai</label>
                <input
                  type="date"
                  required
                  value={formData.periodeEnd}
                  onChange={e => setFormData({ ...formData, periodeEnd: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Batas Akhir Pendaftaran</label>
              <input
                type="date"
                required
                value={formData.batasDaftar}
                onChange={e => setFormData({ ...formData, batasDaftar: e.target.value })}
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
