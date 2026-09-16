// Domain Pendaftaran Trainer (sumber: app-config hero_banner-home-v2).
// Dipindah dari AdminDashboardPage.jsx.
import { useState, useEffect, useCallback } from 'react'
import { appConfigApi } from '@/lib/api'
import {
  PENDAFTARAN_KEY, HEADER_BASE, DEFAULT_SHARED,
  isPastDeadline, autoOffExpired, parseThreadId, threadsToRows, rowsToValue,
} from '../pendaftaranThreads'

export function usePendaftaranTrainer({ activeTab, setApiError, toastApi }) {
  const { setToast, armToastDismiss } = toastApi

  // States for Pendaftaran Trainer (sumber: app-config hero_banner-home-v2)
  const [pendaftaranData, setPendaftaranData] = useState([])
  const [sharedContent, setSharedContent] = useState(DEFAULT_SHARED)
  const [isAddPendaftaranModalOpen, setIsAddPendaftaranModalOpen] = useState(false)

  const persistPendaftaran = (rows) =>
    appConfigApi.set(PENDAFTARAN_KEY, rowsToValue(rows, sharedContent))

  const loadPendaftaran = useCallback(async () => {
    try {
      const res = await appConfigApi.get(PENDAFTARAN_KEY)
      const value = res?.value ?? res?.data?.value ?? res ?? {}
      const shared = value.shared_content || DEFAULT_SHARED
      setSharedContent(shared)

      // Batas waktu bisa terlewat saat dashboard tidak dibuka sama sekali, jadi
      // status hasil baca dinormalisasi dulu lalu ditulis balik ke app-config —
      // kalau tidak, Home masih menampilkan pendaftaran yang sudah tutup.
      const { rows, changed } = autoOffExpired(threadsToRows(value))
      setPendaftaranData(rows)
      if (changed) {
        appConfigApi.set(PENDAFTARAN_KEY, rowsToValue(rows, shared)).catch(() => {})
      }
    } catch (e) {
      // Belum dikonfigurasi / gagal baca → mulai dari kosong.
      setPendaftaranData([])
      setSharedContent(DEFAULT_SHARED)
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'pendaftaran-trainer') loadPendaftaran()
  }, [activeTab, loadPendaftaran])

  const handleAddPendaftaran = async (data) => {
    const threadId = parseThreadId(data.url)
    if (!threadId) {
      setApiError('Tautan topik tidak valid. Pastikan URL mengandung id topik Discourse.')
      return
    }

    const newRow = {
      id: threadId,
      threadId,
      nama: data.nama,
      url: data.url,
      periode: data.periode,
      batasWaktu: data.batasWaktu,
      isActive: false,
      headerText: HEADER_BASE + (data.periode || ''),
      createdAt: Date.now(),
      isNew: true,
    }
    // Ganti kalau threadId sama sudah ada.
    const next = [newRow, ...pendaftaranData.filter(r => r.threadId !== threadId)]
    const prev = pendaftaranData

    setApiError('')
    setPendaftaranData(next)
    try {
      await persistPendaftaran(next)
      setToast({ message: `Pelatihan ${data.nama} berhasil ditambahkan` })
    } catch (err) {
      setPendaftaranData(prev)
      setApiError(err.message || 'Gagal menyimpan pendaftaran pelatihan.')
    }
  }

  // Dashboard bisa dibiarkan terbuka melewati batas waktu, jadi status juga
  // dicek berkala, bukan cuma saat load.
  useEffect(() => {
    const tick = () => {
      setPendaftaranData(prev => {
        const { rows, changed } = autoOffExpired(prev)
        if (changed) persistPendaftaran(rows).catch(() => {})
        return rows
      })
    }
    const timer = setInterval(tick, 30_000)
    return () => clearInterval(timer)
  }, [sharedContent])

  // Aturan: hanya 1 pelatihan boleh aktif. Nyalakan 1 → matikan sisanya.
  // Baris yang batas waktunya lewat tidak boleh dinyalakan lagi.
  const handleTogglePendaftaranStatus = async (id) => {
    const target = pendaftaranData.find(r => r.id === id)
    if (!target) return
    const turningOn = !target.isActive
    if (turningOn && isPastDeadline(target.batasWaktu)) {
      setApiError('Batas waktu pendaftaran sudah lewat. Perbarui batas waktu sebelum mengaktifkan kembali.')
      return
    }
    const next = pendaftaranData.map(r => ({
      ...r,
      isActive: turningOn ? r.id === id : (r.id === id ? false : r.isActive),
    }))
    const prev = pendaftaranData

    setApiError('')
    setPendaftaranData(next)
    try {
      await persistPendaftaran(next)
    } catch (err) {
      setPendaftaranData(prev)
      setApiError(err.message || 'Gagal memperbarui status pelatihan.')
    }
  }


  // Hapus pendaftaran pelatihan (baris berstatus Berakhir). Sumber data tab ini =
  // app-config JSON (PENDAFTARAN_KEY), BUKAN training-sessions. Jadi "delete" =
  // buang entry dari daftar rows lalu tulis balik JSON tanpa entry itu
  // (persistPendaftaran → rowsToValue). Optimistic remove + revert bila gagal.
  const handleDeletePendaftaran = async (item) => {
    if (!item) return
    const prev = pendaftaranData
    const next = pendaftaranData.filter(r => r.id !== item.id)
    setApiError('')
    setPendaftaranData(next)
    try {
      await persistPendaftaran(next)
      setToast({ message: `Pelatihan ${item.nama} berhasil dihapus` })
      armToastDismiss()
    } catch (err) {
      setPendaftaranData(prev) // revert
      setApiError(err.message || 'Gagal menghapus pelatihan.')
    }
  }

  return {
    pendaftaranData,
    sharedContent,
    isAddPendaftaranModalOpen, setIsAddPendaftaranModalOpen,
    loadPendaftaran,
    handleAddPendaftaran,
    handleTogglePendaftaranStatus,
    handleDeletePendaftaran,
  }
}
