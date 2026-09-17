import { useState, useRef, useEffect } from 'react'
import { Search } from 'lucide-react'
import { downloadCsv } from '@/lib/format'
import { buildCsvContent } from './admin/adminCsv'
import { useSort, applySortToList } from './admin/hooks/useSort'
import { useAdminToast } from './admin/hooks/useAdminToast'
import { useAdminUsers } from './admin/hooks/useAdminUsers'
import { usePembayaran } from './admin/hooks/usePembayaran'
import { useVerifikasi, BULK_LIMIT } from './admin/hooks/useVerifikasi'
import { useManajemen } from './admin/hooks/useManajemen'
import { usePendaftaranTrainer } from './admin/hooks/usePendaftaranTrainer'
import { useRiwayatPelatihan } from './admin/hooks/useRiwayatPelatihan'
import { useAdminBoot } from './admin/hooks/useAdminBoot'
import { AdminSidebar } from './admin/AdminSidebar'
import { AdminToast } from './admin/AdminToast'
import { RejectModal, ApproveModal } from './admin/ConfirmModal'
import { BulkApproveModal } from './admin/BulkApproveModal'
import { BulkRejectModal } from './admin/BulkRejectModal'
import { PendingVoucherTable } from './admin/PendingVoucherTable'
import { KonfirmasiVoucherModal, BulkVoucherModal } from './admin/VoucherModals'
import { VerifikasiControls, VerifikasiPembayaranControls, ManajemenControls, PendaftaranTrainerControls, RiwayatPelatihanControls } from './admin/TableControls'
import { VerifikasiTable } from './admin/VerifikasiTable'
import { VerifikasiPembayaranTable } from './admin/VerifikasiPembayaranTable'
import { BelumLanggananTable } from './admin/BelumLanggananTable'
import { KonfirmasiPembayaranModal, TolakPembayaranModal } from './admin/PembayaranModals'
import { ManajemenTable } from './admin/ManajemenTable'
import { DaftarUserTable } from './admin/DaftarUserTable'
import { PendaftaranTrainerTable } from './admin/PendaftaranTrainerTable'
import { RiwayatPelatihanTable } from './admin/RiwayatPelatihanTable'
import { AddPendaftaranTrainerModal } from './admin/AddPendaftaranTrainerModal'
import { AddPelatihanModal } from './admin/AddPelatihanModal'
import { PerbaruiRiwayatModal } from './admin/PerbaruiRiwayatModal'
import { RiwayatDetailModal } from './admin/RiwayatDetailModal'
import { DaftarPesertaModal } from './admin/DaftarPesertaModal'
import { UbahRoleModal } from './admin/UbahRoleModal'
import { HapusAkunModal, PulihkanAkunModal, HapusPermanenModal, TypedDeleteConfirmModal } from './admin/AccountActionModals'
import { SuspendModal } from './admin/SuspendModal'
import { SetujuiAkunModal } from './admin/SetujuiAkunModal'
import { KirimVoucherModal } from './admin/KirimVoucherModal'

export default function AdminDashboardPage({ user, onSignOut }) {
  const [activeTab, setActiveTab] = useState('verifikasi')
  const [searchQuery, setSearchQuery] = useState('')
  const [apiError, setApiError] = useState('')
  // actionModal lintas domain (dibuka dari Manajemen & Pembayaran) → milik page.
  const [actionModal, setActionModal] = useState({ type: null, user: null })
  // Filter Manajemen: dipakai derived data (filteredUsers) yang dihitung sebelum
  // useManajemen dipanggil → milik page, bukan hook.
  const [activeFilter, setActiveFilter] = useState('Disetujui') // tab Manajemen aktif
  const [selectedRoles, setSelectedRoles] = useState([])
  const [selectedSubscriptions, setSelectedSubscriptions] = useState([])
  const [selectedPlans, setSelectedPlans] = useState([]) // filter Jenis Paket (Tahunan/Bulanan)
  const { sortConfig, handleSort, resetSort } = useSort()

  const toastApi = useAdminToast()
  const {
    toast, setToast, toastTimeoutId, limitHit, setLimitHit,
    executeActionRef, flashLimit,
  } = toastApi

  const usersApi = useAdminUsers({ setApiError })
  const {
    users, setUsers,
    managementUsers, setManagementUsers,
    usersById, setUsersById,
    discourseGroups, setDiscourseGroups, discourseGroupsRef,
    trainingRegionsRef,
    loadUsers,
  } = usersApi

  const pendaftaran = usePendaftaranTrainer({ activeTab, setApiError, toastApi })
  const {
    pendaftaranData,
    isAddPendaftaranModalOpen, setIsAddPendaftaranModalOpen,
    loadPendaftaran,
    handleAddPendaftaran,
    handleTogglePendaftaranStatus,
    handleDeletePendaftaran,
  } = pendaftaran

  const riwayat = useRiwayatPelatihan({ activeTab, searchQuery, setApiError, toastApi })
  const {
    riwayatPelatihanData, setRiwayatPelatihanData,
    riwayatPage, setRiwayatPage,
    riwayatTotalPages,
    isAddPelatihanModalOpen, setIsAddPelatihanModalOpen,
    perbaruiSession, setPerbaruiSession,
    pesertaSession, setPesertaSession,
    riwayatDetailUser, setRiwayatDetailUser,
    loadRiwayat,
    handleAddPelatihan,
    handleDeleteRiwayat,
    handleUpdatePelatihan,
    handleDownloadRiwayat,
  } = riwayat

  const pembayaran = usePembayaran({
    activeTab,
    setApiError,
    usersById, setUsersById,
    trainingRegionsRef, discourseGroupsRef,
    loadUsers,
    toastApi,
    actionModal, setActionModal,
  })
  const {
    pembayaranMenunggu, pembayaranDitolak,
    pembayaranSubTab, setPembayaranSubTab,
    konfirmasiCandidate, setKonfirmasiCandidate,
    tolakCandidate, setTolakCandidate,
    pembayaranMenungguCount, setPembayaranMenungguCount,
    pembayaranLoaded,
    handleKonfirmasiPembayaran,
    handleTolakPembayaran,
    handlePembayaranRowAction,
    handleConfirmHapusAkunPembayaran,
  } = pembayaran

  const boot = useAdminBoot({
    loadUsers, loadRiwayat, loadPendaftaran,
    setDiscourseGroups,
    setPembayaranMenungguCount,
  })
  const { trainingSessions } = boot

  const ver = useVerifikasi({
    users, setUsers,
    discourseGroups,
    trainingSessions,
    setApiError,
    toastApi,
  })
  const {
    selectedIds, setSelectedIds, toggleSelect, clearSelection,
    verifSubTab, setVerifSubTab,
    bulkModal, setBulkModal,
    bulkSuspendOpen, setBulkSuspendOpen,
    rejectCandidate, setRejectCandidate,
    approveCandidate, setApproveCandidate,
    pendingVoucherUsers, setPendingVoucherUsers,
    voucherCandidate, setVoucherCandidate,
    roleNameFromId,
    handleVerify,
    handleConfirmApprove,
    handleConfirmVoucher,
    handleBulkConfirmVoucher,
    handleBulkApprove,
    handleBulkReject,
    handleConfirmReject,
  } = ver
  const navFlags = {
    'verifikasi': users.length > 0 || pendingVoucherUsers.length > 0,
    'verifikasi-pembayaran': pembayaranLoaded ? pembayaranMenunggu.length > 0 : pembayaranMenungguCount > 0,
    'manajemen': managementUsers.some(u => u.isNew),
    'riwayat-pelatihan': riwayatPelatihanData.some(r => r.isNew),
    'pendaftaran-trainer': pendaftaranData.some(r => r.isNew),
  }

  // Kolom yang response payment TIDAK embed → ambil dari user (GET /admin/users)
  // via usersById. Pakai nilai user hanya kalau "berisi" ('-'/''/null dianggap kosong);
  // kalau tidak, pertahankan nilai dari payment (mis. plan Yearly/Monthly).
  const enrichFromUser = (row) => {
    const mu = usersById[row.userId]
    if (!mu) return row
    const has = (v) => v != null && v !== '' && v !== '-'
    const pick = (k) => (has(mu[k]) ? mu[k] : row[k])
    return {
      ...row,
      role: pick('role'),
      birthdate: pick('birthdate'),
      lokasi: pick('lokasi'),
      training: pick('training'),
      alumniDaerah: pick('alumniDaerah'),
      alumniTanggal: pick('alumniTanggal'),
      school: pick('school'),
      voucher: has(mu.voucher) ? mu.voucher : row.voucher,
      // endDate SENGAJA tidak ditimpa: tabel ini pakai proyeksi manual dari
      // mapToPembayaran (tgl payment + durasi), bukan endDate subscription user.
      plan: pick('plan'),
      // riwayat: angka user (>0) menang; simpan juga list buat modal Lihat Detail.
      riwayatCount: mu.riwayatCount > 0 ? mu.riwayatCount : row.riwayatCount,
      riwayatList: mu.riwayatList ?? row.riwayatList,
    }
  }

  // Sub-tab "Belum Langganan" (langkah verifikasi pembayaran): akun yang datanya SUDAH
  // disetujui (langkah-1 beres) tapi BELUM pernah berlangganan (subscription 'Not Active').
  // Belum lolos langkah-2 → belum masuk Manajemen. Sumber = managementUsers (mapToManajemen).
  // Catatan: 'Expired' = pernah bayar → tetap di Manajemen, bukan di sini.
  // Exclude akun yang sudah submit bukti bayar (nongol di 'Menunggu Verifikasi'
  // atau 'Pembayaran Ditolak') → jangan dobel-tampil di 'Belum Langganan'.
  const pembayaranUserIds = new Set([
    ...pembayaranMenunggu.map(p => p.userId),
    ...pembayaranDitolak.map(p => p.userId),
  ])
  const belumLangganan = managementUsers.filter(
    u => u.accountStatus === 'Disetujui' && u.subscription === 'Not Active' &&
      !pembayaranUserIds.has(u.id)
  )

  const currentData = activeTab === 'manajemen'
    ? managementUsers
    : activeTab === 'verifikasi-pembayaran'
      ? (pembayaranSubTab === 'belum-langganan'
        ? belumLangganan
        : (pembayaranSubTab === 'ditolak' ? pembayaranDitolak : pembayaranMenunggu).map(enrichFromUser))
      : (verifSubTab === 'voucher' ? pendingVoucherUsers : users)

  const filteredUsers = currentData.filter(user => {
    if (activeTab === 'manajemen') {
      // Tiap tab = 1 tabel utama → hanya baris dgn status == tab aktif.
      if (user.accountStatus !== activeFilter) return false
      // Flow: hanya akun yang lolos 2 langkah (verifikasi akun + pembayaran) yang masuk
      // Manajemen. Akun Disetujui tapi belum pernah langganan ('Not Active') masih di
      // langkah pembayaran (tab "Belum Langganan") → jangan tampil di Manajemen Disetujui.
      if (activeFilter === 'Disetujui' && user.subscription === 'Not Active') return false
      // Tab Ditolak & Baru Dihapus: tanpa filter (tombol filter disembunyikan) →
      // filter tersisa dari tab lain jangan ikut memotong baris.
      const filterable = activeFilter !== 'Ditolak' && activeFilter !== 'Baru Dihapus'
      if (filterable) {
        if (selectedRoles.length > 0 && !selectedRoles.includes(user.role)) return false
        if (selectedSubscriptions.length > 0 && !selectedSubscriptions.includes(user.subscription)) return false
        if (selectedPlans.length > 0 && !selectedPlans.includes(user.plan)) return false
      }
    }
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return ['name', 'username', 'email', 'training', 'school', 'voucher', 'voucherCode'].some(k =>
      (user[k] || '').toLowerCase().includes(q)
    )
  })

  const sortedUsers = applySortToList(filteredUsers, sortConfig)

  // "Pilih semua" dibatasi BULK_LIMIT (keputusan #2): pilih maksimal 10 baris teratas.
  const selectableIds = sortedUsers.slice(0, BULK_LIMIT).map(u => u.id)
  const allSelected = selectableIds.length > 0 && selectableIds.every(id => selectedIds.includes(id))
  const toggleSelectAll = () => {
    if (allSelected) { setSelectedIds([]); return }
    if (sortedUsers.length > BULK_LIMIT) flashLimit()
    setSelectedIds(selectableIds)
  }
  const selectedUsers = currentData.filter(u => selectedIds.includes(u.id))

  const man = useManajemen({
    activeTab,
    users, setUsers,
    managementUsers, setManagementUsers,
    selectedUsers,
    actionModal, setActionModal,
    setApiError,
    toastApi,
    roleNameFromId,
    setBulkSuspendOpen,
    clearSelection,
  })
  const {
    handleRoleChange,
    handleActionClick,
    handleConfirmUbahRole,
    handleConfirmHapusAkun,
    handleConfirmPulihkanAkun,
    handleConfirmHapusPermanen,
    handleConfirmSetujuiAkun,
    handleConfirmTangguhkanAkun,
    handleConfirmKirimVoucher,
    handleManajemenBulk,
    handleBulkTangguhkan,
  } = man

  // Trigger muat ulang per tab — di page (bukan useAdminUsers) supaya bisa
  // menyambungkan bridges milik useVerifikasi.
  useEffect(() => {
    loadUsers(activeTab, [], {
      onVoucher: (rows) => setPendingVoucherUsers(rows),
      onReset: () => clearSelection(),
    })
  }, [activeTab, loadUsers, setPendingVoucherUsers, clearSelection])

  // Derived data (currentData/selectedUsers) dihitung di sini, lalu dipakai
  // useManajemen di bawah — hook tetap unconditional, urutan stabil.


  const handleTabChange = (tab) => {
    // DB-005 #10: toast global (1 state utk semua tab) nyangkut kalau ganti tab
    // sebelum auto-dismiss 5s (mis. toast "Pendaftaran Trainer" masih nempel di
    // Riwayat Pelatihan). Cuma sembunyikan tampilannya di sini — JANGAN clearTimeout
    // toastTimeoutId: sebagian toast (scheduleAction, mis. reject/delete akun) pakai
    // timer itu buat commit API delayed 5s (undo-window). Kalau timer dibatalkan,
    // aksinya batal ikut hilang & state jadi tidak sinkron dgn backend.
    setToast(null)
    setActiveTab(tab); setSearchQuery(''); resetSort()
    setActiveFilter('Disetujui'); setSelectedRoles([]); setSelectedSubscriptions([]); setSelectedPlans([])
    setSelectedIds([]); setBulkModal(null)
    setPembayaranSubTab('menunggu'); setKonfirmasiCandidate(null); setTolakCandidate(null)
  }

  const handleUndoToast = () => {
    // Aksi FE-only (approve→voucher, konfirmasi voucher) menyimpan closure undo.
    if (toast?.undo) {
      toast.undo()
      setToast(null)
      if (toastTimeoutId) clearTimeout(toastTimeoutId)
      return
    }
    // Undo ubah role: kembalikan role lama + batalkan commit.
    if (toast?.roleUndo) {
      executeActionRef.current = false
      handleRoleChange(toast.roleUndo.id, toast.roleUndo.prevRole)
      setToast(null)
      if (toastTimeoutId) clearTimeout(toastTimeoutId)
      return
    }
    // Undo hapus/pulihkan: kembalikan status akun + batalkan commit.
    if (toast?.statusUndo) {
      executeActionRef.current = false
      const { id, prevStatus } = toast.statusUndo
      setManagementUsers(prev => prev.map(u => u.id === id ? { ...u, accountStatus: prevStatus } : u))
      setToast(null)
      if (toastTimeoutId) clearTimeout(toastTimeoutId)
      return
    }
    // Undo bulk status: kembalikan status tiap akun + batalkan commit batch.
    if (toast?.bulkStatusUndo) {
      executeActionRef.current = false
      const prevList = toast.bulkStatusUndo
      setManagementUsers(prev => prev.map(u => { const pr = prevList.find(x => x.id === u.id); return pr ? { ...u, accountStatus: pr.status } : u }))
      setToast(null)
      if (toastTimeoutId) clearTimeout(toastTimeoutId)
      return
    }
    if (toast?.riwayat) {
      const { riwayat, riwayatIndex } = toast
      setRiwayatPelatihanData(prev => {
        const next = [...prev]
        next.splice(riwayatIndex, 0, riwayat)
        return next
      })
      setToast(null)
      if (toastTimeoutId) clearTimeout(toastTimeoutId)
      return
    }
    if (toast?.users) {
      // Undo batch: kembalikan semua baris, batalkan commit.
      executeActionRef.current = false
      setUsers(prev => [...toast.users, ...prev])
      setToast(null)
      if (toastTimeoutId) clearTimeout(toastTimeoutId)
      return
    }
    if (toast?.user) {
      executeActionRef.current = false
      setUsers(prev => [toast.user, ...prev])
      setToast(null)
      if (toastTimeoutId) clearTimeout(toastTimeoutId)
    }
  }

  // Titik biru navbar per menu.
  //  - verifikasi: selalu muncul kalau ada akun di tabel Pending / Pending Voucher.
  //  - menu lain : muncul hanya kalau ada baris "komponen baru" (isNew, < 3 hari).

  const handleExport = () => {
    const csv = buildCsvContent(activeTab, sortedUsers, activeFilter, verifSubTab, pembayaranSubTab)
    const filename =
      activeTab === 'verifikasi'
        ? (verifSubTab === 'voucher' ? 'pending_voucher-Export data.csv' : 'verifikasi_akun-Export data.csv')
        : activeTab === 'verifikasi-pembayaran'
          ? (pembayaranSubTab === 'belum-langganan' ? 'belum_langganan-Export data.csv'
            : pembayaranSubTab === 'ditolak' ? 'pembayaran_ditolak-Export data.csv'
              : 'menunggu_verifikasi-Export data.csv')
          : 'manajemen_akun-Export data.csv'
    downloadCsv(filename, csv)
  }

  // ── Style A (document scroll) khusus tab Daftar User ────────────────────────
  // Zona beku bertingkat: header (top:0) → controls (top:headerH) → thead (top:headerH+controlsH).
  // Tinggi header & controls diukur runtime supaya offset thead selalu pas.
  const isPageScroll = activeTab === 'daftar-user'
  const daftarHeaderRef = useRef(null)
  const daftarControlsRef = useRef(null)
  // sb = lebar sidebar (260 / 84 saat collapse). Dipakai buat pin header title &
  // controls ke area terlihat: root jadi w-max (selebar tabel) supaya bg header/controls
  // ikut selebar konten (nutup "tembus" saat scroll kanan), lalu isinya di-sticky left
  // ke tepi sidebar biar tetap kelihatan.
  const [daftarStick, setDaftarStick] = useState({ h: 96, c: 68, sb: 260 })
  useEffect(() => {
    if (!isPageScroll) return
    const aside = document.querySelector('aside')
    const measure = () => setDaftarStick({
      h: daftarHeaderRef.current?.offsetHeight || 96,
      c: daftarControlsRef.current?.offsetHeight || 68,
      sb: aside?.offsetWidth || 260,
    })
    measure()
    const ro = new ResizeObserver(measure)
    if (daftarHeaderRef.current) ro.observe(daftarHeaderRef.current)
    if (daftarControlsRef.current) ro.observe(daftarControlsRef.current)
    if (aside) ro.observe(aside)
    window.addEventListener('resize', measure)
    return () => { ro.disconnect(); window.removeEventListener('resize', measure) }
  }, [isPageScroll])

  return (
    <div
      className={`bg-white flex font-sans ${isPageScroll ? "min-h-screen w-max min-w-full" : "h-screen overflow-hidden"}`}
    >
      <AdminSidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onSignOut={onSignOut}
        user={user}
        navFlags={navFlags}
      />

      <main
        className={`flex-1 flex flex-col min-w-0 ${isPageScroll ? "" : "overflow-hidden"}`}
      >
        <header
          ref={daftarHeaderRef}
          className={`px-10 py-8 border-b border-gray-100 bg-white ${isPageScroll ? "sticky top-0 z-30" : "shrink-0"}`}
        >
          <h1
            className={`text-3xl font-bold text-[#0A1128] ${isPageScroll ? "w-max sticky" : ""}`}
            style={isPageScroll ? { left: daftarStick.sb } : undefined}
          >
            {activeTab === "verifikasi" && "Verifikasi Akun"}
            {activeTab === "verifikasi-pembayaran" && "Verifikasi Pembayaran"}
            {activeTab === "manajemen" && "Manajemen Akun"}
            {activeTab === "daftar-user" && "Daftar User"}
            {activeTab === "pendaftaran-trainer" &&
              "Pendaftaran Pelatihan Trainer"}
            {activeTab === "riwayat-pelatihan" && "Riwayat Pelatihan"}
          </h1>
        </header>

        <div
          className={`flex-1 p-10 pt-8 bg-[#F7F8FC] ${isPageScroll ? "" : "overflow-hidden"}`}
        >
          {apiError && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">
              {apiError}
            </div>
          )}

          {activeTab === "verifikasi" && (
            <VerifikasiControls
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onExport={handleExport}
              subTab={verifSubTab}
              onSubTabChange={(t) => {
                setVerifSubTab(t);
                setSelectedIds([]);
              }}
              pendingCount={users.length}
              voucherCount={pendingVoucherUsers.length}
              selectedCount={selectedIds.length}
              bulkLimit={BULK_LIMIT}
              limitHit={limitHit}
              onBulkApprove={() => setBulkModal("approve")}
              onBulkReject={() => setBulkModal("reject")}
              onBulkConfirm={() => setBulkModal("confirm")}
              onClearSelection={clearSelection}
              onDismissLimit={() => setLimitHit(false)}
            />
          )}
          {activeTab === "verifikasi-pembayaran" && (
            <VerifikasiPembayaranControls
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onExport={handleExport}
              subTab={pembayaranSubTab}
              onSubTabChange={setPembayaranSubTab}
              belumLanggananCount={belumLangganan.length}
              menungguCount={pembayaranMenunggu.length}
              ditolakCount={pembayaranDitolak.length}
            />
          )}
          {activeTab === "pendaftaran-trainer" && (
            <PendaftaranTrainerControls
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onAdd={() => setIsAddPendaftaranModalOpen(true)}
            />
          )}
          {activeTab === "manajemen" && (
            <ManajemenControls
              activeFilter={activeFilter}
              onFilterChange={(f) => {
                setActiveFilter(f);
                setSelectedIds([]);
              }}
              selectedRoles={selectedRoles}
              onRolesChange={setSelectedRoles}
              selectedSubscriptions={selectedSubscriptions}
              onSubscriptionsChange={setSelectedSubscriptions}
              selectedPlans={selectedPlans}
              onPlansChange={setSelectedPlans}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onExport={handleExport}
              selectedCount={selectedIds.length}
              bulkLimit={BULK_LIMIT}
              limitHit={limitHit}
              onDismissLimit={() => setLimitHit(false)}
              onClearSelection={clearSelection}
              onBulkAction={handleManajemenBulk}
            />
          )}
          {activeTab === "daftar-user" && (
            <div
              ref={daftarControlsRef}
              style={{ top: daftarStick.h }}
              className="sticky z-20 -mx-10 bg-[#F7F8FC]"
            >
              {/* outer selebar konten (bg nutup area saat scroll kanan); inner di-pin
                  sticky-left ke tepi sidebar & selebar viewport biar search tetap tampak */}
              <div
                className="sticky flex items-center justify-between gap-4 px-10 pt-1 pb-6"
                style={{
                  left: daftarStick.sb,
                  width: `calc(100vw - ${daftarStick.sb}px)`,
                }}
              >
                <p className="text-sm text-gray-500">
                  Total{" "}
                  <span className="font-bold text-[#0A1128]">
                    {Object.keys(usersById).length}
                  </span>{" "}
                  user
                </p>
                <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-full px-5 py-3 w-full max-w-sm">
                  <Search size={18} className="text-gray-400 shrink-0" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari Pelatihan..."
                    className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
                  />
                </div>
              </div>
            </div>
          )}
          {activeTab === "riwayat-pelatihan" && (
            <RiwayatPelatihanControls
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onAdd={() => setIsAddPelatihanModalOpen(true)}
              onExport={() => {
                // Ikut baris yang tampil di tabel: terapkan filter pencarian yang sama
                // (nama / daerah / peserta) seperti RiwayatPelatihanTable.
                const q = searchQuery.trim().toLowerCase();
                const rows = q
                  ? riwayatPelatihanData.filter(
                    (item) =>
                      (item.nama || "").toLowerCase().includes(q) ||
                      (item.daerah || "").toLowerCase().includes(q) ||
                      (item.pesertaNama || "").toLowerCase().includes(q) ||
                      (item.pesertaEmail || "").toLowerCase().includes(q),
                  )
                  : riwayatPelatihanData;
                // Kolom persis header tabel: tanpa "Status" (kolom itu tidak dirender).
                const csv = [
                  "Nama Pelatihan,Daerah Pelatihan,Tgl. Mulai,Nama Peserta,Last Updated",
                  ...rows.map(
                    (item) =>
                      `"${item.nama}","${item.daerah}","${item.tglMulai}","${item.pesertaNama}","${item.lastUpdated}"`,
                  ),
                ].join("\n");
                downloadCsv("riwayat_pelatihan-Export data.csv", csv);
              }}
            />
          )}

          {activeTab === "verifikasi" && verifSubTab === "pending" && (
            <VerifikasiTable
              users={sortedUsers}
              sortConfig={sortConfig}
              onSort={handleSort}
              onApprove={handleVerify}
              onReject={setRejectCandidate}
              searchQuery={searchQuery}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
              onToggleSelectAll={toggleSelectAll}
              allSelected={allSelected}
            />
          )}
          {activeTab === "verifikasi" && verifSubTab === "voucher" && (
            <PendingVoucherTable
              users={sortedUsers}
              sortConfig={sortConfig}
              onSort={handleSort}
              onConfirm={setVoucherCandidate}
              onRiwayatDetail={setRiwayatDetailUser}
              searchQuery={searchQuery}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
              onToggleSelectAll={toggleSelectAll}
              allSelected={allSelected}
            />
          )}
          {activeTab === "verifikasi-pembayaran" &&
            pembayaranSubTab === "belum-langganan" && (
              <BelumLanggananTable
                users={sortedUsers}
                sortConfig={sortConfig}
                onSort={handleSort}
                onRiwayatDetail={setRiwayatDetailUser}
                searchQuery={searchQuery}
              />
            )}
          {activeTab === "verifikasi-pembayaran" &&
            pembayaranSubTab !== "belum-langganan" && (
              <VerifikasiPembayaranTable
                users={sortedUsers}
                sortConfig={sortConfig}
                onSort={handleSort}
                searchQuery={searchQuery}
                subTab={pembayaranSubTab}
                onConfirm={setKonfirmasiCandidate}
                onRiwayatClick={setRiwayatDetailUser}
                onRowAction={handlePembayaranRowAction}
              />
            )}
          {activeTab === "pendaftaran-trainer" && (
            <PendaftaranTrainerTable
              data={pendaftaranData}
              onToggleStatus={handleTogglePendaftaranStatus}
              onDelete={(item) =>
                setActionModal({ type: "hapus-pelatihan-trainer", user: item })
              }
              searchQuery={searchQuery}
            />
          )}
          {activeTab === "riwayat-pelatihan" && (
            <p className="mb-4 text-sm text-gray-500">
              Total{" "}
              <span className="font-bold text-[#0A1128]">
                {riwayatPelatihanData.length}
              </span>{" "}
              pelatihan
            </p>
          )}
          {activeTab === "riwayat-pelatihan" && (
            <RiwayatPelatihanTable
              data={riwayatPelatihanData}
              searchQuery={searchQuery}
              page={riwayatPage}
              totalPages={riwayatTotalPages}
              onPageChange={setRiwayatPage}
              onEdit={setPerbaruiSession}
              onDownload={handleDownloadRiwayat}
              onViewPeserta={setPesertaSession}
            />
          )}

          {activeTab === "manajemen" && (
            <ManajemenTable
              users={sortedUsers}
              sortConfig={sortConfig}
              onSort={handleSort}
              onRoleChange={handleRoleChange}
              searchQuery={searchQuery}
              activeFilter={activeFilter}
              onActionClick={handleActionClick}
              onRiwayatClick={setRiwayatDetailUser}
            />
          )}
          {activeTab === "daftar-user" &&
            (() => {
              const q = searchQuery.trim().toLowerCase();
              const list = Object.values(usersById);
              const filtered = q
                ? list.filter(
                  (u) =>
                    (u.name || "").toLowerCase().includes(q) ||
                    (u.email || "").toLowerCase().includes(q) ||
                    (u.username || "").toLowerCase().includes(q),
                )
                : list;
              return (
                <DaftarUserTable
                  users={filtered}
                  searchQuery={searchQuery}
                  stickTop={daftarStick.h + daftarStick.c}
                />
              );
            })()}
        </div>
      </main>

      <RejectModal
        candidate={rejectCandidate}
        onConfirm={handleConfirmReject}
        onCancel={() => setRejectCandidate(null)}
      />
      <ApproveModal
        candidate={approveCandidate}
        discourseGroups={discourseGroups}
        trainingSessions={trainingSessions}
        onConfirm={handleConfirmApprove}
        onCancel={() => setApproveCandidate(null)}
      />
      {bulkModal === "approve" && (
        <BulkApproveModal
          candidates={selectedUsers}
          discourseGroups={discourseGroups}
          trainingSessions={trainingSessions}
          onConfirm={handleBulkApprove}
          onCancel={() => setBulkModal(null)}
        />
      )}
      {bulkModal === "reject" && (
        <BulkRejectModal
          candidates={selectedUsers}
          onConfirm={handleBulkReject}
          onCancel={() => setBulkModal(null)}
        />
      )}
      {bulkModal === "confirm" && (
        <BulkVoucherModal
          candidates={selectedUsers}
          onConfirm={handleBulkConfirmVoucher}
          onCancel={() => setBulkModal(null)}
        />
      )}
      <KonfirmasiVoucherModal
        candidate={voucherCandidate}
        onConfirm={handleConfirmVoucher}
        onCancel={() => setVoucherCandidate(null)}
      />
      <AddPendaftaranTrainerModal
        isOpen={isAddPendaftaranModalOpen}
        onClose={() => setIsAddPendaftaranModalOpen(false)}
        onSave={handleAddPendaftaran}
      />
      {actionModal.type === "ubah-role" && (
        <UbahRoleModal
          user={actionModal.user}
          discourseGroups={discourseGroups}
          onConfirm={handleConfirmUbahRole}
          onCancel={() => setActionModal({ type: null, user: null })}
        />
      )}
      {actionModal.type === "kirim-voucher" && (
        <KirimVoucherModal
          user={actionModal.user}
          onConfirm={handleConfirmKirimVoucher}
          onCancel={() => setActionModal({ type: null, user: null })}
        />
      )}
      {actionModal.type === "hapus-akun" && (
        <HapusAkunModal
          user={actionModal.user}
          onConfirm={handleConfirmHapusAkun}
          onCancel={() => setActionModal({ type: null, user: null })}
        />
      )}
      {actionModal.type === "hapus-akun-pembayaran" && (
        <HapusAkunModal
          user={actionModal.user}
          onConfirm={handleConfirmHapusAkunPembayaran}
          onCancel={() => setActionModal({ type: null, user: null })}
        />
      )}
      {actionModal.type === "pulihkan-akun" && (
        <PulihkanAkunModal
          user={actionModal.user}
          onConfirm={handleConfirmPulihkanAkun}
          onCancel={() => setActionModal({ type: null, user: null })}
        />
      )}
      {actionModal.type === "hapus-akun-permanen" && (
        <HapusPermanenModal
          user={actionModal.user}
          onConfirm={handleConfirmHapusPermanen}
          onCancel={() => setActionModal({ type: null, user: null })}
        />
      )}
      {actionModal.type === "hapus-pelatihan-trainer" && (
        <TypedDeleteConfirmModal
          title="Yakin Hapus Pelatihan Ini?"
          itemName={actionModal.user?.nama}
          confirmLabel="Hapus Pelatihan"
          onConfirm={() => {
            handleDeletePendaftaran(actionModal.user);
            setActionModal({ type: null, user: null });
          }}
          onCancel={() => setActionModal({ type: null, user: null })}
        />
      )}
      {actionModal.type === "setujui-akun" && (
        <SetujuiAkunModal
          user={actionModal.user}
          discourseGroups={discourseGroups}
          trainingSessions={trainingSessions}
          onConfirm={handleConfirmSetujuiAkun}
          onCancel={() => setActionModal({ type: null, user: null })}
          onCopyVoucher={(code) =>
            setToast({ message: <>Kode voucher {code} disalin</> })
          }
        />
      )}
      {actionModal.type === "tangguhkan-akun" && (
        <SuspendModal
          user={actionModal.user}
          onConfirm={handleConfirmTangguhkanAkun}
          onCancel={() => setActionModal({ type: null, user: null })}
        />
      )}
      {bulkSuspendOpen && (
        <SuspendModal
          user={{ name: `${selectedIds.length} akun terpilih` }}
          onConfirm={handleBulkTangguhkan}
          onCancel={() => setBulkSuspendOpen(false)}
        />
      )}
      <AddPelatihanModal
        isOpen={isAddPelatihanModalOpen}
        onClose={() => setIsAddPelatihanModalOpen(false)}
        onSave={handleAddPelatihan}
      />
      <PerbaruiRiwayatModal
        isOpen={!!perbaruiSession}
        session={perbaruiSession}
        onClose={() => setPerbaruiSession(null)}
        onSave={handleUpdatePelatihan}
        onDelete={handleDeleteRiwayat}
      />
      <RiwayatDetailModal
        user={riwayatDetailUser}
        onClose={() => setRiwayatDetailUser(null)}
      />
      <DaftarPesertaModal
        isOpen={!!pesertaSession}
        session={pesertaSession}
        onClose={() => setPesertaSession(null)}
      />
      <KonfirmasiPembayaranModal
        candidate={konfirmasiCandidate}
        onConfirm={handleKonfirmasiPembayaran}
        onReject={() => {
          setTolakCandidate(konfirmasiCandidate);
          setKonfirmasiCandidate(null);
        }}
        onCancel={() => setKonfirmasiCandidate(null)}
      />
      <TolakPembayaranModal
        candidate={tolakCandidate}
        onConfirm={handleTolakPembayaran}
        onCancel={() => setTolakCandidate(null)}
      />
      <AdminToast toast={toast} onUndo={handleUndoToast} />
    </div>
  );
}
