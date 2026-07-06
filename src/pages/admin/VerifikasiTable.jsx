import { ArrowDownUp, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getTableScrollProps } from './tableScroll'

function SortableHeader({ label, sortKey, sortConfig, onSort }) {
  return (
    <div
      className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors select-none"
      onClick={() => onSort(sortKey)}
    >
      {label}
      <ArrowDownUp size={14} className={sortConfig.key === sortKey ? 'text-white' : 'text-white/50'} />
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
          <th className="px-4 py-4 font-medium">Email</th>
          <th className="px-4 py-4 font-medium">Status</th>
          <th className="px-4 py-4 font-medium">
            <SortableHeader label="Tgl. Lahir" sortKey="birthdate" sortConfig={sortConfig} onSort={onSort} />
          </th>
          <th className="px-4 py-4 font-medium">
            <SortableHeader label="Lokasi" sortKey="lokasi" sortConfig={sortConfig} onSort={onSort} />
          </th>
          <th className="px-4 py-4 font-medium text-center">Setuju?</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {users.length > 0 ? users.map(user => {
          const selected = selectedIds.includes(user.id)
          return (
            <tr key={user.id} className={cn('group transition-colors', selected ? 'bg-blue-50/50' : 'hover:bg-[#F9FAFB]')}>
              <td className={cn('px-4 py-4 text-center sticky left-0 z-10 transition-colors', selected ? 'bg-blue-50/50' : 'bg-white group-hover:bg-[#F9FAFB]')}>
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
              <td className={cn('px-4 py-4 sticky left-[48px] z-10 transition-colors shadow-[4px_0_10px_-4px_rgba(0,0,0,0.05)]', selected ? 'bg-blue-50/50' : 'bg-white group-hover:bg-[#F9FAFB]')}>
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
              <td className="px-4 py-4">
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => onApprove(user.id)}
                    className="w-9 h-9 rounded-full bg-white border-2 border-green-500 hover:bg-green-50 flex items-center justify-center text-green-500 transition-colors"
                  >
                    <Check size={16} strokeWidth={3} />
                  </button>
                  <button
                    onClick={() => onReject(user)}
                    className="w-9 h-9 rounded-full bg-white border-2 border-red-400 hover:bg-red-50 flex items-center justify-center text-red-500 transition-colors"
                  >
                    <X size={16} strokeWidth={2.5} />
                  </button>
                </div>
              </td>
            </tr>
          )
        }) : (
          <tr>
            <td colSpan="7" className="px-4 py-12 text-center text-gray-500">
              Tidak ada data yang cocok dengan pencarian <span className="font-semibold">"{searchQuery}"</span>
            </td>
          </tr>
        )}
      </tbody>
    </table>
    </div>
  )
}
