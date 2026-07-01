import { useState } from 'react'
import { Edit } from 'lucide-react'

const ROLE_OPTIONS = ['Trainer Utama', 'Trainer Kelas', 'Guru', 'Trainer Aula']

export function UbahRoleModal({ user, onConfirm, onCancel }) {
  const [selectedRole, setSelectedRole] = useState(user?.role || '')

  if (!user) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-[24px] p-8 max-w-[400px] w-full shadow-2xl flex flex-col items-center text-center mx-4">
        <div className="w-16 h-16 rounded-full border border-dashed border-blue-500 flex items-center justify-center mb-6 bg-blue-50">
          <Edit className="text-blue-500" size={28} strokeWidth={1.5} />
        </div>
        <h3 className="text-xl font-bold text-[#0A1128] mb-3">Ubah Role Pengguna</h3>
        <p className="text-gray-500 mb-6 text-sm px-4">
          Silakan pilih role baru untuk pengguna <span className="font-bold text-[#0A1128]">{user.name}</span>.
        </p>

        <div className="w-full text-left mb-8">
          <label className="block text-sm font-semibold text-[#0A1128] mb-2">Pilih Role</label>
          <div className="relative">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none appearance-none"
            >
              <option value="" disabled>Pilih Role...</option>
              {ROLE_OPTIONS.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-6 w-full">
          <button onClick={onCancel} className="font-semibold text-[#0A1128] hover:text-gray-600 px-6 py-2 transition-colors">
            Batalkan
          </button>
          <button 
            disabled={!selectedRole || selectedRole === user?.role}
            onClick={() => onConfirm(selectedRole)} 
            className="font-semibold px-8 py-3 rounded-full bg-blue-600 text-white hover:bg-blue-700 border border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Simpan
          </button>
        </div>
      </div>
    </div>
  )
}
