// Shell gelap untuk halaman status pembayaran (finish / unfinish / error).
// Sama gaya dengan TransferBankPage & PaymentSuccessPage: wallpaper bokeh,
// navbar "Sarang Gasing", konten di tengah, footer.
import bgDark from '@/assets/dark-mode/Background.png'

const ADMIN_EMAIL = import.meta.env.VITE_CONTACT_ADMIN || 'admin@gasingacademy.org'
export const WA_URL = `mailto:${ADMIN_EMAIL}`

export function PaymentStatusLayout({ children }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0D0B2E] font-sans text-white flex flex-col">
      <img
        src={bgDark}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover"
      />

      <nav className="relative z-10 flex items-center px-6 py-5 lg:px-8 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-white shrink-0" />
          <span className="text-lg font-bold tracking-tight">Sarang Gasing</span>
        </div>
      </nav>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-20 text-center animate-fade-in-up">
        {children}
      </div>

      <footer className="relative z-10 mt-auto pb-8 text-center">
        <p className="text-[13px] text-white/30">©2026 Gasing Academy. All rights reserved..</p>
      </footer>
    </div>
  )
}

// Lingkaran ikon berpendar (hijau/kuning/merah/biru sesuai status).
export function StatusIcon({ icon: Icon, tone = 'green' }) {
  const tones = {
    green:  'bg-[#22c55e] shadow-[0_0_40px_rgba(34,197,94,0.4)]',
    amber:  'bg-[#f59e0b] shadow-[0_0_40px_rgba(245,158,11,0.4)]',
    red:    'bg-[#ef4444] shadow-[0_0_40px_rgba(239,68,68,0.4)]',
    violet: 'bg-[#7c3aed] shadow-[0_0_40px_rgba(124,58,237,0.45)]',
  }
  return (
    <div className={`mb-8 flex h-20 w-20 items-center justify-center rounded-full ${tones[tone]}`}>
      <Icon size={38} strokeWidth={2.2} className="text-white" />
    </div>
  )
}

export function HelpLine() {
  return (
    <p className="mt-10 text-[14px] text-white/45">
      Butuh bantuan?{' '}
      <a
        href={WA_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="font-semibold text-white underline transition-colors hover:text-white/80"
      >
        Hubungi Kami
      </a>
    </p>
  )
}

// Tombol utama putih (CTA) & tombol outline sekunder.
export function StatusPrimaryButton({ as = 'button', className = '', ...props }) {
  const Tag = as
  return (
    <Tag
      className={`flex items-center justify-center gap-2 rounded-full bg-white px-10 py-3.5 text-[15px] font-bold text-[#1a0b3d] transition-all hover:bg-white/90 active:scale-[0.98] ${className}`}
      {...props}
    />
  )
}

export function StatusGhostButton({ as = 'button', className = '', ...props }) {
  const Tag = as
  return (
    <Tag
      className={`flex items-center justify-center gap-2 rounded-full border border-white/25 px-10 py-3.5 text-[15px] font-semibold text-white transition-all hover:bg-white/10 active:scale-[0.98] ${className}`}
      {...props}
    />
  )
}
