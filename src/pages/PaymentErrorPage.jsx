// src/pages/PaymentErrorPage.jsx
// Landing page untuk PG_MIDTRANS_ERROR_URL
// Midtrans redirect ke sini jika pembayaran gagal / ditolak / expired
// Query params: order_id, status_code, status_message, payment_type
import { AlertTriangle, RotateCcw } from 'lucide-react'
import {
  PaymentStatusLayout,
  StatusIcon,
  HelpLine,
  StatusPrimaryButton,
} from '@/components/shared/PaymentStatusLayout'

export default function PaymentErrorPage() {
  const params        = new URLSearchParams(window.location.search)
  const statusMessage = params.get('status_message') || 'Terjadi kesalahan pada proses pembayaran.'
  const orderId       = params.get('order_id') || ''

  const BASE = (import.meta.env.BASE_URL === '/' ? '' : import.meta.env.BASE_URL) + '/login'

  return (
    <PaymentStatusLayout>
      <StatusIcon icon={AlertTriangle} tone="red" />

      <h1 className="mb-4 text-[42px] font-bold tracking-tight">Pembayaran Gagal</h1>
      <p className="max-w-md text-[16px] leading-relaxed text-white/55">{statusMessage}</p>
      {orderId && (
        <p className="mt-3 font-mono text-xs text-white/35">Order ID: {orderId}</p>
      )}

      <div className="mt-10">
        <StatusPrimaryButton as="a" href={BASE}>
          <RotateCcw size={18} /> Coba Lagi
        </StatusPrimaryButton>
      </div>

      <HelpLine />
    </PaymentStatusLayout>
  )
}
