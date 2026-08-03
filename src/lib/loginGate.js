// Evaluasi status akun dari profil (GET /profile/me) untuk menentukan apakah
// login diblokir + modal mana yang tampil. Prioritas: suspended > pending > expired.
//
// TODO(verify): sesuaikan nama field dengan respons /profile/me sebenarnya.
//   - suspend  : suspendedUntil / suspended  (endpoint admin /suspend)
//   - verifikasi: verifiedStatus NUMBER → 1=approved, 2=revise, -1=rejected, lainnya=waiting
//   - langganan : activeSubscription | subscription → { status: 'active'|'expired'|... }
//
// Return null (login lolos) atau { type: 'suspended'|'pending'|'expired', ...meta }.
export function evaluateLoginGate(profile) {
  const p = profile?.user || profile?.data || profile || {}

  // 1. Ditangguhkan — admin men-suspend akun (paling tinggi prioritas).
  //    until  : suspendedUntil ("YYYY-MM-DD HH:mm:ss" / ISO) — lihat SuspendModal.
  //    reason : alasan penangguhan (dropdown REASONS di SuspendModal).
  if (p.suspendedUntil || p.suspended) {
    const s = typeof p.suspended === 'object' ? p.suspended : {}
    return {
      type: 'suspended',
      until: p.suspendedUntil || s.until || s.suspendedUntil || null,
      reason: p.suspendReason || p.suspensionReason || s.reason || '',
    }
  }

  // 2. Pending — akun belum di-approve admin (verifiedStatus = waiting).
  //    Revise (2) & rejected (-1) punya alur email sendiri → tidak digate di sini.
  const vs = p.verifiedStatus
  const approved = vs === 1 || vs === 'approved'
  const revise   = vs === 2 || vs === 'revise'
  const rejected = vs === -1 || vs === 'rejected'

  // 2a. Ditolak — pendaftaran tidak disetujui admin (verifiedStatus = -1) →
  //     modal "Akun Belum Dapat Disetujui" (bukan alur email). Revise (2) tetap
  //     lewat alur email/FixData tersendiri.
  //     TODO(verify): nama field alasan penolakan dari /profile/me
  //     (rejectionReasons | rejectReasons | reviseFields). Fallback: default 3
  //     alasan di LoginStatusModal.
  if (rejected) {
    const reasons = p.rejectionReasons || p.rejectReasons || p.reviseFields || p.rejectionReason || null
    return {
      type: 'rejected',
      reasons: Array.isArray(reasons) ? reasons : reasons ? [reasons] : undefined,
    }
  }

  if (vs !== undefined && vs !== null && !approved && !revise && !rejected) {
    return { type: 'pending' }
  }

  // 3. Masa langganan berakhir — hanya bila status eksplisit 'expired'.
  //    (belum pernah langganan → biarkan lolos, App arahkan ke halaman langganan.)
  const sub = p.activeSubscription || p.subscription
  if (sub?.status === 'expired') {
    return { type: 'expired' }
  }

  return null
}

// Evaluasi payment terakhir (GET /subscription/payments/latest) untuk gate
// "Pembayaran Ditolak". Return null bila payment TIDAK ditolak.
//
// Status ditolak: 'failed' | 'rejected'. Varian modal ditentukan dari alasan
// tolak admin (notes/reason) — cocokkan ke 3 kategori TOLAK_REASONS
// (lihat src/pages/admin/PembayaranModals.jsx). Admin mengirim LABEL sbg `notes`,
// jadi cocokkan value-code MAUPUN kata kunci label:
//   receipt_unreadable / "bukti"/"terbaca" → 'receipt' (unggah ulang bukti)
//   wrong_amount        / "nominal"        → 'amount'  (tampilkan total tagihan)
//   wrong_account       / "rekening"       → 'account' (tampilkan rekening resmi)
// Default (alasan tak dikenal) → 'receipt' (paling aman: minta unggah ulang).
export function evaluatePaymentGate(payment) {
  const p = payment?.payment || payment?.data || payment || {}
  const status = String(p.status || '').toLowerCase()
  if (status !== 'failed' && status !== 'rejected') return null

  const raw = String(
    p.rejectionReason || p.rejectReason || p.reason || p.notes || ''
  ).toLowerCase()

  let variant = 'receipt'
  if (raw.includes('wrong_amount') || raw.includes('nominal')) variant = 'amount'
  else if (raw.includes('wrong_account') || raw.includes('rekening')) variant = 'account'

  const amount = p.amount ?? p.total ?? p.grossAmount ?? null

  // Rekening tujuan resmi dari respons payment (varian 'account'). Nama field
  // belum final (samakan dgn TransferBankPage `pick`). Hanya sertakan nilai
  // yang terdefinisi — sisanya di-fallback ke RECEIVER_BANK di LoginStatusModal.
  // TODO(verify): nama field rekening dari /subscription/payments/latest.
  const pickStr = (...keys) => {
    for (const k of keys) {
      const v = p[k]
      if (v !== undefined && v !== null && v !== '') return v
    }
    return undefined
  }
  const bank = {
    bank: pickStr('bankName', 'bank', 'destinationBank'),
    accountNumber: pickStr('bankAccountNumber', 'accountNumber', 'vaNumber'),
    accountName: pickStr('bankAccountName', 'accountName'),
  }

  // Paket terakhir yang dibeli — dipakai varian 'receipt' untuk deep-link ke
  // TransferBankPage (unggah ulang bukti tanpa memilih paket lagi). Bentuk
  // dibuat kompatibel dgn prop `plan` TransferBankPage (id/name/priceTotal/...).
  const pkg = p.package || p.packageDetail || {}
  const planId = pkg.id ?? p.packageId ?? p.package_id ?? null
  const plan = planId
    ? {
        id: planId,
        name: pkg.name ?? p.packageName ?? p.planName ?? null,
        priceTotal: amount,
        billingCycle: pkg.billingCycle ?? p.billingCycle ?? null,
        months: pkg.months ?? pkg.durationMonths ?? null,
      }
    : null

  return { type: 'payment_rejected', variant, amount, plan, bank }
}
