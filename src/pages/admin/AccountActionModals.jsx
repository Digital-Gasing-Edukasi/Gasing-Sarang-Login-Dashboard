import { History, Trash2, Clock, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

// Modal konfirmasi terpusat untuk aksi status akun (Hapus / Pulihkan).
// tone: 'danger' (merah, Hapus) | 'primary' (biru, Pulihkan).
function ConfirmActionModal({ tone, Icon, title, body, confirmLabel, onConfirm, onCancel }) {
  const danger = tone === 'danger'
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-[24px] p-8 w-full max-w-[400px] shadow-2xl mx-4 flex flex-col items-center text-center">
        <div className={cn(
          'w-16 h-16 rounded-full border border-dashed flex items-center justify-center mb-6',
          danger ? 'border-red-400 bg-red-50' : 'border-blue-400 bg-blue-50'
        )}>
          <Icon className={danger ? 'text-red-500' : 'text-blue-500'} size={28} strokeWidth={1.6} />
        </div>
        <h3 className="text-xl font-bold text-[#0A1128] mb-3">{title}</h3>
        <p className="text-gray-500 mb-8 text-sm px-2">{body}</p>

        <div className="flex items-center gap-3 w-full">
          <button
            onClick={onCancel}
            className="flex-1 font-semibold text-[#0A1128] border border-gray-200 bg-white hover:bg-gray-50 px-6 py-3 rounded-full transition-colors"
          >
            Batalkan
          </button>
          <button
            onClick={onConfirm}
            className={cn(
              'flex-1 font-semibold px-6 py-3 rounded-full text-white transition-colors',
              danger ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-700'
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export function HapusAkunModal({ user, onConfirm, onCancel }) {
  if (!user) return null
  return (
    <ConfirmActionModal
      tone="danger"
      Icon={Trash2}
      title="Yakin Hapus Akun Ini?"
      body={
        <>
          Akun <span className="font-semibold text-[#0A1128]">{user.name}</span>{" "} akan dihapus. Kamu masih dapat memulihkannya sebelum 30 hari.</>
      }
      confirmLabel="Hapus Akun"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}

// Hapus PERMANEN dari tab "Baru Dihapus" — hard delete, tidak bisa dipulihkan.
// Copy sengaja lebih tegas dari HapusAkunModal (soft delete) supaya admin sadar beda.
export function HapusPermanenModal({ user, onConfirm, onCancel }) {
  if (!user) return null
  return (
    <ConfirmActionModal
      tone="danger"
      Icon={Trash2}
      title="Hapus Akun Permanen?"
      body={
        <>
          Akun <span className="font-semibold text-[#0A1128]">{user.name}</span> akan dihapus permanen. Tindakan ini <span className="font-semibold text-red-500">tidak dapat dibatalkan</span>.</>
      }
      confirmLabel="Hapus Permanen"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  )
}

export function PulihkanAkunModal({ user, onConfirm, onCancel }) {
  if (!user) return null
  return (
    <ConfirmActionModal
      tone="primary"
      Icon={History}
      title="Yakin Pulihkan Akun Ini?"
      body={<>Akun <span className="font-semibold text-[#0A1128]">{user.name}</span> akan dipulihkan dan diaktifkan kembali.</>}
      confirmLabel="Pulihkan Akun"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  )
}

export function SetujuiAkunModal({ user, onConfirm, onCancel }) {
  if (!user) return null
  return (
    <ConfirmActionModal
      tone="primary"
      Icon={CheckCircle2}
      title="Yakin Setujui Akun Ini?"
      body={<>Akun <span className="font-semibold text-[#0A1128]">{user.name}</span> akan disetujui dan dipindah ke tab Disetujui.</>}
      confirmLabel="Setujui Akun"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  )
}

export function TangguhkanAkunModal({ user, onConfirm, onCancel }) {
  if (!user) return null
  return (
    <ConfirmActionModal
      tone="danger"
      Icon={Clock}
      title="Yakin Tangguhkan Akun Ini?"
      body={<>Akun <span className="font-semibold text-[#0A1128]">{user.name}</span> akan ditangguhkan dan dipindah ke tab Ditangguhkan.</>}
      confirmLabel="Tangguhkan Akun"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  )
}
