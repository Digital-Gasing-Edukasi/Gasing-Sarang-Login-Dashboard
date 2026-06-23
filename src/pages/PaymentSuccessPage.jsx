// src/pages/PaymentSuccessPage.jsx
import React, { useEffect, useState } from 'react'
import { LogOut, Loader2, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { subscriptionApi, discourseApi, webAppApi } from '@/lib/api'

function Avatar({ name = '' }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div className="w-9 h-9 rounded-full bg-[#fce4e4] text-red-500 flex items-center justify-center text-sm font-semibold">
      {initials || 'U'}
    </div>
  )
}

// ─── BACKGROUND DECORATIONS ──────────────────────────────────────────────────
function Decorations() {
  return (
    <>
      {/* Background gradient & blobs */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#f0f6ff] via-[#f7fafe] to-[#f0f6ff] pointer-events-none -z-20" />
      
      {/* Dark Navy Wave Background */}
      <svg className="absolute bottom-0 left-0 w-full text-[#0a1128] pointer-events-none -z-10" viewBox="0 0 1440 320" preserveAspectRatio="none" style={{height: '40vh', minHeight: '320px'}}>
        <path fill="currentColor" fillOpacity="1" d="M0,256L48,229.3C96,203,192,149,288,144C384,139,480,181,576,192C672,203,768,181,864,154.7C960,128,1056,96,1152,106.7C1248,117,1344,171,1392,197.3L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
      </svg>
    </>
  );
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
    <div className="min-h-screen relative overflow-hidden font-sans z-0 flex flex-col">
      <Decorations />

      {/* ── NAVBAR ── */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">G</span>
          </div>
          <span className="font-bold text-gray-900 text-lg tracking-tight">Gasing Circle</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={onSignOut}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gray-50/80 border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <LogOut size={16} />
            Sign Out
          </button>
          <Avatar name={user?.name || user?.profile?.namaLengkap || 'HK'} />
        </div>
      </nav>

      {/* ── CONTENT ── */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 pb-32 animate-fade-in-up">

        <h1 className="text-[40px] font-bold text-[#10b981] mb-4 tracking-tight">Pembayaran Berhasil</h1>
        <p className="text-gray-500 text-[15px] mb-12 text-center max-w-md">
          Selamat datang di Gasing Circle, akses Anda sekarang kini telah aktif.
        </p>

        {/* CTA — Pilih Tujuan */}
        <div className="flex flex-col gap-3 w-full max-w-sm mb-10">
          <button
            onClick={handleRedirectDefault}
            className={cn(
              'w-full flex items-center justify-between px-6 py-3.5 rounded-full',
              'font-semibold text-white text-[15px]',
              'bg-[#003cf9] hover:bg-blue-700 active:scale-[0.98] transition-all duration-200 shadow-md'
            )}
          >
            <span>Gasing Web App</span>
            <ArrowRight size={18} />
          </button>
          <button
            onClick={handleRedirectSso}
            className={cn(
              'w-full flex items-center justify-between px-6 py-3.5 rounded-full',
              'font-semibold text-[15px]',
              'bg-white text-gray-800 border border-gray-300 hover:bg-gray-50 active:scale-[0.98] transition-all duration-200 shadow-sm'
            )}
          >
            <span>Komunitas (SSO)</span>
            <ArrowRight size={18} />
          </button>
        </div>

        {/* Hubungi Kami */}
        <p className="text-[14px] text-gray-500">
          Butuh bantuan?{' '}
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-gray-900 hover:text-blue-600 transition-colors"
          >
            Hubungi Kami
          </a>
        </p>
      </div>

      {/* Footer */}
      <footer className="relative z-10 pb-8 text-center mt-auto">
        <p className="text-[13px] text-gray-400">©2026 Gasing Circle. All rights reserved.</p>
      </footer>
    </div>
  )
}

