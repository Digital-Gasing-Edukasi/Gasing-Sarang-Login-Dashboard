import { ArrowLeft, X } from 'lucide-react'

// Header per-langkah flow signup (mobile-first, sesuai mock): tombol back
// opsional (kiri) + judul di tengah + tombol X tutup (kanan). Spacer w-9 dipakai
// saat back/close absen supaya judul tetap center. Pembungkus sticky & lebar
// kolom disediakan RightPanel (prop topBar).
export function StepBar({ title, onBack, onClose }) {
  return (
    <div className="flex items-center gap-2">
      {onBack ? (
        <button
          onClick={onBack}
          aria-label="Kembali"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
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
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X size={20} />
        </button>
      ) : (
        <span className="h-9 w-9 shrink-0" aria-hidden="true" />
      )}
    </div>
  )
}

// Subtitle opsional di bawah header. Dipakai step OTP untuk teks
// "Masukkan kode..." + email; judul langkah sendiri kini ada di StepBar.
export function StepHeader({ children }) {
  return (
    <div className="animate-fade-in-up delay-100 text-center">
      {children}
    </div>
  )
}
