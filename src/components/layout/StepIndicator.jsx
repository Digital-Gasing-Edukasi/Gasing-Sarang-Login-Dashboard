import { ArrowLeft, X } from 'lucide-react'
import { cn } from '@/lib/utils'

// ── MOBILE ────────────────────────────────────────────────────────────────
// Header per-langkah (mock lama): back opsional (kiri) + judul tengah + X close
// (kanan). Spacer w-9 saat back/close absen supaya judul tetap center. Fill bar
// progress mobile disediakan RightPanel (prop `progress`), tepat di bawah header.
export function StepBar({ title, onBack, onClose }) {
  return (
    <div className="flex items-center gap-2">
      {onBack ? (
        <button
          onClick={onBack}
          aria-label="Kembali"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full ml-4 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft size={20} />
        </button>
      ) : (
        <span className="h-9 w-9 shrink-0" aria-hidden="true" />
      )}

      <h1 className="min-w-0 flex-1 truncate text-center text-[17px] font-bold text-foreground">
        {title}
      </h1>

      {onClose ? (
        <button
          onClick={onClose}
          aria-label="Tutup"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground mr-4"
        >
          <X size={20} />
        </button>
      ) : (
        <span className="h-9 w-9 shrink-0" aria-hidden="true" />
      )}
    </div>
  )
}

// ── DESKTOP ───────────────────────────────────────────────────────────────
// Progress header: tombol back bulat (kiri) + bar tersegmen + counter
// "current/total" (kanan). Judul langkah tampil sebagai heading di konten.
export function StepProgress({ current, total, onBack }) {
  return (
      <div className="flex items-center gap-3">
      {onBack && (
        <button
          onClick={onBack}
          aria-label="Kembali"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
        >
          <ArrowLeft size={18} />
        </button>
      )}
      <div className="flex flex-1 items-center gap-1">
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            className={cn(
              'h-1 flex-1 rounded-full transition-colors duration-300',
              i < current ? 'bg-[#0033EC]' : 'bg-gray-200'
            )}
          />
        ))}
      </div>
      <span className="shrink-0 text-[13px] lg:text-[10px] font-semibold ml-2 tabular-nums text-[#030B1F]">
        {current}/{total}
      </span>
    </div>
  )
}

// Subtitle opsional di bawah judul. Dipakai step OTP untuk judul besar (desktop)
// + "Masukkan kode..." + email.
export function StepHeader({ children }) {
  return (
    <div className="animate-fade-in-up delay-100 text-center">
      {children}
    </div>
  )
}
