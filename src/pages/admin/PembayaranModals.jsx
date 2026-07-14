import { useState, useEffect } from 'react'
import { X, ImageOff, Download } from 'lucide-react'
import { cn } from '@/lib/utils'

function Field({ label, value }) {
  return (
    <div>
      <div className="text-xs text-gray-400 mb-0.5">{label}</div>
      <div className="text-[15px] font-bold text-[#0A1128]">{value || '-'}</div>
    </div>
  )
}

// Modal detail bukti transfer. Tombol "Tolak Pembayaran" tidak commit langsung —
// memanggil onReject supaya parent membuka TolakPembayaranModal (pilih alasan).
export function KonfirmasiPembayaranModal({ candidate, onConfirm, onReject, onCancel }) {
  if (!candidate) return null
  const p = candidate.payment || {}

  const handleUnduh = () => {
    if (!p.receiptUrl) return
    window.open(p.receiptUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-[24px] w-full max-w-[620px] shadow-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-8 pb-5 overflow-y-auto">
          <div className="flex items-start justify-between mb-1">
            <h3 className="text-2xl font-bold text-[#0A1128]">Konfirmasi Pembayaran?</h3>
            <button onClick={onCancel} className="text-gray-400 hover:text-[#0A1128] transition-colors">
              <X size={22} />
            </button>
          </div>
          <p className="text-gray-500 text-sm mb-6">
            Akun: <span className="font-bold text-[#0A1128]">{candidate.name}</span>
          </p>

          <div className="grid grid-cols-2 gap-8">
            {/* Kiri: detail pengirim */}
            <div className="space-y-4">
              <Field label="Nama Pengirim" value={p.senderName} />
              <Field label="Bank Asal" value={p.bank} />
              <Field label="Tanggal Transfer" value={p.transferDate} />
              <Field label="Paket" value={p.packageName} />
            </div>

            {/* Kanan: preview bukti — gambar asli yang diunggah user. */}
            <div>
              <div className="text-xs text-gray-400 mb-2">Bukti Transfer</div>
              <div className="border border-gray-200 rounded-2xl p-3 flex flex-col items-center text-center">
                {p.receiptUrl ? (
                  <button
                    onClick={handleUnduh}
                    className="w-full rounded-lg overflow-hidden bg-gray-50 border border-gray-100 cursor-zoom-in"
                    title="Klik untuk buka gambar penuh"
                  >
                    <img
                      src={p.receiptUrl}
                      alt="Bukti transfer"
                      className="w-full max-h-[280px] object-contain"
                    />
                  </button>
                ) : (
                  <div className="w-full rounded-lg bg-gray-50 border border-gray-100 py-10 flex flex-col items-center text-gray-400">
                    <ImageOff size={36} className="mb-2" />
                    <div className="text-sm">Bukti belum diunggah</div>
                  </div>
                )}
                <button
                  onClick={handleUnduh}
                  disabled={!p.receiptUrl}
                  className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#0A1128] border border-gray-200 hover:bg-gray-50 px-5 py-2 rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Download size={16} /> Unduh
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 p-6 bg-gray-50/70 border-t border-gray-100">
          <button
            onClick={onReject}
            className="flex-1 font-semibold text-red-500 border border-red-300 bg-white hover:bg-red-50 px-6 py-3.5 rounded-full transition-colors"
          >
            Tolak Pembayaran
          </button>
          <button
            onClick={() => onConfirm(candidate)}
            className="flex-1 font-semibold px-6 py-3.5 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            Konfirmasi Pembayaran
          </button>
        </div>
      </div>
    </div>
  )
}

// Alasan penolakan (value = dikirim ke BE; label = tampilan).
export const TOLAK_REASONS = [
  { value: 'receipt_unreadable', label: 'Bukti pembayaran tidak terbaca / salah' },
  { value: 'wrong_amount',       label: 'Nominal transfer salah' },
  { value: 'wrong_account',      label: 'Rekening tujuan salah' },
]

export function TolakPembayaranModal({ candidate, onConfirm, onCancel }) {
  const [reason, setReason] = useState(TOLAK_REASONS[0].value)

  // Reset ke pilihan pertama tiap kandidat berganti.
  useEffect(() => { setReason(TOLAK_REASONS[0].value) }, [candidate])

  if (!candidate) return null

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-[24px] w-full max-w-[460px] shadow-2xl mx-4 flex flex-col">
        <div className="p-8 pb-5">
          <h3 className="text-2xl font-bold text-red-500 mb-1.5">Tolak Pembayaran?</h3>
          <p className="text-gray-500 text-sm mb-6">
            Akun: <span className="font-bold text-[#0A1128]">{candidate.name}</span>
          </p>

          <div className="text-sm font-medium text-[#0A1128] mb-2">Pilih alasan penolakan:</div>
          <div className="space-y-1">
            {TOLAK_REASONS.map(r => {
              const on = reason === r.value
              return (
                <label key={r.value} className="flex items-center gap-3 py-2 cursor-pointer select-none">
                  <span className={cn(
                    'w-5 h-5 rounded-full border flex items-center justify-center transition-colors shrink-0',
                    on ? 'border-blue-600' : 'border-gray-300'
                  )}>
                    {on && <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
                  </span>
                  <input type="radio" name="tolak-reason" checked={on} onChange={() => setReason(r.value)} className="sr-only" />
                  <span className="text-[15px] text-[#0A1128]">{r.label}</span>
                </label>
              )
            })}
          </div>
        </div>

        <div className="flex items-center gap-4 p-6 bg-gray-50/70 border-t border-gray-100 rounded-b-[24px]">
          <button
            onClick={onCancel}
            className="flex-1 font-semibold text-[#0A1128] border border-gray-200 bg-white hover:bg-gray-50 px-6 py-3.5 rounded-full transition-colors"
          >
            Batalkan
          </button>
          <button
            onClick={() => onConfirm({
              candidate,
              reason,
              reasonLabel: TOLAK_REASONS.find(r => r.value === reason)?.label || reason,
            })}
            className="flex-1 font-semibold px-6 py-3.5 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
          >
            Tolak Pembayaran
          </button>
        </div>
      </div>
    </div>
  )
}
