import { canonicalRole } from './roleOptions'

// Username user (untuk kolom identitas di semua tabel admin).
// JANGAN pernah menurunkan dari email (mis. email.split('@')[0]): itu MENGARANG
// handle yang terlihat asli tapi ≠ username di database. Baca defensif lintas
// varian key/nesting yang mungkin dikirim backend; kalau benar-benar tidak ada,
// balik '-' (jujur "tidak diketahui") — bukan tebakan.
function rawUsername(u) {
  return (
    u?.username || u?.userName || u?.user_name ||
    u?.discourseUsername || u?.discourse_username ||
    u?.user?.username || u?.profile?.username || ''
  )
}

export function fmtUsername(u) {
  const h = rawUsername(u)
  return h ? `@${h}` : '-'
}

// Window "komponen baru": badge New + titik biru navbar hilang setelah 3 hari.
export const NEW_WINDOW_MS = 3 * 24 * 60 * 60 * 1000

// True kalau epoch-ms masih dalam window 3 hari terakhir.
export function computeIsNew(ms) {
  return ms ? (Date.now() - ms) < NEW_WINDOW_MS : false
}

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

// Rule Last Updated: kalau di-update hari ini → tampilkan jam; selain itu → tanggal.
// Balik { text, ms } — ms buat sorting.
function fmtLastUpdated(raw) {
  const ms = dateFieldMs(raw)
  if (!ms) return { text: '-', ms: 0 }
  const d = new Date(ms)
  const now = new Date()
  const today =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  if (today) {
    let h = d.getHours()
    const ampm = h >= 12 ? 'PM' : 'AM'
    h = h % 12 || 12
    const mm = String(d.getMinutes()).padStart(2, '0')
    return { text: `${h}:${mm} ${ampm}`, ms }
  }
  return { text: fmtDate(ms), ms }
}

// Training session (GET /training-sessions) → row tabel Riwayat Pelatihan.
// Endpoint ini TIDAK menyediakan peserta/langganan/status/last-updated → diisi '-'.
// Session hanya membawa `regionId` (tanpa nama daerah), jadi `regionMap`
// (regionId → "Kab, Provinsi") di-resolve terpisah oleh pemanggil dan dilewatkan
// ke sini. Kalau API kelak meng-embed region, object embedded tetap dipakai.
export function mapToRiwayat(s, regionMap = {}) {
  const startMs = dateFieldMs(s.startDate)
  const lu = fmtLastUpdated(s.updatedAt)
  const isNew = computeIsNew(dateFieldMs(s.createdAt))
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
    isNew,
    daerah,
    tglMulai: startMs ? fmtDate(startMs) : '-',
    status:   'Saved',
    pesertaNama:    '-',
    pesertaLainnya: 0,
    pesertaEmail:   '-',
    langganan:      '-',
    lastUpdated:    lu.text,
    lastUpdatedMs:  lu.ms,
    // Raw untuk prefill modal edit (Perbarui Riwayat Pelatihan).
    regionId: rid || '',
    startMs,
    endMs:    dateFieldMs(s.endDate),
  }
}

// User (dari admin/users) → row peserta di modal Daftar Peserta Guru.
export function mapToPeserta(u) {
  const sub = u.activeSubscription || u.subscription
  const langganan =
    sub?.status === 'active'  ? 'Aktif' :
    sub?.status === 'expired' ? 'Berakhir' : 'Non-Aktif'
  return {
    userId: u.id,
    name:   u.name || '-',
    email:  u.email || '-',
    langganan,
  }
}

// verifiedStatus dari API (NUMBER): 1=approved, 2=revise, 3=pending_voucher,
// -1=rejected, lainnya=waiting.
function parseVerifiedStatus(v) {
  if (v === 1 || v === 'approved') return 'Approved'
  if (v === 2 || v === 'revise') return 'Revise'
  if (v === 3 || v === 'pending_voucher') return 'Pending Voucher'
  if (v === -1 || v === 'rejected') return 'Rejected'
  return 'Pending'
}

export function mapToVerifikasi(u, regions = []) {
  // Nama kanonik field region pelatihan = firstTrainingRegionId (lihat SignUpPage).
  // Tetap terima trainingRegionId lama sebagai fallback agar tidak breaking.
  const trainingRegionId = u.firstTrainingRegionId || u.trainingRegionId
  const regionObj = regions.find(r => r.id === trainingRegionId)
  const regionName = regionObj ? regionObj.regionName : (u.firstTrainingRegion?.regionName || u.trainingRegion?.regionName || '-')

  // Lokasi = domisili user (kolom "Lokasi" di tabel). Prioritas region ter-embed di
  // respons; kalau tidak ada, coba resolve regionId lewat daftar regions.
  const userRegion = u.region || u.regency
  const provinceName =
    u.province?.regionName || u.province?.name ||
    userRegion?.parent?.regionName || userRegion?.parent?.name || ''
  const regencyName =
    userRegion?.regionName || userRegion?.name ||
    regions.find(r => r.id === u.regionId)?.regionName || ''
  const lokasi = [regencyName, provinceName].filter(Boolean).join(', ') || '-'

  // Badge "New": akun dibuat < 7 hari.
  const createdMs = parseCreatedAtMs(u.createdAt)
  const isNew = createdMs ? (Date.now() - createdMs) < 7 * 24 * 60 * 60 * 1000 : false

  // Kolom tambahan untuk tabel Pending Voucher (sama seperti mapToManajemen):
  // Alumni Pelatihan (sesi yang diikuti user), jumlah riwayat, kode voucher.
  const lts = u.lastTrainingSession || u.trainingSession || {}
  const ltsMs = dateFieldMs(lts.startDate)
  const alumniNama    = lts.name || '-'
  const alumniTanggal = ltsMs ? fmtDate(ltsMs) : '-'
  const alumniDaerah  = resolveRegionLabel(lts.region || lts.regency, lts.regionId, regions)
  const riwayatCount =
    u.trainingHistoriesCount ?? u.trainingHistoryCount ?? u._count?.trainingHistories ??
    (Array.isArray(u.trainingHistories) ? u.trainingHistories.length : 0)
  const voucherCode = u.lastVoucher?.code || u.activeVoucher?.code || u.voucher?.code || u.voucherCode || ''

  return {
    id:       u.id,
    name:     u.name || '-',
    username: fmtUsername(u),
    email:    u.email || '-',
    // `status` = label tampilan; `verifiedStatus` = enum mentah, dipakai handler
    // approve untuk memindahkan baris ke PENDING_VOUCHER tanpa reload.
    status:   parseVerifiedStatus(u.verifiedStatus),
    verifiedStatus: u.verifiedStatus,
    birthdate: parseBirthdate(u.birthdate),
    lokasi,
    isNew,
    training:  regionName,
    alumniNama,
    alumniDaerah,
    alumniTanggal,
    riwayatCount,
    voucherCode,
    year:      parseCreatedAtYear(u.createdAt),
    school:    u.schoolName || '-',
    role:      resolveRole(u),
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

// Status untuk 4 tab Manajemen Akun (struktur tabel besar):
//   Disetujui | Ditolak | Ditangguhkan | Baru Dihapus
// Prioritas flag: penghapusan > penangguhan > hasil verifikasi.
// (suspend & deletion mengacu endpoint admin: /suspend & /deletion-request.)
function parseManajemenStatus(u) {
  if (u.deletionPending || u.deletionScheduledAt || u.deletedAt) return 'Baru Dihapus'
  if (u.suspendedUntil || u.suspended) return 'Ditangguhkan'
  const vs = u.verifiedStatus
  if (vs === -1 || vs === 'rejected') return 'Ditolak'
  return 'Disetujui'
}

// verifiedStatus (enum backend):
//   REJECTED = -1 | WAITING = 0 | APPROVED = 1 | REVISE = 2 | PENDING_VOUCHER = 3
// WAITING/REVISE/PENDING_VOUCHER = masih di alur Verifikasi Akun.
export const VERIFIED_STATUS = { REJECTED: -1, WAITING: 0, APPROVED: 1, REVISE: 2, PENDING_VOUCHER: 3 }

// Syarat masuk Manajemen Akun (semua tab). Hanya akun ber-keputusan FINAL:
//   APPROVED(1) = voucher sudah diproses (done) → Disetujui/Ditangguhkan/Baru Dihapus
//   REJECTED(-1) → Ditolak
// WAITING(0) / REVISE(2) / PENDING_VOUCHER(3) TIDAK masuk table manapun.
export function isManajemenEligible(u) {
  const vs = u.verifiedStatus
  return vs === 1 || vs === 'approved' || vs === -1 || vs === 'rejected'
}

// Jenis Paket → 'Tahunan' | 'Bulanan' | '-'. Diturunkan dari durasi paket.
// (package: { duration, durationUnit } — lihat admin/packages Create Package.)
function parsePlan(sub) {
  if (!sub) return '-'
  const pkg  = sub.package || sub.plan || {}
  const unit = String(pkg.durationUnit || pkg.duration_unit || '').toLowerCase()
  const dur  = Number(pkg.duration || 0)
  const name = String(pkg.name || sub.packageName || '').toLowerCase()
  if (unit === 'year' || dur >= 12 || name.includes('year') || name.includes('tahun')) return 'Tahunan'
  if (unit === 'month' || dur >= 1 || name.includes('month') || name.includes('bulan')) return 'Bulanan'
  return '-'
}

// Latest Update: <= 24 jam → jam ("9:20 AM"); > 24 jam → tanggal ("28 Mei 2026").
// Balik { text, ms } — ms untuk sorting.
function fmtLastUpdated24h(raw) {
  const ms = dateFieldMs(raw)
  if (!ms) return { text: '-', ms: 0 }
  if (Date.now() - ms <= 24 * 60 * 60 * 1000) {
    const d = new Date(ms)
    let h = d.getHours()
    const ampm = h >= 12 ? 'PM' : 'AM'
    h = h % 12 || 12
    return { text: `${h}:${String(d.getMinutes()).padStart(2, '0')} ${ampm}`, ms }
  }
  return { text: fmtDate(ms), ms }
}

// Nama role (discourse group). Prioritas embedded; fallback resolve id → daftar groups.
// Discourse `name` itu slug ("TrainerUtama"), jadi selalu lewat canonicalRole()
// supaya tabel menampilkan "Trainer Utama". Grup non-role (subscriber) → ''.
function resolveRole(u, groups = []) {
  const embedded = u.discourseGroup || u.discourseGroupName
  if (embedded) return canonicalRole(embedded) || ''
  const gid = u.discourseGroupId
  if (gid != null) {
    const g = groups.find(x => String(x.id) === String(gid))
    if (g) return canonicalRole(g) || ''
  }
  return ''
}

// "Kabupaten, Provinsi" dari region embedded / regionId + daftar provinsi.
function resolveRegionLabel(regionObj, regionId, regions = []) {
  const reg = regionObj || {}
  const regencyName =
    reg.regionName || reg.name ||
    regions.find(r => r.id === regionId)?.regionName || ''
  const provinceName =
    reg.parent?.regionName || reg.parent?.name ||
    regions.find(r => r.id === reg.parentId)?.regionName || ''
  return [regencyName, provinceName].filter(Boolean).join(', ') || '-'
}

// Format nominal → "Rp 500.000". Angka non-valid → "-".
function fmtRupiah(raw) {
  const n = Number(raw)
  if (!raw || isNaN(n)) return '-'
  return 'Rp ' + n.toLocaleString('id-ID')
}

// Payment manual transfer (GET /admin/payments/manual-transfer/list) → row tabel
// Verifikasi Pembayaran. Diasumsikan record payment membawa `user` ter-embed +
// field bukti transfer (bank, amount, receipt). Defensif: kalau yang datang
// object user (payment ter-embed di user), `p.payment` dipakai sebagai sumber
// detail transfer. Kolom identitas user = reuse logika mapToManajemen.
// TODO(be): collection belum kasih contoh response — konfirmasi nama field
// (bank/amount/senderName/receiptUrl) begitu ada payload asli.
export function mapToPembayaran(p, regions = [], discourseGroups = []) {
  const u = p.user || p.member || p            // record user (identitas)
  const pay = p.payment || p                    // record payment (detail transfer)

  // Status member: 'menunggu' → Pending Verifikasi Pembayaran, 'ditolak' → Pembayaran Ditolak.
  const rawStatus = String(pay.status || p.status || '').toLowerCase()
  const isRejected = rawStatus === 'rejected' || rawStatus === 'ditolak' || rawStatus === 'failed'
  const statusMember = isRejected ? 'Pembayaran Ditolak' : 'Pending Verifikasi Pembayaran'

  const sub = u.activeSubscription || u.subscription
  const isNew = computeIsNew(parseCreatedAtMs(u.createdAt))

  const voucher = u.activeVoucher?.code || u.voucher?.code || u.voucherCode || pay.voucherCode || ''
  const lokasi = resolveRegionLabel(u.region || u.regency, u.regionId, regions)

  const lts = u.lastTrainingSession || u.trainingSession || {}
  const ltsMs = dateFieldMs(lts.startDate)
  const alumniNama    = lts.name || '-'
  const alumniTanggal = ltsMs ? fmtDate(ltsMs) : '-'
  const alumniDaerah  = resolveRegionLabel(lts.region || lts.regency, lts.regionId, regions)

  const riwayatCount =
    u.trainingHistoriesCount ?? u.trainingHistoryCount ?? u._count?.trainingHistories ??
    (Array.isArray(u.trainingHistories) ? u.trainingHistories.length : 0)

  const subEnd = sub?.expiresAt || sub?.endDate || sub?.currentPeriodEnd || sub?.expiredAt || sub?.expires_at
  const endMs  = dateFieldMs(subEnd)

  const lu = fmtLastUpdated24h(pay.updatedAt || u.updatedAt)

  // Detail bukti transfer (dipakai KonfirmasiPembayaranModal).
  const pkg = pay.package || sub?.package || {}
  const transferMs = dateFieldMs(pay.transferDate || pay.paidAt || pay.createdAt)

  return {
    id:       pay.id || p.id || u.id,   // id payment (target confirm/reject)
    userId:   u.id,
    name:     u.name || '-',
    username: fmtUsername(u),
    email:    u.email || '-',
    isNew,
    statusMember,
    plan:     parsePlan(sub) !== '-' ? parsePlan(sub) : (pkg.name || '-'),
    endDate:  endMs ? fmtDate(endMs) : '-',
    voucher,
    role:     resolveRole(u, discourseGroups),
    riwayatCount,
    birthdate: parseBirthdate(u.birthdate),
    lokasi,
    training:  alumniNama,       // Alumni Pelatihan Nama
    alumniDaerah,
    alumniTanggal,
    school:    u.schoolName || '-',
    lastUpdated:   lu.text,
    lastUpdatedMs: lu.ms,
    // Detail transfer buat modal konfirmasi:
    payment: {
      senderName:   pay.senderName || pay.accountName || u.name || '-',
      bank:         pay.bankName || pay.senderBank || pay.bank || '-',
      transferDate: transferMs ? fmtDate(transferMs) : '-',
      amount:       fmtRupiah(pay.amount ?? pay.total ?? pay.grossAmount),
      packageName:  pkg.name || pay.packageName || '-',
      receiptUrl:   pay.receiptUrl || pay.receipt?.url || pay.proofUrl || pay.proof?.url || '',
    },
  }
}

export function mapToManajemen(u, regions = [], discourseGroups = []) {
  const sub = u.activeSubscription || u.subscription
  const subStatus =
    sub?.status === 'active'  ? 'Active'  :
    sub?.status === 'expired' ? 'Expired' : 'Not Active'

  const accountStatus = parseManajemenStatus(u)
  const isNew = computeIsNew(parseCreatedAtMs(u.createdAt))

  const voucher = u.activeVoucher?.code || u.voucher?.code || u.voucherCode || ''
  const action  = voucher ? 'Sudah Disalin' : (accountStatus === 'Disetujui' ? 'Konfirmasi' : '-')

  // Lokasi = domisili user.
  const lokasi = resolveRegionLabel(u.region || u.regency, u.regionId, regions)

  // Alumni Pelatihan = sesi yang diikuti user (lastTrainingSession).
  const lts = u.lastTrainingSession || u.trainingSession || {}
  const ltsMs = dateFieldMs(lts.startDate)
  const alumniNama    = lts.name || '-'
  const alumniTanggal = ltsMs ? fmtDate(ltsMs) : '-'
  const alumniDaerah  = resolveRegionLabel(lts.region || lts.regency, lts.regionId, regions)

  // Riwayat Pelatihan = jumlah histori pelatihan.
  const riwayatCount =
    u.trainingHistoriesCount ?? u.trainingHistoryCount ?? u._count?.trainingHistories ??
    (Array.isArray(u.trainingHistories) ? u.trainingHistories.length : 0)

  const subEnd = sub?.expiresAt || sub?.endDate || sub?.currentPeriodEnd || sub?.expiredAt || sub?.expires_at
  const endMs  = dateFieldMs(subEnd)

  const lu = fmtLastUpdated24h(u.updatedAt)

  return {
    id:       u.id,
    name:     u.name || '-',
    username: fmtUsername(u),
    email:    u.email || '-',
    isNew,
    accountStatus,
    voucher,
    birthdate: parseBirthdate(u.birthdate),
    lokasi,
    training:      alumniNama,   // kolom "Alumni Pelatihan Nama"
    alumniDaerah,                // kolom "Alumni Pelatihan Daerah"
    alumniTanggal,               // kolom "Alumni Pelatihan Tanggal Mulai"
    riwayatCount,
    year:      parseCreatedAtYear(u.createdAt),
    school:    u.schoolName || '-',
    role:      resolveRole(u, discourseGroups),
    subscription: subStatus,
    plan:    parsePlan(sub),
    endDate: endMs ? fmtDate(endMs) : '-',
    lastUpdated:   lu.text,
    lastUpdatedMs: lu.ms,
    action,
  }
}
