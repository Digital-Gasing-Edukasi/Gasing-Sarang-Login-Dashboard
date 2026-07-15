// src/pages/PaymentUnfinishPage.jsx
// Landing page untuk PG_MIDTRANS_UNFINISH_URL
// Midtrans redirect ke sini jika user menutup halaman tanpa menyelesaikan pembayaran
import { XCircle, RotateCcw } from 'lucide-react'
import {
  PaymentStatusLayout,
  StatusIcon,
  HelpLine,
  StatusPrimaryButton,
} from '@/components/shared/PaymentStatusLayout'

export default function PaymentUnfinishPage() {
  const BASE = (import.meta.env.BASE_URL === '/' ? '' : import.meta.env.BASE_URL) + '/login'

  return (
    <PaymentStatusLayout>
      <StatusIcon icon={XCircle} tone="violet" />

      <h1 className="mb-4 text-[42px] font-bold tracking-tight">Pembayaran Belum Selesai</h1>
      <p className="max-w-md text-[16px] leading-relaxed text-white/55">
        Kamu meninggalkan halaman pembayaran sebelum menyelesaikan transaksi. Silakan coba lagi.
      </p>

      <div className="mt-10">
        <StatusPrimaryButton as="a" href={BASE}>
          <RotateCcw size={18} /> Coba Lagi
        </StatusPrimaryButton>
      </div>

      <HelpLine />
    </PaymentStatusLayout>
  )
}
