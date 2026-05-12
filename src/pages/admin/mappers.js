export function fmtDate(iso) {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function mapToVerifikasi(u) {
  return {
    id: u.id,
    name: u.name || '-',
    username: u.username ? `@${u.username}` : `@${(u.email || '').split('@')[0]}`,
    email: u.email || '-',
    status: 'Review',
    birthdate: fmtDate(u.birthdate),
    training: u.trainingRegion?.regionName || '-',
    year: u.createdAt ? new Date(u.createdAt).getFullYear().toString() : '-',
    school: u.schoolName || '-',
    role: u.discourseGroup?.name || '',
  }
}

export function mapToManajemen(u) {
  const sub = u.activeSubscription || u.subscription
  const subStatus =
    sub?.status === 'active'  ? 'Active'  :
    sub?.status === 'expired' ? 'Expired' : 'Not Active'
  const accountStatus =
    u.verifiedStatus === 'approved' ? 'Approved' :
    u.verifiedStatus === 'rejected' ? 'Rejected' : 'Pending'
  const isNew = u.createdAt
    ? (Date.now() - new Date(u.createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000
    : false
  const voucher = u.activeVoucher?.code || ''
  const action = voucher ? 'Sudah Disalin' : (accountStatus === 'Approved' ? 'Konfirmasi' : '-')

  return {
    id: u.id,
    name: u.name || '-',
    username: u.username ? `@${u.username}` : `@${(u.email || '').split('@')[0]}`,
    email: u.email || '-',
    isNew,
    accountStatus,
    voucher,
    birthdate: fmtDate(u.birthdate),
    training: u.trainingRegion?.regionName || '-',
    year: u.createdAt ? new Date(u.createdAt).getFullYear().toString() : '-',
    school: u.schoolName || '-',
    role: u.discourseGroup?.name || '',
    subscription: subStatus,
    plan: sub ? (sub.package?.name || 'Terdaftar') : 'Tidak Terdaftar',
    endDate: sub?.expiresAt ? fmtDate(sub.expiresAt) : '',
    action,
  }
}
