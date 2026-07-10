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
