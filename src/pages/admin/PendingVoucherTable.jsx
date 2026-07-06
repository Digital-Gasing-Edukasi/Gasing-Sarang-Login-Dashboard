import { ArrowDownUp, Check, Copy } from 'lucide-react'
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

// Tabel sub-tab "Pending Voucher Setup". Akun yang sudah di-approve di tab Pending
// mendarat di sini menunggu admin klik "Konfirmasi" (kirim voucher + email final).
export function PendingVoucherTable({
  users, sortConfig, onSort, onConfirm, searchQuery,
  selectedIds = [], onToggleSelect, onToggleSelectAll, allSelected = false,
}) {
  const copyCode = (code) => { try { navigator.clipboard?.writeText(code) } catch { /* noop */ } }

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
            <SortableHeader label="Kode Voucher" sortKey="voucherCode" sortConfig={sortConfig} onSort={onSort} />
          </th>
          <th className="px-4 py-4 font-medium text-center">Action</th>
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
                <div className="font-bold text-[#0A1128]">{user.name}</div>
                <div className="text-xs text-gray-400 mt-0.5">{user.username}</div>
              </td>
              <td className="px-4 py-4 text-[#0A1128] font-medium">{user.email}</td>
              <td className="px-4 py-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[#FFF7ED] text-[#F97316]">
                  Pending Voucher Setup
                </span>
              </td>
              <td className="px-4 py-4">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold text-[#0A1128]">{user.voucherCode}</span>
                  <button
                    onClick={() => copyCode(user.voucherCode)}
                    className="text-gray-400 hover:text-[#0A1128] transition-colors"
                    title="Salin kode"
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </td>
              <td className="px-4 py-4">
                <div className="flex items-center justify-center">
                  <button
                    onClick={() => onConfirm(user)}
                    className="px-5 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
                  >
                    Konfirmasi
                  </button>
                </div>
              </td>
            </tr>
          )
        }) : (
          <tr>
            <td colSpan="6" className="px-4 py-12 text-center text-gray-500">
              {searchQuery
                ? <>Tidak ada data yang cocok dengan pencarian <span className="font-semibold">"{searchQuery}"</span></>
                : 'Belum ada akun yang menunggu setup voucher.'}
            </td>
          </tr>
        )}
      </tbody>
    </table>
    </div>
  )
}
