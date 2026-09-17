// Builder konten CSV per tab dashboard + generator kode voucher.
// Dipindah verbatim dari AdminDashboardPage.jsx.

// Label status akun sama seperti yang dirender ManajemenTable (STATUS_LABELS),
// supaya isi CSV konsisten dengan yang dilihat admin di layar.
const CSV_STATUS_LABELS = {
  Pending: 'Ditangguhkan', Ditangguhkan: 'Ditangguhkan',
  Rejected: 'Ditolak', Ditolak: 'Ditolak',
  Approved: 'Disetujui', Disetujui: 'Disetujui',
  Deleted: 'Baru Dihapus', Dihapus: 'Baru Dihapus', 'Baru Dihapus': 'Baru Dihapus',
}

export function buildCsvContent(tab, users, activeFilter, verifSubTab = 'pending', pembayaranSubTab = 'menunggu') {
  const escapeCsv = (str) => {
    const s = String(str ?? '')
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s
  }
  const toCsv = (headers, rows) =>
    [headers.join(','), ...rows.map(r => r.map(escapeCsv).join(','))].join('\n')
  if (tab === 'verifikasi-pembayaran') {
    // Sub-tab "Belum Langganan" pakai kolom read-only (tanpa Jenis Paket/Tgl. Berakhir,
    // + Last Updated) mengikuti BelumLanggananTable.
    if (pembayaranSubTab === 'belum-langganan') {
      const headers = ['Nama Pengguna', 'Email', 'Status Member', 'Kode Voucher', 'Role', 'Riwayat Pelatihan', 'Tgl. Lahir', 'Lokasi', 'Alumni Pelatihan Nama', 'Alumni Pelatihan Daerah', 'Alumni Pelatihan Tanggal Mulai', 'Asal Sekolah', 'Last Updated']
      const rows = users.map(u => [u.name, u.email, 'Belum Langganan', u.voucher || '-', u.role || '-', u.riwayatCount || 0, u.birthdate || '-', u.lokasi || '-', u.training || '-', u.alumniDaerah || '-', u.alumniTanggal || '-', u.school || '-', u.lastUpdated || '-'])
      return toCsv(headers, rows)
    }
    const headers = ['Nama Pengguna', 'Email', 'Status Member', 'Jenis Paket', 'Tgl. Berakhir', 'Kode Voucher', 'Role', 'Riwayat Pelatihan', 'Tgl. Lahir', 'Lokasi', 'Alumni Pelatihan Nama', 'Alumni Pelatihan Daerah', 'Alumni Pelatihan Tanggal Mulai', 'Asal Sekolah', 'Submitted Date']
    const rows = users.map(u => [u.name, u.email, u.statusMember || '-', u.plan || '-', u.endDate || '-', u.voucher || '-', u.role || '-', u.riwayatCount || 0, u.birthdate || '-', u.lokasi || '-', u.training || '-', u.alumniDaerah || '-', u.alumniTanggal || '-', u.school || '-', u.submittedDate || '-'])
    return toCsv(headers, rows)
  }
  if (tab === 'manajemen') {
    // Kolom mengikuti ManajemenTable persis, termasuk "reduced view" untuk
    // tab Ditolak / Baru Dihapus (kolom Langganan..Role disembunyikan).
    const isReducedView = activeFilter === 'Rejected' || activeFilter === 'Deleted'
      || activeFilter === 'Ditolak' || activeFilter === 'Baru Dihapus'
    const headHeaders = ['Nama Pengguna', 'Email', 'Status Member']
    const midHeaders  = ['Langganan', 'Jenis Paket', 'Tgl. Berakhir', 'Kode Voucher', 'Role']
    const tailHeaders = ['Riwayat Pelatihan', 'Tgl. Lahir', 'Lokasi', 'Alumni Pelatihan Nama', 'Alumni Pelatihan Daerah', 'Alumni Pelatihan Tanggal Mulai', 'Asal Sekolah', 'Last Updated']
    const headers = isReducedView ? [...headHeaders, ...tailHeaders] : [...headHeaders, ...midHeaders, ...tailHeaders]
    const rows = users.map(u => {
      const head = [u.name, u.email, CSV_STATUS_LABELS[u.accountStatus] || u.accountStatus || '-']
      const mid  = [u.subscription || 'Tidak Aktif', u.plan || '-', u.endDate || '-', u.voucher || '-', u.role || '-']
      const tail = [u.riwayatCount || '-', u.birthdate || '-', u.lokasi || '-', u.training || '-', u.alumniDaerah || '-', u.alumniTanggal || '-', u.school || '-', u.lastUpdated || '-']
      return isReducedView ? [...head, ...tail] : [...head, ...mid, ...tail]
    })
    return toCsv(headers, rows)
  }
  // tab === 'verifikasi', sub-tab 'voucher' → kolom ikut PendingVoucherTable.
  if (verifSubTab === 'voucher') {
    const headers = ['Nama Pengguna', 'Email', 'Status Member', 'Kode Voucher', 'Role', 'Riwayat Pelatihan', 'Tgl. Lahir', 'Lokasi', 'Alumni Pelatihan Nama', 'Alumni Pelatihan Daerah', 'Alumni Pelatihan Tanggal Mulai', 'Asal Sekolah']
    const rows = users.map(u => [u.name, u.email, 'Pending Voucher Setup', u.voucherCode || '-', u.role || '-', u.riwayatCount ?? 0, u.birthdate || '-', u.lokasi || '-', u.alumniNama || '-', u.alumniDaerah || '-', u.alumniTanggal || '-', u.school || '-'])
    return toCsv(headers, rows)
  }
  // tab === 'verifikasi', sub-tab 'pending' → kolom ikut VerifikasiTable.
  const headers = ['Nama Pengguna', 'Email', 'Status', 'Tgl. Lahir', 'Lokasi', 'Alumni Pelatihan Daerah', 'Alumni Pelatihan Bulan & Tahun', 'Asal Sekolah']
  const rows = users.map(u => [u.name, u.email, u.status, u.birthdate, u.lokasi, u.alumniDaerah || '-', u.trainingPeriod || '-', u.school || '-'])
  return [headers.join(','), ...rows.map(r => r.map(escapeCsv).join(','))].join('\n')
}

// Generate kode voucher (placeholder FE). TODO(be): kode asli mestinya dari backend
// saat approve (auto-generate). Ganti pemanggilan ini begitu endpoint tersedia.
export function genVoucherCode() {
  return 'GASI' + Math.random().toString(36).slice(2, 8).toUpperCase()
}
