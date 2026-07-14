import { useState, useEffect } from 'react'
import { Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

// Field kode voucher + tombol Copy (state: default → "Tersalin").
function CopyField({ code }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try { await navigator.clipboard?.writeText(code) } catch { /* noop */ }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="flex items-center justify-between gap-3 border border-gray-200 rounded-xl px-4 py-3">
      <span className="font-mono font-semibold text-[#0A1128] truncate">{code}</span>
      <button
        onClick={copy}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors shrink-0',
          copied ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-[#0A1128] hover:bg-gray-200'
        )}
      >
        {copied ? <Check size={14} strokeWidth={3} /> : <Copy size={14} />}
        {copied ? 'Tersalin' : 'Copy'}
      </button>
    </div>
  )
}

// Modal konfirmasi tunggal. Admin salin voucher lalu konfirmasi → akun final +
// email ke user (endpoint email masih TODO, lihat handler di AdminDashboardPage).
export function KonfirmasiVoucherModal({ candidate, onConfirm, onCancel }) {
  if (!candidate) return null
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-[24px] w-full max-w-[440px] shadow-2xl mx-4 overflow-hidden flex flex-col">
        <div className="p-8 pb-5">
          <h3 className="text-2xl font-bold text-[#0A1128] mb-1.5">Konfirmasi Copy Voucher</h3>
          <p className="text-gray-500 text-sm mb-6">
            Salin voucher untuk <span className="font-bold text-[#0A1128]">{candidate.name}</span>, lalu konfirmasi untuk mengirim ke email user.
          </p>
          <label className="block text-sm font-medium text-[#0A1128] mb-1.5">Kode Voucher</label>
          <CopyField code={candidate.voucherCode} />
        </div>

        <div className="flex items-center gap-4 p-6 bg-gray-50/70 border-t border-gray-100">
          <button
            onClick={onCancel}
            className="flex-1 font-semibold text-[#0A1128] border border-gray-200 bg-white hover:bg-gray-50 px-6 py-3.5 rounded-full transition-colors"
          >
            Batalkan
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 font-semibold px-6 py-3.5 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            Konfirmasi
          </button>
        </div>
      </div>
    </div>
  )
}

// Modal konfirmasi massal. List akun terpilih + kode voucher masing-masing.
export function BulkVoucherModal({ candidates = [], onConfirm, onCancel }) {
  // Reset kalau daftar kandidat berganti (opsional; modal remount tiap buka).
  useEffect(() => {}, [candidates])

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-[24px] w-full max-w-[860px] shadow-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-8 pb-4">
          <h3 className="text-2xl font-bold text-[#0A1128] mb-1.5">Konfirmasi Akun ini?</h3>
          <p className="text-gray-500 text-sm">
            Kirim voucher & konfirmasi <span className="font-bold text-[#0A1128]">{candidates.length}</span> akun terpilih.
          </p>
        </div>

        <div className="px-8 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          {candidates.map((c, idx) => (
            <div key={c.id} className="flex gap-3">
              <span className="w-6 h-6 shrink-0 rounded-full bg-gray-100 text-gray-500 text-xs font-bold flex items-center justify-center mt-1">
                {idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-[#0A1128] truncate">{c.name}</div>
                <div className="text-xs text-gray-400 mb-2 truncate">{c.email}</div>
                <CopyField code={c.voucherCode} />
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
            onClick={() => onConfirm(candidates)}
            className="flex-1 font-semibold px-6 py-3.5 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            Konfirmasi {candidates.length} Akun
          </button>
        </div>
      </div>
    </div>
  )
}
