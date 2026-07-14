// src/pages/PaymentSuccessPage.jsx
import { useEffect, useState } from 'react'
import { LogOut, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { subscriptionApi, discourseApi, webAppApi } from '@/lib/api'
import bgDark from '@/assets/dark-mode/Background.png'

function Avatar({ name = '' }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div className="w-9 h-9 rounded-full bg-[#ef4444] text-white flex items-center justify-center text-sm font-semibold">
      {initials || 'U'}
    </div>
  )
}

export default function PaymentSuccessPage({ user, onSignOut, activePlanName }) {
  const WA_NUMBER = import.meta.env.VITE_WA_NUMBER || '628123456789'
  const waUrl     = `https://wa.me/${WA_NUMBER}`

  const handleRedirectDefault = () => {
    webAppApi.redirectWithTokens()
  }

  const handleRedirectSso = async () => {
    try {
      await discourseApi.ssoLogin()
    } catch (error) {
      console.error('Gagal inisiasi SSO:', error)
    }
  }

  // Nama paket: dari props (diteruskan dari App) atau fallback ke cek API
  const [planName, setPlanName] = useState(activePlanName || '')
  const [loading, setLoading]  = useState(!activePlanName)

  useEffect(() => {
    if (activePlanName) return
    subscriptionApi.getStatus()
      .then(data => setPlanName(data.planName || data.plan?.name || 'Visionary'))
      .catch(() => setPlanName('Visionary'))
      .finally(() => setLoading(false))
  }, [activePlanName])

  return (
    <div className="min-h-screen relative overflow-hidden font-sans z-0">
      {/* ═══════════════ MOBILE (tema gelap, sesuai reference) ═══════════════ */}
      <div
        className="lg:hidden relative min-h-screen flex flex-col items-center justify-center text-center text-white px-8 animate-fade-in-up"
        style={{
          background:
            'radial-gradient(ellipse at 50% 35%, #4c1d95 0%, #2e1065 45%, #150a35 100%)',
        }}
      >
        <h1 className="text-[30px] font-bold leading-tight mb-10">
          Pembayaran Kamu{' '}
          <span className="text-[#4ADE80]">Berhasil!</span>
        </h1>
        <button
          onClick={handleRedirectDefault}
          className="px-10 py-3.5 rounded-full bg-white text-[#1a0b3d] font-bold text-[15px] hover:bg-white/90 active:scale-[0.98] transition-all shadow-lg"
        >
          Jelajahi Sarang Gasing
        </button>
        <p className="text-[13px] text-white/50 mt-10">
          Butuh bantuan?{' '}
          <a href={waUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-white/80 underline hover:text-white transition-colors">
            Hubungi Kami
          </a>
        </p>
      </div>

      {/* ═══════════════════════════ DESKTOP (dark) ═══════════════════════════ */}
      <div className="hidden lg:flex relative min-h-screen flex-col bg-[#0D0B2E] text-white">
        {/* wallpaper bokeh */}
        <img
          src={bgDark}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover"
        />

        {/* ── NAVBAR ── */}
        <nav className="relative z-10 flex items-center justify-between px-8 py-5 shrink-0">
          <div className="flex items-center gap-3">
            {/* Slot logo */}
            <div className="w-9 h-9 rounded-full bg-white shrink-0" />
            <span className="font-bold text-white text-lg tracking-tight">Gasing Circle</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={onSignOut}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 border border-white/15 text-sm font-medium text-white/80 hover:bg-white/10 transition-colors"
            >
              <LogOut size={16} />
              Sign Out
            </button>
            <Avatar name={user?.name || user?.profile?.namaLengkap || 'HK'} />
          </div>
        </nav>

        {/* ── CONTENT ── */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 pb-24 animate-fade-in-up">
          {/* Ceklis hijau */}
          <div className="w-20 h-20 rounded-full bg-[#22c55e] flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(34,197,94,0.4)]">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-[42px] font-bold text-white mb-4 tracking-tight">Pembayaran Berhasil!</h1>
          <p className="text-white/55 text-[16px] mb-12 text-center max-w-md leading-relaxed">
            Selamat datang di Gasing Circle, akses kamu sekarang kini telah aktif.
          </p>

          {/* CTA — Pilih Tujuan */}
          <div className="flex flex-col gap-3 w-full max-w-sm">
            <button
              onClick={handleRedirectDefault}
              className={cn(
                'w-full flex items-center justify-between px-6 py-3.5 rounded-full',
                'font-bold text-[#1a0b3d] text-[15px]',
                'bg-white hover:bg-white/90 active:scale-[0.98] transition-all duration-200 shadow-sm'
              )}
            >
              <span>Gasing Web App</span>
              <ArrowRight size={18} />
            </button>
            <button
              onClick={handleRedirectSso}
              className={cn(
                'w-full flex items-center justify-between px-6 py-3.5 rounded-full',
                'font-bold text-[15px] text-white',
                'border border-white/25 hover:bg-white/10 active:scale-[0.98] transition-all duration-200'
              )}
            >
              <span>Komunitas (SSO)</span>
              <ArrowRight size={18} />
            </button>
          </div>

          {/* Hubungi Kami */}
          <p className="text-[14px] text-white/45 mt-10">
            Butuh bantuan?{' '}
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-white/80 underline hover:text-white transition-colors"
            >
              Hubungi Kami
            </a>
          </p>
        </div>

        {/* Footer */}
        <footer className="relative z-10 pb-8 text-center mt-auto">
          <p className="text-[13px] text-white/30">©2026 Gasing Circle. All rights reserved.</p>
        </footer>
      </div>
    </div>
  )
}

