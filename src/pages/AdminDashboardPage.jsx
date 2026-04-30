import React, { useState } from 'react'
import {
  User, Users, LogOut, Search, Download,
  ArrowDownUp, Check, X, ChevronDown, UserX, UserCheck
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

export default function AdminDashboardPage({ onSignOut }) {
  const [activeTab, setActiveTab] = useState('verifikasi')
  const [users, setUsers] = useState(INITIAL_USERS)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
  const [roleErrors, setRoleErrors] = useState({})
  const [rejectCandidate, setRejectCandidate] = useState(null)
  const [approveCandidate, setApproveCandidate] = useState(null)
  const [toast, setToast] = useState(null)
  const [toastTimeoutId, setToastTimeoutId] = useState(null)

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
    setUsers(users.map(u => u.id === id ? { ...u, role: newRole } : u))
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
  const filteredUsers = users.filter(user => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      (user.name || '').toLowerCase().includes(q) ||
      (user.username || '').toLowerCase().includes(q) ||
      (user.email || '').toLowerCase().includes(q) ||
      (user.training || '').toLowerCase().includes(q) ||
      (user.school || '').toLowerCase().includes(q)
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
    
    if (sortConfig.key === 'birthdate') {
      valA = new Date(valA).getTime() || 0
      valB = new Date(valB).getTime() || 0
    } else if (typeof valA === 'string') {
      valA = valA.toLowerCase()
      valB = valB.toLowerCase()
    }

    if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1
    if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1
    return 0
  })

  const handleExport = () => {
    const headers = ['Nama Pengguna', 'Email', 'Status', 'Tgl.Lahir', 'Alumni Pelatihan', 'Tahun', 'Asal Sekolah', 'Role Pengguna']
    
    const escapeCsv = (val) => {
      if (val == null) return '""'
      const str = String(val)
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    }

    const rows = sortedUsers.map(user => [
      user.name,
      user.email,
      user.status,
      user.birthdate,
      user.training,
      user.year,
      user.school,
      user.role || 'Pilih Role'
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(escapeCsv).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', 'verifikasi_akun-Export data.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="min-h-screen bg-white flex font-sans">
      
      {/* ─── SIDEBAR ─── */}
      <aside className="w-[260px] bg-[#0A1128] text-white flex flex-col shrink-0">
        <div className="p-8 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-white shrink-0"></div>
          <span className="text-xl font-bold tracking-wide">Logo</span>
        </div>

        <nav className="flex-1 px-4 mt-4 space-y-2">
          <button
            onClick={() => setActiveTab('verifikasi')}
            className={cn(
              "w-full flex items-center gap-4 px-5 py-3.5 rounded-full transition-colors text-sm font-medium",
              activeTab === 'verifikasi' ? "bg-white/10" : "text-gray-400 hover:text-white hover:bg-white/5"
            )}
          >
            <User size={18} />
            Verifikasi Akun
          </button>
          
          <button
            onClick={() => setActiveTab('manajemen')}
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
          <h1 className="text-2xl font-bold text-[#0A1128]">Verifikasi Akun</h1>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-10 bg-white">
          
          {/* Table Controls */}
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

          {/* Table */}
          <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
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
