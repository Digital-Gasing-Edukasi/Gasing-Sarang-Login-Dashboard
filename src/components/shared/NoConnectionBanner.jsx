import { WifiOff, X } from 'lucide-react'

// Banner "Tidak Ada Koneksi" (flow 5). Muncul di atas layar saat request gagal
// karena jaringan (offline / server tak terjangkau). Dismissible.
export function NoConnectionBanner({ onClose }) {
  return (
    <div className="fixed inset-x-0 top-0 z-[130] px-4 pt-3 animate-fade-in-up">
      <div className="mx-auto flex max-w-md items-center gap-3 rounded-2xl border-l-4 border-red-500 bg-[#1a1424] px-4 py-3 text-white shadow-2xl">
        <WifiOff size={22} className="shrink-0 text-red-400" />
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-bold leading-tight">Tidak Ada Koneksi</p>
          <p className="text-[13px] text-white/60 leading-tight mt-0.5">
            Periksa koneksi internet kamu
          </p>
        </div>
        <button
          onClick={onClose}
          className="shrink-0 text-white/50 hover:text-white transition-colors"
          aria-label="Tutup"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  )
}
