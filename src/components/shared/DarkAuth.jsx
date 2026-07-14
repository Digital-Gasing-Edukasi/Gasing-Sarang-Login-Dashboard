import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import bgImg from '@/assets/dark-mode/Background.png'
import { Logo } from '@/components/shared/Logo'

// Layout auth full-bleed tema gelap (desktop). Wallpaper = Background.png,
// logo kiri-atas, konten di tengah, footer bawah.
export function AuthDarkLayout({ children, maxWidth = 'max-w-[520px]' }) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#0D0B2E] flex flex-col">
      <img
        src={bgImg}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover"
      />

      {/* Logo — pojok kiri-atas: padding 16px (mobile) / 24px (desktop non-split) */}
      <header className="relative z-10 px-4 pt-4 lg:px-6 lg:pt-6 shrink-0">
        <div className="flex items-center">
          <Logo variant="responsive" />
        </div>
      </header>

      {/* Konten */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-6 py-10">
        <div className={cn('w-full', maxWidth)}>{children}</div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 pb-6 shrink-0">
        <p className="text-center text-xs text-white/45">©2026 Gasing Academy. All rights reserved..</p>
      </footer>
    </div>
  )
}

// Input pill tema gelap (glass).
export function DarkInput({ icon: Icon, iconRight, error, className, ...props }) {
  return (
    <div className="relative flex items-center">
      {Icon && (
        <span className="absolute left-4 text-white/40 pointer-events-none z-10">
          <Icon size={18} />
        </span>
      )}
      <input
        className={cn(
          'w-full rounded-full bg-white/[0.06] border py-3.5 text-[15px] text-white placeholder:text-white/35 outline-none transition-colors focus:border-[#a78bfa]/70 focus:bg-white/[0.09]',
          Icon ? 'pl-12' : 'pl-5',
          iconRight ? 'pr-12' : 'pr-5',
          error ? 'border-red-400/70' : 'border-white/15',
          className
        )}
        {...props}
      />
      {iconRight}
    </div>
  )
}

export function DarkTogglePassword({ show, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="absolute right-4 z-10 text-white/40 hover:text-white/70 transition-colors"
    >
      {show ? <Eye size={18} /> : <EyeOff size={18} />}
    </button>
  )
}

// Tombol utama pill.
//   variant "gradient" (default) — gradient ungu aktif, glass abu saat disabled.
//   variant "white"              — putih solid; opacity 90% aktif, 30% saat disabled.
export function DarkPrimaryButton({ children, className, variant = 'gradient', ...props }) {
  return (
    <button
      className={cn(
        'w-full rounded-full py-4 font-bold text-[15px] transition-all active:scale-[0.99]',
        'flex items-center justify-center gap-2',
        variant === 'white'
          ? 'bg-white text-[#1a0b3d] opacity-90 hover:opacity-100 disabled:opacity-30 disabled:cursor-not-allowed'
          : cn(
              'text-white bg-gradient-to-r from-[#7c3aed] to-[#a855f7] hover:brightness-110',
              'disabled:from-white/[0.12] disabled:to-white/[0.12] disabled:text-white/45 disabled:cursor-not-allowed disabled:hover:brightness-100'
            ),
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

// Tombol sekunder pill — outline transparan.
export function DarkGhostButton({ children, className, ...props }) {
  return (
    <button
      className={cn(
        'w-full rounded-full py-3.5 font-bold text-[15px] text-white border border-white/25 hover:bg-white/[0.06] transition-colors',
        'flex items-center justify-center gap-2',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export function DarkDivider() {
  return (
    <div className="flex items-center my-6">
      <div className="mx-auto h-px w-14 bg-white/20" />
    </div>
  )
}
