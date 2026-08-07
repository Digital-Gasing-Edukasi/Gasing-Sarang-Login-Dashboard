import { useState, useEffect } from 'react'
import { RoleSelect } from './RoleSelect'
import { getRoleOptions, resolveRoleValue } from './roleOptions'

// Ubah Role (Manajemen Akun). Opsi role datang dari daftar discourse group backend
// — sama seperti Verifikasi — supaya admin tidak pernah ditawari role yang tidak
// punya grup padanannya. onConfirm(discourseGroupId), bukan nama role, karena itu
// yang diminta API.
export function UbahRoleModal({ user, discourseGroups = [], onConfirm, onCancel }) {
  const roleOptions = getRoleOptions(discourseGroups)
  const currentId = resolveRoleValue(discourseGroups, user?.role)
  const [groupId, setGroupId] = useState(currentId)

  useEffect(() => { setGroupId(currentId) }, [currentId])

  if (!user) return null

  const changed = !!groupId && groupId !== currentId

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-[24px] p-7 w-full max-w-[420px] shadow-2xl mx-4 overflow-visible">
        <h3 className="text-xl font-bold text-[#0A1128] mb-6">Ubah Role?</h3>

        <div className="flex items-center justify-between gap-4 mb-8">
          <span className="font-semibold text-[#0A1128]">{user.name}</span>
          <RoleSelect
            value={groupId}
            onChange={setGroupId}
            options={roleOptions}
            className="min-w-[190px]"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="flex-1 font-semibold text-[#0A1128] border border-gray-200 bg-white hover:bg-gray-50 px-6 py-3 rounded-full transition-colors"
          >
            Batalkan
          </button>
          <button
            disabled={!changed}
            onClick={() => onConfirm(groupId)}
            className="flex-1 font-semibold px-6 py-3 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Simpan
          </button>
        </div>
      </div>
    </div>
  )
}
