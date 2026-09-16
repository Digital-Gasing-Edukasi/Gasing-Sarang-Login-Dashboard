// Domain Riwayat Pelatihan (GET /training-sessions + CRUD + CSV import flow).
// Dipindah dari AdminDashboardPage.jsx. Catatan 429 dipertahankan: TIDAK ada
// loop N+1 per-session (resolve region / ringkasan peserta) — kolom "Daerah" &
// "Peserta" harus di-embed backend di response list.
import { useState, useEffect, useCallback } from 'react'
import { adminApi, trainingSessionsApi, trainingHistoriesApi, queueApi } from '@/lib/api'
import { downloadCsv, fmtTimeAmPm } from '@/lib/format'
import { mapToRiwayat } from '../mappers'

// Riwayat Pelatihan: jumlah baris per page (dikirim sbg `limit` ke GET /training-sessions).
export const RIWAYAT_PAGE_SIZE = 100

export function useRiwayatPelatihan({ activeTab, searchQuery, setApiError, toastApi }) {
  const { setToast, armToastDismiss } = toastApi

  // States for Riwayat Pelatihan (di-load dari GET /training-sessions)
  const [riwayatPelatihanData, setRiwayatPelatihanData] = useState([])
  const [riwayatPage, setRiwayatPage] = useState(1)
  const [riwayatTotalPages, setRiwayatTotalPages] = useState(3) // sementara: 3 page dulu
  const [isAddPelatihanModalOpen, setIsAddPelatihanModalOpen] = useState(false)
  const [perbaruiSession, setPerbaruiSession] = useState(null)
  const [pesertaSession, setPesertaSession] = useState(null)
  const [riwayatDetailUser, setRiwayatDetailUser] = useState(null) // modal Riwayat Pelatihan (Lihat Detail)

  // Cukup 1 request: list training-sessions. mapToRiwayat auto-pakai region yang
  // di-embed backend (s.region/s.regency) kalau ada.
  const loadRiwayat = useCallback(async (page = 1, keyword = '') => {
    try {
      const params = { page, limit: RIWAYAT_PAGE_SIZE }
      if (keyword.trim()) params.keyword = keyword.trim()
      const res = await trainingSessionsApi.list(params)
      const list = Array.isArray(res) ? res : (res?.data || res?.items || [])
      setRiwayatPelatihanData(list.map(s => mapToRiwayat(s)))
      const total = res?.meta?.total ?? res?.total
      if (Number.isFinite(total)) {
        setRiwayatTotalPages(Math.max(1, Math.ceil(total / RIWAYAT_PAGE_SIZE)))
      } else {
        setRiwayatTotalPages(3) // sementara: 3 page dulu selagi backend belum kirim meta.total
      }
    } catch (e) {
      setRiwayatPelatihanData([])
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'riwayat-pelatihan') loadRiwayat(riwayatPage, searchQuery)
  }, [activeTab, loadRiwayat, riwayatPage, searchQuery])

  // Reset ke page 1 tiap kali kata kunci pencarian berubah.
  useEffect(() => { setRiwayatPage(1) }, [searchQuery])

  // Tambah pelatihan baru → POST /admin/training-sessions (optimistic).
  // Status = state upload: Processing (in-flight) → Saved (sukses) / Error (gagal).
  // Response cuma balikin session (tanpa peserta/langganan) → kolom itu diisi '-'.
  const handleAddPelatihan = async (data) => {
    const tempId = `temp-${Date.now()}`
    const baseRow = {
      id: tempId,
      nama: data.name,
      isNew: true,
      daerah: data.daerahLabel,
      tglMulai: data.tglMulaiLabel,
      status: 'Processing',
      pesertaNama: '-',
      pesertaLainnya: 0,
      pesertaEmail: '-',
      langganan: '-',
      lastUpdated: fmtTimeAmPm(new Date()),
      lastUpdatedMs: Date.now(),
      regionId: data.regionId,
      startMs: data.startDate ? new Date(data.startDate).getTime() : null,
      endMs: data.endDate ? new Date(data.endDate).getTime() : null,
    }
    setRiwayatPelatihanData(prev => [baseRow, ...prev])

    try {
      const res = await adminApi.createTrainingSession({
        name: data.name,
        regionId: data.regionId,
        startDate: data.startDate,
        endDate: data.endDate,
      })
      const sessionId = res?.id || res?.data?.id || tempId
      setRiwayatPelatihanData(prev =>
        prev.map(r => (r.id === tempId ? { ...r, id: sessionId } : r))
      )

      // Kalau ada CSV peserta: upload → validasi → push (row invalid/duplikat di-skip).
      // Session tetap dibuat meski import gagal → row Saved + toast peringatan.
      let pesertaWarn = ''
      if (data.pesertaFile) {
        try {
          const up = await trainingHistoriesApi.upload(data.pesertaFile, sessionId)
          await queueApi.waitJob(up.trackId)
          const pushRes = await trainingHistoriesApi.push(up.importId)
          await queueApi.waitJob(pushRes.trackId)
        } catch (impErr) {
          pesertaWarn = ` (import peserta gagal: ${impErr.message || 'error'})`
        }
      }

      setRiwayatPelatihanData(prev =>
        prev.map(r => (r.id === sessionId ? { ...r, status: 'Saved' } : r))
      )
      setToast({ message: `Pelatihan ${data.name} berhasil ditambahkan${pesertaWarn}` })
      armToastDismiss()
    } catch (err) {
      setRiwayatPelatihanData(prev =>
        prev.map(r => (r.id === tempId ? { ...r, status: 'Error' } : r))
      )
      setApiError(err.message || 'Gagal menambah pelatihan.')
    }
  }

  // Hapus session → DELETE /admin/training-sessions/:id (optimistic + revert).
  // Dipicu dari tombol "Hapus Riwayat" di modal edit (ketik DELETE).
  const handleDeleteRiwayat = async (item) => {
    if (!item) return
    const prev = riwayatPelatihanData
    setRiwayatPelatihanData(p => p.filter(r => r.id !== item.id))
    try {
      await adminApi.deleteTrainingSession(item.id)
      setToast({ message: 'Berhasil menghapus riwayat pelatihan' })
      armToastDismiss()
    } catch (err) {
      setRiwayatPelatihanData(prev) // revert
      setApiError(err.message || 'Gagal menghapus riwayat pelatihan.')
    }
  }

  // Simpan perubahan session → PATCH + (opsional) ganti CSV peserta (upload+push).
  const handleUpdatePelatihan = async (data) => {
    const prev = riwayatPelatihanData
    // Optimistic: update tampilan + status Processing selama request jalan.
    setRiwayatPelatihanData(p => p.map(r => r.id === data.id
      ? { ...r, nama: data.name, daerah: data.daerahLabel, tglMulai: data.tglMulaiLabel, regionId: data.regionId, status: 'Processing' }
      : r))
    try {
      await adminApi.updateTrainingSession(data.id, {
        name: data.name, regionId: data.regionId, startDate: data.startDate, endDate: data.endDate,
      })
      let pesertaWarn = ''
      if (data.pesertaFile) {
        try {
          const up = await trainingHistoriesApi.upload(data.pesertaFile, data.id)
          await queueApi.waitJob(up.trackId)
          const pushRes = await trainingHistoriesApi.push(up.importId)
          await queueApi.waitJob(pushRes.trackId)
        } catch (impErr) {
          pesertaWarn = ` (import peserta gagal: ${impErr.message || 'error'})`
        }
      }
      setRiwayatPelatihanData(p => p.map(r => r.id === data.id ? { ...r, status: 'Saved' } : r))
      setToast({ message: `Berhasil menyimpan riwayat ${data.name}${pesertaWarn}` })
      armToastDismiss()
    } catch (err) {
      setRiwayatPelatihanData(prev) // revert
      setApiError(err.message || 'Gagal menyimpan riwayat pelatihan.')
    }
  }

  const handleDownloadRiwayat = (item) => {
    const csv = [
      'Nama Pelatihan,Daerah Pelatihan,Tgl. Mulai,Status,Nama Peserta,Last Updated',
      `"${item.nama}","${item.daerah}","${item.tglMulai}","${item.status}","${item.pesertaNama}","${item.lastUpdated}"`
    ].join('\n')
    downloadCsv(`${item.nama}-Export data.csv`, csv)
  }

  return {
    riwayatPelatihanData, setRiwayatPelatihanData,
    riwayatPage, setRiwayatPage,
    riwayatTotalPages,
    isAddPelatihanModalOpen, setIsAddPelatihanModalOpen,
    perbaruiSession, setPerbaruiSession,
    pesertaSession, setPesertaSession,
    riwayatDetailUser, setRiwayatDetailUser,
    loadRiwayat,
    handleAddPelatihan,
    handleDeleteRiwayat,
    handleUpdatePelatihan,
    handleDownloadRiwayat,
  }
}
