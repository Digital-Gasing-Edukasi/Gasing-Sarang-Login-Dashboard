import illustrationForgotImg from '@/assets/illustrasi_forgotPassword.png'
import { Logo } from '@/components/shared/Logo'
import { MobileHero } from '@/components/layout/MobileHero'

function EnvelopeCluster({ flip = false, className = '' }) {
  return (
    <svg
      viewBox="0 0 240 220"
      fill="none"
      aria-hidden="true"
      className={className}
      style={flip ? { transform: 'scaleX(-1)' } : {}}
    >
      <g transform="translate(10,90) rotate(-14,55,40)">
        <rect x="0" y="0" width="110" height="76" rx="7" fill="white" stroke="#0F172A" strokeWidth="2.5"/>
        <path d="M0 0 L55 40 L110 0" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      </g>
      <path d="M2 195 C -8 168 18 145 38 156 C 22 172 6 188 2 195 Z" fill="#4ADE80"/>
      <path d="M-4 215 C -18 185 12 158 35 172 C 16 190 -1 210 -4 215 Z" fill="#4ADE80"/>
      <path d="M42 210 C 28 188 38 165 58 168 C 52 186 44 205 42 210 Z" fill="#4ADE80"/>
      <g transform="translate(128,14) rotate(12,38,28)">
        <rect x="0" y="0" width="76" height="54" rx="6" fill="white" stroke="#0F172A" strokeWidth="2"/>
        <path d="M0 0 L38 28 L76 0" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      </g>
      <g transform="translate(155,105) rotate(-6,28,20)">
        <rect x="0" y="0" width="56" height="40" rx="5" fill="white" stroke="#0F172A" strokeWidth="1.5"/>
        <path d="M0 0 L28 20 L56 0" stroke="#0F172A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      </g>
      <path d="M218 65 C 232 42 248 52 242 70 C 232 72 220 68 218 65 Z" fill="#4ADE80"/>
      <path d="M230 82 C 248 60 262 74 254 92 C 242 92 228 86 230 82 Z" fill="#4ADE80"/>
      <path d="M10 200 Q 30 170 55 160" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <path d="M225 70 Q 235 90 230 115" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    </svg>
  )
}

export function AuthFullLayout({ children, illustration = 'robot' }) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header desktop — di mobile diganti MobileHero */}
      <header className="hidden lg:flex items-center px-6 pt-6 pb-5 shrink-0">
        <Logo variant="full" />
      </header>
      <div className="hidden lg:block h-px bg-border shrink-0" />

      <MobileHero />

      {/* Mobile: kartu putih "popup" naik menutupi hero (rounded-top). Desktop: full-bleed. */}
      <div className="relative z-10 -mt-6 lg:mt-0 rounded-t-[28px] lg:rounded-none bg-white shadow-[0_-12px_30px_rgba(0,0,0,0.10)] lg:shadow-none flex-1 overflow-hidden flex flex-col">
        {/* Dekorasi ilustrasi hanya desktop */}
        {illustration === 'forgotPassword' ? (
          <>
            <div className="hidden lg:block absolute bottom-0 left-0 w-64 sm:w-80 lg:w-96 translate-y-8 pointer-events-none select-none">
              <img src={illustrationForgotImg} alt="" draggable="false" className="w-full h-full" />
            </div>
            <div className="hidden lg:block absolute bottom-0 right-0 w-64 sm:w-80 lg:w-96 translate-y-8 pointer-events-none select-none">
              <img src={illustrationForgotImg} alt="" draggable="false" className="w-full h-full" style={{ transform: 'scaleX(-1)' }} />
            </div>
          </>
        ) : (
          <>
            <div className="hidden lg:block absolute bottom-0 left-0 w-44 sm:w-56 lg:w-64 pointer-events-none select-none">
              <EnvelopeCluster />
            </div>
            <div className="hidden lg:block absolute bottom-0 right-0 w-44 sm:w-56 lg:w-64 pointer-events-none select-none">
              <EnvelopeCluster flip />
            </div>
          </>
        )}

        <div className="flex-1 flex items-start lg:items-center justify-center px-6 pt-9 pb-8 lg:py-12">
          <div className="w-full max-w-[420px] relative z-10">
            {children}
          </div>
        </div>
      </div>

      <div className="pb-6 shrink-0">
        <p className="text-xs text-muted-foreground text-center">©2026 Gasing Academy. All rights reserved..</p>
      </div>
    </div>
  )
}
