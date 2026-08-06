// Pill "Kode Voucher" — satu-satunya sumber style kolom voucher di semua tabel
// admin (Verifikasi Akun, Verifikasi Pembayaran, Manajemen Akun). Kosong → '-'.
export function VoucherCode({ code }) {
  if (!code) return <span className="text-gray-400">-</span>
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs border border-blue-100 bg-blue-50 text-blue-600 font-bold">
      {code}
    </div>
  )
}
