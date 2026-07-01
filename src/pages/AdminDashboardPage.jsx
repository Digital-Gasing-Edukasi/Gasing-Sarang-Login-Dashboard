import { useState, useRef, useEffect, useCallback } from 'react'
import { adminApi, discourseApi, regionsApi } from '@/lib/api'
import { mapToVerifikasi, mapToManajemen } from './admin/mappers'
import { AdminSidebar }    from './admin/AdminSidebar'
import { AdminToast }      from './admin/AdminToast'
import { RejectModal, ApproveModal } from './admin/ConfirmModal'
import { VerifikasiControls, ManajemenControls, PendaftaranTrainerControls, RiwayatPelatihanControls } from './admin/TableControls'
import { VerifikasiTable } from './admin/VerifikasiTable'
import { ManajemenTable }  from './admin/ManajemenTable'
import { PendaftaranTrainerTable } from './admin/PendaftaranTrainerTable'
import { RiwayatPelatihanTable } from './admin/RiwayatPelatihanTable'
import { AddPendaftaranTrainerModal } from './admin/AddPendaftaranTrainerModal'
import { UbahRoleModal } from './admin/UbahRoleModal'
import { KirimVoucherModal } from './admin/KirimVoucherModal'
import { HapusRiwayatModal } from './admin/HapusRiwayatModal'


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

export default function AdminDashboardPage({ onSignOut }) {
  const [activeTab, setActiveTab] = useState('verifikasi')
  const [users, setUsers]                   = useState([])
  const [managementUsers, setManagementUsers] = useState([])
  const [loadingUsers, setLoadingUsers]     = useState(false)
  const [apiError, setApiError]             = useState('')
  const [searchQuery, setSearchQuery]       = useState('')
  const [roleErrors, setRoleErrors]         = useState({})
  
  // States for Pendaftaran Trainer
  const [pendaftaranData, setPendaftaranData] = useState([
    { id: 1, nama: 'Pelatihan Gasing Daerah A', kuota: 50, periode: '10 - 20 Nov 2023', batasDaftar: '05 Nov 2023', isActive: true },
    { id: 2, nama: 'Pelatihan Gasing Daerah B', kuota: 100, periode: '11 - 20 Nov 2023', batasDaftar: '05 Nov 2023', isActive: false },
    { id: 3, nama: 'Pelatihan Gasing Daerah C', kuota: 50, periode: '11 - 20 Nov 2023', batasDaftar: '05 Nov 2023', isActive: false },
  ])
  const [isAddPendaftaranModalOpen, setIsAddPendaftaranModalOpen] = useState(false)

  // States for Riwayat Pelatihan
  const [riwayatPelatihanData, setRiwayatPelatihanData] = useState([
    { id: 1, nama: 'Pelatihan SDN 02 Melati Harapan', isNew: true, daerah: 'Bogor, Jawa Barat', tglMulai: '15 Mar 2026', status: 'Saved', pesertaNama: 'Achmad Fauzi', pesertaLainnya: 50, pesertaEmail: 'achfauzi@gmail.com', langganan: 'Aktif', lastUpdatedDate: '28 Mei 2026', lastUpdatedTime: '9:20 AM' },
    { id: 2, nama: 'Pelatihan SD Terpadu Depok', daerah: 'Depok, Jawa Barat', tglMulai: '25 Feb 2026', status: 'Saved', pesertaNama: 'Achmad Fauzi', pesertaLainnya: 50, pesertaEmail: 'achfauzi@gmail.com', langganan: 'Non-Aktif', lastUpdatedDate: '12 Feb 2026', lastUpdatedTime: '14:05 PM' },
    { id: 3, nama: 'Pelatihan TNI Jaya Aceh Barat', daerah: 'Aceh Barat, Aceh', tglMulai: '5 Jan 2026', status: 'Saved', pesertaNama: 'Achmad Fauzi', pesertaLainnya: 50, pesertaEmail: 'achfauzi@gmail.com', langganan: 'Berakhir', lastUpdatedDate: '5 Jan 2026', lastUpdatedTime: '08:30 AM' },
  ])
  const [riwayatToDelete, setRiwayatToDelete] = useState(null)

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

  useEffect(() => {
    discourseApi.getGroups()
      .then(res => setDiscourseGroups(Array.isArray(res) ? res : (res.data || [])))
      .catch(err => console.error("Failed to load discourse groups", err))
  }, [])

  const handleTabChange = (tab) => {
    setActiveTab(tab); setSearchQuery(''); resetSort()
    setActiveFilter('Semua'); setSelectedRoles([]); setSelectedSubscriptions([])
  }

  const handleAddPendaftaran = (data) => {
    const formatPeriode = (start, end) => {
      // simple format for demonstration
      if (!start || !end) return '-'
      const s = new Date(start)
      const e = new Date(end)
      return `${s.getDate()} - ${e.getDate()} ${e.toLocaleString('id-ID', { month: 'short' })} ${e.getFullYear()}`
    }
    const formatBatas = (batas) => {
      if (!batas) return '-'
      const b = new Date(batas)
      return `${b.getDate()} ${b.toLocaleString('id-ID', { month: 'short' })} ${b.getFullYear()}`
    }
    
    const newEntry = {
      id: Date.now(),
      nama: data.nama,
      kuota: data.kuota,
      periode: formatPeriode(data.periodeStart, data.periodeEnd),
      batasDaftar: formatBatas(data.batasDaftar),
      isActive: true
    }
    setPendaftaranData(prev => [newEntry, ...prev])
    setToast({ message: <>Pelatihan <span className="font-medium">{data.nama}</span> berhasil ditambahkan</> })
  }

  const handleTogglePendaftaranStatus = (id) => {
    setPendaftaranData(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, isActive: !item.isActive }
      }
      return item
    }))
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
      'Nama Pelatihan,Daerah Pelatihan,Tgl. Mulai,Status,Nama Peserta,Email,Langganan,Last Updated',
      `"${item.nama}","${item.daerah}","${item.tglMulai}","${item.status}","${item.pesertaNama}","${item.pesertaEmail}","${item.langganan}","${item.lastUpdatedDate}"`
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
      <AdminSidebar activeTab={activeTab} onTabChange={handleTabChange} onSignOut={onSignOut} />

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
              onExport={() => {
                const csv = [
                  'Nama Pelatihan,Daerah Pelatihan,Tgl. Mulai,Status,Nama Peserta,Email,Langganan,Last Updated',
                  ...riwayatPelatihanData.map(item => `"${item.nama}","${item.daerah}","${item.tglMulai}","${item.status}","${item.pesertaNama}","${item.pesertaEmail}","${item.langganan}","${item.lastUpdatedDate}"`)
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
      <HapusRiwayatModal
        item={riwayatToDelete}
        onConfirm={handleDeleteRiwayat}
        onCancel={() => setRiwayatToDelete(null)}
      />
      <AdminToast toast={toast} onUndo={handleUndoToast} />
    </div>
  )
}
