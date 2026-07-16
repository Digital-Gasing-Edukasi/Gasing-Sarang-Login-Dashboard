import { ArrowDownUp, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getTableScrollProps } from './tableScroll'

// Header sortable, dengan opsi sublabel (grup "Alumni Pelatihan").
function SortableHeader({ label, sublabel, sortKey, sortConfig, onSort }) {
  return (
    <div className="select-none whitespace-nowrap">
      {sublabel && <div className="text-[11px] font-normal text-white/40 mb-0.5">{sublabel}</div>}
      <div
        className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors"
        onClick={() => onSort(sortKey)}
      >
        {label}
        <ArrowDownUp size={14} className={sortConfig.key === sortKey ? 'text-white' : 'text-white/50'} />
      </div>
    </div>
  )
}

// Tooltip dark-bubble, muncul di bawah tombol pas hover. Caret nunjuk ke atas.
function Tooltip({ label }) {
  return (
    <div className="pointer-events-none absolute left-1/2 top-full z-40 mt-2 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-xl bg-[#0A1128] px-4 py-2 text-sm font-semibold text-white opacity-0 shadow-lg transition-all duration-150 group-hover/tip:translate-y-0 group-hover/tip:opacity-100">
      <span className="absolute -top-1 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 rounded-sm bg-[#0A1128]" />
      {label}
    </div>
  )
}

export function VerifikasiTable({
  users, sortConfig, onSort, onApprove, onReject, searchQuery,
  selectedIds = [], onToggleSelect, onToggleSelectAll, allSelected = false,
}) {
  return (
    <div {...getTableScrollProps()}>
    <table className="w-full text-left text-sm whitespace-nowrap">
      <thead className="bg-[#0A1128] text-white sticky top-0 z-20">
        <tr>
          <th className="px-4 py-4 w-12 text-center sticky left-0 z-30 bg-[#0A1128] align-bottom">
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
          <th className="px-4 py-4 font-medium sticky left-[48px] z-30 bg-[#0A1128] shadow-[4px_0_10px_-4px_rgba(0,0,0,0.3)] align-bottom">
            <SortableHeader label="Nama Pengguna" sortKey="name" sortConfig={sortConfig} onSort={onSort} />
          </th>
          <th className="px-4 py-4 font-medium align-bottom">Email</th>
          <th className="px-4 py-4 font-medium align-bottom">Status</th>
          <th className="px-4 py-4 font-medium align-bottom">
            <SortableHeader label="Tgl. Lahir" sortKey="birthdate" sortConfig={sortConfig} onSort={onSort} />
          </th>
          <th className="px-4 py-4 font-medium align-bottom">
            <SortableHeader label="Lokasi" sortKey="lokasi" sortConfig={sortConfig} onSort={onSort} />
          </th>
          <th className="px-4 py-4 font-medium align-bottom">
            <SortableHeader label="Daerah" sublabel="Alumni Pelatihan" sortKey="alumniDaerah" sortConfig={sortConfig} onSort={onSort} />
          </th>
          <th className="px-4 py-4 font-medium align-bottom">
            <SortableHeader label="Tanggal Mulai" sublabel="Alumni Pelatihan" sortKey="alumniTanggal" sortConfig={sortConfig} onSort={onSort} />
          </th>
          <th className="px-4 py-4 font-medium align-bottom">
            <SortableHeader label="Asal Sekolah" sortKey="school" sortConfig={sortConfig} onSort={onSort} />
          </th>
          {selectedIds.length === 0 && <th className="px-4 py-4 font-medium text-center align-bottom sticky right-0 z-30 bg-[#0A1128] shadow-[-4px_0_10px_-4px_rgba(0,0,0,0.3)]">Setuju?</th>}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {users.length > 0 ? users.map(user => {
          const selected = selectedIds.includes(user.id)
          return (
            <tr key={user.id} className={cn('group transition-colors', selected ? 'bg-[#F4F6FB]' : 'hover:bg-[#F9FAFB]')}>
              <td className={cn('px-4 py-4 text-center sticky left-0 z-10 transition-colors', selected ? 'bg-[#F4F6FB]' : 'bg-white group-hover:bg-[#F9FAFB]')}>
                <button
                  onClick={() => onToggleSelect(user.id)}
                  className={cn(
                    'w-4 h-4 rounded border flex items-center justify-center mx-auto transition-colors',
                    selected ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-gray-50 hover:border-gray-400'
                  )}
                >
                  {selected && <Check size={11} className="text-white" strokeWidth={3} />}
                </button>
              </td>
              <td className={cn('px-4 py-4 sticky left-[48px] z-10 transition-colors shadow-[4px_0_10px_-4px_rgba(0,0,0,0.05)]', selected ? 'bg-[#F4F6FB]' : 'bg-white group-hover:bg-[#F9FAFB]')}>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#0A1128]">{user.name}</span>
                  {user.isNew && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-600 text-white">
                      New
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">{user.username}</div>
              </td>
              <td className="px-4 py-4 text-[#0A1128] font-medium">{user.email}</td>
              <td className="px-4 py-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[#FDF4FF] text-[#D946EF]">
                  {user.status}
                </span>
              </td>
              <td className="px-4 py-4 text-[#0A1128] font-medium">{user.birthdate}</td>
              <td className="px-4 py-4 text-[#0A1128] font-medium whitespace-normal max-w-[220px]" title={user.lokasi}>{user.lokasi}</td>
              <td className="px-4 py-4 text-[#0A1128] font-medium whitespace-normal max-w-[200px]" title={user.alumniDaerah}>{user.alumniDaerah || '-'}</td>
              <td className="px-4 py-4 text-[#0A1128] font-medium">{user.alumniTanggal || '-'}</td>
              <td className="px-4 py-4 text-[#0A1128] font-medium whitespace-normal max-w-[220px]" title={user.school}>{user.school || '-'}</td>
              {selectedIds.length === 0 && (
                <td className={cn('px-4 py-4 sticky right-0 z-10 group-hover:z-40 transition-colors shadow-[-4px_0_10px_-4px_rgba(0,0,0,0.05)]', selected ? 'bg-[#F4F6FB]' : 'bg-white group-hover:bg-[#F9FAFB]')}>
                  <div className="flex items-center justify-center gap-2">
                    <div className="relative group/tip">
                      <button
                        onClick={() => onApprove(user.id)}
                        className="w-9 h-9 rounded-full bg-white border-2 border-green-500 hover:bg-green-50 flex items-center justify-center text-green-500 transition-colors"
                      >
                        <Check size={16} strokeWidth={3} />
                      </button>
                      <Tooltip label="Setujui" />
                    </div>
                    <div className="relative group/tip">
                      <button
                        onClick={() => onReject(user)}
                        className="w-9 h-9 rounded-full bg-white border-2 border-red-400 hover:bg-red-50 flex items-center justify-center text-red-500 transition-colors"
                      >
                        <X size={16} strokeWidth={2.5} />
                      </button>
                      <Tooltip label="Tolak akun" />
                    </div>
                  </div>
                </td>
              )}
            </tr>
          )
        }) : (
          <tr>
            <td colSpan="10" className="px-4 py-12 text-center text-gray-500">
              Tidak ada data yang cocok dengan pencarian <span className="font-semibold">"{searchQuery}"</span>
            </td>
          </tr>
        )}
      </tbody>
    </table>
    </div>
  )
}
