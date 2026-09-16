// Domain Verifikasi Akun: tabel Pending + Pending Voucher Setup, seleksi bulk,
// approve/reject single & bulk, konfirmasi voucher. Dipindah dari AdminDashboardPage.jsx.
import { useState, useCallback } from 'react'
import { adminApi } from '@/lib/api'
import { VERIFIED_STATUS } from '../mappers'
import { canonicalRole } from '../roleOptions'
import { genVoucherCode } from '../adminCsv'

export const BULK_LIMIT = 10 // keputusan #2: hard limit 10 akun sekaligus

export function useVerifikasi({
  users, setUsers,
  discourseGroups,
  trainingSessions,
  setApiError,
  toastApi,
}) {
  const { setToast, scheduleAction, apiErrMsg, flashLimit } = toastApi

  const [selectedIds, setSelectedIds] = useState([])
  const [verifSubTab, setVerifSubTab] = useState('pending') // 'pending' | 'voucher'
  const [bulkModal, setBulkModal] = useState(null) // 'approve' | 'reject' | 'confirm' | null
  const [bulkSuspendOpen, setBulkSuspendOpen] = useState(false) // modal tangguhkan bulk (Manajemen)
  const [rejectCandidate, setRejectCandidate] = useState(null)
  const [approveCandidate, setApproveCandidate] = useState(null)

  // Sub-tab Pending Voucher Setup (task b). Diisi FE dari hasil approve tab Pending
  // (opsi B — belum ada state backend). TODO(be): list dari endpoint saat tersedia.
  const [pendingVoucherUsers, setPendingVoucherUsers] = useState([])
  const [voucherCandidate, setVoucherCandidate] = useState(null) // konfirmasi voucher tunggal

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id)
      if (prev.length >= BULK_LIMIT) { flashLimit(); return prev } // hard limit
      return [...prev, id]
    })
  }

  const clearSelection = useCallback(() => setSelectedIds([]), [])

  // Role + Pelatihan kini dipilih di dalam ApproveModal (bukan lagi di baris tabel),
  // jadi klik centang langsung buka modal — validasi wajib ada di modal.
  const handleVerify = (id) => {
    setApproveCandidate(users.find(u => u.id === id))
  }

  // Resolve nama role (discourse group) dari id — untuk kolom Role di tabel voucher.
  const roleNameFromId = (id) => {
    const g = discourseGroups.find(x => String(x.id ?? x.groupId) === String(id))
    return canonicalRole(g) || ''
  }

  // Approve langkah-1 ("Approve Main Data"): WAITING(0) → PENDING_VOUCHER(3).
  // discourseGroupId + firstTrainingSessionId WAJIB di payload — kehadirannya yang
  // menandai request ini sebagai langkah-1. Optimistic + toast undo 5s.
  const handleConfirmApprove = ({ discourseGroupId, firstTrainingSessionId }) => {
    if (!approveCandidate) return
    const target = approveCandidate
    setApproveCandidate(null)
    // firstTrainingSession baru ke-set → BE bikin 1 record histori. Baris optimistic
    // masih bawa riwayatCount lama (0 dari tahap WAITING); bump ke min 1 + isi Alumni Nama
    // dari sesi terpilih supaya kolom "Riwayat Pelatihan" langsung akurat sebelum reload.
    const pickedSession = trainingSessions.find(s => String(s.id) === String(firstTrainingSessionId))
    const vUser = { ...target, verifiedStatus: VERIFIED_STATUS.PENDING_VOUCHER, status: 'Pending Voucher', discourseGroupId, firstTrainingSessionId, role: roleNameFromId(discourseGroupId) || target.role, voucherCode: genVoucherCode(), hasRiwayat: true, riwayatCount: Math.max(target.riwayatCount || 0, 1), alumniNama: pickedSession?.name || target.alumniNama }
    setUsers(prev => prev.filter(u => u.id !== target.id))
    setPendingVoucherUsers(prev => [vUser, ...prev])
    setToast({
      message: `Akun ${target.name} telah disetujui`,
      undo: () => {
        setPendingVoucherUsers(prev => prev.filter(u => u.id !== target.id))
        setUsers(prev => [target, ...prev])
      },
    })
    scheduleAction(
      // BE sudah auto-membuat record training-history saat verify menyetel
      // firstTrainingSession (POST manual → 409 "already exists"), jadi cukup verify saja.
      () => adminApi.verifyUser(target.id, { status: 'approved', discourseGroupId, firstTrainingSessionId }),
      (err) => {
        setPendingVoucherUsers(prev => prev.filter(u => u.id !== target.id))
        setUsers(prev => [target, ...prev])
        setApiError(apiErrMsg(err, 'Gagal menyetujui akun.'))
      }
    )
  }

  // Konfirmasi voucher → langkah-2 ("Finalize"): PENDING_VOUCHER(3) → APPROVED(1).
  // Payload { status, discourseGroupId }. firstTrainingSessionId TETAP tidak dikirim:
  // dulu kehadiran kedua field itu dibaca backend sebagai penanda langkah-1 sehingga
  // akun mental balik ke PENDING_VOUCHER. Sejak 20 Jul backend mewajibkan
  // discourseGroupId untuk status approved, jadi field itu terpaksa ikut.
  // VERIFIKASI: pastikan akun benar-benar mendarat di APPROVED, bukan PENDING_VOUCHER.
  // Optimistic remove baris + toast undo 5s.
  const handleConfirmVoucher = () => {
    if (!voucherCandidate) return
    const target = voucherCandidate
    setVoucherCandidate(null)
    setPendingVoucherUsers(prev => prev.filter(u => u.id !== target.id))
    setToast({
      message: `Akun ${target.name} telah disetujui`,
      undo: () => setPendingVoucherUsers(prev => [target, ...prev]),
    })
    scheduleAction(
      () => adminApi.verifyUser(target.id, { status: 'approved', discourseGroupId: target.discourseGroupId }),
      (err) => { setPendingVoucherUsers(prev => [target, ...prev]); setApiError(apiErrMsg(err, 'Gagal menyetujui akun.')) }
    )
  }

  const handleBulkConfirmVoucher = (rows) => {
    const ids = rows.map(r => r.id)
    const removed = pendingVoucherUsers.filter(u => ids.includes(u.id))
    setPendingVoucherUsers(prev => prev.filter(u => !ids.includes(u.id)))
    setBulkModal(null); setSelectedIds([])
    setToast({
      message: `${rows.length} akun telah disetujui`,
      undo: () => setPendingVoucherUsers(prev => [...removed, ...prev]),
    })
    scheduleAction(
      () => Promise.all(rows.map(r => adminApi.verifyUser(r.id, { status: 'approved', discourseGroupId: r.discourseGroupId }))),
      (err) => { setPendingVoucherUsers(prev => [...removed, ...prev]); setApiError(apiErrMsg(err, 'Gagal menyetujui sebagian akun.')) }
    )
  }

  // ── Bulk approve / reject ───────────────────────────────────────────────────
  // Pola sama dengan single: optimistic remove + toast undo 5 detik + commit batch
  // (Promise.all). Undo membatalkan timer, jadi API tak pernah dipanggil.
  // Bulk approve langkah-1: kirim discourseGroupId + firstTrainingSessionId per baris.
  const handleBulkApprove = (rows) => {
    const ids = rows.map(r => r.id)
    const removed = users.filter(u => ids.includes(u.id))
    const vUsers = rows.map(r => {
      const base = removed.find(u => u.id === r.id) || {}
      const pickedSession = trainingSessions.find(s => String(s.id) === String(r.firstTrainingSessionId))
      return { ...base, verifiedStatus: VERIFIED_STATUS.PENDING_VOUCHER, status: 'Pending Voucher', discourseGroupId: r.discourseGroupId, firstTrainingSessionId: r.firstTrainingSessionId, role: roleNameFromId(r.discourseGroupId) || base.role, voucherCode: genVoucherCode(), hasRiwayat: true, riwayatCount: Math.max(base.riwayatCount || 0, 1), alumniNama: pickedSession?.name || base.alumniNama }
    })
    setUsers(prev => prev.filter(u => !ids.includes(u.id)))
    setPendingVoucherUsers(prev => [...vUsers, ...prev])
    setBulkModal(null); setSelectedIds([])
    setToast({
      message: `${rows.length} akun disetujui, menunggu setup voucher`,
      undo: () => {
        setPendingVoucherUsers(prev => prev.filter(u => !ids.includes(u.id)))
        setUsers(prev => [...removed, ...prev])
      },
    })
    scheduleAction(
      // BE auto-membuat record training-history saat verify menyetel firstTrainingSession,
      // jadi cukup verify saja (POST manual → 409 "already exists").
      () => Promise.all(rows.map(r => adminApi.verifyUser(r.id, { status: 'approved', discourseGroupId: r.discourseGroupId, firstTrainingSessionId: r.firstTrainingSessionId }))),
      (err) => {
        setPendingVoucherUsers(prev => prev.filter(u => !ids.includes(u.id)))
        setUsers(prev => [...removed, ...prev])
        setApiError(apiErrMsg(err, 'Gagal menyetujui sebagian akun.'))
      }
    )
  }

  const handleBulkReject = (rows) => {
    const ids = rows.map(r => r.id)
    const removed = users.filter(u => ids.includes(u.id))
    setUsers(prev => prev.filter(u => !ids.includes(u.id)))
    setBulkModal(null); setSelectedIds([])
    setToast({ message: `${rows.length} akun telah ditolak`, users: removed })

    scheduleAction(
      () => Promise.all(rows.map(r => r.status === 'rejected'
        ? adminApi.rejectUser(r.id, { rejectedReason: r.reason })
        : adminApi.reviseUser(r.id, { rejectedReason: r.reason, fieldsToRevise: r.invalidFields })
      )),
      (err) => { setUsers(prev => [...removed, ...prev]); setApiError(apiErrMsg(err, 'Gagal menolak sebagian akun. Silakan coba lagi.')) }
    )
  }

  const handleConfirmReject = ({ status, invalidFields, reason }) => {
    if (!rejectCandidate) return
    const target = rejectCandidate
    setUsers(prev => prev.filter(u => u.id !== target.id))
    setRejectCandidate(null)
    setToast({ message: `Akun ${target.name} telah ditolak`, user: target })

    // status 'rejected' → tolak final (teks bebas). status 'revise' → minta perbaiki
    // data (backend generate token JWT + email link revise). Lihat ADR-0003.
    const apiCall = status === 'rejected'
      ? () => adminApi.rejectUser(target.id, { rejectedReason: reason })
      : () => adminApi.reviseUser(target.id, { rejectedReason: reason, fieldsToRevise: invalidFields })

    scheduleAction(apiCall, (err) => {
      setUsers(prev => [target, ...prev]); setApiError(apiErrMsg(err, 'Gagal menolak akun. Silakan coba lagi.'))
    })
  }

  return {
    selectedIds, setSelectedIds, toggleSelect, clearSelection,
    verifSubTab, setVerifSubTab,
    bulkModal, setBulkModal,
    bulkSuspendOpen, setBulkSuspendOpen,
    rejectCandidate, setRejectCandidate,
    approveCandidate, setApproveCandidate,
    pendingVoucherUsers, setPendingVoucherUsers,
    voucherCandidate, setVoucherCandidate,
    roleNameFromId,
    handleVerify,
    handleConfirmApprove,
    handleConfirmVoucher,
    handleBulkConfirmVoucher,
    handleBulkApprove,
    handleBulkReject,
    handleConfirmReject,
  }
}
