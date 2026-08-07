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
    <div className="pointer-events-none absolute top-[40px] left-0 right-0 z-[100] flex justify-center px-4">
      <div className="pointer-events-auto flex max-w-full items-center justify-center gap-4 whitespace-nowrap rounded-2xl bg-[#EF4444] px-5 py-3 text-white shadow-[1px_1px_18px_3px_rgba(0,0,0,0.1)] animate-fade-in-up">
        <p className="text-[16px] font-medium leading-[1.5]">
          Terlalu banyak percobaan login. Silakan coba lagi dalam {fmt(left)}.
        </p>
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
