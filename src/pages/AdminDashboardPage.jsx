import { useState, useRef, useEffect, useCallback } from 'react'
import { adminApi, discourseApi, regionsApi, appConfigApi, trainingSessionsApi } from '@/lib/api'
import { mapToVerifikasi, mapToManajemen, mapToRiwayat, fmtDate } from './admin/mappers'
import { AdminSidebar }    from './admin/AdminSidebar'
import { AdminToast }      from './admin/AdminToast'
import { RejectModal, ApproveModal } from './admin/ConfirmModal'
import { VerifikasiControls, ManajemenControls, PendaftaranTrainerControls, RiwayatPelatihanControls } from './admin/TableControls'
import { VerifikasiTable } from './admin/VerifikasiTable'
import { ManajemenTable }  from './admin/ManajemenTable'
import { PendaftaranTrainerTable } from './admin/PendaftaranTrainerTable'
import { RiwayatPelatihanTable } from './admin/RiwayatPelatihanTable'
import { AddPendaftaranTrainerModal } from './admin/AddPendaftaranTrainerModal'
import { AddPelatihanModal } from './admin/AddPelatihanModal'
import { PerbaruiRiwayatModal } from './admin/PerbaruiRiwayatModal'
import { UbahRoleModal } from './admin/UbahRoleModal'
import { KirimVoucherModal } from './admin/KirimVoucherModal'
import { HapusRiwayatModal } from './admin/HapusRiwayatModal'


// ─── Pendaftaran Trainer (app-config hero_banner-home-v2) ───────────────────────
const PENDAFTARAN_KEY = 'hero_banner-home-v2'
const HEADER_BASE = 'Apa kamu mau daftar menjadi Trainer di pelatihan Gasing tanggal '
const DEFAULT_SHARED = {
  modalBody: 'Tim Gasing akan menghubungi members yang terpilih menjadi Trainer untuk pengimbasan, berikut informasi lainnya. Pastikan nomor HP kamu aktif ya!',
  modalTitle: 'Yuk, daftar jadi Trainer pengimbasan Gasing!',
  modalSuccess: 'Terima kasih sudah mendaftar sebagai Trainer!',
}

// Ambil id topik dari URL Discourse (mis .../t/slug/143 atau .../t/slug/143/5 → 143).
function parseThreadId(url) {
  if (!url) return null
  const s = String(url)
  const m = s.match(/\/t\/[^/]+\/(\d+)/)
  if (m) return m[1]
  const nums = s.match(/\d+/g)
  return nums ? nums[nums.length - 1] : null
}

// value.threads (object) → array baris untuk table.
function threadsToRows(value) {
  const threads = value?.threads || {}
  return Object.entries(threads).map(([id, t]) => ({
    id,
    threadId: id,
    nama: t.namaPelatihan || '-',
    url: t.url || '',
    periode: t.periode || '-',
    batasWaktu: t.batasWaktu || '',
    isActive: !!t.enabled,
    headerText: t.headerText || '',
  }))
}

// array baris → value untuk PUT (pertahankan shared_content).
function rowsToValue(rows, sharedContent) {
  const threads = {}
  rows.forEach(r => {
    threads[r.threadId] = {
      enabled: r.isActive,
      headerText: r.headerText,
      namaPelatihan: r.nama,
      periode: r.periode,
      batasWaktu: r.batasWaktu,
      url: r.url,
    }
  })
  return { threads, shared_content: sharedContent || DEFAULT_SHARED }
}

function useSort() {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }))
  }
  return { sortConfig, handleSort, resetSort: () => setSortConfig({ key: null, direction: 'asc' }) }
}

function applySortToList(list, sortConfig) {
  if (!sortConfig.key) return list
  return [...list].sort((a, b) => {
    let valA = a[sortConfig.key] || ''
    let valB = b[sortConfig.key] || ''
    if (sortConfig.key === 'birthdate' || sortConfig.key === 'endDate') {
      valA = valA ? new Date(valA).getTime() : 0
      valB = valB ? new Date(valB).getTime() : 0
    } else if (typeof valA === 'string') {
      valA = valA.toLowerCase(); valB = valB.toLowerCase()
    }
    if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1
    if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1
    return 0
  })
}

function buildCsvContent(tab, users) {
  const escapeCsv = (str) => {
    const s = String(str ?? '')
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s
  }
  const headers = tab === 'verifikasi'
    ? ['Nama Pengguna', 'Email', 'Status', 'Tgl.Lahir', 'Alumni Pelatihan', 'Tahun', 'Asal Sekolah', 'Role Pengguna']
    : ['Nama Pengguna', 'Email', 'Status Akun', 'Kode Voucher', 'Tgl.Lahir', 'Alumni Pelatihan', 'Tahun', 'Asal Sekolah', 'Role Pengguna', 'Berlangganan', 'Tgl Berakhir']
  const rows = tab === 'verifikasi'
    ? users.map(u => [u.name, u.email, u.status, u.birthdate, u.training, u.year, u.school, u.role || 'Pilih Role'])
    : users.map(u => [u.name, u.email, u.accountStatus || '-', u.voucher || '-', u.birthdate || '-', u.training || '-', u.year || '-', u.school || '-', u.role || 'Pilih Role', u.subscription || '-', u.plan || '-'])
  return [headers.join(','), ...rows.map(r => r.map(escapeCsv).join(','))].join('\n')
}

export default function AdminDashboardPage({ user, onSignOut }) {
  const [activeTab, setActiveTab] = useState('verifikasi')
  const [users, setUsers]                   = useState([])
  const [managementUsers, setManagementUsers] = useState([])
  const [loadingUsers, setLoadingUsers]     = useState(false)
  const [apiError, setApiError]             = useState('')
  const [searchQuery, setSearchQuery]       = useState('')
  const [roleErrors, setRoleErrors]         = useState({})
  
  // States for Pendaftaran Trainer (sumber: app-config hero_banner-home-v2)
  const [pendaftaranData, setPendaftaranData] = useState([])
  const [sharedContent, setSharedContent] = useState(DEFAULT_SHARED)
  const [isAddPendaftaranModalOpen, setIsAddPendaftaranModalOpen] = useState(false)

  // States for Riwayat Pelatihan (di-load dari GET /training-sessions)
  const [riwayatPelatihanData, setRiwayatPelatihanData] = useState([])
  const [riwayatToDelete, setRiwayatToDelete] = useState(null)
  const [isAddPelatihanModalOpen, setIsAddPelatihanModalOpen] = useState(false)
  const [perbaruiSession, setPerbaruiSession] = useState(null)

  const [discourseGroups, setDiscourseGroups] = useState([])
  const [trainingRegions, setTrainingRegions] = useState([])
  const [rejectCandidate, setRejectCandidate] = useState(null)
  const [approveCandidate, setApproveCandidate] = useState(null)
  const [toast, setToast]                   = useState(null)
  const [toastTimeoutId, setToastTimeoutId] = useState(null)
  const [activeFilter, setActiveFilter]     = useState('Semua')
  const [selectedRoles, setSelectedRoles]   = useState([])
  const [selectedSubscriptions, setSelectedSubscriptions] = useState([])
  const [actionModal, setActionModal]       = useState({ type: null, user: null })
  const executeActionRef = useRef(true)
  const { sortConfig, handleSort, resetSort } = useSort()

  const loadUsers = useCallback(async (tab, currentRegions = []) => {
    setLoadingUsers(true); setApiError('')
    try {
      let regions = currentRegions.length ? currentRegions : [];
      if (regions.length === 0) {
        try {
          const rRes = await regionsApi.list();
          regions = Array.isArray(rRes) ? rRes : (rRes.data || []);
          // update state tapi jangan trigger infinite loop
          setTrainingRegions(regions);
        } catch (e) {
          console.error("Failed to load regions", e)
        }
      }

      if (tab === 'verifikasi') {
        // Backend: list user yang butuh verifikasi = filter[verifiedStatus]=waiting.
        const res = await adminApi.getUsers({ 'filter[verifiedStatus]': 'waiting' })
        const rawList = Array.isArray(res) ? res : res.data || []
        // Defensif: kalau server tidak memfilter, saring lagi di klien.
        const pendingUsers = rawList.filter(u => u.verifiedStatus != 1 && u.verifiedStatus != -1 || u.verifiedStatus === 'waiting')
        setUsers(pendingUsers.map(u => mapToVerifikasi(u, regions)))
      } else {
        const res = await adminApi.getUsers({})
        setManagementUsers((Array.isArray(res) ? res : res.data || []).map(u => mapToManajemen(u, regions)))
      }
    } catch (err) {
      setApiError(err.message || 'Gagal memuat data')
    } finally {
      setLoadingUsers(false)
    }
  }, [])

  useEffect(() => { loadUsers(activeTab) }, [activeTab])

  const loadPendaftaran = useCallback(async () => {
    try {
      const res = await appConfigApi.get(PENDAFTARAN_KEY)
      const value = res?.value ?? res?.data?.value ?? res ?? {}
      setSharedContent(value.shared_content || DEFAULT_SHARED)
      setPendaftaranData(threadsToRows(value))
    } catch (e) {
      // Belum dikonfigurasi / gagal baca → mulai dari kosong.
      setPendaftaranData([])
      setSharedContent(DEFAULT_SHARED)
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'pendaftaran-trainer') loadPendaftaran()
  }, [activeTab, loadPendaftaran])

  const loadRiwayat = useCallback(async () => {
    try {
      const res = await trainingSessionsApi.list({ page: 1, limit: 100 })
      const list = Array.isArray(res) ? res : (res?.data || res?.items || [])

      // Session cuma bawa regionId. Resolve "Kab/Kota, Provinsi":
      // GET /regions/:id → { name, parentId }, lalu parentId → nama provinsi.
      // Dedupe + cache (parentId sering sama). Best-effort; gagal = biarin '-'.
      const cache = {}
      const getRegion = async (id) => {
        if (!id) return null
        if (id in cache) return cache[id]
        try {
          const r = await regionsApi.get(id)
          const reg = r?.data || r
          cache[id] = { name: reg?.name || reg?.regionName || '', parentId: reg?.parentId || null }
        } catch { cache[id] = null }
        return cache[id]
      }

      const ids = [...new Set(list.map(s => s.regionId).filter(Boolean))]
      const regionMap = {}
      await Promise.all(ids.map(async (id) => {
        const reg = await getRegion(id)
        if (!reg) return
        const prov = reg.parentId ? await getRegion(reg.parentId) : null
        regionMap[id] = [reg.name, prov?.name].filter(Boolean).join(', ')
      }))

      setRiwayatPelatihanData(list.map(s => mapToRiwayat(s, regionMap)))
    } catch (e) {
      setRiwayatPelatihanData([])
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'riwayat-pelatihan') loadRiwayat()
  }, [activeTab, loadRiwayat])

  useEffect(() => {
    discourseApi.getGroups()
      .then(res => setDiscourseGroups(Array.isArray(res) ? res : (res.data || [])))
      .catch(err => console.error("Failed to load discourse groups", err))
  }, [])

  const handleTabChange = (tab) => {
    setActiveTab(tab); setSearchQuery(''); resetSort()
    setActiveFilter('Semua'); setSelectedRoles([]); setSelectedSubscriptions([])
  }

  const persistPendaftaran = (rows) =>
    appConfigApi.set(PENDAFTARAN_KEY, rowsToValue(rows, sharedContent))

  const handleAddPendaftaran = async (data) => {
    const threadId = parseThreadId(data.url)
    if (!threadId) {
      setApiError('Tautan topik tidak valid. Pastikan URL mengandung id topik Discourse.')
      return
    }

    const newRow = {
      id: threadId,
      threadId,
      nama: data.nama,
      url: data.url,
      periode: data.periode,
      batasWaktu: data.batasWaktu,
      isActive: false,
      headerText: HEADER_BASE + (data.periode || ''),
    }
    // Ganti kalau threadId sama sudah ada.
    const next = [newRow, ...pendaftaranData.filter(r => r.threadId !== threadId)]
    const prev = pendaftaranData

    setApiError('')
    setPendaftaranData(next)
    try {
      await persistPendaftaran(next)
      setToast({ message: <>Pelatihan <span className="font-medium">{data.nama}</span> berhasil ditambahkan</> })
    } catch (err) {
      setPendaftaranData(prev)
      setApiError(err.message || 'Gagal menyimpan pendaftaran pelatihan.')
    }
  }

  // Aturan: hanya 1 pelatihan boleh aktif. Nyalakan 1 → matikan sisanya.
  const handleTogglePendaftaranStatus = async (id) => {
    const target = pendaftaranData.find(r => r.id === id)
    if (!target) return
    const turningOn = !target.isActive
    const next = pendaftaranData.map(r => ({
      ...r,
      isActive: turningOn ? r.id === id : (r.id === id ? false : r.isActive),
    }))
    const prev = pendaftaranData

    setApiError('')
    setPendaftaranData(next)
    try {
      await persistPendaftaran(next)
    } catch (err) {
      setPendaftaranData(prev)
      setApiError(err.message || 'Gagal memperbarui status pelatihan.')
    }
  }


  // Tambah pelatihan baru → POST /admin/training-sessions (optimistic).
  // Status = state upload: Processing (in-flight) → Saved (sukses) / Error (gagal).
  // Response cuma balikin session (tanpa peserta/langganan) → kolom itu diisi '-'.
  const handleAddPelatihan = async (data) => {
    const tempId = `temp-${Date.now()}`
    const baseRow = {
      id: tempId,
      nama: data.name,
      isNew: true,
      daerah: data.daerahLabel,
      tglMulai: data.tglMulaiLabel,
      status: 'Processing',
      pesertaNama: '-',
      pesertaLainnya: 0,
      pesertaEmail: '-',
      langganan: '-',
      lastUpdatedDate: fmtDate(Date.now()),
      lastUpdatedTime: '',
    }
    setRiwayatPelatihanData(prev => [baseRow, ...prev])

    try {
      const res = await adminApi.createTrainingSession({
        name: data.name,
        regionId: data.regionId,
        startDate: data.startDate,
        endDate: data.endDate,
      })
      const sessionId = res?.id || res?.data?.id || tempId
      setRiwayatPelatihanData(prev =>
        prev.map(r => (r.id === tempId ? { ...r, id: sessionId, status: 'Saved' } : r))
      )
      setToast({ message: <>Pelatihan <span className="font-medium">{data.name}</span> berhasil ditambahkan</> })
      if (toastTimeoutId) clearTimeout(toastTimeoutId)
      const tid = setTimeout(() => setToast(null), 5000)
      setToastTimeoutId(tid)
    } catch (err) {
      setRiwayatPelatihanData(prev =>
        prev.map(r => (r.id === tempId ? { ...r, status: 'Error' } : r))
      )
      setApiError(err.message || 'Gagal menambah pelatihan.')
    }
  }

  const handleDeleteRiwayat = (item) => {
    const target = item || riwayatToDelete
    if (!target) return
    const idx = riwayatPelatihanData.findIndex(r => r.id === target.id)
    setRiwayatPelatihanData(prev => prev.filter(r => r.id !== target.id))
    setRiwayatToDelete(null)
    setToast({ message: 'Berhasil menghapus riwayat pelatihan', riwayat: target, riwayatIndex: idx })
    if (toastTimeoutId) clearTimeout(toastTimeoutId)
    const id = setTimeout(() => setToast(null), 5000)
    setToastTimeoutId(id)
  }

  const handleDownloadRiwayat = (item) => {
    const csv = [
      'Nama Pelatihan,Daerah Pelatihan,Tgl. Mulai,Status,Nama Peserta',
      `"${item.nama}","${item.daerah}","${item.tglMulai}","${item.status}","${item.pesertaNama}"`
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `${item.nama}-Export data.csv`)
    document.body.appendChild(link); link.click(); document.body.removeChild(link)
  }

  const scheduleAction = (apiCall, onError) => {
    executeActionRef.current = true
    if (toastTimeoutId) clearTimeout(toastTimeoutId)
    const id = setTimeout(async () => {
      if (executeActionRef.current) {
        try { await apiCall() }
        catch { onError() }
      }
      setToast(null)
    }, 5000)
    setToastTimeoutId(id)
  }

  const handleVerify = (id) => {
    const user = users.find(u => u.id === id)
    if (!user.role) {
      setRoleErrors(prev => ({ ...prev, [id]: true }))
      setTimeout(() => setRoleErrors(prev => ({ ...prev, [id]: false })), 30000)
      return
    }
    setApproveCandidate(user)
  }

  const handleConfirmApprove = () => {
    if (!approveCandidate) return
    const target = approveCandidate
    setUsers(prev => prev.filter(u => u.id !== target.id))
    setApproveCandidate(null)
    setToast({ message: <>Akun {target.name} telah <span className="text-green-500 font-medium">disetujui</span></>, user: target })
    
    // Pastikan discourseGroupId berupa angka (integer)
    const groupId = target.role ? parseInt(target.role, 10) : null;
    
    scheduleAction(() => adminApi.verifyUser(target.id, { status: 'approved', discourseGroupId: groupId }), () => {
      setUsers(prev => [target, ...prev]); setApiError('Gagal menyetujui akun. Silakan coba lagi.')
    })
  }

  const handleConfirmReject = ({ status, invalidFields, reason }) => {
    if (!rejectCandidate) return
    const target = rejectCandidate
    setUsers(prev => prev.filter(u => u.id !== target.id))
    setRejectCandidate(null)
    setToast({ message: <>Akun {target.name} telah <span className="text-red-500 font-medium">ditolak</span></>, user: target })

    // status 'rejected' → tolak final (teks bebas). status 'revise' → minta perbaiki
    // data (backend generate token JWT + email link revise). Lihat ADR-0003.
    const apiCall = status === 'rejected'
      ? () => adminApi.rejectUser(target.id, { rejectedReason: reason })
      : () => adminApi.reviseUser(target.id, { rejectedReason: reason, fieldsToRevise: invalidFields })

    scheduleAction(apiCall, () => {
      setUsers(prev => [target, ...prev]); setApiError('Gagal menolak akun. Silakan coba lagi.')
    })
  }

  const handleRoleChange = (id, newRole) => {
    if (activeTab === 'verifikasi') {
      setUsers(users.map(u => u.id === id ? { ...u, role: newRole } : u))
    } else {
      setManagementUsers(managementUsers.map(u => u.id === id ? { ...u, role: newRole } : u))
    }
    if (newRole) setRoleErrors(prev => ({ ...prev, [id]: false }))
  }

  const handleActionClick = (type, user) => {
    setActionModal({ type, user })
  }

  const handleConfirmUbahRole = (newRole) => {
    const target = actionModal.user
    handleRoleChange(target.id, newRole)
    setActionModal({ type: null, user: null })
    setToast({ message: <>Role {target.name} telah diubah menjadi <span className="font-bold">{newRole}</span></> })
    // Call API here...
    // adminApi.updateDiscourseGroup(...)
  }

  const handleConfirmKirimVoucher = (voucherCode) => {
    const target = actionModal.user
    setManagementUsers(managementUsers.map(u => u.id === target.id ? { ...u, voucher: voucherCode } : u))
    setActionModal({ type: null, user: null })
    setToast({ message: <>Voucher <span className="font-bold">{voucherCode}</span> berhasil dikirim ke {target.name}</> })
    // Call API here...
    // adminApi.grantPersonalVoucher(...)
  }

  const handleUndoToast = () => {
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
    if (toast?.user) {
      executeActionRef.current = false
      setUsers(prev => [toast.user, ...prev])
      setToast(null)
      if (toastTimeoutId) clearTimeout(toastTimeoutId)
    }
  }

  const currentData = activeTab === 'verifikasi' ? users : managementUsers

  const filteredUsers = currentData.filter(user => {
    if (activeTab === 'manajemen') {
      if (activeFilter !== 'Semua' && user.accountStatus !== activeFilter) return false
      if (selectedRoles.length > 0 && !selectedRoles.includes(user.role)) return false
      if (selectedSubscriptions.length > 0 && !selectedSubscriptions.includes(user.subscription)) return false
    }
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return ['name', 'username', 'email', 'training', 'school', 'voucher'].some(k =>
      (user[k] || '').toLowerCase().includes(q)
    )
  })

  const sortedUsers = applySortToList(filteredUsers, sortConfig)

  const handleExport = () => {
    const csv = buildCsvContent(activeTab, sortedUsers)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', activeTab === 'verifikasi' ? 'verifikasi_akun-Export data.csv' : 'manajemen_akun-Export data.csv')
    document.body.appendChild(link); link.click(); document.body.removeChild(link)
  }

  return (
    <div className="h-screen bg-white flex font-sans overflow-hidden">
      <AdminSidebar activeTab={activeTab} onTabChange={handleTabChange} onSignOut={onSignOut} user={user} />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="px-10 py-8 border-b border-gray-100 shrink-0">
          <h1 className="text-2xl font-bold text-[#0A1128]">
            {activeTab === 'verifikasi' && 'Verifikasi Akun'}
            {activeTab === 'manajemen' && 'Manajemen Akun'}
            {activeTab === 'pendaftaran-trainer' && 'Pendaftaran Pelatihan Trainer'}
            {activeTab === 'riwayat-pelatihan' && 'Riwayat Pelatihan'}
          </h1>
        </header>

        <div className="flex-1 overflow-auto p-10 bg-white">
          {apiError && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">
              {apiError}
            </div>
          )}

          {activeTab === 'verifikasi' && (
            <VerifikasiControls
              totalCount={sortedUsers.length}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onExport={handleExport}
            />
          )}
          {activeTab === 'manajemen' && (
            <ManajemenControls
              activeFilter={activeFilter} onFilterChange={setActiveFilter}
              selectedRoles={selectedRoles} onRolesChange={setSelectedRoles}
              selectedSubscriptions={selectedSubscriptions} onSubscriptionsChange={setSelectedSubscriptions}
              searchQuery={searchQuery} onSearchChange={setSearchQuery}
              onExport={handleExport}
            />
          )}
          {activeTab === 'pendaftaran-trainer' && (
            <PendaftaranTrainerControls
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onAdd={() => setIsAddPendaftaranModalOpen(true)}
            />
          )}
          {activeTab === 'riwayat-pelatihan' && (
            <RiwayatPelatihanControls
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onAdd={() => setIsAddPelatihanModalOpen(true)}
              onExport={() => {
                const csv = [
                  'Nama Pelatihan,Daerah Pelatihan,Tgl. Mulai,Status,Nama Peserta',
                  ...riwayatPelatihanData.map(item => `"${item.nama}","${item.daerah}","${item.tglMulai}","${item.status}","${item.pesertaNama}"`)
                ].join('\n')
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
                const url = URL.createObjectURL(blob)
                const link = document.createElement('a')
                link.setAttribute('href', url)
                link.setAttribute('download', 'riwayat_pelatihan-Export data.csv')
                document.body.appendChild(link); link.click(); document.body.removeChild(link)
              }}
            />
          )}

          <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              {activeTab === 'verifikasi' && (
                <VerifikasiTable
                  users={sortedUsers}
                  sortConfig={sortConfig}
                  onSort={handleSort}
                  onRoleChange={handleRoleChange}
                  onApprove={handleVerify}
                  onReject={setRejectCandidate}
                  roleErrors={roleErrors}
                  searchQuery={searchQuery}
                  discourseGroups={discourseGroups}
                />
              )}
              {activeTab === 'manajemen' && (
                <ManajemenTable
                  users={sortedUsers}
                  sortConfig={sortConfig}
                  onSort={handleSort}
                  onRoleChange={handleRoleChange}
                  searchQuery={searchQuery}
                  activeFilter={activeFilter}
                  onActionClick={handleActionClick}
                />
              )}
              {activeTab === 'pendaftaran-trainer' && (
                <PendaftaranTrainerTable
                  data={pendaftaranData}
                  onToggleStatus={handleTogglePendaftaranStatus}
                  searchQuery={searchQuery}
                />
              )}
              {activeTab === 'riwayat-pelatihan' && (
                <RiwayatPelatihanTable
                  data={riwayatPelatihanData}
                  searchQuery={searchQuery}
                  onEdit={setPerbaruiSession}
                  onDelete={setRiwayatToDelete}
                  onDownload={handleDownloadRiwayat}
                />
              )}
            </div>
          </div>
        </div>
      </main>

      <RejectModal  candidate={rejectCandidate}  onConfirm={handleConfirmReject} onCancel={() => setRejectCandidate(null)} />
      <ApproveModal candidate={approveCandidate} onConfirm={handleConfirmApprove} onCancel={() => setApproveCandidate(null)} />
      <AddPendaftaranTrainerModal
        isOpen={isAddPendaftaranModalOpen}
        onClose={() => setIsAddPendaftaranModalOpen(false)}
        onSave={handleAddPendaftaran}
      />
      {actionModal.type === 'ubah-role' && (
        <UbahRoleModal 
          user={actionModal.user} 
          onConfirm={handleConfirmUbahRole} 
          onCancel={() => setActionModal({ type: null, user: null })} 
        />
      )}
      {actionModal.type === 'kirim-voucher' && (
        <KirimVoucherModal 
          user={actionModal.user} 
          onConfirm={handleConfirmKirimVoucher} 
          onCancel={() => setActionModal({ type: null, user: null })} 
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
        onDone={(session, count) => {
          setToast({ message: <>Berhasil menambahkan <span className="font-medium">{count}</span> peserta ke <span className="font-medium">{session.nama}</span></> })
          if (toastTimeoutId) clearTimeout(toastTimeoutId)
          const tid = setTimeout(() => setToast(null), 5000)
          setToastTimeoutId(tid)
        }}
      />
      <HapusRiwayatModal
        item={riwayatToDelete}
        onConfirm={handleDeleteRiwayat}
        onCancel={() => setRiwayatToDelete(null)}
      />
      <AdminToast toast={toast} onUndo={handleUndoToast} />
    </div>
  )
}
