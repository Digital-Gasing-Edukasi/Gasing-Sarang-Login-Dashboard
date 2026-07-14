import { ArrowDownUp, Check, GraduationCap } from 'lucide-react'
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

// Tabel sub-tab "Pending Voucher Setup". Akun yang sudah di-approve di tab Pending
// mendarat di sini menunggu admin klik "Konfirmasi" (kirim voucher + email final).
export function PendingVoucherTable({
  users, sortConfig, onSort, onConfirm, onRiwayatDetail, searchQuery,
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
          <th className="px-4 py-4 font-medium align-bottom">Status Member</th>
          <th className="px-4 py-4 font-medium align-bottom">
            <SortableHeader label="Kode Voucher" sortKey="voucherCode" sortConfig={sortConfig} onSort={onSort} />
          </th>
          <th className="px-4 py-4 font-medium align-bottom">
            <SortableHeader label="Role" sortKey="role" sortConfig={sortConfig} onSort={onSort} />
          </th>
          <th className="px-4 py-4 font-medium align-bottom">
            <SortableHeader label="Riwayat Pelatihan" sortKey="riwayatCount" sortConfig={sortConfig} onSort={onSort} />
          </th>
          <th className="px-4 py-4 font-medium align-bottom">
            <SortableHeader label="Tgl. Lahir" sortKey="birthdate" sortConfig={sortConfig} onSort={onSort} />
          </th>
          <th className="px-4 py-4 font-medium align-bottom">
            <SortableHeader label="Lokasi" sortKey="lokasi" sortConfig={sortConfig} onSort={onSort} />
          </th>
          <th className="px-4 py-4 font-medium align-bottom">
            <SortableHeader label="Nama" sublabel="Alumni Pelatihan" sortKey="alumniNama" sortConfig={sortConfig} onSort={onSort} />
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
          <th className="px-4 py-4 font-medium text-center align-bottom">Action</th>
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
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-600 text-white">New</span>
                  )}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">{user.username}</div>
              </td>
              <td className="px-4 py-4 text-[#0A1128] font-medium">{user.email}</td>
              <td className="px-4 py-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[#FFF7ED] text-[#F97316]">
                  Pending Voucher Setup
                </span>
              </td>
              <td className="px-4 py-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full border border-gray-200 font-mono text-xs font-semibold text-[#0A1128]">
                  {user.voucherCode || '-'}
                </span>
              </td>
              <td className="px-4 py-4">
                {user.role ? (
                  <span className="inline-flex items-center gap-1.5 font-medium text-[#0A1128]">
                    <GraduationCap size={15} className="text-blue-600" /> {user.role}
                  </span>
                ) : <span className="text-gray-400">-</span>}
              </td>
              <td className="px-4 py-4">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-[#0A1128]">{user.riwayatCount ?? 0}</span>
                  <button
                    onClick={() => onRiwayatDetail?.(user)}
                    className="text-link hover:underline text-sm"
                  >
                    Lihat Detail
                  </button>
                </div>
              </td>
              <td className="px-4 py-4 text-[#0A1128] font-medium">{user.birthdate}</td>
              <td className="px-4 py-4 text-[#0A1128] font-medium whitespace-normal max-w-[200px]" title={user.lokasi}>{user.lokasi}</td>
              <td className="px-4 py-4 text-[#0A1128] font-medium whitespace-normal max-w-[200px]" title={user.alumniNama}>{user.alumniNama || '-'}</td>
              <td className="px-4 py-4 text-[#0A1128] font-medium whitespace-normal max-w-[200px]" title={user.alumniDaerah}>{user.alumniDaerah || '-'}</td>
              <td className="px-4 py-4 text-[#0A1128] font-medium">{user.alumniTanggal || '-'}</td>
              <td className="px-4 py-4 text-[#0A1128] font-medium whitespace-normal max-w-[220px]" title={user.school}>{user.school || '-'}</td>
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
            <td colSpan="14" className="px-4 py-12 text-center text-gray-500">
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
