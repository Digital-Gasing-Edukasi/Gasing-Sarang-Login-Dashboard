// src/pages/PaymentFinishPage.jsx
// Landing page untuk PG_MIDTRANS_FINISH_URL
// Midtrans redirect ke sini setelah user menyelesaikan / melewati halaman pembayaran
// Query params: order_id, status_code, transaction_status, payment_type
import { CheckCircle, Clock, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { webAppApi } from '@/lib/api'

function Decorations({ color }) {
  return (
    <>
      <div className="absolute inset-0 bg-gradient-to-br from-[#f0f6ff] via-[#f7fafe] to-[#f0f6ff] pointer-events-none -z-20" />
      <svg
        className={`absolute bottom-0 left-0 w-full pointer-events-none -z-10 ${color}`}
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
        style={{ height: '40vh', minHeight: '320px' }}
      >
        <path
          fill="currentColor"
          fillOpacity="1"
          d="M0,256L48,229.3C96,203,192,149,288,144C384,139,480,181,576,192C672,203,768,181,864,154.7C960,128,1056,96,1152,106.7C1248,117,1344,171,1392,197.3L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
        />
      </svg>
    </>
  )
}

export default function PaymentFinishPage() {
  const params            = new URLSearchParams(window.location.search)
  const transactionStatus = params.get('transaction_status') || ''
  const orderId           = params.get('order_id') || ''

  const isSuccess = ['settlement', 'capture'].includes(transactionStatus)
  const isPending = transactionStatus === 'pending'

  const WA_NUMBER     = import.meta.env.VITE_WA_NUMBER || '628123456789'
  const waUrl         = `https://wa.me/${WA_NUMBER}`
  const BASE          = import.meta.env.BASE_URL || '/register/'

  return (
    <div className="min-h-screen relative overflow-hidden font-sans z-0 flex flex-col">
      <Decorations color={isSuccess ? 'text-[#0a1128]' : 'text-[#78350f]'} />

      {/* Navbar */}
      <nav className="relative z-10 flex items-center px-8 py-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">G</span>
          </div>
          <span className="font-bold text-gray-900 text-lg tracking-tight">Gasing Circle</span>
        </div>
      </nav>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 pb-32 animate-fade-in-up">

        {isSuccess ? (
          <>
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h1 className="text-[40px] font-bold text-[#10b981] mb-4 tracking-tight text-center">
              Pembayaran Berhasil!
            </h1>
            <p className="text-gray-500 text-[15px] mb-3 text-center max-w-md">
              Selamat datang di Gasing Circle, akses Anda sekarang telah aktif.
            </p>
            {orderId && (
              <p className="text-xs text-gray-400 mb-10 font-mono">Order ID: {orderId}</p>
            )}
            <button
              onClick={() => webAppApi.redirectWithTokens()}
              className={cn(
                'px-10 py-3.5 rounded-full font-semibold text-white text-[15px]',
                'bg-[#003cf9] hover:bg-blue-700 active:scale-[0.98] transition-all duration-200 shadow-md',
                'flex items-center gap-2 mb-10'
              )}
            >
              Gasing Web App <ArrowRight size={16} />
            </button>
          </>
        ) : isPending ? (
          <>
            <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mb-6">
              <Clock className="w-10 h-10 text-amber-500" />
            </div>
            <h1 className="text-[40px] font-bold text-amber-500 mb-4 tracking-tight text-center">
              Menunggu Pembayaran
            </h1>
            <p className="text-gray-500 text-[15px] mb-3 text-center max-w-md">
              Pembayaran sedang diproses. Akses akan aktif otomatis setelah dikonfirmasi.
            </p>
            {orderId && (
              <p className="text-xs text-gray-400 mb-10 font-mono">Order ID: {orderId}</p>
            )}
            <a
              href={BASE}
              className={cn(
                'px-10 py-3.5 rounded-full font-semibold text-white text-[15px]',
                'bg-amber-500 hover:bg-amber-600 active:scale-[0.98] transition-all duration-200 shadow-md',
                'flex items-center gap-2 mb-10'
              )}
            >
              Kembali ke Beranda
            </a>
          </>
        ) : (
          <>
            <h1 className="text-[36px] font-bold text-gray-700 mb-4 tracking-tight text-center">
              Pembayaran Diproses
            </h1>
            <p className="text-gray-500 text-[15px] mb-10 text-center max-w-md">
              Status transaksi sedang diverifikasi. Silakan cek email atau hubungi kami.
            </p>
            <a href={BASE} className="px-8 py-3 rounded-full bg-gray-800 text-white font-semibold hover:bg-gray-900 transition-colors mb-10">
              Kembali ke Beranda
            </a>
          </>
        )}

        <p className="text-[14px] text-gray-500">
          Butuh bantuan?{' '}
          <a href={waUrl} target="_blank" rel="noopener noreferrer"
            className="font-semibold text-gray-900 hover:text-blue-600 transition-colors">
            Hubungi Kami
          </a>
        </p>
      </div>

      <footer className="relative z-10 pb-8 text-center mt-auto">
        <p className="text-[13px] text-gray-400">©2026 Gasing Circle. All rights reserved.</p>
      </footer>
    </div>
  )
}
