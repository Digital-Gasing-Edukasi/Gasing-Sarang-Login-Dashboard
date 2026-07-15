// src/pages/PaymentFinishPage.jsx
// Landing page untuk PG_MIDTRANS_FINISH_URL
// Midtrans redirect ke sini setelah user menyelesaikan / melewati halaman pembayaran
// Query params: order_id, status_code, transaction_status, payment_type
import { CheckCircle, Clock, ArrowRight, Hourglass } from 'lucide-react'
import { webAppApi } from '@/lib/api'
import {
  PaymentStatusLayout,
  StatusIcon,
  HelpLine,
  StatusPrimaryButton,
} from '@/components/shared/PaymentStatusLayout'

export default function PaymentFinishPage() {
  const params            = new URLSearchParams(window.location.search)
  const transactionStatus = params.get('transaction_status') || ''
  const orderId           = params.get('order_id') || ''

  const isSuccess = ['settlement', 'capture'].includes(transactionStatus)
  const isPending = transactionStatus === 'pending'

  const BASE = (import.meta.env.BASE_URL === '/' ? '' : import.meta.env.BASE_URL) + '/login'

  const view = isSuccess
    ? {
        icon: CheckCircle,
        tone: 'green',
        title: 'Pembayaran Berhasil!',
        desc: 'Selamat datang di Sarang Gasing, akses kamu sekarang telah aktif.',
      }
    : isPending
      ? {
          icon: Clock,
          tone: 'amber',
          title: 'Menunggu Pembayaran',
          desc: 'Pembayaran sedang diproses. Akses akan aktif otomatis setelah dikonfirmasi.',
        }
      : {
          icon: Hourglass,
          tone: 'violet',
          title: 'Pembayaran Diproses',
          desc: 'Status transaksi sedang diverifikasi. Silakan cek email atau hubungi kami.',
        }

  return (
    <PaymentStatusLayout>
      <StatusIcon icon={view.icon} tone={view.tone} />

      <h1 className="mb-4 text-[42px] font-bold tracking-tight">{view.title}</h1>
      <p className="max-w-md text-[16px] leading-relaxed text-white/55">{view.desc}</p>
      {orderId && (
        <p className="mt-3 font-mono text-xs text-white/35">Order ID: {orderId}</p>
      )}

      <div className="mt-10">
        {isSuccess ? (
          <StatusPrimaryButton onClick={() => webAppApi.redirectWithTokens()}>
            Gasing Web App <ArrowRight size={18} />
          </StatusPrimaryButton>
        ) : (
          <StatusPrimaryButton as="a" href={BASE}>
            Kembali ke Beranda <ArrowRight size={18} />
          </StatusPrimaryButton>
        )}
      </div>

      <HelpLine />
    </PaymentStatusLayout>
  )
}
