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
    <div className="animate-fade-in-up mb-6 flex items-center gap-3 rounded-xl bg-[#EF4444] px-5 py-3.5 text-white shadow-lg">
      <p className="min-w-0 flex-1 text-[15px] leading-tight">
        Terlalu banyak percobaan login. Silakan coba lagi dalam {fmt(left)}.
      </p>
      <button
        onClick={onClose}
        aria-label="Tutup"
        className="shrink-0 text-white/80 transition-colors hover:text-white"
      >
        <X size={20} />
      </button>
    </div>
  )
}
