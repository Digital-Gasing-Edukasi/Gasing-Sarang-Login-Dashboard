import { useState } from 'react'
import { Trash2 } from 'lucide-react'

export function HapusRiwayatModal({ item, onConfirm, onCancel }) {
  const [confirmText, setConfirmText] = useState('')

  if (!item) return null

  const canDelete = confirmText.trim().toUpperCase() === 'DELETE'

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-[24px] p-8 max-w-[400px] w-full shadow-2xl flex flex-col items-center text-center mx-4">
        <div className="w-16 h-16 rounded-full border border-dashed border-red-500 flex items-center justify-center mb-6 bg-red-50">
          <Trash2 className="text-red-500" size={26} strokeWidth={1.5} />
        </div>
        <h3 className="text-xl font-bold text-[#0A1128] mb-3">Yakin Hapus Riwayat Pelatihan?</h3>
        <p className="text-gray-500 mb-6 text-sm px-2">
          Kamu akan menghapus <span className="font-bold text-[#0A1128]">{item.nama}</span>. Seluruh data yang tersimpan akan hilang.
        </p>

        <div className="w-full text-left mb-8">
          <label className="block text-sm font-semibold text-[#0A1128] mb-2">
            Ketik <span className="text-red-500 font-bold">DELETE</span> untuk melanjutkan
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Ketik DELETE"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none"
          />
        </div>

        <div className="flex items-center justify-center gap-4 w-full">
          <button
            onClick={onCancel}
            className="flex-1 font-semibold text-[#0A1128] border border-gray-200 hover:bg-gray-50 px-6 py-3 rounded-full transition-colors"
          >
            Batalkan
          </button>
          <button
            disabled={!canDelete}
            onClick={() => onConfirm(item)}
            className="flex-1 font-semibold px-6 py-3 rounded-full bg-red-500 text-white hover:bg-red-600 transition-all disabled:bg-red-200 disabled:cursor-not-allowed"
          >
            Hapus
          </button>
        </div>
      </div>
    </div>
  )
}
