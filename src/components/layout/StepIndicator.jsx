import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

// Progress bar segmented + sticky (dipakai di flow signup).
// current = langkah aktif (1..total). onBack: tampil panah bulat di kiri.
export function StepBar({ current, total = 3, onBack }) {
  return (
    <div className="sticky top-0 z-20 -mx-6 lg:-mx-16 mb-8 bg-background/90 px-6 lg:px-16 pt-2 pb-4 backdrop-blur supports-[backdrop-filter]:bg-background/75">
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
    </div>
  )
}

