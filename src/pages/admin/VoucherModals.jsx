import { useState, useEffect } from 'react'
import { Copy, Check, X, CheckCircle2 } from 'lucide-react'
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

// Modal konfirmasi tunggal. Admin WAJIB salin voucher dulu → Konfirmasi baru aktif.
// email ke user (endpoint email masih TODO, lihat handler di AdminDashboardPage).
export function KonfirmasiVoucherModal({ candidate, onConfirm, onCancel }) {
  const [copied, setCopied] = useState(false)   // latch: sekali copy tetap true
  const [toast, setToast]   = useState(false)

  // Reset saat kandidat berganti (modal dipakai ulang).
  useEffect(() => { setCopied(false); setToast(false) }, [candidate])

  if (!candidate) return null

  const copy = async () => {
    try { await navigator.clipboard?.writeText(candidate.voucherCode) } catch { /* noop */ }
    setCopied(true)
    setToast(true)
    setTimeout(() => setToast(false), 3000)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      {toast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[110] bg-[#030B1F] text-white pl-6 pr-4 py-3.5 rounded-full shadow-lg flex items-center gap-6 font-sans text-[16px] animate-in slide-in-from-top-4 fade-in duration-300">
          <span className="font-normal">Kode voucher telah disalin</span>
          <button onClick={() => setToast(false)} aria-label="Tutup" className="text-[#B3B6BC] hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>
      )}

      <div className="bg-white rounded-[24px] w-full max-w-[520px] shadow-2xl p-7">
        <div className="flex items-start justify-between mb-6">
          <h3 className="text-xl font-bold text-[#0A1128]">Konfirmasi Copy Voucher</h3>
          <button type="button" onClick={onCancel} aria-label="Tutup" className="text-gray-400 hover:text-[#0A1128] transition-colors">
            <X size={22} />
          </button>
        </div>

        <div className="flex items-center gap-4">
          <span className="font-bold text-[#0A1128] shrink-0">{candidate.name}</span>
          <div className="flex-1 min-w-0">
            <div className="text-sm text-gray-500">Kode Voucher:</div>
            <div className="font-bold text-blue-600 truncate">{candidate.voucherCode}</div>
          </div>
          <button
            onClick={copy}
            className={cn(
              'flex items-center justify-center gap-2 min-w-[120px] px-5 py-2.5 rounded-full border text-sm font-semibold transition-colors shrink-0',
              copied ? 'border-gray-200 text-blue-600' : 'border-gray-200 text-[#0A1128] hover:bg-gray-50'
            )}
          >
            {copied
              ? <><CheckCircle2 size={18} className="fill-blue-600 text-white" /> Tersalin</>
              : <><Copy size={16} /> Salin</>}
          </button>
        </div>

        <button
          disabled={!copied}
          onClick={onConfirm}
          className={cn(
            'w-full mt-8 font-semibold px-6 py-3.5 rounded-full text-white transition-colors',
            copied ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-300 cursor-not-allowed'
          )}
        >
          Konfirmasi
        </button>
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
