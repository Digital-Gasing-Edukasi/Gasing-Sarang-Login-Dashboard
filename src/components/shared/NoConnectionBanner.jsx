import { WifiOff, X } from 'lucide-react'

// Toast error "tidak ada jaringan" (flow 5). Pixel-perfect Figma:
// pill merah #EF4444, rounded-16, center atas panel form (top 40px), whitespace-nowrap.
// Ikon wifi-off kiri (frame 24 / glyph 22), teks 14px medium, tombol X kanan.
export function NoConnectionBanner({ onClose }) {
  return (
    <div className="pointer-events-none absolute top-[40px] left-0 right-0 z-[100] flex justify-center px-4">
      <div className="pointer-events-auto flex max-w-full items-center justify-center gap-2 whitespace-nowrap rounded-2xl bg-[#EF4444] px-4 py-[10px] text-white shadow-[1px_1px_18px_3px_rgba(0,0,0,0.1)] animate-fade-in-up">
        <span className="flex size-6 shrink-0 items-center justify-center">
          <WifiOff size={22} />
        </span>
        <p className="text-[14px] font-medium leading-[1.5]">Tidak Ada Koneksi</p>
        <button
          onClick={onClose}
          aria-label="Tutup"
          className="flex size-6 shrink-0 items-center justify-center text-white/90 transition-colors hover:text-white"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  )
}
