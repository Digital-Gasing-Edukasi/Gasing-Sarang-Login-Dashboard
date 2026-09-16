// Domain Verifikasi Pembayaran (manual transfer): dua dataset sub-tab,
// modal konfirmasi/tolak, enrichment user on-demand, blue-dot count.
// Dipindah dari AdminDashboardPage.jsx — guard 429 & alur undo dipertahankan.
import { useState, useRef, useEffect, useCallback } from 'react'
import { adminApi } from '@/lib/api'
import { mapToManajemen, mapToPembayaran } from '../mappers'

export function usePembayaran({
  activeTab,
  setApiError,
  usersById, setUsersById,
  trainingRegionsRef, discourseGroupsRef,
  loadUsers,
  toastApi,
  actionModal, setActionModal,
}) {
  const { setToast, scheduleAction, apiErrMsg } = toastApi

  // ── Verifikasi Pembayaran ───────────────────────────────────────────────────
  // Dua sub-tab = dua dataset: 'menunggu' (payment pending + bukti) & 'ditolak'.
  const [pembayaranMenunggu, setPembayaranMenunggu] = useState([])
  const [pembayaranDitolak, setPembayaranDitolak]   = useState([])
  const [pembayaranSubTab, setPembayaranSubTab]     = useState('menunggu')
  const [konfirmasiCandidate, setKonfirmasiCandidate] = useState(null) // modal bukti transfer
  const [tolakCandidate, setTolakCandidate]           = useState(null) // modal pilih alasan tolak
  // Titik biru navbar: sebelum tab dibuka pakai count ringan dari /stats (1 request
  // kecil, bukan full list); setelah tab dibuka, pakai list live (pembayaranLoaded).
  const [pembayaranMenungguCount, setPembayaranMenungguCount] = useState(0)
  const [pembayaranLoaded, setPembayaranLoaded]     = useState(false)
  // userId yang sudah pernah di-fetch on-demand (sukses/gagal) → jangan tembak ulang.
  const fetchedUserIdsRef = useRef(new Set())

  // Verifikasi Pembayaran (manual transfer): dua request terpisah.
  //  - Menunggu = filter 'receipt_uploaded' (bukti diunggah, menunggu review admin).
  //  - Ditolak  = filter 'rejected'.
  // try/catch per sub-tab supaya gagal di satu tidak mengosongkan lainnya.
  const loadPembayaran = useCallback(async (currentRegions = []) => {
    const regions = currentRegions.length ? currentRegions : trainingRegionsRef.current
    try {
      const res = await adminApi.listManualPayments({ filter: 'receipt_uploaded' })
      const list = Array.isArray(res) ? res : (res?.data || res?.items || [])
      setPembayaranMenunggu(list.map(p => mapToPembayaran(p, regions, discourseGroupsRef.current)))
      setPembayaranLoaded(true) // mulai sekarang titik biru pakai list live, bukan count /stats
    } catch (e) {
      console.error('Failed to load pending payments', e)
      setPembayaranMenunggu([])
    }
    try {
      const res = await adminApi.listManualPayments({ filter: 'rejected' })
      const list = Array.isArray(res) ? res : (res?.data || res?.items || [])
      setPembayaranDitolak(list.map(p => mapToPembayaran(p, regions, discourseGroupsRef.current)))
    } catch (e) {
      console.error('Failed to load rejected payments', e)
      setPembayaranDitolak([])
    }
  }, [trainingRegionsRef, discourseGroupsRef])

  useEffect(() => {
    if (activeTab === 'verifikasi-pembayaran') loadPembayaran()
  }, [activeTab, loadPembayaran])

  // Enrich on-demand (opsi B): kalau baris payment usernya tidak ada di usersById
  // (mis. di luar 20 user pertama yang ke-load Manajemen), fetch GET /admin/users/{id}
  // per user yang kurang, map, lalu gabung ke usersById. Guard fetchedUserIdsRef
  // supaya tidak menembak ulang (termasuk yang gagal) walau effect re-run.
  useEffect(() => {
    const rows = [...pembayaranMenunggu, ...pembayaranDitolak]
    const missing = [...new Set(rows.map(r => r.userId).filter(Boolean))]
      .filter(id => !usersById[id] && !fetchedUserIdsRef.current.has(id))
    if (!missing.length) return
    missing.forEach(id => fetchedUserIdsRef.current.add(id))
    let cancelled = false
    Promise.all(missing.map(id =>
      adminApi.getUser(id)
        .then(res => ({ id, raw: res?.data ?? res }))
        .catch(() => null)
    )).then(results => {
      if (cancelled) return
      const add = {}
      for (const r of results) {
        if (!r?.raw) continue
        const row = mapToManajemen(r.raw, trainingRegionsRef.current, discourseGroupsRef.current)
        add[row.id ?? r.id] = row
      }
      if (Object.keys(add).length) setUsersById(prev => ({ ...prev, ...add }))
    })
    return () => { cancelled = true }
  }, [pembayaranMenunggu, pembayaranDitolak, usersById, setUsersById, trainingRegionsRef, discourseGroupsRef])

  // ── Verifikasi Pembayaran: konfirmasi / tolak ──────────────────────────────
  // Pola sama dgn approve/reject akun: optimistic remove baris + toast undo 5s +
  // commit via scheduleAction. TODO(be): endpoint confirm/reject belum live.
  const handleKonfirmasiPembayaran = (target) => {
    if (!target) return
    setKonfirmasiCandidate(null)
    // Kandidat bisa datang dari sub-tab "menunggu" atau "ditolak" (aksi Setujui
    // Pembayaran). Buang dari kedua list; restore diarahkan ke list asalnya.
    const fromDitolak = target.statusMember === 'Pembayaran Ditolak'
    const restore = () => fromDitolak
      ? setPembayaranDitolak(prev => [target, ...prev])
      : setPembayaranMenunggu(prev => [target, ...prev])
    setPembayaranMenunggu(prev => prev.filter(u => u.id !== target.id))
    setPembayaranDitolak(prev => prev.filter(u => u.id !== target.id))
    setToast({
      message: `Berhasil konfirmasi pembayaran akun ${target.name}`,
      undo: restore,
    })
    scheduleAction(
      // Approve sukses → langganan aktif di BE. Refresh Manajemen supaya user
      // approved + status langganannya ikut muncul (state Manajemen kalau tidak
      // di-refetch tetap basi sampai pindah tab / hard reload).
      async () => { await adminApi.approveManualPayment(target.id); loadUsers('manajemen') },
      (err) => { restore(); setApiError(apiErrMsg(err, 'Gagal mengonfirmasi pembayaran.')) }
    )
  }

  // reason = enum value (BE pakai untuk template email penolakan).
  // notes = untuk reason 'unsuficient_transfer' WAJIB string angka (nominal
  // yang beneran diterima BE); alasan lain teks bebas opsional. Divalidasi di
  // TolakPembayaranModal sebelum onConfirm dipanggil.
  const handleTolakPembayaran = ({ candidate: target, reason, notes }) => {
    if (!target) return
    setTolakCandidate(null)
    setKonfirmasiCandidate(null)
    const rejected = { ...target, statusMember: 'Pembayaran Ditolak' }
    setPembayaranMenunggu(prev => prev.filter(u => u.id !== target.id))
    setPembayaranDitolak(prev => [rejected, ...prev])
    setToast({
      message: `Pembayaran ${target.name} telah ditolak`,
      undo: () => {
        setPembayaranDitolak(prev => prev.filter(u => u.id !== target.id))
        setPembayaranMenunggu(prev => [target, ...prev])
      },
    })
    scheduleAction(
      () => adminApi.rejectManualPayment(target.id, reason, notes || undefined),
      (err) => {
        setPembayaranDitolak(prev => prev.filter(u => u.id !== target.id))
        setPembayaranMenunggu(prev => [target, ...prev])
        setApiError(apiErrMsg(err, 'Gagal menolak pembayaran.'))
      }
    )
  }

  // Menu "..." di sub-tab Pembayaran Ditolak → dua aksi:
  //   setujui-pembayaran → buka modal bukti transfer (approve, sama alur menunggu)
  //   hapus-akun         → konfirmasi lalu deletion-request (pindah ke Baru Dihapus)
  const handlePembayaranRowAction = (type, user) => {
    if (type === 'setujui-pembayaran') setKonfirmasiCandidate(user)
    else if (type === 'hapus-akun') setActionModal({ type: 'hapus-akun-pembayaran', user })
  }

  // Hapus akun dari tab Pembayaran Ditolak → deletion-request + pindah ke Baru
  // Dihapus. Row pembayaran: id = payment id, userId = id akun (dipakai endpoint).
  const handleConfirmHapusAkunPembayaran = () => {
    const target = actionModal.user
    if (!target) return
    setActionModal({ type: null, user: null })
    setPembayaranDitolak(prev => prev.filter(u => u.id !== target.id))
    setToast({
      message: `Akun ${target.name} telah dihapus`,
      undo: () => setPembayaranDitolak(prev => [target, ...prev]),
    })
    scheduleAction(
      // Refresh Manajemen supaya akun muncul di tab "Baru Dihapus".
      async () => { await adminApi.requestUserDeletion(target.userId || target.id); loadUsers('manajemen') },
      (err) => { setPembayaranDitolak(prev => [target, ...prev]); setApiError(apiErrMsg(err, 'Gagal menghapus akun.')) }
    )
  }

  return {
    pembayaranMenunggu, pembayaranDitolak,
    pembayaranSubTab, setPembayaranSubTab,
    konfirmasiCandidate, setKonfirmasiCandidate,
    tolakCandidate, setTolakCandidate,
    pembayaranMenungguCount, setPembayaranMenungguCount,
    pembayaranLoaded,
    loadPembayaran,
    handleKonfirmasiPembayaran,
    handleTolakPembayaran,
    handlePembayaranRowAction,
    handleConfirmHapusAkunPembayaran,
  }
}
