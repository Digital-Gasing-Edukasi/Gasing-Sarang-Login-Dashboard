// Prefetch mount-only dashboard: dataset navbar dots, payment stats ringan,
// discourse groups, opsi sesi pelatihan. Dipindah dari AdminDashboardPage.jsx.
//
// Semua effect di sini jalan sekali (atau per loader identity yang stabil via
// useCallback([])) — terpisah dari trigger per-tab di hook domain supaya tidak
// ikut nembak ulang saat ganti tab (429).
import { useState, useEffect } from 'react'
import { adminApi, discourseApi, trainingSessionsApi } from '@/lib/api'

export function useAdminBoot({
  loadUsers, loadRiwayat, loadPendaftaran,
  setDiscourseGroups,
  setPembayaranMenungguCount,
}) {
  // Opsi "Nama Pelatihan Terbaru" untuk modal approve (single & bulk). Load sekali.
  const [trainingSessions, setTrainingSessions] = useState([])

  // Muat semua dataset sekali di mount supaya titik biru navbar akurat walau
  // tab-nya belum pernah dibuka (dot = ada baris isNew / ada akun pending).
  useEffect(() => {
    loadUsers('manajemen')
    loadRiwayat()
    loadPendaftaran()
  }, [loadUsers, loadRiwayat, loadPendaftaran])

  // Titik biru Verifikasi Pembayaran: cukup count ringan dari /stats saat mount
  // (bukan full list). Full list baru di-fetch saat tab dibuka (loadPembayaran).
  useEffect(() => {
    adminApi.getManualPaymentStats()
      .then(res => {
        const s = res?.data ?? res ?? {}
        const n = s.receipt_uploaded ?? s.receiptUploaded ?? s.pendingReview ?? 0
        setPembayaranMenungguCount(Number(n) || 0)
      })
      .catch(err => console.error('Failed to load payment stats', err))
  }, [setPembayaranMenungguCount])

  useEffect(() => {
    discourseApi.getGroups()
      .then(res => setDiscourseGroups(Array.isArray(res) ? res : (res.data || [])))
      .catch(err => console.error("Failed to load discourse groups", err))
  }, [setDiscourseGroups])

  useEffect(() => {
    trainingSessionsApi.list({ page: 1, limit: 100 })
      .then(res => {
        const list = Array.isArray(res) ? res : (res?.data || res?.items || [])
        setTrainingSessions(list.map(s => ({ id: s.id, name: s.name || '-' })))
      })
      .catch(err => console.error("Failed to load training sessions", err))
  }, [])

  return { trainingSessions }
}
