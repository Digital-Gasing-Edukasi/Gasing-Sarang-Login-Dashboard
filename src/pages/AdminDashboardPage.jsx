import React, { useState, useRef, useEffect } from 'react'
import {
  User, Users, LogOut, Search, Download,
  ArrowDownUp, Check, X, ChevronDown, UserX, UserCheck, Copy, Filter
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── DUMMY DATA MATCHING SCREENSHOT ──────────────────────────────────────────
const INITIAL_USERS = [
  { id: 1, name: 'Achmad Fauzi', username: '@achfauzi', email: 'achfauzi@gmail.com', status: 'Review', birthdate: '12 Mar 1995', training: 'Bolaang Mongondow', year: '2012', school: 'Sekolah Model Terpadu (SMT) Bojonegoro', role: 'Trainer Utama' },
  { id: 2, name: 'Ade Irma', username: '@adeirma', email: 'adeirma@gmail.com', status: 'Review', birthdate: '05 Jul 1998', training: 'Ilugwa Mamberamo Tengah', year: '2019', school: 'SMK Negeri 1 Tenggarong Seberang Kutai Kartagneg...', role: 'Trainer Kelas' },
  { id: 3, name: 'Adelia Putri Anjayani', username: '@adelputri', email: 'adelputrianjayani@gmail.com', status: 'Review', birthdate: '22 Nov 1999', training: 'MI Pondok Pinang Jakarta', year: '2022', school: 'SMA Negeri 1 Cikarang Utara Kabupaten Bekasi', role: 'Guru' },
  { id: 4, name: 'Aditya Pratama', username: '@aditprat', email: 'aditprat@gmail.com', status: 'Review', birthdate: '30 Jan 1994', training: 'Soe, Timor Tengah Selatan', year: '2017', school: 'SD Inpres Soe', role: 'Trainer Aula' },
  { id: 5, name: 'Agus Setiawan', username: '@agusset', email: 'agusset@gmail.com', status: 'Review', birthdate: '15 Aug 1992', training: 'Tapanuli Utara', year: '2024', school: 'SMP Negeri 1 Tarutung', role: 'Trainer Utama' },
  { id: 6, name: 'Ahmad Hidayat Muslimin', username: '@ahmadhid', email: 'ahmadhidm@gmail.com', status: 'Review', birthdate: '02 Feb 1997', training: 'Ambon', year: '2019', school: 'SD Negeri 1 Pattimura', role: '' },
]

const INITIAL_MANAGEMENT_USERS = [
  { id: 1, name: 'Achmad Fauzi', username: '@achfauzi', email: 'achfauzi@gmail.com', isNew: true, accountStatus: 'Pending', voucher: 'GASI99999', birthdate: '12 Mar 1995', training: 'Bolaang Mongondow', year: '2021', school: 'Sekolah Model Terpadu (SMT) Bojonegoro', role: 'Trainer Utama', subscription: 'Active', plan: 'Paket Tahunan', endDate: '22 Feb 2026', action: 'Konfirmasi' },
  { id: 2, name: 'Ade Irma', username: '@adeirma', email: 'adeirma@gmail.com', isNew: false, accountStatus: 'Rejected', voucher: '', birthdate: '05 Jul 1998', training: 'Ilugwa Mamberamo Tengah', year: '2022', school: 'SMK Negeri 1 Tenggarong Seberang Kutai Kartagneg...', role: '', subscription: 'Not Active', plan: 'Tidak Terdaftar', endDate: '', action: '-' },
  { id: 3, name: 'Adelia Putri Anjayani', username: '@adelputri', email: 'adelputrianjayani@gmail.com', isNew: false, accountStatus: 'Approved', voucher: 'GASI99888', birthdate: '22 Nov 1999', training: 'MI Pondok Pinang Jakarta', year: '2022', school: 'SMA Negeri 1 Cikarang Utara Kabupaten Bekasi', role: 'Trainer Kelas', subscription: 'Active', plan: 'Paket Tahunan', endDate: '22 Feb 2026', action: 'Sudah Disalin' },
  { id: 4, name: 'Aditya Pratama', username: '@aditprat', email: 'aditprat@gmail.com', isNew: false, accountStatus: 'Approved', voucher: 'GASI99777', birthdate: '30 Jan 1994', training: 'Soe, Timor Tengah Selatan', year: '2017', school: 'SD Inpres Soe', role: 'Trainer Aula', subscription: 'Expired', plan: 'Sudah Berakhir', endDate: '', action: 'Sudah Disalin' },
  { id: 5, name: 'Agus Setiawan', username: '@agusset', email: 'agusset@gmail.com', isNew: false, accountStatus: 'Pending', voucher: 'GASI99555', birthdate: '15 Aug 1992', training: 'Tapanuli Utara', year: '2024', school: 'SMP Negeri 1 Tarutung', role: 'Trainer Utama', subscription: 'Active', plan: 'Paket Tahunan', endDate: '22 Feb 2026', action: 'Sudah Disalin' },
  { id: 6, name: 'Ahmad Hidayat Muslimin', username: '@ahmadhid', email: 'ahmadhidm@gmail.com', isNew: true, accountStatus: 'Approved', voucher: 'GASI99656', birthdate: '02 Feb 1997', training: 'Ambon', year: '2019', school: 'SD Negeri 1 Pattimura', role: 'Guru', subscription: 'Active', plan: 'Paket Tahunan', endDate: '22 Feb 2026', action: 'Konfirmasi' },
  { id: 7, name: 'Bianka Nadine Sitomorang', username: '@biankans', email: 'biankandsitomorang@gmail.com', isNew: false, accountStatus: 'Rejected', voucher: '', birthdate: '18 Sep 2001', training: 'Fakfak', year: '2023', school: 'SMP Negeri 1 Fakfak', role: '', subscription: 'Not Active', plan: 'Tidak Terdaftar', endDate: '', action: '-' },
  { id: 8, name: 'Budi Cahyono', username: '@budicah', email: 'budicah@gmail.com', isNew: false, accountStatus: 'Approved', voucher: 'GASI99444', birthdate: '29 Jun 1994', training: 'Kupang', year: '2020', school: 'SD Negeri 2 Nusa Cendana', role: 'Trainer Aula', subscription: 'Active', plan: 'Paket Tahunan', endDate: '22 Feb 2026', action: 'Sudah Disalin' },
  { id: 9, name: 'Cahyo Utomo', username: '@cahyouto', email: 'cahyouto@gmail.com', isNew: false, accountStatus: 'Approved', voucher: '', birthdate: '04 May 1997', training: 'Kota Pontianak', year: '2019', school: 'SD Negeri 10 Tanjungpura', role: 'Trainer Utama', subscription: 'Expired', plan: 'Sudah Berakhir', endDate: '', action: '-' },
]

export default function AdminDashboardPage({ onSignOut }) {
  const [activeTab, setActiveTab] = useState('verifikasi')
  const [users, setUsers] = useState(INITIAL_USERS)
  const [managementUsers, setManagementUsers] = useState(INITIAL_MANAGEMENT_USERS)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
  const [roleErrors, setRoleErrors] = useState({})
  const [rejectCandidate, setRejectCandidate] = useState(null)
  const [approveCandidate, setApproveCandidate] = useState(null)
  const [toast, setToast] = useState(null)
  const [toastTimeoutId, setToastTimeoutId] = useState(null)
  const [activeFilter, setActiveFilter] = useState('Semua')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [selectedRoles, setSelectedRoles] = useState([])
  const [selectedSubscriptions, setSelectedSubscriptions] = useState([])
  const filterRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setIsFilterOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setSearchQuery('')
    setSortConfig({ key: null, direction: 'asc' })
    setActiveFilter('Semua')
    setIsFilterOpen(false)
    setSelectedRoles([])
    setSelectedSubscriptions([])
  }

  // Handlers for action buttons
  const handleVerify = (id) => {
    const user = users.find(u => u.id === id)
    if (!user.role) {
      setRoleErrors(prev => ({ ...prev, [id]: true }))
      setTimeout(() => {
        setRoleErrors(prev => ({ ...prev, [id]: false }))
      }, 30000) // 30 seconds
      return
    }
    setApproveCandidate(user)
  }

  const handleConfirmApprove = () => {
    if (!approveCandidate) return
    setUsers(users.filter(u => u.id !== approveCandidate.id))
    
    setToast({
      message: <>Akun {approveCandidate.name} telah <span className="text-green-500 font-medium">disetujui</span></>,
      user: approveCandidate
    })
    
    setApproveCandidate(null)
    if (toastTimeoutId) clearTimeout(toastTimeoutId)
    const newTimeout = setTimeout(() => setToast(null), 5000)
    setToastTimeoutId(newTimeout)
  }

  const handleCancelApprove = () => {
    setApproveCandidate(null)
  }

  const handleRoleChange = (id, newRole) => {
    if (activeTab === 'verifikasi') {
      setUsers(users.map(u => u.id === id ? { ...u, role: newRole } : u))
    } else {
      setManagementUsers(managementUsers.map(u => u.id === id ? { ...u, role: newRole } : u))
    }
    if (newRole) {
      setRoleErrors(prev => ({ ...prev, [id]: false }))
    }
  }

  const handleRejectClick = (user) => {
    setRejectCandidate(user)
  }

  const handleConfirmReject = () => {
    if (!rejectCandidate) return
    setUsers(users.filter(u => u.id !== rejectCandidate.id))
    
    setToast({
      message: <>Akun {rejectCandidate.name} telah <span className="text-red-500 font-medium">ditolak</span></>,
      user: rejectCandidate
    })
    
    setRejectCandidate(null)

    if (toastTimeoutId) clearTimeout(toastTimeoutId)
    const newTimeout = setTimeout(() => {
      setToast(null)
    }, 5000)
    setToastTimeoutId(newTimeout)
  }

  const handleCancelReject = () => {
    setRejectCandidate(null)
  }

  const handleUndoToast = () => {
    if (toast && toast.user) {
      setUsers(prev => [toast.user, ...prev].sort((a, b) => a.id - b.id))
      setToast(null)
      if (toastTimeoutId) clearTimeout(toastTimeoutId)
    }
  }

  // --- Search & Sort Logic ---
  const currentData = activeTab === 'verifikasi' ? users : managementUsers;

  const filteredUsers = currentData.filter(user => {
    if (activeTab === 'manajemen') {
      if (activeFilter !== 'Semua' && user.accountStatus !== activeFilter) return false;
      if (selectedRoles.length > 0 && !selectedRoles.includes(user.role)) return false;
      if (selectedSubscriptions.length > 0 && !selectedSubscriptions.includes(user.subscription)) return false;
    }

    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      (user.name || '').toLowerCase().includes(q) ||
      (user.username || '').toLowerCase().includes(q) ||
      (user.email || '').toLowerCase().includes(q) ||
      (user.training || '').toLowerCase().includes(q) ||
      (user.school || '').toLowerCase().includes(q) ||
      (user.voucher || '').toLowerCase().includes(q)
    )
  })

  const handleSort = (key) => {
    let direction = 'asc'
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (!sortConfig.key) return 0
    let valA = a[sortConfig.key] || ''
    let valB = b[sortConfig.key] || ''
    
    if (sortConfig.key === 'birthdate' || sortConfig.key === 'endDate') {
      valA = valA ? new Date(valA).getTime() : 0
      valB = valB ? new Date(valB).getTime() : 0
    } else if (typeof valA === 'string') {
      valA = valA.toLowerCase()
      valB = valB.toLowerCase()
    }

    if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1
    if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1
    return 0
  })

  const handleExport = () => {
    const escapeCsv = (str) => {
      if (str === null || str === undefined) return '';
      const stringStr = String(str);
      if (stringStr.includes(',') || stringStr.includes('"') || stringStr.includes('\n')) {
        return `"${stringStr.replace(/"/g, '""')}"`;
      }
      return stringStr;
    };

    let headers = []
    let rows = []

    if (activeTab === 'verifikasi') {
      headers = ['Nama Pengguna', 'Email', 'Status', 'Tgl.Lahir', 'Alumni Pelatihan', 'Tahun', 'Asal Sekolah', 'Role Pengguna']
      rows = sortedUsers.map(user => [
        user.name,
        user.email,
        user.status,
        user.birthdate,
        user.training,
        user.year,
        user.school,
        user.role || 'Pilih Role'
      ])
    } else {
      headers = ['Nama Pengguna', 'Email', 'Status Akun', 'Kode Voucher', 'Tgl.Lahir', 'Alumni Pelatihan', 'Tahun', 'Asal Sekolah', 'Role Pengguna', 'Berlangganan', 'Tgl Berakhir']
      rows = sortedUsers.map(user => [
        user.name,
        user.email,
        user.accountStatus || '-',
        user.voucher || '-',
        user.birthdate || '-',
        user.training || '-',
        user.year || '-',
        user.school || '-',
        user.role || 'Pilih Role',
        user.subscription || '-',
        user.plan || '-'
      ])
    }

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(escapeCsv).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', activeTab === 'verifikasi' ? 'verifikasi_akun-Export data.csv' : 'manajemen_akun-Export data.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="h-screen bg-white flex font-sans overflow-hidden">
      
      {/* ─── SIDEBAR ─── */}
      <aside className="w-[260px] min-w-[260px] max-w-[260px] flex-none bg-[#0A1128] text-white flex flex-col h-full">
        <div className="p-8 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-white shrink-0"></div>
          <span className="text-xl font-bold tracking-wide">Logo</span>
        </div>

        <nav className="flex-1 px-4 mt-4 space-y-2">
          <button
            onClick={() => handleTabChange('verifikasi')}
            className={cn(
              "w-full flex items-center gap-4 px-5 py-3.5 rounded-full transition-colors text-sm font-medium",
              activeTab === 'verifikasi' ? "bg-white/10" : "text-gray-400 hover:text-white hover:bg-white/5"
            )}
          >
            <User size={18} />
            Verifikasi Akun
          </button>
          
          <button
            onClick={() => handleTabChange('manajemen')}
            className={cn(
              "w-full flex items-center gap-4 px-5 py-3.5 rounded-full transition-colors text-sm font-medium",
              activeTab === 'manajemen' ? "bg-white/10" : "text-gray-400 hover:text-white hover:bg-white/5"
            )}
          >
            <Users size={18} />
            Manajemen Akun
          </button>
        </nav>

        <div className="p-6 border-t border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500 overflow-hidden">
              {/* Profile image placeholder */}
              <img src="https://i.pravatar.cc/100" alt="Admin" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold">Admin Gasing</span>
              <span className="text-xs text-gray-400">@admingasing</span>
            </div>
          </div>
          <button onClick={onSignOut} className="text-white hover:text-gray-300 p-2">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* ─── MAIN CONTENT ─── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Header Title */}
        <header className="px-10 py-8 border-b border-gray-100 shrink-0">
          <h1 className="text-2xl font-bold text-[#0A1128]">
            {activeTab === 'verifikasi' ? 'Verifikasi Akun' : 'Manajemen Akun'}
          </h1>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-10 bg-white">
          
          {/* Table Controls */}
          {activeTab === 'verifikasi' ? (
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-[#0A1128]">Total:</span>
                <div className="flex items-center gap-2 bg-[#FDF4FF] px-3 py-1.5 rounded-full">
                  <span className="w-6 h-6 rounded-full bg-[#D946EF] text-white text-xs flex items-center justify-center font-bold">
                    {sortedUsers.length}
                  </span>
                  <span className="text-sm font-bold text-[#D946EF]">Review</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="relative w-[300px]">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Cari user..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-full text-sm outline-none focus:border-[#D946EF] focus:ring-1 focus:ring-[#D946EF] transition-all"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                <button 
                  onClick={handleExport}
                  className="flex items-center gap-2 bg-[#0A1128] hover:bg-[#0A1128]/90 text-white px-5 py-2.5 rounded-full text-sm font-medium transition-colors"
                >
                  <Download size={16} />
                  Export List
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 bg-gray-50/50 border border-gray-100 p-1.5 rounded-full">
                {['Semua', 'Approved', 'Pending', 'Rejected'].map(status => {
                  const isSelected = activeFilter === status;
                  return (
                    <button 
                      key={status}
                      onClick={() => setActiveFilter(status)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors",
                        isSelected ? "bg-[#0A1128] text-white shadow-sm" : "text-gray-500 hover:text-[#0A1128] bg-transparent"
                      )}
                    >
                      <div className={cn(
                        "w-4 h-4 rounded flex items-center justify-center border",
                        isSelected ? "border-blue-600 bg-blue-600" : "border-gray-300 bg-white"
                      )}>
                        {isSelected && <Check size={12} className="text-white" strokeWidth={3} />}
                      </div>
                      {status}
                    </button>
                  )
                })}
              </div>

              <div className="flex items-center gap-3 relative" ref={filterRef}>
                <button 
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className={cn(
                    "w-[42px] h-[42px] rounded-full border flex items-center justify-center transition-colors shrink-0 shadow-sm",
                    isFilterOpen ? "border-blue-600 text-blue-600 bg-blue-50" : "border-gray-200 text-[#0A1128] hover:bg-gray-50"
                  )}
                >
                  <Filter size={18} strokeWidth={2} />
                </button>

                {/* Filter Popover */}
                {isFilterOpen && (
                  <div className="absolute top-14 left-0 w-[320px] bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 p-6 z-50">
                    
                    {/* Role Section */}
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-3">
                        <div 
                          className={cn(
                            "w-4 h-4 rounded border flex items-center justify-center cursor-pointer",
                            selectedRoles.length === 4 ? "border-blue-600 bg-blue-600" : "border-gray-300 bg-white"
                          )} 
                          onClick={() => {
                            if (selectedRoles.length === 4) setSelectedRoles([])
                            else setSelectedRoles(['Trainer Utama', 'Trainer Aula', 'Trainer Kelas', 'Guru'])
                          }}
                        >
                          {selectedRoles.length === 4 && <Check size={12} className="text-white" strokeWidth={3} />}
                        </div>
                        <span className="font-bold text-[#0A1128]">Role</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {['Trainer Utama', 'Trainer Aula', 'Trainer Kelas', 'Guru'].map(role => (
                          <button
                            key={role}
                            onClick={() => {
                              if (selectedRoles.includes(role)) setSelectedRoles(selectedRoles.filter(r => r !== role))
                              else setSelectedRoles([...selectedRoles, role])
                            }}
                            className={cn(
                              "px-4 py-1.5 rounded-full text-sm transition-colors border",
                              selectedRoles.includes(role) 
                                ? "border-blue-600 text-blue-600 bg-blue-50 font-medium" 
                                : "border-gray-200 text-gray-600 hover:border-gray-300"
                            )}
                          >
                            {role}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Berlangganan Section */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div 
                          className={cn(
                            "w-4 h-4 rounded border flex items-center justify-center cursor-pointer",
                            selectedSubscriptions.length === 3 ? "border-blue-600 bg-blue-600" : "border-gray-300 bg-white"
                          )} 
                          onClick={() => {
                            if (selectedSubscriptions.length === 3) setSelectedSubscriptions([])
                            else setSelectedSubscriptions(['Not Active', 'Active', 'Expired'])
                          }}
                        >
                          {selectedSubscriptions.length === 3 && <Check size={12} className="text-white" strokeWidth={3} />}
                        </div>
                        <span className="font-bold text-[#0A1128]">Berlangganan</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {['Not Active', 'Active', 'Expired'].map(sub => (
                          <button
                            key={sub}
                            onClick={() => {
                              if (selectedSubscriptions.includes(sub)) setSelectedSubscriptions(selectedSubscriptions.filter(s => s !== sub))
                              else setSelectedSubscriptions([...selectedSubscriptions, sub])
                            }}
                            className={cn(
                              "px-4 py-1.5 rounded-full text-sm transition-colors border",
                              selectedSubscriptions.includes(sub) 
                                ? "border-blue-600 text-blue-600 bg-blue-50 font-medium" 
                                : "border-gray-200 text-gray-600 hover:border-gray-300"
                            )}
                          >
                            {sub}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div className="relative w-[280px]">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Cari user..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-full text-sm outline-none focus:border-[#D946EF] focus:ring-1 focus:ring-[#D946EF] transition-all"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                <button 
                  onClick={handleExport}
                  className="flex items-center gap-2 bg-[#0A1128] hover:bg-[#0A1128]/90 text-white px-5 py-2.5 rounded-full text-sm font-medium transition-colors shadow-sm"
                >
                  <Download size={16} />
                  Export List
                </button>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              {activeTab === 'verifikasi' ? (
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-[#0A1128] text-white">
                    <tr>
                      <th className="px-4 py-4 w-12 text-center sticky left-0 z-20 bg-[#0A1128]">
                        <div className="w-4 h-4 rounded border border-white/30 mx-auto"></div>
                      </th>
                      <th className="px-4 py-4 font-medium sticky left-[48px] z-20 bg-[#0A1128] shadow-[4px_0_10px_-4px_rgba(0,0,0,0.3)]">
                        <div className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors select-none" onClick={() => handleSort('name')}>
                          Nama Pengguna <ArrowDownUp size={14} className={sortConfig.key === 'name' ? "text-white" : "text-white/50"} />
                        </div>
                      </th>
                      <th className="px-4 py-4 font-medium">
                        <div className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors select-none" onClick={() => handleSort('email')}>
                          Email <ArrowDownUp size={14} className={sortConfig.key === 'email' ? "text-white" : "text-white/50"} />
                        </div>
                      </th>
                      <th className="px-4 py-4 font-medium">Status</th>
                      <th className="px-4 py-4 font-medium">
                        <div className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors select-none" onClick={() => handleSort('birthdate')}>
                          Tgl.Lahir <ArrowDownUp size={14} className={sortConfig.key === 'birthdate' ? "text-white" : "text-white/50"} />
                        </div>
                      </th>
                      <th className="px-4 py-4 font-medium">
                        <div className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors select-none" onClick={() => handleSort('training')}>
                          Alumni Pelatihan <ArrowDownUp size={14} className={sortConfig.key === 'training' ? "text-white" : "text-white/50"} />
                        </div>
                      </th>
                      <th className="px-4 py-4 font-medium">
                        <div className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors select-none" onClick={() => handleSort('year')}>
                          Tahun <ArrowDownUp size={14} className={sortConfig.key === 'year' ? "text-white" : "text-white/50"} />
                        </div>
                      </th>
                      <th className="px-4 py-4 font-medium">
                        <div className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors select-none" onClick={() => handleSort('school')}>
                          Asal Sekolah asas <ArrowDownUp size={14} className={sortConfig.key === 'school' ? "text-white" : "text-white/50"} />
                        </div>
                      </th>
                      <th className="px-4 py-4 font-medium">Role Pengguna</th>
                      <th className="px-4 py-4 font-medium text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sortedUsers.length > 0 ? (
                      sortedUsers.map((user, idx) => (
                        <tr key={user.id} className="group hover:bg-[#F9FAFB] transition-colors">
                          <td className="px-4 py-4 text-center sticky left-0 z-10 bg-white group-hover:bg-[#F9FAFB] transition-colors">
                            <div className="w-4 h-4 rounded border border-gray-300 bg-gray-50 mx-auto"></div>
                          </td>
                          <td className="px-4 py-4 sticky left-[48px] z-10 bg-white group-hover:bg-[#F9FAFB] transition-colors shadow-[4px_0_10px_-4px_rgba(0,0,0,0.05)]">
                            <div className="font-bold text-[#0A1128]">{user.name}</div>
                            <div className="text-xs text-gray-400 mt-0.5">{user.username}</div>
                          </td>
                        <td className="px-4 py-4 text-[#0A1128] font-medium">{user.email}</td>
                        <td className="px-4 py-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[#FDF4FF] text-[#D946EF]">
                            {user.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-[#0A1128] font-medium">{user.birthdate}</td>
                        <td className="px-4 py-4 text-[#0A1128] font-medium max-w-[200px] truncate" title={user.training}>
                          {user.training}
                        </td>
                        <td className="px-4 py-4 text-[#0A1128] font-medium">{user.year}</td>
                        <td className="px-4 py-4 text-[#0A1128] font-medium max-w-[250px] truncate" title={user.school}>
                          {user.school}
                        </td>
                        <td className="px-4 py-4">
                          <div className="relative w-36">
                            <select 
                              className={cn(
                                "w-full appearance-none bg-white border rounded-full py-1.5 pl-4 pr-8 text-sm font-medium outline-none transition-all duration-300",
                                roleErrors[user.id] 
                                  ? "border-red-500 ring-[3px] ring-red-500/20 text-red-600" 
                                  : "border-gray-200 focus:border-[#0A1128] text-[#0A1128]"
                              )}
                              value={user.role || ""}
                              onChange={(e) => handleRoleChange(user.id, e.target.value)}
                            >
                              <option value="" disabled>Pilih Role</option>
                              <option value="Trainer Utama">Trainer Utama</option>
                              <option value="Trainer Kelas">Trainer Kelas</option>
                              <option value="Guru">Guru</option>
                              <option value="Trainer Aula">Trainer Aula</option>
                            </select>
                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              onClick={() => handleVerify(user.id)}
                              className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center text-white transition-colors"
                            >
                              <Check size={16} strokeWidth={3} />
                            </button>
                            <button 
                              onClick={() => handleRejectClick(user)}
                              className="w-8 h-8 rounded-full bg-white border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-gray-500 transition-colors"
                            >
                              <X size={16} strokeWidth={2} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="10" className="px-4 py-12 text-center text-gray-500">
                        Tidak ada data yang cocok dengan pencarian <span className="font-semibold">"{searchQuery}"</span>
                      </td>
                    </tr>
                  )}
                  </tbody>
                </table>
              ) : (
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-[#0A1128] text-white">
                    <tr>
                      <th className="px-4 py-4 w-12 text-center sticky left-0 z-20 bg-[#0A1128]">
                        <div className="w-4 h-4 rounded border border-white/30 mx-auto"></div>
                      </th>
                      <th className="px-4 py-4 font-medium sticky left-[48px] z-20 bg-[#0A1128] shadow-[4px_0_10px_-4px_rgba(0,0,0,0.3)]">
                        <div className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors select-none" onClick={() => handleSort('name')}>
                          Nama Pengguna <ArrowDownUp size={14} className={sortConfig.key === 'name' ? "text-white" : "text-white/50"} />
                        </div>
                      </th>
                      <th className="px-4 py-4 font-medium">
                        <div className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors select-none" onClick={() => handleSort('email')}>
                          Email <ArrowDownUp size={14} className={sortConfig.key === 'email' ? "text-white" : "text-white/50"} />
                        </div>
                      </th>
                      <th className="px-4 py-4 font-medium">
                        <div className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors select-none" onClick={() => handleSort('accountStatus')}>
                          Status Akun <ArrowDownUp size={14} className={sortConfig.key === 'accountStatus' ? "text-white" : "text-white/50"} />
                        </div>
                      </th>
                      <th className="px-4 py-4 font-medium">Kode Voucher</th>
                      <th className="px-4 py-4 font-medium">
                        <div className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors select-none" onClick={() => handleSort('birthdate')}>
                          Tgl.Lahir <ArrowDownUp size={14} className={sortConfig.key === 'birthdate' ? "text-white" : "text-white/50"} />
                        </div>
                      </th>
                      <th className="px-4 py-4 font-medium">
                        <div className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors select-none" onClick={() => handleSort('training')}>
                          Alumni Pelatihan <ArrowDownUp size={14} className={sortConfig.key === 'training' ? "text-white" : "text-white/50"} />
                        </div>
                      </th>
                      <th className="px-4 py-4 font-medium">
                        <div className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors select-none" onClick={() => handleSort('year')}>
                          Tahun <ArrowDownUp size={14} className={sortConfig.key === 'year' ? "text-white" : "text-white/50"} />
                        </div>
                      </th>
                      <th className="px-4 py-4 font-medium">
                        <div className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors select-none" onClick={() => handleSort('school')}>
                          Asal Sekolah asas <ArrowDownUp size={14} className={sortConfig.key === 'school' ? "text-white" : "text-white/50"} />
                        </div>
                      </th>
                      <th className="px-4 py-4 font-medium">
                        <div className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors select-none" onClick={() => handleSort('role')}>
                          Role <ArrowDownUp size={14} className={sortConfig.key === 'role' ? "text-white" : "text-white/50"} />
                        </div>
                      </th>
                      <th className="px-4 py-4 font-medium">
                        <div className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors select-none" onClick={() => handleSort('subscription')}>
                          Berlangganan <ArrowDownUp size={14} className={sortConfig.key === 'subscription' ? "text-white" : "text-white/50"} />
                        </div>
                      </th>
                      <th className="px-4 py-4 font-medium">
                        <div className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors select-none" onClick={() => handleSort('plan')}>
                          Tgl. Berakhir <ArrowDownUp size={14} className={sortConfig.key === 'plan' ? "text-white" : "text-white/50"} />
                        </div>
                      </th>
                      <th className="px-4 py-4 font-medium text-center">
                        <div className="flex items-center justify-center gap-2 cursor-pointer hover:text-white transition-colors select-none" onClick={() => handleSort('action')}>
                          Action Voucher <ArrowDownUp size={14} className={sortConfig.key === 'action' ? "text-white" : "text-white/50"} />
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sortedUsers.length > 0 ? (
                      sortedUsers.map((user, idx) => (
                        <tr key={user.id} className="group hover:bg-[#F9FAFB] transition-colors">
                          <td className="px-4 py-4 text-center sticky left-0 z-10 bg-white group-hover:bg-[#F9FAFB] transition-colors">
                            <div className="w-4 h-4 rounded border border-gray-300 bg-gray-50 mx-auto"></div>
                          </td>
                          <td className="px-4 py-4 sticky left-[48px] z-10 bg-white group-hover:bg-[#F9FAFB] transition-colors shadow-[4px_0_10px_-4px_rgba(0,0,0,0.05)]">
                            <div className="flex flex-col">
                              <div className="font-bold text-[#0A1128] flex items-center">
                                {user.name}
                                {user.isNew && (
                                  <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold ml-2">New</span>
                                )}
                              </div>
                              <div className="text-xs text-gray-400 mt-0.5">{user.username}</div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-[#0A1128] font-medium">{user.email}</td>
                          <td className="px-4 py-4">
                            <span className={cn(
                              "inline-flex items-center px-3 py-1 rounded-full text-xs font-bold",
                              user.accountStatus === 'Pending' ? "bg-orange-50 text-orange-500" :
                              user.accountStatus === 'Rejected' ? "bg-red-50 text-red-500" :
                              user.accountStatus === 'Approved' ? "bg-green-50 text-green-500" : ""
                            )}>
                              {user.accountStatus}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className={cn(
                              "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs border w-[150px] justify-between",
                              user.voucher ? "border-gray-200 bg-white" : "border-gray-100 bg-gray-50 opacity-50"
                            )}>
                              <div className="flex items-center gap-1">
                                <span className="text-gray-500">Voucher:</span>
                                {user.voucher && <span className="font-bold text-blue-600">{user.voucher}</span>}
                              </div>
                              <Copy size={12} className={user.voucher ? "text-gray-400 cursor-pointer hover:text-gray-600" : "text-gray-300"} />
                            </div>
                          </td>
                          <td className="px-4 py-4 text-[#0A1128] font-medium">{user.birthdate}</td>
                          <td className="px-4 py-4 text-[#0A1128] font-medium max-w-[200px] truncate" title={user.training}>
                            {user.training}
                          </td>
                          <td className="px-4 py-4 text-[#0A1128] font-medium">{user.year}</td>
                          <td className="px-4 py-4 text-[#0A1128] font-medium max-w-[250px] truncate" title={user.school}>
                            {user.school}
                          </td>
                          <td className="px-4 py-4">
                            <div className="relative w-36">
                              <select 
                                className={cn(
                                  "w-full appearance-none border rounded-full py-1.5 pl-4 pr-8 text-sm font-medium outline-none transition-all duration-300",
                                  !user.role || user.accountStatus === 'Rejected' ? "bg-gray-50 text-gray-400 border-gray-100" : "bg-white border-gray-200 focus:border-[#0A1128] text-[#0A1128]"
                                )}
                                value={user.role || ""}
                                onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                disabled={user.accountStatus === 'Rejected'}
                              >
                                <option value="" disabled>Pilih Role</option>
                                <option value="Trainer Utama">Trainer Utama</option>
                                <option value="Trainer Kelas">Trainer Kelas</option>
                                <option value="Guru">Guru</option>
                                <option value="Trainer Aula">Trainer Aula</option>
                              </select>
                              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className={cn(
                              "inline-flex items-center px-3 py-1 rounded-full text-xs font-bold",
                              user.subscription === 'Active' ? "bg-green-50 text-green-600" :
                              user.subscription === 'Not Active' ? "bg-gray-100 text-gray-600" :
                              user.subscription === 'Expired' ? "bg-red-50 text-red-500" : ""
                            )}>
                              {user.subscription}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-col">
                              <span className={cn(
                                "font-medium",
                                user.subscription === 'Not Active' ? "text-gray-400" :
                                user.subscription === 'Expired' ? "text-red-500" : "text-[#0A1128]"
                              )}>{user.plan}</span>
                              {user.endDate && (
                                <span className="text-[10px] text-gray-400 mt-0.5">Berakhir: {user.endDate}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            {user.action === 'Konfirmasi' && (
                              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-full text-xs font-bold transition-colors">
                                Konfirmasi
                              </button>
                            )}
                            {user.action === 'Sudah Disalin' && (
                              <span className="bg-green-50 text-green-600 px-4 py-1.5 rounded-full text-xs font-bold">
                                Sudah Disalin
                              </span>
                            )}
                            {user.action === '-' && (
                              <span className="text-gray-400 font-bold">-</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="13" className="px-4 py-12 text-center text-gray-500">
                          Tidak ada data yang cocok dengan pencarian <span className="font-semibold">"{searchQuery}"</span>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>

        </div>
      </main>

      {/* ─── MODAL REJECT ─── */}
      {rejectCandidate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-[24px] p-8 max-w-[400px] w-full shadow-2xl flex flex-col items-center text-center mx-4">
            <div className="w-16 h-16 rounded-full border border-dashed border-red-500 flex items-center justify-center mb-6 bg-red-50">
              <UserX className="text-red-500" size={28} strokeWidth={1.5} />
            </div>
            
            <h3 className="text-xl font-bold text-[#0A1128] mb-3">Tolak verifikasi akun ini?</h3>
            
            <p className="text-gray-500 mb-8 text-sm px-4">
              Akun <span className="font-bold text-[#0A1128]">{rejectCandidate.name}</span> akan ditolak dan <span className="text-red-500">tidak mendapatkan akses</span> ke GASING Circle.
            </p>
            
            <div className="flex items-center justify-center gap-6 w-full">
              <button 
                onClick={handleCancelReject}
                className="font-semibold text-[#0A1128] hover:text-gray-600 px-6 py-2 transition-colors"
              >
                Batalkan
              </button>
              <button 
                onClick={handleConfirmReject}
                className="font-semibold px-8 py-3 rounded-full bg-[#FEE2E2] text-[#EF4444] hover:bg-white hover:border-[#EF4444] border border-transparent transition-all"
              >
                Tolak Akun
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL APPROVE ─── */}
      {approveCandidate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-[24px] p-8 max-w-[400px] w-full shadow-2xl flex flex-col items-center text-center mx-4">
            <div className="w-16 h-16 rounded-full border border-dashed border-green-500 flex items-center justify-center mb-6 bg-green-50">
              <UserCheck className="text-green-500" size={28} strokeWidth={1.5} />
            </div>
            
            <h3 className="text-xl font-bold text-[#0A1128] mb-3">Setujui verifikasi akun ini?</h3>
            
            <p className="text-gray-500 mb-8 text-sm px-4">
              Akun <span className="font-bold text-[#0A1128]">{approveCandidate.name}</span> akan disetujui dan <span className="text-green-500">mendapatkan akses</span> ke GASING Circle.
            </p>
            
            <div className="flex items-center justify-center gap-6 w-full">
              <button 
                onClick={handleCancelApprove}
                className="font-semibold text-[#0A1128] hover:text-gray-600 px-6 py-2 transition-colors"
              >
                Batalkan
              </button>
              <button 
                onClick={handleConfirmApprove}
                className="font-semibold px-8 py-3 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                Setujui Akun
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── TOAST NOTIFICATION ─── */}
      {toast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] bg-[#0A1128] text-white px-6 py-3.5 rounded-full shadow-lg flex items-center gap-6 animate-in slide-in-from-top-4 fade-in duration-300">
          <span className="text-sm font-light">
            {toast.message}
          </span>
          <button 
            onClick={handleUndoToast}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Batalkan
          </button>
        </div>
      )}
    </div>
  )
}
