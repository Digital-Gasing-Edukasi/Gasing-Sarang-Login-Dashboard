// src/pages/PaymentSuccessPage.jsx
import React, { useEffect, useState } from 'react'
import { CheckCircle2, LogOut, MessageCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { subscriptionApi } from '@/lib/api'

function Avatar({ name = '' }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-semibold">
      {initials || 'U'}
    </div>
  )
}

export default function PaymentSuccessPage({ user, onSignOut, activePlanName }) {
  const DISCOURSE_URL = import.meta.env.VITE_DISCOURSE_URL || '#'
  const WA_NUMBER    = import.meta.env.VITE_WA_NUMBER || '628123456789'
  const waUrl        = `https://wa.me/${WA_NUMBER}`

  // Nama paket: dari props (diteruskan dari App) atau fallback ke cek API
  const [planName, setPlanName] = useState(activePlanName || '')
  const [loading, setLoading]  = useState(!activePlanName)

  useEffect(() => {
    if (activePlanName) return
    // Kalau tidak ada props, fetch dari API
    subscriptionApi.getStatus()
      .then(data => setPlanName(data.planName || data.plan?.name || 'Visionary'))
      .catch(() => setPlanName('Visionary'))
      .finally(() => setLoading(false))
  }, [activePlanName])

  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* ── NAVBAR ── */}
      <nav className="flex items-center justify-between px-8 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">G</span>
          </div>
          <span className="font-semibold text-gray-900">Gasing Circle</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onSignOut}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <LogOut size={15} />
            Sign Out
          </button>
          <Avatar name={user?.name || user?.profile?.namaLengkap || ''} />
        </div>
      </nav>

      {/* ── CONTENT ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-16 animate-fade-in-up">

        {/* Icon sukses */}
        <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mb-6">
          <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center">
            <CheckCircle2 size={32} className="text-blue-600" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-3">Pembayaran Berhasil</h1>
        <p className="text-gray-500 text-sm mb-8 text-center max-w-sm">
          Selamat datang di Gasing Circle, akses Anda sekarang kini telah aktif.
        </p>

        {/* Nama paket aktif */}
        <div className="bg-green-50 border border-green-100 rounded-full px-5 py-2 mb-10">
          {loading
            ? <Loader2 size={16} className="animate-spin text-green-600" />
            : (
              <p className="text-sm text-gray-600">
                Paket Aktif:{' '}
                <span className="font-semibold text-blue-600">{planName}</span>
              </p>
            )
          }
        </div>

        {/* CTA — Mulai jelajahi komunitas */}
        <a
          href={DISCOURSE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            'w-full max-w-xs py-3.5 rounded-xl font-semibold text-white text-sm text-center',
            'bg-blue-600 hover:bg-blue-700 active:scale-[0.98] transition-all duration-200',
            'flex items-center justify-center gap-2 mb-4'
          )}
        >
          Mulai Jelajahi Komunitas
        </a>

        {/* Hubungi Kami */}
        <p className="text-sm text-gray-500">
          Butuh bantuan?{' '}
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-gray-900 underline underline-offset-2 hover:text-blue-600 transition-colors"
          >
            Hubungi Kami
          </a>
        </p>
      </div>

      {/* Footer */}
      <footer className="pb-6 text-center">
        <p className="text-xs text-gray-400">©2026 Gasing Circle. All rights reserved.</p>
      </footer>
    </div>
  )
}
