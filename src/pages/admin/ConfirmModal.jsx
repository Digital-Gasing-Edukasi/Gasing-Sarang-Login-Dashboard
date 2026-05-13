import { useState } from 'react'
import { UserX, UserCheck } from 'lucide-react'

export function RejectModal({ candidate, onConfirm, onCancel }) {
  const [reason, setReason] = useState('')

  if (!candidate) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-[24px] p-8 max-w-[400px] w-full shadow-2xl flex flex-col items-center text-center mx-4">
        <div className="w-16 h-16 rounded-full border border-dashed border-red-500 flex items-center justify-center mb-6 bg-red-50">
          <UserX className="text-red-500" size={28} strokeWidth={1.5} />
        </div>
        <h3 className="text-xl font-bold text-[#0A1128] mb-3">Tolak verifikasi akun ini?</h3>
        <p className="text-gray-500 mb-6 text-sm px-4">
          Akun <span className="font-bold text-[#0A1128]">{candidate.name}</span> akan ditolak dan{' '}
          <span className="text-red-500">tidak mendapatkan akses</span> ke GASING Circle.
        </p>

        <div className="w-full text-left mb-8">
          <label className="block text-sm font-semibold text-[#0A1128] mb-2">Alasan Penolakan <span className="text-red-500">*</span></label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Masukkan alasan penolakan..."
            className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none resize-none"
            rows={3}
          />
        </div>

        <div className="flex items-center justify-center gap-6 w-full">
          <button onClick={onCancel} className="font-semibold text-[#0A1128] hover:text-gray-600 px-6 py-2 transition-colors">
            Batalkan
          </button>
          <button 
            disabled={!reason.trim()}
            onClick={() => onConfirm(reason)} 
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
