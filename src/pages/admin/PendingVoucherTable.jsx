import { ArrowDownUp, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { abbrevRegion } from '@/lib/format'
import { TableShell, FreezeBlurLeft, FreezeBlurRight } from './TableShell'
import { RoleTag } from './RoleTag'
import { VoucherCode } from './VoucherCode'

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
    <TableShell>
    <table className="w-full table-fixed text-left text-sm whitespace-nowrap">
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
          <th className="px-4 py-4 font-medium w-[244px] sticky left-[48px] z-30 bg-[#0A1128] align-bottom relative">
            <SortableHeader label="Nama Pengguna" sortKey="name" sortConfig={sortConfig} onSort={onSort} />
            <FreezeBlurLeft />
          </th>
          <th className="px-4 py-4 font-medium align-bottom w-[244px]">Email</th>
          <th className="px-4 py-4 font-medium align-bottom w-[244px]">Status Member</th>
          <th className="px-4 py-4 font-medium align-bottom w-[244px]">
            <SortableHeader label="Kode Voucher" sortKey="voucherCode" sortConfig={sortConfig} onSort={onSort} />
          </th>
          <th className="px-4 py-4 font-medium align-bottom w-[244px]">
            <SortableHeader label="Role" sortKey="role" sortConfig={sortConfig} onSort={onSort} />
          </th>
          <th className="px-4 py-4 font-medium align-bottom w-[244px]">
            <SortableHeader label="Riwayat Pelatihan" sortKey="riwayatCount" sortConfig={sortConfig} onSort={onSort} />
          </th>
          <th className="px-4 py-4 font-medium align-bottom w-[244px]">
            <SortableHeader label="Tgl. Lahir" sortKey="birthdate" sortConfig={sortConfig} onSort={onSort} />
          </th>
          <th className="px-4 py-4 font-medium align-bottom w-[244px]">
            <SortableHeader label="Lokasi" sortKey="lokasi" sortConfig={sortConfig} onSort={onSort} />
          </th>
          <th className="px-4 py-4 font-medium align-bottom w-[244px]">
            <SortableHeader label="Nama" sublabel="Alumni Pelatihan" sortKey="alumniNama" sortConfig={sortConfig} onSort={onSort} />
          </th>
          <th className="px-4 py-4 font-medium align-bottom w-[244px]">
            <SortableHeader label="Daerah" sublabel="Alumni Pelatihan" sortKey="alumniDaerah" sortConfig={sortConfig} onSort={onSort} />
          </th>
          <th className="px-4 py-4 font-medium align-bottom w-[244px]">
            <SortableHeader label="Tanggal Mulai" sublabel="Alumni Pelatihan" sortKey="alumniTanggal" sortConfig={sortConfig} onSort={onSort} />
          </th>
          <th className="px-4 py-4 font-medium align-bottom w-[244px]">
            <SortableHeader label="Asal Sekolah" sortKey="school" sortConfig={sortConfig} onSort={onSort} />
          </th>
          <th className="px-4 py-4 font-medium text-center align-bottom w-[244px] sticky right-0 z-30 bg-[#0A1128] relative">Action<FreezeBlurRight /></th>
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
              <td className={cn('px-4 py-4 sticky left-[48px] z-10 transition-colors relative align-top', selected ? 'bg-blue-50/50' : 'bg-white group-hover:bg-[#F9FAFB]')}>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-[#0A1128] whitespace-normal line-clamp-2 break-words" title={user.name}>{user.name}</span>
                  {user.isNew && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-600 text-white shrink-0">New</span>
                  )}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">{user.username}</div>
                <FreezeBlurLeft />
              </td>
              <td className="px-4 py-4 text-[#0A1128] font-medium align-top whitespace-normal break-words line-clamp-2" title={user.email}>{user.email}</td>
              <td className="px-4 py-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[#FFF7ED] text-[#F97316]">
                  Pending Voucher Setup
                </span>
              </td>
              <td className="px-4 py-4">
                <VoucherCode code={user.voucherCode} />
              </td>
              <td className="px-4 py-4">
                {user.role ? (
                  <RoleTag role={user.role} size={15} />
                ) : <span className="text-gray-400">-</span>}
              </td>
              <td className="px-4 py-4">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-[#0A1128]">{user.riwayatCount ?? 0}</span>
                  <button
                    onClick={() => onRiwayatDetail?.(user)}
                    className="text-link underline text-sm px-2 py-1 -mx-2 -my-1 rounded-md hover:bg-blue-50 transition-colors"
                  >
                    Lihat Detail
                  </button>
                </div>
              </td>
              <td className="px-4 py-4 text-[#0A1128] font-medium">{user.birthdate}</td>
              <td className="px-4 py-4 text-[#0A1128] font-medium whitespace-normal max-w-[244px]" title={user.lokasi}>{abbrevRegion(user.lokasi)}</td>
              <td className="px-4 py-4 text-[#0A1128] font-medium whitespace-normal max-w-[244px]" title={user.alumniNama}>{user.alumniNama || '-'}</td>
              <td className="px-4 py-4 text-[#0A1128] font-medium whitespace-normal max-w-[244px]" title={user.alumniDaerah}>{abbrevRegion(user.alumniDaerah) || '-'}</td>
              <td className="px-4 py-4 text-[#0A1128] font-medium">{user.alumniTanggal || '-'}</td>
              <td className="px-4 py-4 text-[#0A1128] font-medium whitespace-normal max-w-[244px]" title={user.school}>{user.school || '-'}</td>
              <td className={cn('px-4 py-4 sticky right-0 z-10 transition-colors relative', selected ? 'bg-blue-50/50' : 'bg-white group-hover:bg-[#F9FAFB]')}>
                <FreezeBlurRight />
                <div className="flex items-center justify-center">
                  <button
                    onClick={() => onConfirm(user)}
                    className="px-5 py-2 rounded-full bg-[#0033EC] hover:bg-[#0029BD] text-white text-sm font-medium transition-colors"
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
    </TableShell>
  )
}
