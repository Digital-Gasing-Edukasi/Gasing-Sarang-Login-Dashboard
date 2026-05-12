import { ArrowDownUp, Check, X, ChevronDown } from 'lucide-react'
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

export function VerifikasiTable({ users, sortConfig, onSort, onRoleChange, onApprove, onReject, roleErrors, searchQuery }) {
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
          <th className="px-4 py-4 font-medium">Status</th>
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
          <th className="px-4 py-4 font-medium">Role Pengguna</th>
          <th className="px-4 py-4 font-medium text-center">Action</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {users.length > 0 ? users.map(user => (
          <tr key={user.id} className="group hover:bg-[#F9FAFB] transition-colors">
            <td className="px-4 py-4 text-center sticky left-0 z-10 bg-white group-hover:bg-[#F9FAFB] transition-colors">
              <div className="w-4 h-4 rounded border border-gray-300 bg-gray-50 mx-auto" />
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
            <td className="px-4 py-4 text-[#0A1128] font-medium max-w-[200px] truncate" title={user.training}>{user.training}</td>
            <td className="px-4 py-4 text-[#0A1128] font-medium">{user.year}</td>
            <td className="px-4 py-4 text-[#0A1128] font-medium max-w-[250px] truncate" title={user.school}>{user.school}</td>
            <td className="px-4 py-4">
              <div className="relative w-36">
                <select
                  className={cn(
                    'w-full appearance-none bg-white border rounded-full py-1.5 pl-4 pr-8 text-sm font-medium outline-none transition-all duration-300',
                    roleErrors[user.id]
                      ? 'border-red-500 ring-[3px] ring-red-500/20 text-red-600'
                      : 'border-gray-200 focus:border-[#0A1128] text-[#0A1128]'
                  )}
                  value={user.role || ''}
                  onChange={e => onRoleChange(user.id, e.target.value)}
                >
                  <option value="" disabled>Pilih Role</option>
                  {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </td>
            <td className="px-4 py-4">
              <div className="flex items-center justify-center gap-2">
                <button onClick={() => onApprove(user.id)} className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center text-white transition-colors">
                  <Check size={16} strokeWidth={3} />
                </button>
                <button onClick={() => onReject(user)} className="w-8 h-8 rounded-full bg-white border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-gray-500 transition-colors">
                  <X size={16} strokeWidth={2} />
                </button>
              </div>
            </td>
          </tr>
        )) : (
          <tr>
            <td colSpan="10" className="px-4 py-12 text-center text-gray-500">
              Tidak ada data yang cocok dengan pencarian <span className="font-semibold">"{searchQuery}"</span>
            </td>
          </tr>
        )}
      </tbody>
    </table>
  )
}
