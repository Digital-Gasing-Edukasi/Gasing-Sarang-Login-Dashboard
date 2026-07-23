import { useState, useEffect } from 'react'
import { Copy, X, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

// Tombol salin bergaya pill: default "Salin" → setelah diklik latch jadi "Tersalin"
// (ikon centang biru). Dipakai di modal tunggal & massal supaya bentuknya seragam.
function CopyPill({ code, onCopied }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try { await navigator.clipboard?.writeText(code) } catch { /* noop */ }
    setCopied(true)
    onCopied?.()
  }
  return (
    <button
      type="button"
      onClick={copy}
      className={cn(
        'flex items-center justify-center gap-2 min-w-[140px] px-5 py-2.5 rounded-full border border-gray-200 text-sm font-semibold transition-colors shrink-0',
        copied ? 'text-blue-600' : 'text-[#0A1128] hover:bg-gray-50'
      )}
    >
      {copied
        ? <><CheckCircle2 size={18} className="fill-blue-600 text-white" /> Tersalin</>
        : <><Copy size={16} /> Salin</>}
    </button>
  )
}

// Kolom kode voucher (label abu + kode biru) — sama di kedua modal.
function VoucherCode({ code }) {
  return (
    <div className="shrink-0">
      <div className="text-sm text-gray-500">Kode Voucher:</div>
      <div className="font-bold text-blue-600">{code}</div>
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

  const handleCopied = () => {
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

      <div className="bg-white rounded-[24px] w-full max-w-[520px] shadow-2xl">
        <div className="flex items-start justify-between px-7 py-6">
          <h3 className="text-xl font-bold text-[#0A1128]">Konfirmasi Copy Voucher</h3>
          <button type="button" onClick={onCancel} aria-label="Tutup" className="text-gray-400 hover:text-[#0A1128] transition-colors">
            <X size={22} />
          </button>
        </div>
        <hr className="border-gray-100" />

        <div className="px-7 py-7">
          <div className="flex items-center gap-5">
            <span className="font-bold text-[#0A1128] flex-1 min-w-0">{candidate.name}</span>
            <VoucherCode code={candidate.voucherCode} />
            <CopyPill code={candidate.voucherCode} onCopied={handleCopied} />
          </div>

          <div className="flex justify-end mt-8">
            <button
              disabled={!copied}
              onClick={onConfirm}
              className={cn(
                'font-semibold px-12 py-3.5 rounded-full text-white transition-colors',
                copied ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-300 cursor-not-allowed'
              )}
            >
              Konfirmasi
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Modal konfirmasi massal. List akun terpilih (2 kolom) + kode voucher masing-masing.
export function BulkVoucherModal({ candidates = [], onConfirm, onCancel }) {
  // Bagi kolom-major seperti referensi: 1-5 kiri, 6-10 kanan.
  const half  = Math.ceil(candidates.length / 2)
  const cols  = [candidates.slice(0, half), candidates.slice(half)]

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[24px] w-full max-w-[1100px] shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-start justify-between px-8 py-6 shrink-0">
          <h3 className="text-xl font-bold text-[#0A1128]">Setujui Akun Ini?</h3>
          <button type="button" onClick={onCancel} aria-label="Tutup" className="text-gray-400 hover:text-[#0A1128] transition-colors">
            <X size={22} />
          </button>
        </div>
        <hr className="border-gray-100 shrink-0" />

        <div className="px-8 py-6 overflow-y-auto">
          <p className="text-sm text-gray-500 mb-5">{candidates.length} akun dipilih:</p>

          <div className="flex gap-8">
            {cols.map((col, ci) => (
              col.length === 0 ? null : (
                <div key={ci} className={cn('flex-1 min-w-0 space-y-6', ci === 1 && 'border-l border-gray-200 pl-8')}>
                  {col.map((c, idx) => (
                    <div key={c.id} className="flex items-center gap-4">
                      <span className="w-6 h-6 shrink-0 rounded-full bg-gray-100 text-gray-500 text-xs font-bold flex items-center justify-center">
                        {ci * half + idx + 1}
                      </span>
                      <span className="font-bold text-[#0A1128] flex-1 min-w-0">{c.name}</span>
                      <VoucherCode code={c.voucherCode} />
                      <CopyPill code={c.voucherCode} />
                    </div>
                  ))}
                </div>
              )
            ))}
          </div>
        </div>

        <div className="flex justify-end px-8 pb-7 pt-2 shrink-0">
          <button
            onClick={() => onConfirm(candidates)}
            className="font-semibold px-16 py-3.5 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            Setujui
          </button>
        </div>
      </div>
    </div>
  )
}
