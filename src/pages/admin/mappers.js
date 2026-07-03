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

// Ambil epoch-ms dari field date API (object { unix } / { utc:{raw} } / { date } / ISO).
function dateFieldMs(raw) {
  if (!raw) return null
  if (typeof raw === 'object') {
    if (raw.unix) return raw.unix * 1000
    const iso = raw.utc?.raw || raw.date
    if (iso) { const d = new Date(iso); return isNaN(d) ? null : d.getTime() }
    return null
  }
  const d = new Date(raw)
  return isNaN(d) ? null : d.getTime()
}

// Training session (GET /training-sessions) → row tabel Riwayat Pelatihan.
// Endpoint ini TIDAK menyediakan peserta/langganan/status/last-updated → diisi '-'.
// Session hanya membawa `regionId` (tanpa nama daerah), jadi `regionMap`
// (regionId → "Kab, Provinsi") di-resolve terpisah oleh pemanggil dan dilewatkan
// ke sini. Kalau API kelak meng-embed region, object embedded tetap dipakai.
export function mapToRiwayat(s, regionMap = {}) {
  const startMs = dateFieldMs(s.startDate)
  const rid = s.regionId || s.region?.id
  const embedded = s.region || s.regency
  const embeddedName = embedded?.name || embedded?.regionName
  const daerah =
    regionMap[rid] ||
    (embeddedName
      ? [embeddedName, embedded.parent?.name || embedded.parent?.regionName].filter(Boolean).join(', ')
      : '-')
  return {
    id:       s.id,
    nama:     s.name || '-',
    daerah,
    tglMulai: startMs ? fmtDate(startMs) : '-',
    status:   'Saved',
    pesertaNama:    '-',
    pesertaLainnya: 0,
    pesertaEmail:   '-',
    langganan:      '-',
    lastUpdatedDate: '-',
    lastUpdatedTime: '',
  }
}

// verifiedStatus dari API (NUMBER): 1=approved, 2=revise, -1=rejected, lainnya=waiting.
function parseVerifiedStatus(v) {
  if (v === 1 || v === 'approved') return 'Approved'
  if (v === 2 || v === 'revise') return 'Revise'
  if (v === -1 || v === 'rejected') return 'Rejected'
  return 'Pending'
}

export function mapToVerifikasi(u, regions = []) {
  // Nama kanonik field region pelatihan = firstTrainingRegionId (lihat SignUpPage).
  // Tetap terima trainingRegionId lama sebagai fallback agar tidak breaking.
  const trainingRegionId = u.firstTrainingRegionId || u.trainingRegionId
  const regionObj = regions.find(r => r.id === trainingRegionId)
  const regionName = regionObj ? regionObj.regionName : (u.firstTrainingRegion?.regionName || u.trainingRegion?.regionName || '-')

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
    // Id mentah untuk membangun link perbaikan data (prefill di FixDataPage).
    raw: {
      birthdate:  (u.birthdate && typeof u.birthdate === 'object') ? (u.birthdate.date || '') : (u.birthdate || ''),
      regionId:   u.regionId || u.region?.id || '',
      provinceId: u.provinceId || u.province?.id || u.region?.parentId || '',
      firstTrainingRegionId: u.firstTrainingRegionId || u.trainingRegionId || '',
      firstTrainingYear:     u.firstTrainingYear || '',
      firstTrainingMonth:    u.firstTrainingMonth || '',
      lastTrainingSessionId: u.lastTrainingSessionId || u.lastTrainingSession?.id || '',
    },
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

  const trainingRegionId = u.firstTrainingRegionId || u.trainingRegionId
  const regionObj = regions.find(r => r.id === trainingRegionId)
  const regionName = regionObj ? regionObj.regionName : (u.firstTrainingRegion?.regionName || u.trainingRegion?.regionName || '-')

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
