import { useState, useRef, useEffect, useCallback } from 'react'
import { adminApi, discourseApi, regionsApi } from '@/lib/api'
import { mapToVerifikasi, mapToManajemen } from './admin/mappers'
import { AdminSidebar }    from './admin/AdminSidebar'
import { AdminToast }      from './admin/AdminToast'
import { RejectModal, ApproveModal } from './admin/ConfirmModal'
import { VerifikasiControls, ManajemenControls } from './admin/TableControls'
import { VerifikasiTable } from './admin/VerifikasiTable'
import { ManajemenTable }  from './admin/ManajemenTable'

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
  const [discourseGroups, setDiscourseGroups] = useState([])
  const [trainingRegions, setTrainingRegions] = useState([])
  const [rejectCandidate, setRejectCandidate] = useState(null)
  const [approveCandidate, setApproveCandidate] = useState(null)
  const [toast, setToast]                   = useState(null)
  const [toastTimeoutId, setToastTimeoutId] = useState(null)
  const [activeFilter, setActiveFilter]     = useState('Semua')
  const [selectedRoles, setSelectedRoles]   = useState([])
  const [selectedSubscriptions, setSelectedSubscriptions] = useState([])
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
        const res = await adminApi.getUsers({ verifiedStatus: 0 })
        const rawList = Array.isArray(res) ? res : res.data || []
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

  const handleConfirmReject = (reason) => {
    if (!rejectCandidate) return
    const target = rejectCandidate
    setUsers(prev => prev.filter(u => u.id !== target.id))
    setRejectCandidate(null)
    setToast({ message: <>Akun {target.name} telah <span className="text-red-500 font-medium">ditolak</span></>, user: target })
    
    // API menggunakan key 'rejectedReason' bukan 'reason'
    scheduleAction(() => adminApi.verifyUser(target.id, { status: 'rejected', rejectedReason: reason }), () => {
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

  const handleUndoToast = () => {
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
            {activeTab === 'verifikasi' ? 'Verifikasi Akun' : 'Manajemen Akun'}
          </h1>
        </header>

        <div className="flex-1 overflow-auto p-10 bg-white">
          {apiError && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">
              {apiError}
            </div>
          )}

          {activeTab === 'verifikasi' ? (
            <VerifikasiControls
              totalCount={sortedUsers.length}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onExport={handleExport}
            />
          ) : (
            <ManajemenControls
              activeFilter={activeFilter} onFilterChange={setActiveFilter}
              selectedRoles={selectedRoles} onRolesChange={setSelectedRoles}
              selectedSubscriptions={selectedSubscriptions} onSubscriptionsChange={setSelectedSubscriptions}
              searchQuery={searchQuery} onSearchChange={setSearchQuery}
              onExport={handleExport}
            />
          )}

          <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              {activeTab === 'verifikasi' ? (
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
              ) : (
                <ManajemenTable
                  users={sortedUsers}
                  sortConfig={sortConfig}
                  onSort={handleSort}
                  onRoleChange={handleRoleChange}
                  searchQuery={searchQuery}
                />
              )}
            </div>
          </div>
        </div>
      </main>

      <RejectModal  candidate={rejectCandidate}  onConfirm={handleConfirmReject} onCancel={() => setRejectCandidate(null)} />
      <ApproveModal candidate={approveCandidate} onConfirm={handleConfirmApprove} onCancel={() => setApproveCandidate(null)} />
      <AdminToast toast={toast} onUndo={handleUndoToast} />
    </div>
  )
}
