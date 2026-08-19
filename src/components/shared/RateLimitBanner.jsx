import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

// "1 menit" / "45 detik" — dibulatkan ke atas biar tidak pernah janji terlalu cepat.
const fmt = (s) => (s >= 60 ? `${Math.ceil(s / 60)} menit` : `${s} detik`)

// Banner rate-limit (HTTP 429 dari NestJS Throttler). Hitung mundur sisa cooldown;
// saat habis, banner hilang sendiri lewat onExpire (dipakai juga untuk buka blokir
// tombol Login di LoginPage). seconds = Retry-After dari backend.
export function RateLimitBanner({ seconds = 60, onClose, onExpire }) {
  const [left, setLeft] = useState(seconds)

  useEffect(() => { setLeft(seconds) }, [seconds])

  useEffect(() => {
    if (left <= 0) { onExpire?.(); return }
    const id = setTimeout(() => setLeft((s) => s - 1), 1000)
    return () => clearTimeout(id)
  }, [left, onExpire])

  if (left <= 0) return null

  return (
    <div className="pointer-events-none fixed top-6 left-0 right-0 z-[100] flex justify-center px-4">
      {/* Mobile (Figma node 9031:60718): pill lebar penuh, teks 14px center WRAP 2 baris,
          tanpa tombol X. Desktop (sm:) balik ke satu baris nowrap + tombol X. */}
      <div className="pointer-events-auto flex w-full max-w-[358px] items-center justify-center gap-4 rounded-[100px] bg-[#EF4444] px-5 py-[10px] text-white shadow-[1px_1px_18px_3px_rgba(0,0,0,0.1)] animate-fade-in-up sm:w-auto sm:max-w-full sm:rounded-2xl sm:py-3">
        <p className="flex-1 text-center text-[14px] font-medium leading-[1.5] sm:flex-none sm:text-left sm:text-[16px] sm:whitespace-nowrap">
          Terlalu banyak percobaan login. Silakan coba lagi dalam {fmt(left)}.
        </p>
        <button
          onClick={onClose}
          aria-label="Tutup"
          className="hidden size-6 shrink-0 items-center justify-center text-white/90 transition-colors hover:text-white sm:flex"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  )
}
