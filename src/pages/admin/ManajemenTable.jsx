import { ArrowDownUp, ChevronDown, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'

const ROLE_OPTIONS = ['Trainer Utama', 'Trainer Kelas', 'Guru', 'Trainer Aula']

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

const STATUS_CLASSES = {
  Pending:  'bg-orange-50 text-orange-500',
  Rejected: 'bg-red-50 text-red-500',
  Approved: 'bg-green-50 text-green-500',
}

const SUBSCRIPTION_CLASSES = {
  Active:     'bg-green-50 text-green-600',
  'Not Active': 'bg-gray-100 text-gray-600',
  Expired:    'bg-red-50 text-red-500',
}

export function ManajemenTable({ users, sortConfig, onSort, onRoleChange, searchQuery }) {
  return (
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
            <SortableHeader label="Status Akun" sortKey="accountStatus" sortConfig={sortConfig} onSort={onSort} />
          </th>
          <th className="px-4 py-4 font-medium">Kode Voucher</th>
          <th className="px-4 py-4 font-medium">
            <SortableHeader label="Tgl.Lahir" sortKey="birthdate" sortConfig={sortConfig} onSort={onSort} />
          </th>
          <th className="px-4 py-4 font-medium">
            <SortableHeader label="Alumni Pelatihan" sortKey="training" sortConfig={sortConfig} onSort={onSort} />
          </th>
          <th className="px-4 py-4 font-medium">
            <SortableHeader label="Tahun" sortKey="year" sortConfig={sortConfig} onSort={onSort} />
          </th>
          <th className="px-4 py-4 font-medium">
            <SortableHeader label="Asal Sekolah asas" sortKey="school" sortConfig={sortConfig} onSort={onSort} />
          </th>
          <th className="px-4 py-4 font-medium">
            <SortableHeader label="Role" sortKey="role" sortConfig={sortConfig} onSort={onSort} />
          </th>
          <th className="px-4 py-4 font-medium">
            <SortableHeader label="Berlangganan" sortKey="subscription" sortConfig={sortConfig} onSort={onSort} />
          </th>
          <th className="px-4 py-4 font-medium">
            <SortableHeader label="Tgl. Berakhir" sortKey="plan" sortConfig={sortConfig} onSort={onSort} />
          </th>
          <th className="px-4 py-4 font-medium text-center">
            <SortableHeader label="Action Voucher" sortKey="action" sortConfig={sortConfig} onSort={onSort} />
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {users.length > 0 ? users.map(user => (
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
              <div className="text-xs text-gray-400 mt-0.5">{user.username}</div>
            </td>
            <td className="px-4 py-4 text-[#0A1128] font-medium">{user.email}</td>
            <td className="px-4 py-4">
              <span className={cn('inline-flex items-center px-3 py-1 rounded-full text-xs font-bold', STATUS_CLASSES[user.accountStatus] || '')}>
                {user.accountStatus}
              </span>
            </td>
            <td className="px-4 py-4">
              <div className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs border w-[150px] justify-between',
                user.voucher ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50 opacity-50'
              )}>
                <div className="flex items-center gap-1">
                  <span className="text-gray-500">Voucher:</span>
                  {user.voucher && <span className="font-bold text-blue-600">{user.voucher}</span>}
                </div>
                <Copy size={12} className={user.voucher ? 'text-gray-400 cursor-pointer hover:text-gray-600' : 'text-gray-300'} />
              </div>
            </td>
            <td className="px-4 py-4 text-[#0A1128] font-medium">{user.birthdate}</td>
            <td className="px-4 py-4 text-[#0A1128] font-medium max-w-[200px] truncate" title={user.training}>{user.training}</td>
            <td className="px-4 py-4 text-[#0A1128] font-medium">{user.year}</td>
            <td className="px-4 py-4 text-[#0A1128] font-medium max-w-[250px] truncate" title={user.school}>{user.school}</td>
            <td className="px-4 py-4">
              <div className="relative w-36">
                <select
                  className={cn(
                    'w-full appearance-none border rounded-full py-1.5 pl-4 pr-8 text-sm font-medium outline-none transition-all duration-300',
                    !user.role || user.accountStatus === 'Rejected'
                      ? 'bg-gray-50 text-gray-400 border-gray-100'
                      : 'bg-white border-gray-200 focus:border-[#0A1128] text-[#0A1128]'
                  )}
                  value={user.role || ''}
                  onChange={e => onRoleChange(user.id, e.target.value)}
                  disabled={user.accountStatus === 'Rejected'}
                >
                  <option value="" disabled>Pilih Role</option>
                  {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </td>
            <td className="px-4 py-4">
              <span className={cn('inline-flex items-center px-3 py-1 rounded-full text-xs font-bold', SUBSCRIPTION_CLASSES[user.subscription] || '')}>
                {user.subscription}
              </span>
            </td>
            <td className="px-4 py-4">
              <div className="flex flex-col">
                <span className={cn(
                  'font-medium',
                  user.subscription === 'Not Active' ? 'text-gray-400' :
                  user.subscription === 'Expired'    ? 'text-red-500'  : 'text-[#0A1128]'
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
              {user.action === '-' && <span className="text-gray-400 font-bold">-</span>}
            </td>
          </tr>
        )) : (
          <tr>
            <td colSpan="13" className="px-4 py-12 text-center text-gray-500">
              Tidak ada data yang cocok dengan pencarian <span className="font-semibold">"{searchQuery}"</span>
            </td>
          </tr>
        )}
      </tbody>
    </table>
  )
}
