// Domain Manajemen Akun: filter, aksi baris (role/hapus/pulihkan/permanen/
// setujui/tangguhkan/voucher), bulk status + undo. Dipindah dari AdminDashboardPage.jsx.
import { useState } from 'react'
import { adminApi } from '@/lib/api'

export function useManajemen({
  activeTab,
  users, setUsers,
  managementUsers, setManagementUsers,
  selectedUsers,
  actionModal, setActionModal,
  setApiError,
  toastApi,
  roleNameFromId,
  setBulkSuspendOpen,
  clearSelection,
}) {
  const { setToast, scheduleAction, apiErrMsg } = toastApi

  const [roleErrors, setRoleErrors]         = useState({})

  const handleRoleChange = (id, newRole) => {
    if (activeTab === 'verifikasi') {
      setUsers(users.map(u => u.id === id ? { ...u, role: newRole } : u))
    } else {
      setManagementUsers(managementUsers.map(u => u.id === id ? { ...u, role: newRole } : u))
    }
    if (newRole) setRoleErrors(prev => ({ ...prev, [id]: false }))
  }

  const handleActionClick = (type, user) => {
    setActionModal({ type, user })
  }

  // gid = discourseGroupId dari dropdown (opsinya sudah berasal dari backend, jadi
  // id-nya selalu sah). Nama role cuma dipakai untuk tampilan optimistic.
  const handleConfirmUbahRole = (gid) => {
    const target = actionModal.user
    const prevRole = target.role
    setActionModal({ type: null, user: null })

    const newRole = roleNameFromId(gid)
    handleRoleChange(target.id, newRole)
    setToast({
      message: `Berhasil mengubah role akun ${target.name}`,
      roleUndo: { id: target.id, prevRole },
    })
    // Commit ke backend. Undo membatalkan timer.
    scheduleAction(
      () => adminApi.updateDiscourseGroup(target.id, gid),
      (err) => { handleRoleChange(target.id, prevRole); setApiError(apiErrMsg(err, 'Gagal mengubah role.')) }
    )
  }

  // Hapus akun (tab Disetujui/Ditolak) → pindah ke "Baru Dihapus" (deletion-request).
  const handleConfirmHapusAkun = () => {
    const target = actionModal.user
    if (!target) return
    setActionModal({ type: null, user: null })
    const prevStatus = target.accountStatus
    setManagementUsers(prev => prev.map(u => u.id === target.id ? { ...u, accountStatus: 'Baru Dihapus' } : u))
    setToast({ message: `Akun ${target.name} telah dihapus`, statusUndo: { id: target.id, prevStatus } })
    scheduleAction(
      () => adminApi.requestUserDeletion(target.id),
      (err) => { setManagementUsers(prev => prev.map(u => u.id === target.id ? { ...u, accountStatus: prevStatus } : u)); setApiError(apiErrMsg(err, 'Gagal menghapus akun.')) }
    )
  }

  // Pulihkan akun → kembali "Disetujui". Sumber "Baru Dihapus" = cancelDeletion,
  // sumber "Ditangguhkan" = unsuspend.
  const handleConfirmPulihkanAkun = () => {
    const target = actionModal.user
    if (!target) return
    setActionModal({ type: null, user: null })
    const prevStatus = target.accountStatus
    setManagementUsers(prev => prev.map(u => u.id === target.id ? { ...u, accountStatus: 'Disetujui' } : u))
    setToast({ message: `Akun ${target.name} telah dipulihkan`, statusUndo: { id: target.id, prevStatus } })
    const apiCall = prevStatus === 'Baru Dihapus'
      ? () => adminApi.cancelUserDeletion(target.id)
      : () => adminApi.unsuspendUser(target.id)
    scheduleAction(
      apiCall,
      (err) => { setManagementUsers(prev => prev.map(u => u.id === target.id ? { ...u, accountStatus: prevStatus } : u)); setApiError(apiErrMsg(err, 'Gagal memulihkan akun.')) }
    )
  }

  // Hapus akun PERMANEN (tab Baru Dihapus) → baris hilang total dari daftar.
  // Optimistic remove + toast undo 5 dtk (clearTimeout membatalkan commit). Undo
  // mengembalikan snapshot. Endpoint = adminApi.deleteUserPermanent (TODO: konfirmasi).
  const handleConfirmHapusPermanen = () => {
    const target = actionModal.user
    if (!target) return
    setActionModal({ type: null, user: null })
    const snapshot = managementUsers
    setManagementUsers(prev => prev.filter(u => u.id !== target.id))
    setToast({
      message: `Akun ${target.name} dihapus permanen`,
      undo: () => setManagementUsers(snapshot),
    })
    scheduleAction(
      () => adminApi.deleteUserPermanent(target.id),
      (err) => { setManagementUsers(snapshot); setApiError(apiErrMsg(err, 'Gagal menghapus akun permanen.')) }
    )
  }

  // Setujui akun (tab Ditolak) → approve dgn role + pelatihan + voucher (dari modal).
  const handleConfirmSetujuiAkun = ({ discourseGroupId, firstTrainingSessionId, voucherCode }) => {
    const target = actionModal.user
    if (!target) return
    setActionModal({ type: null, user: null })
    const prevStatus = target.accountStatus
    const roleName = roleNameFromId(discourseGroupId)
    setManagementUsers(prev => prev.map(u => u.id === target.id
      ? { ...u, accountStatus: 'Disetujui', role: roleName || u.role, voucher: voucherCode || u.voucher }
      : u))
    setToast({ message: `Akun ${target.name} telah disetujui`, statusUndo: { id: target.id, prevStatus } })

    const isUnreject = prevStatus === 'Ditolak'
    const payload = isUnreject
      ? { status: 'unreject' }
      : { status: 'approved', discourseGroupId, firstTrainingSessionId }

    scheduleAction(
      () => adminApi.verifyUser(target.id, payload),
      (err) => { setManagementUsers(prev => prev.map(u => u.id === target.id ? { ...u, accountStatus: prevStatus } : u)); setApiError(apiErrMsg(err, 'Gagal menyetujui akun.')) }
    )
  }

  // Tangguhkan akun (tab Disetujui) → suspend s/d suspendedUntil (modal preset/manual).
  // TODO(be): emailMessage belum dikirim — endpoint /suspend hanya terima suspendedUntil + reason.
  const handleConfirmTangguhkanAkun = ({ suspendedUntil, reason }) => {
    const target = actionModal.user
    if (!target) return
    setActionModal({ type: null, user: null })
    const prevStatus = target.accountStatus
    setManagementUsers(prev => prev.map(u => u.id === target.id ? { ...u, accountStatus: 'Ditangguhkan' } : u))
    setToast({ message: `Akun ${target.name} telah ditangguhkan`, statusUndo: { id: target.id, prevStatus } })
    scheduleAction(
      () => adminApi.suspendUser(target.id, { suspendedUntil, reason }),
      (err) => { setManagementUsers(prev => prev.map(u => u.id === target.id ? { ...u, accountStatus: prevStatus } : u)); setApiError(apiErrMsg(err, 'Gagal menangguhkan akun.')) }
    )
  }

  const handleConfirmKirimVoucher = (voucherCode) => {
    const target = actionModal.user
    if (!target) return
    const prevVoucher = target.voucher
    setManagementUsers(prev => prev.map(u => u.id === target.id ? { ...u, voucher: voucherCode } : u))
    setActionModal({ type: null, user: null })
    setToast({
      message: `Voucher ${voucherCode} berhasil dikirim ke ${target.name}`,
      undo: () => setManagementUsers(prev => prev.map(u => u.id === target.id ? { ...u, voucher: prevVoucher } : u)),
    })
    // Commit ke backend (optimistic + toast undo 5s). TODO(be): konfirmasi bentuk
    // payload personal voucher — { userId, code } masih tebakan sampai kontrak final.
    scheduleAction(
      () => adminApi.grantPersonalVoucher({ userId: target.id, code: voucherCode }),
      (err) => {
        setManagementUsers(prev => prev.map(u => u.id === target.id ? { ...u, voucher: prevVoucher } : u))
        setApiError(apiErrMsg(err, 'Gagal mengirim voucher.'))
      }
    )
  }

  // ── Bulk aksi Manajemen (mengikuti aksi baris per tab) ──────────────────────
  // Ubah status banyak akun sekaligus + toast undo 5s. commitEach(id, prevStatus)->Promise.
  const runBulkStatus = (rows, newStatus, message, commitEach) => {
    if (!rows.length) return
    const prev = rows.map(u => ({ id: u.id, status: u.accountStatus }))
    const ids = rows.map(r => r.id)
    setManagementUsers(p => p.map(u => ids.includes(u.id) ? { ...u, accountStatus: newStatus } : u))
    clearSelection()
    setToast({ message, bulkStatusUndo: prev })
    scheduleAction(
      () => Promise.all(ids.map(id => commitEach(id, prev.find(x => x.id === id)?.status))),
      (err) => {
        setManagementUsers(p => p.map(u => { const pr = prev.find(x => x.id === u.id); return pr ? { ...u, accountStatus: pr.status } : u }))
        setApiError(apiErrMsg(err, 'Gagal memproses sebagian akun.'))
      }
    )
  }

  const handleManajemenBulk = (key) => {
    const rows = selectedUsers
    if (!rows.length) return
    if (key === 'hapus') {
      runBulkStatus(rows, 'Baru Dihapus', `${rows.length} akun telah dihapus`, (id) => adminApi.requestUserDeletion(id))
    } else if (key === 'pulihkan') {
      runBulkStatus(rows, 'Disetujui', `${rows.length} akun telah dipulihkan`,
        (id, prevStatus) => prevStatus === 'Baru Dihapus' ? adminApi.cancelUserDeletion(id) : adminApi.unsuspendUser(id))
    } else if (key === 'setujui') {
      // REVISE(2) ga punya endpoint approve langsung (lihat guard sama di
      // ManajemenTable.jsx ditolakMenuItems) — keluarin dari batch biar ga ada
      // request yang pasti ditolak BE. Sisanya (REJECTED) jalan seperti biasa.
      const approvable = rows.filter(r => r.verifiedStatus !== 2 && r.verifiedStatus !== 'revise')
      if (!approvable.length) {
        setApiError('Akun revisi tidak bisa disetujui langsung — tunggu user kirim ulang data.')
        return
      }
      runBulkStatus(approvable, 'Disetujui', `${approvable.length} akun telah disetujui`,
        (id) => adminApi.verifyUser(id, { status: 'approved', discourseGroupId: rows.find(r => r.id === id)?.discourseGroupId }))
    } else if (key === 'tangguhkan') {
      setBulkSuspendOpen(true)
    }
  }

  // Bulk tangguhkan pakai satu SuspendModal → suspendedUntil + reason sama untuk semua terpilih.
  const handleBulkTangguhkan = ({ suspendedUntil, reason }) => {
    const rows = selectedUsers
    setBulkSuspendOpen(false)
    runBulkStatus(rows, 'Ditangguhkan', `${rows.length} akun telah ditangguhkan`, (id) => adminApi.suspendUser(id, { suspendedUntil, reason }))
  }

  return {
    roleErrors,
    actionModal, setActionModal,
    handleRoleChange,
    handleActionClick,
    handleConfirmUbahRole,
    handleConfirmHapusAkun,
    handleConfirmPulihkanAkun,
    handleConfirmHapusPermanen,
    handleConfirmSetujuiAkun,
    handleConfirmTangguhkanAkun,
    handleConfirmKirimVoucher,
    runBulkStatus,
    handleManajemenBulk,
    handleBulkTangguhkan,
  }
}
