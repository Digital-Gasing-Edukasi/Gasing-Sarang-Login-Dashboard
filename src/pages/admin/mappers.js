// ─── Date helpers ──────────────────────────────────────────────────────────────
// API mengembalikan date sebagai object { date, formatted } atau unix timestamp object
// Bukan string ISO biasa

function parseBirthdate(raw) {
  if (!raw) return '-'
  // Object dari API: { date: "1999-12-15", formatted: "15 Dec 1999" }
  if (typeof raw === 'object' && raw.formatted) return raw.formatted
  if (typeof raw === 'object' && raw.date)      return fmtDate(raw.date)
  // Fallback: string ISO
  return fmtDate(raw)
}

function parseCreatedAtYear(raw) {
  if (!raw) return '-'
  // Object dari API: { unix: 1778561249, utc: {...}, local: {...} }
  if (typeof raw === 'object' && raw.unix) {
    return new Date(raw.unix * 1000).getFullYear().toString()
  }
  // Fallback: string ISO
  const d = new Date(raw)
  return isNaN(d) ? '-' : d.getFullYear().toString()
}

function parseCreatedAtMs(raw) {
  if (!raw) return null
  if (typeof raw === 'object' && raw.unix) return raw.unix * 1000
  const d = new Date(raw)
  return isNaN(d) ? null : d.getTime()
}

export function fmtDate(iso) {
  if (!iso) return '-'
  const d = new Date(iso)
  if (isNaN(d)) return '-'
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

// verifiedStatus dari API adalah NUMBER: 0=pending, 1=approved, 2=rejected
function parseVerifiedStatus(v) {
  if (v === 1 || v === 'approved') return 'Approved'
  if (v === -1 || v === 'rejected') return 'Rejected'
  return 'Pending'
}

export function mapToVerifikasi(u, regions = []) {
  const regionObj = regions.find(r => r.id === u.trainingRegionId)
  const regionName = regionObj ? regionObj.regionName : (u.trainingRegion?.regionName || '-')

  return {
    id:       u.id,
    name:     u.name || '-',
    username: u.username ? `@${u.username}` : `@${(u.email || '').split('@')[0]}`,
    email:    u.email || '-',
    status:   parseVerifiedStatus(u.verifiedStatus),
    birthdate: parseBirthdate(u.birthdate),
    training:  regionName,
    year:      parseCreatedAtYear(u.createdAt),
    school:    u.schoolName || '-',
    role:      u.discourseGroup?.name || u.discourseGroupName || '',
  }
}

export function mapToManajemen(u, regions = []) {
  const sub = u.activeSubscription || u.subscription
  const subStatus =
    sub?.status === 'active'  ? 'Active'  :
    sub?.status === 'expired' ? 'Expired' : 'Not Active'

  const accountStatus = parseVerifiedStatus(u.verifiedStatus)

  const createdMs = parseCreatedAtMs(u.createdAt)
  const isNew = createdMs ? (Date.now() - createdMs) < 7 * 24 * 60 * 60 * 1000 : false

  const voucher = u.activeVoucher?.code || ''
  const action  = voucher ? 'Sudah Disalin' : (accountStatus === 'Approved' ? 'Konfirmasi' : '-')

  const regionObj = regions.find(r => r.id === u.trainingRegionId)
  const regionName = regionObj ? regionObj.regionName : (u.trainingRegion?.regionName || '-')

  return {
    id:       u.id,
    name:     u.name || '-',
    username: u.username ? `@${u.username}` : `@${(u.email || '').split('@')[0]}`,
    email:    u.email || '-',
    isNew,
    accountStatus,
    voucher,
    birthdate: parseBirthdate(u.birthdate),
    training:  regionName,
    year:      parseCreatedAtYear(u.createdAt),
    school:    u.schoolName || '-',
    role:      u.discourseGroup?.name || u.discourseGroupName || '',
    subscription: subStatus,
    plan:    sub ? (sub.package?.name || 'Terdaftar') : 'Tidak Terdaftar',
    endDate: sub?.expiresAt ? fmtDate(sub.expiresAt) : '',
    action,
  }
}
