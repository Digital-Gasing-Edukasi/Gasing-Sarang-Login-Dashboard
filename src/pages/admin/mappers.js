import { canonicalRole } from './roleOptions'
import { ID_MONTHS, fmtRupiah, localizePlanName, fmtTimeAmPm } from '@/lib/format'

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
  // Bentuk baru { unix, utc:{raw}, local } atau string ISO → lewat dateFieldMs
  // supaya format tanggal konsisten ("15 Des 1999") dan tidak jadi '-'.
  const ms = dateFieldMs(raw)
  return ms ? fmtDate(ms) : '-'
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

// Bulan+tahun pelatihan pertama yang DIKETIK user saat sign up (firstTrainingMonth
// 1-12 + firstTrainingYear). BUKAN startDate sesi pelatihan (itu dibuat admin).
// Dipakai kolom "Alumni Pelatihan / Bulan & Tahun" di tabel Verifikasi Akun (Pending),
// karena di tahap WAITING user belum di-assign ke sesi mana pun.
function fmtTrainingPeriod(month, year) {
  const m = Number(month)
  const y = Number(year)
  if (!m || m < 1 || m > 12 || !y) return { text: '-', ms: 0 }
  return { text: `${ID_MONTHS[m - 1]} ${y}`, ms: new Date(y, m - 1, 1).getTime() }
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

// Format Last Updated: bila `withinWindow(ms)` true → tampilkan jam (fmtTimeAmPm),
// selain itu → tanggal. Balik { text, ms } — ms buat sorting.
function fmtUpdated(raw, withinWindow) {
  const ms = dateFieldMs(raw)
  if (!ms) return { text: '-', ms: 0 }
  return { text: withinWindow(ms) ? fmtTimeAmPm(ms) : fmtDate(ms), ms }
}

function isSameDay(ms) {
  const d = new Date(ms)
  const now = new Date()
  return d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
}

// Rule: di-update hari ini → jam; selain itu → tanggal.
function fmtLastUpdated(raw) {
  return fmtUpdated(raw, isSameDay)
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

// "Alumni Pelatihan" = sesi pelatihan pertama user (firstTrainingSession, embed
// region { full_name }). Sama persis dipakai mapToVerifikasi/Pembayaran/Manajemen:
//   lts          = record sesi (fallback lastTrainingSession/trainingSession)
//   alumniNama   = nama sesi
//   alumniDaerah = region.full_name → nama sesi → (opsional) regionFallback
//   alumniTanggal= startDate (fallback endDate) diformat
//   riwayatCount = jumlah histori; fallback ada/tidaknya sesi
// regionFallback dipakai tabel Verifikasi Akun (region pelatihan user) saat sesi
// belum meng-embed region.
function deriveAlumni(u, { regionFallback } = {}) {
  const lts = u.firstTrainingSession || u.lastTrainingSession || u.trainingSession || {}
  const ltsStartMs = dateFieldMs(lts.startDate) || dateFieldMs(lts.endDate)
  const hasRiwayat = !!(lts.id || lts.name)
  const alumniNama = lts.name || '-'
  const alumniDaerah = lts.region?.full_name || lts.name ||
    (regionFallback && regionFallback !== '-' ? regionFallback : '-')
  const alumniTanggal = ltsStartMs ? fmtDate(ltsStartMs) : '-'
  // Count dari tabel trainingHistories (bisa 0 walau firstTrainingSession ada, karena
  // sesi yang di-assign admin BUKAN record trainingHistory). JANGAN pakai `??` mentah:
  // `0 ?? x` = 0, jadi count nol menelan fallback & kolom tampil '-'. Ambil count API,
  // lalu Math.max dengan hasRiwayat (sesi pertama = minimal 1) supaya kolom tidak kosong.
  const apiCount =
    u.trainingHistoriesCount ?? u.trainingHistoryCount ?? u._count?.trainingHistories ??
    (Array.isArray(u.trainingHistories) ? u.trainingHistories.length : 0)
  const riwayatCount = Math.max(Number(apiCount) || 0, hasRiwayat ? 1 : 0)
  return { lts, ltsStartMs, hasRiwayat, alumniNama, alumniDaerah, alumniTanggal, riwayatCount }
}

export function mapToVerifikasi(u, regions = [], discourseGroups = []) {
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

  // Alumni Pelatihan diturunkan dari `firstTrainingSession` (nama kanonik baru;
  // lastTrainingSession dipertahankan sbg fallback biar respons lama tetap jalan).
  // Payload sekarang meng-embed region: { name, parent_name, full_name }. Jadi:
  //   Daerah  = fts.region.full_name (mis. "Kabupaten Toba, Sumatera Utara")
  //   Tanggal = fts.startDate
  // Riwayat Pelatihan = ada/tidaknya sesi (punya firstTrainingSession → true).
  // Daerah alumni untuk tabel ini punya fallback region pelatihan pertama user.
  const { lts, hasRiwayat, alumniNama, alumniDaerah, alumniTanggal, riwayatCount } =
    deriveAlumni(u, { regionFallback: regionName })
  const voucherCode = u.lastVoucher?.code || u.activeVoucher?.code || u.voucher?.code || u.voucherCode || ''

  // Fallback modal "Lihat Detail" (sama seperti mapToManajemen). Tabel training-history
  // sering kosong (record manual) → derive 1 baris dari firstTrainingSession supaya
  // modal tidak kosong padahal kolom Riwayat Pelatihan menunjukkan angka.
  const riwayatList = buildRiwayatList(u, regions, { lts, hasRiwayat, alumniNama, alumniDaerah, alumniTanggal })

  // Bulan & tahun pelatihan pertama dari input sign up (bukan startDate sesi).
  const trainingPeriod = fmtTrainingPeriod(u.firstTrainingMonth, u.firstTrainingYear)

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
    trainingPeriod:   trainingPeriod.text,
    trainingPeriodMs: trainingPeriod.ms,
    hasRiwayat,
    riwayatCount,
    riwayatList,
    voucherCode,
    year:      parseCreatedAtYear(u.createdAt),
    school:    u.schoolName || '-',
    role:      resolveRole(u, discourseGroups),
    // Dibawa mentah (bukan cuma dipakai resolveRole) karena langkah-2 approve harus
    // mengirim ulang discourseGroupId. Tanpa ini, baris hasil reload halaman kehilangan
    // nilainya dan BE menolak: "discourseGroupId is required when status is approved".
    discourseGroupId: toGroupId(u.discourseGroupId ?? u.discourseGroup?.id),
    // Id mentah untuk membangun link perbaikan data (prefill di FixDataPage).
    raw: {
      birthdate:  (u.birthdate && typeof u.birthdate === 'object') ? (u.birthdate.date || '') : (u.birthdate || ''),
      regionId:   u.regionId || u.region?.id || '',
      provinceId: u.provinceId || u.province?.id || u.region?.parentId || '',
      firstTrainingRegionId: u.firstTrainingRegionId || u.trainingRegionId || '',
      firstTrainingYear:     u.firstTrainingYear || '',
      firstTrainingMonth:    u.firstTrainingMonth || '',
      // Prefill sesi pelatihan pertama di modal Setujui/Approve. Nama kanonik baru =
      // firstTrainingSessionId; last* dipertahankan sbg fallback respons lama.
      firstTrainingSessionId: u.firstTrainingSessionId || u.firstTrainingSession?.id || u.lastTrainingSessionId || u.lastTrainingSession?.id || '',
    },
  }
}

// Status untuk 4 tab Manajemen Akun (struktur tabel besar):
//   Disetujui | Ditolak | Ditangguhkan | Baru Dihapus
// Prioritas flag: penghapusan > penangguhan > hasil verifikasi.
// (suspend & deletion mengacu endpoint admin: /suspend & /deletion-request.)
function parseManajemenStatus(u) {
  // Penghapusan terjadwal (soft delete). Backend baru mengirim object `deletion`
  // { set_at, deletion_cause, will_be_deleted_at, remaining }. Field flat lama
  // (deletionPending/deletionScheduledAt/deletedAt) dipertahankan sbg fallback.
  const del = u.deletion
  const hasDeletion = !!(del && (del.set_at || del.will_be_deleted_at || del.deletion_cause))
  if (hasDeletion || u.deletionPending || u.deletionScheduledAt || u.deletedAt) return 'Baru Dihapus'
  if (u.suspendedUntil || u.suspended) return 'Ditangguhkan'
  const vs = u.verifiedStatus
  // REJECTED(-1) = tolak final; REVISE(2) = diminta perbaiki data. Keduanya hasil
  // aksi "Tolak Akun" admin, jadi keduanya muncul di tab Ditolak.
  if (vs === -1 || vs === 'rejected' || vs === 2 || vs === 'revise') return 'Ditolak'
  return 'Disetujui'
}

// verifiedStatus (enum backend):
//   REJECTED = -1 | WAITING = 0 | APPROVED = 1 | REVISE = 2 | PENDING_VOUCHER = 3
// WAITING/REVISE/PENDING_VOUCHER = masih di alur Verifikasi Akun.
export const VERIFIED_STATUS = { REJECTED: -1, WAITING: 0, APPROVED: 1, REVISE: 2, PENDING_VOUCHER: 3 }

// Syarat masuk Manajemen Akun (semua tab):
//   APPROVED(1) = voucher sudah diproses (done) → Disetujui/Ditangguhkan/Baru Dihapus
//   REJECTED(-1) = tolak final          → Ditolak
//   REVISE(2)    = diminta perbaiki data → Ditolak
// WAITING(0) / PENDING_VOUCHER(3) masih di alur Verifikasi Akun → TIDAK masuk.
export function isManajemenEligible(u) {
  const vs = u.verifiedStatus
  return vs === 1 || vs === 'approved' ||
         vs === -1 || vs === 'rejected' ||
         vs === 2 || vs === 'revise'
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

// Durasi paket → jumlah hari. Dipakai hitung Tgl. Berakhir manual saat subscription
// belum punya endDate (mis. payment masih pending/ditolak). Yearly=365, Monthly=30.
function planDurationDays(sub, planLabel) {
  const pkg  = sub?.package || sub?.plan || {}
  const unit = String(pkg.durationUnit || pkg.duration_unit || '').toLowerCase()
  const dur  = Number(pkg.duration || 0)
  const name = String(pkg.name || sub?.packageName || planLabel || '').toLowerCase()
  if (unit === 'year'  || dur >= 12 || name.includes('year')  || name.includes('tahun') || planLabel === 'Tahunan') return 365
  if (unit === 'month' || dur >= 1  || name.includes('month') || name.includes('bulan') || planLabel === 'Bulanan') return 30
  return 0
}

// Latest Update: <= 24 jam → jam ("9:20 AM"); > 24 jam → tanggal ("28 Mei 2026").
function fmtLastUpdated24h(raw) {
  return fmtUpdated(raw, (ms) => Date.now() - ms <= 24 * 60 * 60 * 1000)
}

// Nama role (discourse group). Prioritas embedded; fallback resolve id → daftar groups.
// Discourse `name` itu slug ("TrainerUtama"), jadi selalu lewat canonicalRole()
// supaya tabel menampilkan "Trainer Utama". Grup non-role (subscriber) → ''.
// discourseGroupId harus integer saat dikirim balik ke BE (bentuk string ditolak).
// Kembalikan null kalau tidak ada, supaya caller bisa bedakan "kosong" vs 0.
function toGroupId(v) {
  if (v == null || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

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

  // Alumni Pelatihan dari firstTrainingSession (embed region { full_name }).
  const { alumniNama, alumniDaerah, alumniTanggal, riwayatCount } = deriveAlumni(u)

  // Paket: prioritas record payment (pay.package) — saat ditolak/pending user
  // belum punya subscription aktif, jadi sub bisa null. Nama paket ("Yearly"/
  // "Monthly") dipakai untuk label Jenis Paket sekaligus hitung durasi.
  const pkg = pay.package || sub?.package || {}
  const planLabel = parsePlan(sub) !== '-'
    ? parsePlan(sub)
    : (localizePlanName(pkg.name) || '-')

  // Tgl. Berakhir: subscription belum tentu punya endDate saat payment masih
  // pending/ditolak → hitung manual = tgl payment dibuat + durasi paket
  // (Tahunan +365 hari, Bulanan +30 hari). Durasi dibaca dari nama paket payment
  // (pkg.name) karena sub bisa kosong. Fallback ke endDate subscription asli.
  const subEnd = sub?.expiresAt || sub?.endDate || sub?.currentPeriodEnd || sub?.expiredAt || sub?.expires_at
  const payStartMs = dateFieldMs(pay.createdAt || pay.transferDate || pay.paidAt)
  const durDays = planDurationDays(sub, pkg.name || planLabel)
  const endMs = (payStartMs && durDays)
    ? payStartMs + durDays * 86400000
    : dateFieldMs(subEnd)

  // Submitted Date: waktu user upload bukti bayar (receiptFile.createdAt).
  // Format sama dengan Last Updated (fmtLastUpdated24h: <24 jam → jam AM/PM,
  // selain itu → tgl "31 Jul 2026").
  const sd = fmtLastUpdated24h(pay.receiptFile?.createdAt)

  // Detail bukti transfer (dipakai KonfirmasiPembayaranModal).
  const transferMs = dateFieldMs(pay.transferDate || pay.paidAt || pay.createdAt)

  return {
    id:       pay.id || p.id || u.id,   // id payment (target confirm/reject)
    userId:   u.id,
    name:     u.name || '-',
    username: fmtUsername(u),
    email:    u.email || '-',
    isNew,
    statusMember,
    plan:     planLabel !== '-' ? planLabel : (localizePlanName(pkg.name) || '-'),
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
    submittedDate:  sd.text,
    submittedMs:    sd.ms,
    // Waktu user submit request verifikasi pembayaran (dipakai kolom Reminded Time
    // = countdown 24 jam). payStartMs = createdAt payment (fallback transferDate/paidAt).
    createdMs:      payStartMs,
    // Detail transfer buat modal konfirmasi:
    payment: {
      senderName:   pay.senderName || pay.accountName || u.name || '-',
      bank:         pay.bankName || pay.senderBank || pay.bank || '-',
      transferDate: transferMs ? fmtDate(transferMs) : '-',
      amount:       fmtRupiah(pay.amount ?? pay.total ?? pay.grossAmount),
      packageName:  localizePlanName(pkg.name || pay.packageName) || '-',
      receiptUrl:   pay.receiptUrl || pay.receipt?.url || pay.proofUrl || pay.proof?.url || '',
    },
  }
}

// 1 baris training-history (GET /admin/users/training-history/{userId} atau embed
// user.trainingHistories) → row modal Lihat Detail. Session bisa ter-nest
// (h.trainingSession) atau flat (h). Region embed baru pakai { full_name }.
export function mapToUserRiwayat(h, i = 0, fallbackEmail = '-', regions = []) {
  const sess = h.trainingSession || h.session || h
  const startMs = dateFieldMs(sess.startDate) || dateFieldMs(h.startDate)
  return {
    id:       h.id || sess.id || i,
    nama:     sess.name || h.name || '-',
    daerah:   sess.region?.full_name || resolveRegionLabel(sess.region || sess.regency, sess.regionId, regions),
    tglMulai: startMs ? fmtDate(startMs) : '-',
    startMs:  startMs || 0,
    email:    h.email || h.user?.email || fallbackEmail || '-',
    isNew:    computeIsNew(dateFieldMs(h.createdAt || sess.createdAt)),
  }
}

// Fallback list Riwayat Pelatihan (dipakai modal Lihat Detail SEBELUM fetch, atau
// kalau endpoint gagal). Sumber utama modal = GET /admin/users/training-history/{id}
// via mapToUserRiwayat. Di sini cuma pakai apa yang sudah ter-embed di respons user:
// array `trainingHistories`, atau derive 1 baris dari firstTrainingSession.
// Setiap baris: { id, nama, daerah, tglMulai, startMs (sort), email, isNew }.
function buildRiwayatList(u, regions, derived) {
  const rows = Array.isArray(u.trainingHistories) ? u.trainingHistories : []
  const list = rows.map((h, i) => mapToUserRiwayat(h, i, u.email, regions))
  if (list.length) return list

  // Fallback dari firstTrainingSession (payload { id, name, startDate, region }).
  const { lts, hasRiwayat, alumniNama, alumniDaerah, alumniTanggal } = derived
  if (!hasRiwayat) return []
  return [{
    id:       lts.id || 'lts',
    nama:     alumniNama,
    daerah:   alumniDaerah,
    tglMulai: alumniTanggal,
    startMs:  dateFieldMs(lts.startDate) || dateFieldMs(lts.endDate) || 0,
    email:    u.email || '-',
    isNew:    computeIsNew(dateFieldMs(lts.createdAt)),
  }]
}

export function mapToManajemen(u, regions = [], discourseGroups = []) {
  const sub = u.activeSubscription || u.subscription
  const subStatus =
    sub?.status === 'active'  ? 'Active'  :
    sub?.status === 'expired' ? 'Expired' : 'Not Active'

  const accountStatus = parseManajemenStatus(u)
  const isNew = computeIsNew(parseCreatedAtMs(u.createdAt))

  // Sumber voucher sama dgn mapToVerifikasi — termasuk lastVoucher (dipakai backend
  // buat voucher yang sudah dikirim), biar kolom Kode Voucher tidak kosong.
  const voucher = u.lastVoucher?.code || u.activeVoucher?.code || u.voucher?.code || u.voucherCode || ''
  const action  = voucher ? 'Sudah Disalin' : (accountStatus === 'Disetujui' ? 'Konfirmasi' : '-')

  // Lokasi = domisili user.
  const lokasi = resolveRegionLabel(u.region || u.regency, u.regionId, regions)

  // Alumni Pelatihan = sesi yang diikuti user (firstTrainingSession, embed region
  // { full_name }): Daerah = region.full_name → nama sesi; Tanggal = startDate.
  const { lts, hasRiwayat, alumniNama, alumniDaerah, alumniTanggal, riwayatCount } = deriveAlumni(u)

  // List detail untuk modal "Riwayat Pelatihan" (dibuka dari kolom → Lihat Detail).
  const riwayatList = buildRiwayatList(u, regions, { lts, hasRiwayat, alumniNama, alumniDaerah, alumniTanggal })

  const subEnd = sub?.expiresAt || sub?.endDate || sub?.currentPeriodEnd || sub?.expiredAt || sub?.expires_at
  const endMs  = dateFieldMs(subEnd)

  // Kolom Last Updated murni dari field `updatedAt` (updated_at = varian snake_case
  // dari field yang sama). Tanpa fallback ke createdAt/modifiedAt: kalau backend tak
  // embed updatedAt di list /admin/users, kolom tampil '-'.
  const lu = fmtLastUpdated24h(u.updatedAt || u.updated_at)

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
    riwayatList,                 // detail histori (modal Riwayat Pelatihan)
    year:      parseCreatedAtYear(u.createdAt),
    school:    u.schoolName || '-',
    role:      resolveRole(u, discourseGroups),
    // Dibawa mentah (bukan cuma dipakai resolveRole) karena langkah-2 approve harus
    // mengirim ulang discourseGroupId. Tanpa ini, baris hasil reload halaman kehilangan
    // nilainya dan BE menolak: "discourseGroupId is required when status is approved".
    discourseGroupId: toGroupId(u.discourseGroupId ?? u.discourseGroup?.id),
    subscription: subStatus,
    plan:    parsePlan(sub),
    endDate: endMs ? fmtDate(endMs) : '-',
    lastUpdated:   lu.text,
    lastUpdatedMs: lu.ms,
    action,
  }
}
