import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ArrowDownUp, MoreHorizontal, Edit, Trash2, Clock, CheckCircle2, History, SearchX, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getTableScrollProps } from './tableScroll'

// Menu aksi per tab. `type` dipetakan ke handler di AdminDashboardPage.
const MENU_BY_TAB = {
  'Disetujui': [
    { type: 'ubah-role',       label: 'Ubah Role',       Icon: Edit,         danger: false },
    { type: 'tangguhkan-akun', label: 'Tangguhkan Akun', Icon: Clock,        danger: false },
    { type: 'hapus-akun',      label: 'Hapus Akun',      Icon: Trash2,       danger: true },
  ],
  'Ditolak': [
    { type: 'setujui-akun',    label: 'Setujui Akun',    Icon: CheckCircle2, danger: false },
    { type: 'hapus-akun',      label: 'Hapus Akun',      Icon: Trash2,       danger: true },
  ],
  'Ditangguhkan': [
    { type: 'pulihkan-akun',   label: 'Pulihkan Akun',   Icon: History,      danger: false },
    { type: 'hapus-akun',      label: 'Hapus Akun',      Icon: Trash2,       danger: true },
  ],
  'Baru Dihapus': [
    { type: 'pulihkan-akun',   label: 'Pulihkan Akun',   Icon: History,      danger: false },
  ],
}

const MENU_W = 208

// Menu aksi baris. Di-portal ke body + posisi fixed supaya tidak terpotong
// container scroll tabel (overflow-auto). Buka ke atas bila mepet bawah viewport.
function RowActionMenu({ tab, user, onAction }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef(null)
  const menuRef = useRef(null)
  const items = MENU_BY_TAB[tab] || MENU_BY_TAB['Disetujui']

  useEffect(() => {
    if (!open) return
    const onDoc = (e) => {
      if (menuRef.current?.contains(e.target) || btnRef.current?.contains(e.target)) return
      setOpen(false)
    }
    const close = () => setOpen(false)
    document.addEventListener('mousedown', onDoc)
    window.addEventListener('resize', close)
    window.addEventListener('scroll', close, true)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      window.removeEventListener('resize', close)
      window.removeEventListener('scroll', close, true)
    }
  }, [open])

  const toggle = () => {
    const r = btnRef.current.getBoundingClientRect()
    const height = items.length * 40 + 12
    const openUp = r.bottom + height > window.innerHeight
    setPos({
      top: openUp ? r.top - height - 6 : r.bottom + 6,
      left: Math.max(12, r.right - MENU_W),
    })
    setOpen(o => !o)
  }

  return (
    <>
      <button
        ref={btnRef}
        onClick={toggle}
        className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 border border-gray-200 text-gray-500 transition-colors mx-auto"
      >
        <MoreHorizontal size={16} />
      </button>
      {open && createPortal(
        <div
          ref={menuRef}
          style={{ position: 'fixed', top: pos.top, left: pos.left, width: MENU_W }}
          className="bg-white border border-gray-100 shadow-xl rounded-xl py-2 z-[200] flex flex-col text-left"
        >
          {items.map(({ type, label, Icon, danger }) => (
            <button
              key={type}
              onClick={() => { onAction && onAction(type, user); setOpen(false) }}
              className={cn(
                'flex items-center gap-3 px-4 py-2 text-sm transition-colors',
                danger ? 'text-red-500 hover:bg-red-50' : 'text-[#0A1128] hover:bg-gray-50'
              )}
            >
              <Icon size={16} className={danger ? 'text-red-500' : 'text-blue-500'} />
              {label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  )
}

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

export function ManajemenTable({
  users, sortConfig, onSort, searchQuery, activeFilter, onActionClick,
  selectedIds = [], onToggleSelect, onToggleSelectAll, allSelected = false,
}) {
  const isReducedView = activeFilter === 'Rejected' || activeFilter === 'Deleted' || activeFilter === 'Ditolak' || activeFilter === 'Baru Dihapus'

  return (
    <div {...getTableScrollProps()}>
      <table className="w-full text-left text-sm whitespace-nowrap">
        <thead className="bg-[#0A1128] text-white sticky top-0 z-20">
          <tr>
            <th className="px-4 py-4 w-12 text-center sticky left-0 z-30 bg-[#0A1128]">
              <button
                onClick={onToggleSelectAll}
                className={cn(
                  'w-4 h-4 rounded border flex items-center justify-center mx-auto transition-colors',
                  allSelected ? 'bg-blue-600 border-blue-600' : 'border-white/30 hover:border-white/60'
                )}
              >
                {allSelected && <Check size={11} className="text-white" strokeWidth={3} />}
              </button>
            </th>
            <th className="px-4 py-4 font-medium sticky left-[48px] z-30 bg-[#0A1128] shadow-[4px_0_10px_-4px_rgba(0,0,0,0.3)]">
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
            <th className="px-4 py-4 font-medium text-center sticky right-0 z-30 bg-[#0A1128] shadow-[-4px_0_10px_-4px_rgba(0,0,0,0.3)]">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {users.length > 0 ? users.map(user => {
            const selected = selectedIds.includes(user.id)
            return (
              <tr key={user.id} className={cn('group transition-colors', selected ? 'bg-[#F4F6FB]' : 'hover:bg-[#F9FAFB]')}>
                <td className={cn('px-4 py-4 text-center sticky left-0 z-10 transition-colors', selected ? 'bg-[#F4F6FB]' : 'bg-white group-hover:bg-[#F9FAFB]')}>
                  <button
                    onClick={() => onToggleSelect && onToggleSelect(user.id)}
                    className={cn(
                      'w-4 h-4 rounded border flex items-center justify-center mx-auto transition-colors',
                      selected ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-gray-50 hover:border-gray-400'
                    )}
                  >
                    {selected && <Check size={11} className="text-white" strokeWidth={3} />}
                  </button>
                </td>
                <td className={cn('px-4 py-4 sticky left-[48px] z-10 transition-colors shadow-[4px_0_10px_-4px_rgba(0,0,0,0.05)]', selected ? 'bg-[#F4F6FB]' : 'bg-white group-hover:bg-[#F9FAFB]')}>
                  <div className="font-bold text-[#0A1128] flex items-center">
                    {user.name}
                    {user.isNew && (
                      <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold ml-2">New</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">{user.username}</div>
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
                        <span className="text-gray-400 font-medium italic cursor-pointer hover:text-link" onClick={() => onActionClick && onActionClick('ubah-role', user)}>Set Role</span>
                      )}
                    </td>
                  </>
                )}

                <td className="px-4 py-4 text-[#0A1128] font-medium">
                  {user.riwayatCount ? (
                    <div className="flex items-center gap-2">
                      <span>{user.riwayatCount}</span>
                      <span className="text-link cursor-pointer hover:underline text-xs">Lihat Detail</span>
                    </div>
                  ) : '-'}
                </td>
                <td className="px-4 py-4 text-[#0A1128] font-medium">{user.birthdate || '-'}</td>
                <td className="px-4 py-4 text-[#0A1128] font-medium whitespace-normal break-words max-w-[200px] leading-snug align-top">{user.lokasi || '-'}</td>
                <td className="px-4 py-4 text-[#0A1128] font-medium whitespace-normal break-words max-w-[200px] leading-snug align-top">{user.training || '-'}</td>
                <td className="px-4 py-4 text-[#0A1128] font-medium whitespace-normal break-words max-w-[200px] leading-snug align-top">{user.alumniDaerah || '-'}</td>
                <td className="px-4 py-4 text-[#0A1128] font-medium">{user.alumniTanggal || '-'}</td>
                <td className="px-4 py-4 text-[#0A1128] font-medium whitespace-normal break-words max-w-[200px] leading-snug align-top">{user.school || '-'}</td>
                <td className="px-4 py-4 text-[#0A1128] font-medium">{user.lastUpdated || '-'}</td>
                <td className={cn('px-4 py-4 text-center sticky right-0 z-10 transition-colors shadow-[-4px_0_10px_-4px_rgba(0,0,0,0.05)]', selected ? 'bg-[#F4F6FB]' : 'bg-white group-hover:bg-[#F9FAFB]')}>
                  <RowActionMenu tab={activeFilter} user={user} onAction={onActionClick} />
                </td>
              </tr>
            )
          }) : (
            <tr>
              <td colSpan="20" className="px-4 py-16">
                {searchQuery ? (
                  <div className="flex flex-col items-center text-center gap-2">
                    <div className="w-14 h-14 rounded-full border border-gray-200 flex items-center justify-center text-gray-300 mb-1">
                      <SearchX size={26} />
                    </div>
                    <p className="font-bold text-[#0A1128]">Tidak bisa menemukan "{searchQuery}"</p>
                    <p className="text-sm text-gray-400">Coba cari lagi menggunakan ejaan atau kata kunci berbeda.</p>
                  </div>
                ) : (
                  <p className="text-center text-gray-500">Tidak ada data pada tab ini.</p>
                )}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
