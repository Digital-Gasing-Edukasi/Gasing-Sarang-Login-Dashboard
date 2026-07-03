import { useState, useRef, useEffect } from 'react'
import { ArrowDownUp, Copy, MoreHorizontal, Edit, Gift, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

function SortableHeader({ label, sortKey, sortConfig, onSort }) {
  return (
    <div
      className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors select-none whitespace-nowrap"
      onClick={() => onSort(sortKey)}
    >
      {label}
      <ArrowDownUp size={14} className={sortConfig?.key === sortKey ? 'text-white' : 'text-white/50'} />
    </div>
  )
}

const STATUS_CLASSES = {
  Pending:  'bg-orange-50 text-orange-500',
  Ditangguhkan: 'bg-orange-50 text-orange-500',
  Rejected: 'border border-pink-200 text-pink-500 bg-transparent',
  Ditolak: 'border border-pink-200 text-pink-500 bg-transparent',
  Approved: 'bg-green-50 text-green-500',
  Disetujui: 'bg-green-50 text-green-500',
  Deleted: 'border border-red-200 text-red-500 bg-transparent',
  Dihapus: 'border border-red-200 text-red-500 bg-transparent',
  'Baru Dihapus': 'border border-red-200 text-red-500 bg-transparent'
}

const STATUS_LABELS = {
  Pending: 'Ditangguhkan',
  Ditangguhkan: 'Ditangguhkan',
  Rejected: 'Ditolak',
  Ditolak: 'Ditolak',
  Approved: 'Disetujui',
  Disetujui: 'Disetujui',
  Deleted: 'Baru Dihapus',
  Dihapus: 'Baru Dihapus',
  'Baru Dihapus': 'Baru Dihapus'
}

const SUBSCRIPTION_CLASSES = {
  Active:     'text-green-500',
  Aktif:     'text-green-500',
  'Not Active': 'text-gray-400',
  Expired:    'text-red-500',
}

export function ManajemenTable({ users, sortConfig, onSort, searchQuery, activeFilter, onActionClick }) {
  const [openMenuId, setOpenMenuId] = useState(null)
  const menuRef = useRef(null)

  const isReducedView = activeFilter === 'Rejected' || activeFilter === 'Deleted' || activeFilter === 'Ditolak' || activeFilter === 'Baru Dihapus'

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [menuRef])

  return (
    <div className="pb-32">
      <table className="w-full text-left text-sm whitespace-nowrap">
        <thead className="bg-[#0A1128] text-white">
          <tr>
            <th className="px-4 py-4 w-12 text-center sticky left-0 z-20 bg-[#0A1128]">
              <div className="w-4 h-4 rounded border border-white/30 mx-auto" />
            </th>
            <th className="px-4 py-4 font-medium sticky left-[48px] z-20 bg-[#0A1128] shadow-[4px_0_10px_-4px_rgba(0,0,0,0.3)]">
              <SortableHeader label="Nama Pengguna" sortKey="name" sortConfig={sortConfig} onSort={onSort} />
            </th>
            <th className="px-4 py-4 font-medium">
              <SortableHeader label="Email" sortKey="email" sortConfig={sortConfig} onSort={onSort} />
            </th>
            <th className="px-4 py-4 font-medium">
              <SortableHeader label="Status Member" sortKey="accountStatus" sortConfig={sortConfig} onSort={onSort} />
            </th>
            
            {!isReducedView && (
              <>
                <th className="px-4 py-4 font-medium">
                  <SortableHeader label="Langganan" sortKey="subscription" sortConfig={sortConfig} onSort={onSort} />
                </th>
                <th className="px-4 py-4 font-medium">
                  <SortableHeader label="Jenis Paket" sortKey="plan" sortConfig={sortConfig} onSort={onSort} />
                </th>
                <th className="px-4 py-4 font-medium">
                  <SortableHeader label="Tgl. Berakhir" sortKey="endDate" sortConfig={sortConfig} onSort={onSort} />
                </th>
                <th className="px-4 py-4 font-medium">Kode Voucher</th>
                <th className="px-4 py-4 font-medium">
                  <SortableHeader label="Role" sortKey="role" sortConfig={sortConfig} onSort={onSort} />
                </th>
              </>
            )}

            <th className="px-4 py-4 font-medium">
              <SortableHeader label="Riwayat Pelatihan" sortKey="riwayatPelatihan" sortConfig={sortConfig} onSort={onSort} />
            </th>
            <th className="px-4 py-4 font-medium">
              <SortableHeader label="Tgl. Lahir" sortKey="birthdate" sortConfig={sortConfig} onSort={onSort} />
            </th>
            <th className="px-4 py-4 font-medium">
              <SortableHeader label="Lokasi" sortKey="lokasi" sortConfig={sortConfig} onSort={onSort} />
            </th>
            <th className="px-4 py-4 font-medium">
              <SortableHeader label="Alumni Pelatihan Nama" sortKey="training" sortConfig={sortConfig} onSort={onSort} />
            </th>
            <th className="px-4 py-4 font-medium">
              <SortableHeader label="Alumni Pelatihan Daerah" sortKey="alumniDaerah" sortConfig={sortConfig} onSort={onSort} />
            </th>
            <th className="px-4 py-4 font-medium">
              <SortableHeader label="Alumni Pelatihan Tanggal Mulai" sortKey="alumniTanggal" sortConfig={sortConfig} onSort={onSort} />
            </th>
            <th className="px-4 py-4 font-medium">
              <SortableHeader label="Asal Sekolah" sortKey="school" sortConfig={sortConfig} onSort={onSort} />
            </th>
            <th className="px-4 py-4 font-medium">
              <SortableHeader label="Last Updated" sortKey="lastUpdated" sortConfig={sortConfig} onSort={onSort} />
            </th>
            <th className="px-4 py-4 font-medium text-center">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {users.length > 0 ? users.map(user => {
            const isMenuOpen = openMenuId === user.id;
            return (
              <tr key={user.id} className="group hover:bg-[#F9FAFB] transition-colors">
                <td className="px-4 py-4 text-center sticky left-0 z-10 bg-white group-hover:bg-[#F9FAFB] transition-colors">
                  <div className="w-4 h-4 rounded border border-gray-300 bg-gray-50 mx-auto" />
                </td>
                <td className="px-4 py-4 sticky left-[48px] z-10 bg-white group-hover:bg-[#F9FAFB] transition-colors shadow-[4px_0_10px_-4px_rgba(0,0,0,0.05)]">
                  <div className="font-bold text-[#0A1128] flex items-center">
                    {user.name}
                    {user.isNew && (
                      <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold ml-2">New</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">{user.username || user.email.split('@')[0]}</div>
                </td>
                <td className="px-4 py-4 text-[#0A1128] font-medium">{user.email}</td>
                <td className="px-4 py-4">
                  <span className={cn('inline-flex items-center px-3 py-1 rounded-full text-xs font-bold', STATUS_CLASSES[user.accountStatus] || '')}>
                    {STATUS_LABELS[user.accountStatus] || user.accountStatus}
                  </span>
                </td>

                {!isReducedView && (
                  <>
                    <td className="px-4 py-4">
                      <span className={cn('font-bold', SUBSCRIPTION_CLASSES[user.subscription] || '')}>
                        {user.subscription || 'Tidak Aktif'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-[#0A1128] font-medium">{user.plan || '-'}</td>
                    <td className="px-4 py-4 text-[#0A1128] font-medium">{user.endDate || '-'}</td>
                    <td className="px-4 py-4">
                      {user.voucher ? (
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs border border-blue-100 bg-blue-50 text-blue-600 font-bold">
                          {user.voucher}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {user.role ? (
                        <div className="flex items-center gap-2 text-blue-500 font-medium">
                          <Edit size={14} className="cursor-pointer" onClick={() => onActionClick && onActionClick('ubah-role', user)} />
                          {user.role}
                        </div>
                      ) : (
                        <span className="text-gray-400 font-medium italic cursor-pointer hover:text-blue-500" onClick={() => onActionClick && onActionClick('ubah-role', user)}>Set Role</span>
                      )}
                    </td>
                  </>
                )}

                <td className="px-4 py-4 text-[#0A1128] font-medium">
                  {user.riwayatCount ? (
                    <div className="flex items-center gap-2">
                      <span>{user.riwayatCount}</span>
                      <span className="text-blue-500 cursor-pointer hover:underline text-xs">Lihat Detail</span>
                    </div>
                  ) : '-'}
                </td>
                <td className="px-4 py-4 text-[#0A1128] font-medium">{user.birthdate || '-'}</td>
                <td className="px-4 py-4 text-[#0A1128] font-medium max-w-[200px] truncate" title={user.lokasi}>{user.lokasi || '-'}</td>
                <td className="px-4 py-4 text-[#0A1128] font-medium max-w-[200px] truncate" title={user.training}>{user.training || '-'}</td>
                <td className="px-4 py-4 text-[#0A1128] font-medium max-w-[200px] truncate" title={user.alumniDaerah}>{user.alumniDaerah || '-'}</td>
                <td className="px-4 py-4 text-[#0A1128] font-medium">{user.alumniTanggal || '-'}</td>
                <td className="px-4 py-4 text-[#0A1128] font-medium max-w-[200px] truncate" title={user.school}>{user.school || '-'}</td>
                <td className="px-4 py-4 text-[#0A1128] font-medium">
                  <div className="flex flex-col">
                    <span>{user.lastUpdatedDate || '-'}</span>
                    <span className="text-[10px] text-gray-400">{user.lastUpdatedTime || ''}</span>
                  </div>
                </td>
                <td className="px-4 py-4 text-center relative">
                  <button 
                    onClick={() => setOpenMenuId(isMenuOpen ? null : user.id)}
                    className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 border border-gray-200 text-gray-500 transition-colors mx-auto"
                  >
                    <MoreHorizontal size={16} />
                  </button>

                  {isMenuOpen && (
                    <div ref={menuRef} className="absolute right-12 top-2 w-48 bg-white border border-gray-100 shadow-lg rounded-xl py-2 z-50 flex flex-col text-left">
                      {!isReducedView && (
                        <>
                          <button onClick={() => { onActionClick && onActionClick('ubah-role', user); setOpenMenuId(null) }} className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-sm text-[#0A1128] transition-colors">
                            <Edit size={16} className="text-blue-500" />
                            Ubah Role
                          </button>
                          <button onClick={() => { onActionClick && onActionClick('kirim-voucher', user); setOpenMenuId(null) }} className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-sm text-[#0A1128] transition-colors">
                            <Gift size={16} className="text-green-500" />
                            Kirim Voucher
                          </button>
                        </>
                      )}
                      <button onClick={() => { onActionClick && onActionClick('hapus-akun', user); setOpenMenuId(null) }} className="flex items-center gap-3 px-4 py-2 hover:bg-red-50 text-sm text-red-500 transition-colors">
                        <Trash2 size={16} />
                        Hapus Akun
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            )
          }) : (
            <tr>
              <td colSpan="20" className="px-4 py-12 text-center text-gray-500">
                Tidak ada data yang cocok dengan pencarian <span className="font-semibold">"{searchQuery}"</span>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
