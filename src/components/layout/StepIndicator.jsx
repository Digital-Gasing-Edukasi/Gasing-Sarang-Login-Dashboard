import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

// Progress bar segmented (dipakai di flow signup). Pembungkus sticky + lebar
// kolom disediakan RightPanel (prop topBar) supaya selebar form di tengah.
// current = langkah aktif (1..total). onBack: tampil panah bulat di kiri.
export function StepBar({ current, total = 3, onBack }) {
  return (
    <div className="flex items-center gap-4">
      {onBack && (
        <button
          onClick={onBack}
          aria-label="Kembali"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft size={18} />
        </button>
      )}
      <div className="flex flex-1 items-center gap-2">
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            className={cn(
              'h-1 flex-1 rounded-full transition-colors duration-300',
              i < current ? 'bg-blue-600' : 'bg-muted'
            )}
          />
        ))}
      </div>
      <span className="shrink-0 text-sm font-bold text-foreground">
        {current}/{total}
      </span>
    </div>
  )
}

// Judul header per-langkah signup. Style dipusatkan di sini supaya ketiga step
// (Data Akun / Data Pribadi / Verifikasi Email) tampil seragam. `children`
// dipakai step OTP untuk subtitle (teks "Masukkan kode..." + email).
export function StepHeader({ title, children }) {
  return (
    <div className="animate-fade-in-up delay-100 text-center">
      <h1 className="text-[22px] font-bold text-foreground mb-1.5">{title}</h1>
      {children}
    </div>
  )
}

