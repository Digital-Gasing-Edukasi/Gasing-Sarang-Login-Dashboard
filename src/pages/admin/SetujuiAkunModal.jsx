import { useState, useEffect } from 'react'
import { Copy, Check } from 'lucide-react'
import { getRoleOptions, resolveRoleValue } from './roleOptions'
import { RoleSelect } from './RoleSelect'
import { Dropdown } from './ConfirmModal'

// Kode voucher placeholder FE (auto saat approve). TODO(be): dari backend.
function genVoucher() {
  return 'GASI' + Math.random().toString(36).slice(2, 8).toUpperCase()
}

// Field wrapper + label, isi dioper anak (RoleSelect / Dropdown) — konsisten
// dengan pola dropdown shared lain di app (lihat ApproveModal di ConfirmModal.jsx),
// bukan <select> native lagi.
function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-[#0A1128] mb-1.5">{label}</label>
      {children}
    </div>
  )
}

// Setujui Akun (dari tab Ditolak) — atur role + pelatihan, tampilkan kode voucher.
// onConfirm({ discourseGroupId, firstTrainingSessionId, voucherCode }).
export function SetujuiAkunModal({ user, discourseGroups = [], trainingSessions = [], onConfirm, onCancel, onCopyVoucher }) {
  const roleOptions = getRoleOptions(discourseGroups)
  const sessionOptions = trainingSessions
    .map(s => ({ value: String(s.id), label: s.name }))
    .sort((a, b) => String(a.label).localeCompare(String(b.label)))

  const [role, setRole]       = useState('')
  const [session, setSession] = useState('')
  const [voucher]             = useState(genVoucher)
  const [copied, setCopied]   = useState(false)

  useEffect(() => {
    if (!user) return
    setRole(resolveRoleValue(discourseGroups, user.role))
    setSession(user.raw?.firstTrainingSessionId ? String(user.raw.firstTrainingSessionId) : '')
  }, [user, discourseGroups])

  if (!user) return null

  const canSubmit = !!role && !!session
  const copy = () => {
    navigator.clipboard?.writeText(voucher)
    setCopied(true)
    onCopyVoucher && onCopyVoucher(voucher) // toast konfirmasi di parent (DB-002 #10)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#030B1F]/30 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[24px] w-full max-w-[440px] shadow-2xl overflow-hidden">
        <div className="p-7">
          <h3 className="text-xl font-bold text-[#0A1128] mb-1.5">Setujui Akun</h3>
          <p className="text-gray-500 text-sm mb-6">
            Atur role &amp; pelatihan untuk <span className="font-bold text-[#0A1128]">{user.name}</span> sebelum menyetujui.
          </p>

          <div className="space-y-4">
            <Field label="Role Pengguna">
              <RoleSelect value={role} onChange={setRole} options={roleOptions} placeholder="Pilih role" />
            </Field>
            <Field label="Nama Pelatihan">
              <Dropdown value={session} onChange={setSession} options={sessionOptions} placeholder="Pilih pelatihan" />
            </Field>
            <div>
              <label className="block text-sm font-semibold text-[#0A1128] mb-1.5">Kode Voucher</label>
              <div className="flex items-center justify-between gap-2 border border-gray-200 rounded-xl py-3 px-4">
                <span className="text-sm font-bold text-blue-600">{voucher}</span>
                <button type="button" onClick={copy} className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#0A1128] transition-colors">
                  {copied ? <><Check size={14} className="text-green-500" /> Tersalin</> : <><Copy size={14} /> Salin</>}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-6 bg-gray-50/70 border-t border-gray-100">
          <button onClick={onCancel} className="flex-1 font-semibold text-[#0A1128] border border-gray-200 bg-white hover:bg-gray-50 px-6 py-3 rounded-full transition-colors">
            Batalkan
          </button>
          <button
            disabled={!canSubmit}
            onClick={() => onConfirm({ discourseGroupId: parseInt(role, 10), firstTrainingSessionId: session, voucherCode: voucher })}
            className="flex-1 font-semibold px-6 py-3 rounded-full bg-[#0033EC] text-white hover:bg-[#0029BD] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Setujui
          </button>
        </div>
      </div>
    </div>
  )
}
