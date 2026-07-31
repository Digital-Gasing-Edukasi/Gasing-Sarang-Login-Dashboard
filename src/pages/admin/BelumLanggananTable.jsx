import { ArrowDownUp, SearchX } from 'lucide-react'
import { cn } from '@/lib/utils'
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
        <ArrowDownUp size={14} className={sortConfig?.key === sortKey ? 'text-white' : 'text-white/50'} />
      </div>
    </div>
  )
}

// Sub-tab "Belum Langganan" pada Verifikasi Pembayaran. Read-only (tanpa checkbox &
// tanpa kolom Action): daftar akun terverifikasi yang BELUM punya langganan aktif.
// Kolom = PendingVoucherTable + "Last Updated" (ganti kolom Action). Sumber row =
// mapToManajemen (managementUsers), jadi field ikut skema itu.
export function BelumLanggananTable({ users, sortConfig, onSort, onRiwayatDetail, searchQuery }) {
  return (
    <TableShell>
    <table className="w-full text-left text-sm whitespace-nowrap">
      <thead className="bg-[#0A1128] text-white sticky top-0 z-20">
        <tr>
          <th className="px-4 py-4 font-medium sticky left-0 z-30 bg-[#0A1128] align-bottom relative">
            <SortableHeader label="Nama Pengguna" sortKey="name" sortConfig={sortConfig} onSort={onSort} />
            <FreezeBlurLeft />
          </th>
          <th className="px-4 py-4 font-medium align-bottom">Email</th>
          <th className="px-4 py-4 font-medium align-bottom">Status Member</th>
          <th className="px-4 py-4 font-medium align-bottom">
            <SortableHeader label="Kode Voucher" sortKey="voucher" sortConfig={sortConfig} onSort={onSort} />
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
            <SortableHeader label="Nama" sublabel="Alumni Pelatihan" sortKey="training" sortConfig={sortConfig} onSort={onSort} />
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
          <th className="px-4 py-4 font-medium align-bottom sticky right-0 z-30 bg-[#0A1128] relative">
            <SortableHeader label="Last Updated" sortKey="lastUpdated" sortConfig={sortConfig} onSort={onSort} />
            <FreezeBlurRight />
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {users.length > 0 ? users.map(user => (
          <tr key={user.id} className="group transition-colors hover:bg-[#F9FAFB]">
            <td className="px-4 py-4 sticky left-0 z-10 bg-white group-hover:bg-[#F9FAFB] transition-colors relative">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#0A1128]">{user.name}</span>
                {user.isNew && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-600 text-white">New</span>
                )}
              </div>
              <div className="text-xs text-gray-400 mt-0.5">{user.username}</div>
              <FreezeBlurLeft />
            </td>
            <td className="px-4 py-4 text-[#0A1128] font-medium">{user.email}</td>
            <td className="px-4 py-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-500">
                Belum Langganan
              </span>
            </td>
            <td className="px-4 py-4">
              <VoucherCode code={user.voucher} />
            </td>
            <td className="px-4 py-4">
              {user.role ? (
                <RoleTag role={user.role} size={15} />
              ) : <span className="text-gray-400">-</span>}
            </td>
            <td className="px-4 py-4 text-[#0A1128] font-medium">
              {user.riwayatCount ? (
                <div className="flex items-center gap-2">
                  <span>{user.riwayatCount}</span>
                  <button
                    onClick={() => onRiwayatDetail?.(user)}
                    className="text-link underline text-sm"
                  >
                    Lihat Detail
                  </button>
                </div>
              ) : '-'}
            </td>
            <td className="px-4 py-4 text-[#0A1128] font-medium">{user.birthdate || '-'}</td>
            <td className="px-4 py-4 text-[#0A1128] font-medium whitespace-normal break-words max-w-[200px] leading-snug align-top" title={user.lokasi}>{user.lokasi || '-'}</td>
            <td className="px-4 py-4 text-[#0A1128] font-medium whitespace-normal break-words max-w-[200px] leading-snug align-top" title={user.training}>{user.training || '-'}</td>
            <td className="px-4 py-4 text-[#0A1128] font-medium whitespace-normal break-words max-w-[200px] leading-snug align-top" title={user.alumniDaerah}>{user.alumniDaerah || '-'}</td>
            <td className="px-4 py-4 text-[#0A1128] font-medium">{user.alumniTanggal || '-'}</td>
            <td className="px-4 py-4 text-[#0A1128] font-medium whitespace-normal break-words max-w-[220px] leading-snug align-top" title={user.school}>{user.school || '-'}</td>
            <td className="px-4 py-4 text-[#0A1128] font-medium sticky right-0 z-10 bg-white group-hover:bg-[#F9FAFB] transition-colors relative">
              <FreezeBlurRight />
              {user.lastUpdated || '-'}
            </td>
          </tr>
        )) : (
          <tr>
            <td colSpan={13} className="px-4 py-16">
              {searchQuery ? (
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="w-14 h-14 rounded-full border border-gray-200 flex items-center justify-center text-gray-300 mb-1">
                    <SearchX size={26} />
                  </div>
                  <p className="font-bold text-[#0A1128]">Tidak bisa menemukan "{searchQuery}"</p>
                  <p className="text-sm text-gray-400">Coba cari lagi menggunakan ejaan atau kata kunci berbeda.</p>
                </div>
              ) : (
                <p className="text-center text-gray-500">Tidak ada akun yang belum berlangganan.</p>
              )}
            </td>
          </tr>
        )}
      </tbody>
    </table>
    </TableShell>
  )
}
