import { useState, useRef, useEffect, useCallback } from 'react'
import { adminApi, discourseApi, regionsApi, appConfigApi, trainingSessionsApi, trainingHistoriesApi, queueApi } from '@/lib/api'
import { mapToVerifikasi, mapToManajemen, mapToRiwayat, fmtDate, computeIsNew, isManajemenEligible } from './admin/mappers'
import { AdminSidebar }    from './admin/AdminSidebar'
import { AdminToast }      from './admin/AdminToast'
import { RejectModal, ApproveModal } from './admin/ConfirmModal'
import { BulkApproveModal } from './admin/BulkApproveModal'
import { BulkRejectModal } from './admin/BulkRejectModal'
import { PendingVoucherTable } from './admin/PendingVoucherTable'
import { KonfirmasiVoucherModal, BulkVoucherModal } from './admin/VoucherModals'
import { VerifikasiControls, ManajemenControls, PendaftaranTrainerControls, RiwayatPelatihanControls } from './admin/TableControls'
import { VerifikasiTable } from './admin/VerifikasiTable'
import { ManajemenTable }  from './admin/ManajemenTable'
import { PendaftaranTrainerTable } from './admin/PendaftaranTrainerTable'
import { RiwayatPelatihanTable } from './admin/RiwayatPelatihanTable'
import { AddPendaftaranTrainerModal } from './admin/AddPendaftaranTrainerModal'
import { AddPelatihanModal } from './admin/AddPelatihanModal'
import { PerbaruiRiwayatModal } from './admin/PerbaruiRiwayatModal'
import { DaftarPesertaModal } from './admin/DaftarPesertaModal'
import { UbahRoleModal } from './admin/UbahRoleModal'
import { HapusAkunModal, PulihkanAkunModal } from './admin/AccountActionModals'
import { SuspendModal } from './admin/SuspendModal'
import { SetujuiAkunModal } from './admin/SetujuiAkunModal'
import { KirimVoucherModal } from './admin/KirimVoucherModal'


// ─── Pendaftaran Trainer (app-config hero_banner-home-v2) ───────────────────────
const PENDAFTARAN_KEY = 'hero_banner-home-v2'
const HEADER_BASE = 'Apa kamu mau daftar menjadi Trainer di pelatihan Gasing tanggal '
const DEFAULT_SHARED = {
  modalBody: 'Tim Gasing akan menghubungi members yang terpilih menjadi Trainer untuk pengimbasan, berikut informasi lainnya. Pastikan nomor HP kamu aktif ya!',
  modalTitle: 'Yuk, daftar jadi Trainer pengimbasan Gasing!',
  modalSuccess: 'Terima kasih sudah mendaftar sebagai Trainer!',
}

// Ambil id topik dari URL Discourse (mis .../t/slug/143 atau .../t/slug/143/5 → 143).
function parseThreadId(url) {
  if (!url) return null
  const s = String(url)
  const m = s.match(/\/t\/[^/]+\/(\d+)/)
  if (m) return m[1]
  const nums = s.match(/\d+/g)
  return nums ? nums[nums.length - 1] : null
}

// value.threads (object) → array baris untuk table.
function threadsToRows(value) {
  const threads = value?.threads || {}
  return Object.entries(threads).map(([id, t]) => ({
    id,
    threadId: id,
    nama: t.namaPelatihan || '-',
    url: t.url || '',
    periode: t.periode || '-',
    batasWaktu: t.batasWaktu || '',
    isActive: !!t.enabled,
    headerText: t.headerText || '',
    createdAt: t.createdAt || null,
    isNew: computeIsNew(t.createdAt),
  }))
}

// array baris → value untuk PUT (pertahankan shared_content).
function rowsToValue(rows, sharedContent) {
  const threads = {}
  rows.forEach(r => {
    threads[r.threadId] = {
      enabled: r.isActive,
      headerText: r.headerText,
      namaPelatihan: r.nama,
      periode: r.periode,
      batasWaktu: r.batasWaktu,
      url: r.url,
      createdAt: r.createdAt || null,
    }
  })
  return { threads, shared_content: sharedContent || DEFAULT_SHARED }
}

function useSort() {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }))
  }
  return { sortConfig, handleSort, resetSort: () => setSortConfig({ key: null, direction: 'asc' }) }
}

function applySortToList(list, sortConfig) {
  if (!sortConfig.key) return list
  return [...list].sort((a, b) => {
    let valA = a[sortConfig.key] || ''
    let valB = b[sortConfig.key] || ''
    if (sortConfig.key === 'lastUpdated') {
      valA = a.lastUpdatedMs || 0
      valB = b.lastUpdatedMs || 0
    } else if (sortConfig.key === 'birthdate' || sortConfig.key === 'endDate') {
      valA = valA ? new Date(valA).getTime() : 0
      valB = valB ? new Date(valB).getTime() : 0
    } else if (typeof valA === 'string') {
      valA = valA.toLowerCase(); valB = valB.toLowerCase()
    }
    if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1
    if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1
    return 0
  })
}

function buildCsvContent(tab, users) {
  const escapeCsv = (str) => {
    const s = String(str ?? '')
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s
  }
  const headers = tab === 'verifikasi'
    ? ['Nama Pengguna', 'Email', 'Status', 'Tgl.Lahir', 'Alumni Pelatihan', 'Tahun', 'Asal Sekolah', 'Role Pengguna']
    : ['Nama Pengguna', 'Email', 'Status Akun', 'Kode Voucher', 'Tgl.Lahir', 'Alumni Pelatihan', 'Tahun', 'Asal Sekolah', 'Role Pengguna', 'Berlangganan', 'Tgl Berakhir']
  const rows = tab === 'verifikasi'
    ? users.map(u => [u.name, u.email, u.status, u.birthdate, u.training, u.year, u.school, u.role || 'Pilih Role'])
    : users.map(u => [u.name, u.email, u.accountStatus || '-', u.voucher || '-', u.birthdate || '-', u.training || '-', u.year || '-', u.school || '-', u.role || 'Pilih Role', u.subscription || '-', u.plan || '-'])
  return [headers.join(','), ...rows.map(r => r.map(escapeCsv).join(','))].join('\n')
}

// Generate kode voucher (placeholder FE). TODO(be): kode asli mestinya dari backend
// saat approve (auto-generate). Ganti pemanggilan ini begitu endpoint tersedia.
function genVoucherCode() {
  return 'SUB' + Math.random().toString(36).slice(2, 8).toUpperCase()
}

export default function AdminDashboardPage({ user, onSignOut }) {
  const [activeTab, setActiveTab] = useState('verifikasi')
  const [users, setUsers]                   = useState([])
  const [managementUsers, setManagementUsers] = useState([])
  const [loadingUsers, setLoadingUsers]     = useState(false)
  const [apiError, setApiError]             = useState('')
  const [searchQuery, setSearchQuery]       = useState('')
  const [roleErrors, setRoleErrors]         = useState({})
  
  // States for Pendaftaran Trainer (sumber: app-config hero_banner-home-v2)
  const [pendaftaranData, setPendaftaranData] = useState([])
  const [sharedContent, setSharedContent] = useState(DEFAULT_SHARED)
  const [isAddPendaftaranModalOpen, setIsAddPendaftaranModalOpen] = useState(false)

  // States for Riwayat Pelatihan (di-load dari GET /training-sessions)
  const [riwayatPelatihanData, setRiwayatPelatihanData] = useState([])
  const [isAddPelatihanModalOpen, setIsAddPelatihanModalOpen] = useState(false)
  const [perbaruiSession, setPerbaruiSession] = useState(null)
  const [pesertaSession, setPesertaSession] = useState(null)

  const [discourseGroups, setDiscourseGroups] = useState([])
  // Ref agar mapToManajemen selalu baca daftar group terbaru tanpa memicu ulang loadUsers.
  const discourseGroupsRef = useRef([])
  const [trainingRegions, setTrainingRegions] = useState([])
  const [trainingSessions, setTrainingSessions] = useState([])
  const [rejectCandidate, setRejectCandidate] = useState(null)
  const [approveCandidate, setApproveCandidate] = useState(null)

  // ── Bulk verifikasi ────────────────────────────────────────────────────────
  const BULK_LIMIT = 10 // keputusan #2: hard limit 10 akun sekaligus
  const [selectedIds, setSelectedIds] = useState([])
  const [verifSubTab, setVerifSubTab] = useState('pending') // 'pending' | 'voucher'
  const [bulkSuspendOpen, setBulkSuspendOpen] = useState(false) // modal tangguhkan bulk (Manajemen)
  const [bulkModal, setBulkModal] = useState(null) // 'approve' | 'reject' | 'confirm' | null

  // Sub-tab Pending Voucher Setup (task b). Diisi FE dari hasil approve tab Pending
  // (opsi B — belum ada state backend). TODO(be): list dari endpoint saat tersedia.
  const [pendingVoucherUsers, setPendingVoucherUsers] = useState([])
  const [voucherCandidate, setVoucherCandidate] = useState(null) // konfirmasi voucher tunggal
  const [limitHit, setLimitHit] = useState(false)
  const limitTimeoutRef = useRef(null)
  const [toast, setToast]                   = useState(null)
  const [toastTimeoutId, setToastTimeoutId] = useState(null)
  const [activeFilter, setActiveFilter]     = useState('Disetujui') // tab Manajemen aktif
  const [selectedRoles, setSelectedRoles]   = useState([])
  const [selectedSubscriptions, setSelectedSubscriptions] = useState([])
  const [selectedPlans, setSelectedPlans] = useState([]) // filter Jenis Paket (Tahunan/Bulanan)
  const [actionModal, setActionModal]       = useState({ type: null, user: null })
  const executeActionRef = useRef(true)
  const { sortConfig, handleSort, resetSort } = useSort()

  const loadUsers = useCallback(async (tab, currentRegions = []) => {
    setLoadingUsers(true); setApiError('')
    try {
      let regions = currentRegions.length ? currentRegions : [];
      if (regions.length === 0) {
        try {
          const rRes = await regionsApi.list();
          regions = Array.isArray(rRes) ? rRes : (rRes.data || []);
          // update state tapi jangan trigger infinite loop
          setTrainingRegions(regions);
        } catch (e) {
          console.error("Failed to load regions", e)
        }
      }

      if (tab === 'verifikasi') {
        // Backend: list user yang butuh verifikasi = filter[verifiedStatus]=waiting.
        const res = await adminApi.getUsers({ 'filter[verifiedStatus]': 'waiting' })
        const rawList = Array.isArray(res) ? res : res.data || []
        // Defensif: kalau server tidak memfilter, saring lagi di klien.
        const pendingUsers = rawList.filter(u => u.verifiedStatus != 1 && u.verifiedStatus != -1 || u.verifiedStatus === 'waiting')
        setUsers(pendingUsers.map(u => mapToVerifikasi(u, regions)))
        setSelectedIds([]) // buang seleksi lama setelah reload
      } else {
        const res = await adminApi.getUsers({})
        const rawList = Array.isArray(res) ? res : res.data || []
        // Hanya akun ber-keputusan final (approved/rejected) + voucher beres yang
        // masuk Manajemen. WAITING/REVISE/pending-voucher disaring keluar.
        setManagementUsers(rawList.filter(isManajemenEligible).map(u => mapToManajemen(u, regions, discourseGroupsRef.current)))
      }
    } catch (err) {
      setApiError(err.message || 'Gagal memuat data')
    } finally {
      setLoadingUsers(false)
    }
  }, [])

  useEffect(() => { loadUsers(activeTab) }, [activeTab])

  const loadPendaftaran = useCallback(async () => {
    try {
      const res = await appConfigApi.get(PENDAFTARAN_KEY)
      const value = res?.value ?? res?.data?.value ?? res ?? {}
      setSharedContent(value.shared_content || DEFAULT_SHARED)
      setPendaftaranData(threadsToRows(value))
    } catch (e) {
      // Belum dikonfigurasi / gagal baca → mulai dari kosong.
      setPendaftaranData([])
      setSharedContent(DEFAULT_SHARED)
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'pendaftaran-trainer') loadPendaftaran()
  }, [activeTab, loadPendaftaran])

  // Cukup 1 request: list training-sessions. mapToRiwayat auto-pakai region yang
  // di-embed backend (s.region/s.regency) kalau ada.
  //
  // CATATAN 429: dulu di sini ada 2 loop per-session — resolve region (GET
  // /regions/:id per id) + ringkasan peserta (getSessionParticipants per id).
  // Untuk 100 session itu ~200 request → backend NestJS throttler (default
  // ~10 req/60s) langsung balikin ThrottlerException 429. Loop dibuang. Kolom
  // "Daerah" & "Peserta" harus di-embed backend di response list (lihat gap
  // manajemen-akun-data-gaps), bukan disintesis lewat N+1 fetch dari FE.
  const loadRiwayat = useCallback(async () => {
    try {
      const res = await trainingSessionsApi.list({ page: 1, limit: 100 })
      const list = Array.isArray(res) ? res : (res?.data || res?.items || [])
      setRiwayatPelatihanData(list.map(s => mapToRiwayat(s)))
    } catch (e) {
      setRiwayatPelatihanData([])
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'riwayat-pelatihan') loadRiwayat()
  }, [activeTab, loadRiwayat])

  // Muat semua dataset sekali di mount supaya titik biru navbar akurat walau
  // tab-nya belum pernah dibuka (dot = ada baris isNew / ada akun pending).
  useEffect(() => {
    loadUsers('manajemen')
    loadRiwayat()
    loadPendaftaran()
  }, [loadUsers, loadRiwayat, loadPendaftaran])

  useEffect(() => {
    discourseApi.getGroups()
      .then(res => setDiscourseGroups(Array.isArray(res) ? res : (res.data || [])))
      .catch(err => console.error("Failed to load discourse groups", err))
  }, [])

  // Sinkron ref + re-map kolom Role begitu daftar group siap (jika user datang
  // sebelum groups selesai di-load, nama role tetap terisi setelah ini).
  useEffect(() => {
    discourseGroupsRef.current = discourseGroups
    if (discourseGroups.length) loadUsers('manajemen', trainingRegions)
  }, [discourseGroups, loadUsers])

  // Opsi "Nama Pelatihan Terbaru" untuk modal approve (single & bulk). Load sekali.
  useEffect(() => {
    trainingSessionsApi.list({ page: 1, limit: 100 })
      .then(res => {
        const list = Array.isArray(res) ? res : (res?.data || res?.items || [])
        setTrainingSessions(list.map(s => ({ id: s.id, name: s.name || '-' })))
      })
      .catch(err => console.error("Failed to load training sessions", err))
  }, [])

  const handleTabChange = (tab) => {
    setActiveTab(tab); setSearchQuery(''); resetSort()
    setActiveFilter('Disetujui'); setSelectedRoles([]); setSelectedSubscriptions([]); setSelectedPlans([])
    setSelectedIds([]); setBulkModal(null)
  }

  // ── Seleksi baris verifikasi ────────────────────────────────────────────────
  const flashLimit = () => {
    setLimitHit(true)
    if (limitTimeoutRef.current) clearTimeout(limitTimeoutRef.current)
    limitTimeoutRef.current = setTimeout(() => setLimitHit(false), 2500)
  }

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id)
      if (prev.length >= BULK_LIMIT) { flashLimit(); return prev } // hard limit
      return [...prev, id]
    })
  }

  const clearSelection = () => setSelectedIds([])

  const persistPendaftaran = (rows) =>
    appConfigApi.set(PENDAFTARAN_KEY, rowsToValue(rows, sharedContent))

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
      setToast({ message: <>Pelatihan <span className="font-medium">{data.nama}</span> berhasil ditambahkan</> })
    } catch (err) {
      setPendaftaranData(prev)
      setApiError(err.message || 'Gagal menyimpan pendaftaran pelatihan.')
    }
  }

  // Aturan: hanya 1 pelatihan boleh aktif. Nyalakan 1 → matikan sisanya.
  const handleTogglePendaftaranStatus = async (id) => {
    const target = pendaftaranData.find(r => r.id === id)
    if (!target) return
    const turningOn = !target.isActive
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
      lastUpdated: (() => { const d = new Date(); let h = d.getHours(); const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12; return `${h}:${String(d.getMinutes()).padStart(2, '0')} ${ap}` })(),
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
      setToast({ message: <>Pelatihan <span className="font-medium">{data.name}</span> berhasil ditambahkan{pesertaWarn}</> })
      if (toastTimeoutId) clearTimeout(toastTimeoutId)
      const tid = setTimeout(() => setToast(null), 5000)
      setToastTimeoutId(tid)
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
      if (toastTimeoutId) clearTimeout(toastTimeoutId)
      const id = setTimeout(() => setToast(null), 5000)
      setToastTimeoutId(id)
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
      setToast({ message: <>Berhasil menyimpan riwayat <span className="font-medium">{data.name}</span>{pesertaWarn}</> })
      if (toastTimeoutId) clearTimeout(toastTimeoutId)
      const tid = setTimeout(() => setToast(null), 5000)
      setToastTimeoutId(tid)
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
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `${item.nama}-Export data.csv`)
    document.body.appendChild(link); link.click(); document.body.removeChild(link)
  }

  const scheduleAction = (apiCall, onError) => {
    executeActionRef.current = true
    if (toastTimeoutId) clearTimeout(toastTimeoutId)
    const id = setTimeout(async () => {
      if (executeActionRef.current) {
        try { await apiCall() }
        catch { onError() }
      }
      setToast(null)
    }, 5000)
    setToastTimeoutId(id)
  }

  // Toast dengan undo untuk aksi FE-only (tanpa API): perubahan state langsung,
  // `undo` mengembalikan state, auto-dismiss 5 detik.
  const showUndoToast = (message, undo) => {
    setToast({ message, undo })
    if (toastTimeoutId) clearTimeout(toastTimeoutId)
    const id = setTimeout(() => setToast(null), 5000)
    setToastTimeoutId(id)
  }

  // Role + Pelatihan kini dipilih di dalam ApproveModal (bukan lagi di baris tabel),
  // jadi klik centang langsung buka modal — validasi wajib ada di modal.
  const handleVerify = (id) => {
    setApproveCandidate(users.find(u => u.id === id))
  }

  // Approve (opsi B): TIDAK memanggil backend. Akun dipindah ke sub-tab Pending
  // Voucher + kode voucher di-generate FE. Konfirmasi final terjadi di tab voucher.
  // TODO(be): panggil verifyUser(approved) di sini bila backend ingin dicatat lebih awal.
  // Resolve nama role (discourse group) dari id — untuk kolom Role di tabel voucher.
  const roleNameFromId = (id) => {
    const g = discourseGroups.find(x => String(x.id ?? x.groupId) === String(id))
    return g?.name || g?.title || g?.groupName || ''
  }

  const handleConfirmApprove = ({ discourseGroupId, lastTrainingSessionId }) => {
    if (!approveCandidate) return
    const target = approveCandidate
    setApproveCandidate(null)
    const vUser = { ...target, discourseGroupId, lastTrainingSessionId, role: roleNameFromId(discourseGroupId) || target.role, voucherCode: genVoucherCode() }
    setUsers(prev => prev.filter(u => u.id !== target.id))
    setPendingVoucherUsers(prev => [vUser, ...prev])
    showUndoToast(
      <>Akun {target.name} <span className="text-green-500 font-medium">disetujui</span>, menunggu setup voucher</>,
      () => {
        setPendingVoucherUsers(prev => prev.filter(u => u.id !== target.id))
        setUsers(prev => [target, ...prev])
      }
    )
  }

  // Konfirmasi voucher tunggal → akun final + email ke user. FE remove baris.
  // TODO(be): panggil endpoint konfirmasi/kirim-email di sini (pending).
  const handleConfirmVoucher = () => {
    if (!voucherCandidate) return
    const target = voucherCandidate
    setVoucherCandidate(null)
    setPendingVoucherUsers(prev => prev.filter(u => u.id !== target.id))
    showUndoToast(
      <>Akun {target.name} telah <span className="text-green-500 font-medium">dikonfirmasi</span></>,
      () => setPendingVoucherUsers(prev => [target, ...prev])
    )
  }

  const handleBulkConfirmVoucher = (rows) => {
    const ids = rows.map(r => r.id)
    const removed = pendingVoucherUsers.filter(u => ids.includes(u.id))
    setPendingVoucherUsers(prev => prev.filter(u => !ids.includes(u.id)))
    setBulkModal(null); setSelectedIds([])
    // TODO(be): endpoint konfirmasi batch + email (pending).
    showUndoToast(
      <>{rows.length} akun telah <span className="text-green-500 font-medium">dikonfirmasi</span></>,
      () => setPendingVoucherUsers(prev => [...removed, ...prev])
    )
  }

  // ── Bulk approve / reject ───────────────────────────────────────────────────
  // Pola sama dengan single: optimistic remove + toast undo 5 detik + commit batch
  // (Promise.all). Undo membatalkan timer, jadi API tak pernah dipanggil.
  // Bulk approve (opsi B): pindah semua ke Pending Voucher + generate kode. FE-only.
  const handleBulkApprove = (rows) => {
    const ids = rows.map(r => r.id)
    const removed = users.filter(u => ids.includes(u.id))
    const vUsers = rows.map(r => {
      const base = removed.find(u => u.id === r.id) || {}
      return { ...base, discourseGroupId: r.discourseGroupId, lastTrainingSessionId: r.lastTrainingSessionId, role: roleNameFromId(r.discourseGroupId) || base.role, voucherCode: genVoucherCode() }
    })
    setUsers(prev => prev.filter(u => !ids.includes(u.id)))
    setPendingVoucherUsers(prev => [...vUsers, ...prev])
    setBulkModal(null); setSelectedIds([])
    showUndoToast(
      <>{rows.length} akun <span className="text-green-500 font-medium">disetujui</span>, menunggu setup voucher</>,
      () => {
        setPendingVoucherUsers(prev => prev.filter(u => !ids.includes(u.id)))
        setUsers(prev => [...removed, ...prev])
      }
    )
  }

  const handleBulkReject = (rows) => {
    const ids = rows.map(r => r.id)
    const removed = users.filter(u => ids.includes(u.id))
    setUsers(prev => prev.filter(u => !ids.includes(u.id)))
    setBulkModal(null); setSelectedIds([])
    setToast({ message: <>{rows.length} akun telah <span className="text-red-500 font-medium">ditolak</span></>, users: removed })

    scheduleAction(
      () => Promise.all(rows.map(r => r.status === 'rejected'
        ? adminApi.rejectUser(r.id, { rejectedReason: r.reason })
        : adminApi.reviseUser(r.id, { rejectedReason: r.reason, fieldsToRevise: r.invalidFields })
      )),
      () => { setUsers(prev => [...removed, ...prev]); setApiError('Gagal menolak sebagian akun. Silakan coba lagi.') }
    )
  }

  const handleConfirmReject = ({ status, invalidFields, reason }) => {
    if (!rejectCandidate) return
    const target = rejectCandidate
    setUsers(prev => prev.filter(u => u.id !== target.id))
    setRejectCandidate(null)
    setToast({ message: <>Akun {target.name} telah <span className="text-red-500 font-medium">ditolak</span></>, user: target })

    // status 'rejected' → tolak final (teks bebas). status 'revise' → minta perbaiki
    // data (backend generate token JWT + email link revise). Lihat ADR-0003.
    const apiCall = status === 'rejected'
      ? () => adminApi.rejectUser(target.id, { rejectedReason: reason })
      : () => adminApi.reviseUser(target.id, { rejectedReason: reason, fieldsToRevise: invalidFields })

    scheduleAction(apiCall, () => {
      setUsers(prev => [target, ...prev]); setApiError('Gagal menolak akun. Silakan coba lagi.')
    })
  }

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

  const handleConfirmUbahRole = (newRole) => {
    const target = actionModal.user
    const prevRole = target.role
    handleRoleChange(target.id, newRole)
    setActionModal({ type: null, user: null })
    setToast({
      message: <>Berhasil mengubah role akun <span className="font-bold">{target.name}</span></>,
      roleUndo: { id: target.id, prevRole },
    })
    // Commit ke backend (resolve nama role → discourseGroupId). Undo membatalkan timer.
    const grp = discourseGroups.find(g => (g.name || g) === newRole)
    const gid = grp ? (grp.id ?? grp) : null
    scheduleAction(
      () => (gid != null ? adminApi.updateDiscourseGroup(target.id, gid) : Promise.resolve()),
      () => { handleRoleChange(target.id, prevRole); setApiError('Gagal mengubah role.') }
    )
  }

  // Hapus akun (tab Disetujui/Ditolak) → pindah ke "Baru Dihapus" (deletion-request).
  const handleConfirmHapusAkun = () => {
    const target = actionModal.user
    if (!target) return
    setActionModal({ type: null, user: null })
    const prevStatus = target.accountStatus
    setManagementUsers(prev => prev.map(u => u.id === target.id ? { ...u, accountStatus: 'Baru Dihapus' } : u))
    setToast({ message: <>Akun {target.name} telah <span className="text-red-500 font-medium">dihapus</span></>, statusUndo: { id: target.id, prevStatus } })
    scheduleAction(
      () => adminApi.requestUserDeletion(target.id),
      () => { setManagementUsers(prev => prev.map(u => u.id === target.id ? { ...u, accountStatus: prevStatus } : u)); setApiError('Gagal menghapus akun.') }
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
    setToast({ message: <>Akun {target.name} telah <span className="text-green-500 font-medium">dipulihkan</span></>, statusUndo: { id: target.id, prevStatus } })
    const apiCall = prevStatus === 'Baru Dihapus'
      ? () => adminApi.cancelUserDeletion(target.id)
      : () => adminApi.unsuspendUser(target.id)
    scheduleAction(
      apiCall,
      () => { setManagementUsers(prev => prev.map(u => u.id === target.id ? { ...u, accountStatus: prevStatus } : u)); setApiError('Gagal memulihkan akun.') }
    )
  }

  // Setujui akun (tab Ditolak) → approve dgn role + pelatihan + voucher (dari modal).
  const handleConfirmSetujuiAkun = ({ discourseGroupId, lastTrainingSessionId, voucherCode }) => {
    const target = actionModal.user
    if (!target) return
    setActionModal({ type: null, user: null })
    const prevStatus = target.accountStatus
    const roleName = discourseGroups.find(g => String(g.id ?? g) === String(discourseGroupId))?.name
    setManagementUsers(prev => prev.map(u => u.id === target.id
      ? { ...u, accountStatus: 'Disetujui', role: roleName || u.role, voucher: voucherCode || u.voucher }
      : u))
    setToast({ message: <>Akun {target.name} telah <span className="text-green-500 font-medium">disetujui</span></>, statusUndo: { id: target.id, prevStatus } })
    scheduleAction(
      () => adminApi.verifyUser(target.id, { status: 'approved', discourseGroupId, lastTrainingSessionId }),
      () => { setManagementUsers(prev => prev.map(u => u.id === target.id ? { ...u, accountStatus: prevStatus } : u)); setApiError('Gagal menyetujui akun.') }
    )
  }

  // Tangguhkan akun (tab Disetujui) → suspend s/d suspendedUntil (modal preset/manual).
  // TODO(be): reason & emailMessage belum dikirim — endpoint /suspend hanya terima suspendedUntil.
  const handleConfirmTangguhkanAkun = ({ suspendedUntil }) => {
    const target = actionModal.user
    if (!target) return
    setActionModal({ type: null, user: null })
    const prevStatus = target.accountStatus
    setManagementUsers(prev => prev.map(u => u.id === target.id ? { ...u, accountStatus: 'Ditangguhkan' } : u))
    setToast({ message: <>Akun {target.name} telah <span className="text-orange-500 font-medium">ditangguhkan</span></>, statusUndo: { id: target.id, prevStatus } })
    scheduleAction(
      () => adminApi.suspendUser(target.id, suspendedUntil),
      () => { setManagementUsers(prev => prev.map(u => u.id === target.id ? { ...u, accountStatus: prevStatus } : u)); setApiError('Gagal menangguhkan akun.') }
    )
  }

  const handleConfirmKirimVoucher = (voucherCode) => {
    const target = actionModal.user
    setManagementUsers(managementUsers.map(u => u.id === target.id ? { ...u, voucher: voucherCode } : u))
    setActionModal({ type: null, user: null })
    setToast({ message: <>Voucher <span className="font-bold">{voucherCode}</span> berhasil dikirim ke {target.name}</> })
    // Call API here...
    // adminApi.grantPersonalVoucher(...)
  }

  const handleUndoToast = () => {
    // Aksi FE-only (approve→voucher, konfirmasi voucher) menyimpan closure undo.
    if (toast?.undo) {
      toast.undo()
      setToast(null)
      if (toastTimeoutId) clearTimeout(toastTimeoutId)
      return
    }
    // Undo ubah role: kembalikan role lama + batalkan commit.
    if (toast?.roleUndo) {
      executeActionRef.current = false
      handleRoleChange(toast.roleUndo.id, toast.roleUndo.prevRole)
      setToast(null)
      if (toastTimeoutId) clearTimeout(toastTimeoutId)
      return
    }
    // Undo hapus/pulihkan: kembalikan status akun + batalkan commit.
    if (toast?.statusUndo) {
      executeActionRef.current = false
      const { id, prevStatus } = toast.statusUndo
      setManagementUsers(prev => prev.map(u => u.id === id ? { ...u, accountStatus: prevStatus } : u))
      setToast(null)
      if (toastTimeoutId) clearTimeout(toastTimeoutId)
      return
    }
    // Undo bulk status: kembalikan status tiap akun + batalkan commit batch.
    if (toast?.bulkStatusUndo) {
      executeActionRef.current = false
      const prevList = toast.bulkStatusUndo
      setManagementUsers(prev => prev.map(u => { const pr = prevList.find(x => x.id === u.id); return pr ? { ...u, accountStatus: pr.status } : u }))
      setToast(null)
      if (toastTimeoutId) clearTimeout(toastTimeoutId)
      return
    }
    if (toast?.riwayat) {
      const { riwayat, riwayatIndex } = toast
      setRiwayatPelatihanData(prev => {
        const next = [...prev]
        next.splice(riwayatIndex, 0, riwayat)
        return next
      })
      setToast(null)
      if (toastTimeoutId) clearTimeout(toastTimeoutId)
      return
    }
    if (toast?.users) {
      // Undo batch: kembalikan semua baris, batalkan commit.
      executeActionRef.current = false
      setUsers(prev => [...toast.users, ...prev])
      setToast(null)
      if (toastTimeoutId) clearTimeout(toastTimeoutId)
      return
    }
    if (toast?.user) {
      executeActionRef.current = false
      setUsers(prev => [toast.user, ...prev])
      setToast(null)
      if (toastTimeoutId) clearTimeout(toastTimeoutId)
    }
  }

  // Titik biru navbar per menu.
  //  - verifikasi: selalu muncul kalau ada akun di tabel Pending / Pending Voucher.
  //  - menu lain : muncul hanya kalau ada baris "komponen baru" (isNew, < 3 hari).
  const navFlags = {
    'verifikasi':          users.length > 0 || pendingVoucherUsers.length > 0,
    'manajemen':           managementUsers.some(u => u.isNew),
    'riwayat-pelatihan':   riwayatPelatihanData.some(r => r.isNew),
    'pendaftaran-trainer': pendaftaranData.some(r => r.isNew),
  }

  const currentData = activeTab === 'manajemen'
    ? managementUsers
    : (verifSubTab === 'voucher' ? pendingVoucherUsers : users)

  const filteredUsers = currentData.filter(user => {
    if (activeTab === 'manajemen') {
      // Tiap tab = 1 tabel utama → hanya baris dgn status == tab aktif.
      if (user.accountStatus !== activeFilter) return false
      if (selectedRoles.length > 0 && !selectedRoles.includes(user.role)) return false
      if (selectedSubscriptions.length > 0 && !selectedSubscriptions.includes(user.subscription)) return false
      if (selectedPlans.length > 0 && !selectedPlans.includes(user.plan)) return false
    }
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return ['name', 'username', 'email', 'training', 'school', 'voucher', 'voucherCode'].some(k =>
      (user[k] || '').toLowerCase().includes(q)
    )
  })

  const sortedUsers = applySortToList(filteredUsers, sortConfig)

  // "Pilih semua" dibatasi BULK_LIMIT (keputusan #2): pilih maksimal 10 baris teratas.
  const selectableIds = sortedUsers.slice(0, BULK_LIMIT).map(u => u.id)
  const allSelected = selectableIds.length > 0 && selectableIds.every(id => selectedIds.includes(id))
  const toggleSelectAll = () => {
    if (allSelected) { setSelectedIds([]); return }
    if (sortedUsers.length > BULK_LIMIT) flashLimit()
    setSelectedIds(selectableIds)
  }
  const selectedUsers = currentData.filter(u => selectedIds.includes(u.id))

  // ── Bulk aksi Manajemen (mengikuti aksi baris per tab) ──────────────────────
  // Ubah status banyak akun sekaligus + toast undo 5s. commitEach(id, prevStatus)->Promise.
  const runBulkStatus = (rows, newStatus, message, commitEach) => {
    if (!rows.length) return
    const prev = rows.map(u => ({ id: u.id, status: u.accountStatus }))
    const ids = rows.map(r => r.id)
    setManagementUsers(p => p.map(u => ids.includes(u.id) ? { ...u, accountStatus: newStatus } : u))
    setSelectedIds([])
    setToast({ message, bulkStatusUndo: prev })
    scheduleAction(
      () => Promise.all(ids.map(id => commitEach(id, prev.find(x => x.id === id)?.status))),
      () => {
        setManagementUsers(p => p.map(u => { const pr = prev.find(x => x.id === u.id); return pr ? { ...u, accountStatus: pr.status } : u }))
        setApiError('Gagal memproses sebagian akun.')
      }
    )
  }

  const handleManajemenBulk = (key) => {
    const rows = selectedUsers
    if (!rows.length) return
    if (key === 'hapus') {
      runBulkStatus(rows, 'Baru Dihapus', <>{rows.length} akun telah <span className="text-red-500 font-medium">dihapus</span></>, (id) => adminApi.requestUserDeletion(id))
    } else if (key === 'pulihkan') {
      runBulkStatus(rows, 'Disetujui', <>{rows.length} akun telah <span className="text-green-500 font-medium">dipulihkan</span></>,
        (id, prevStatus) => prevStatus === 'Baru Dihapus' ? adminApi.cancelUserDeletion(id) : adminApi.unsuspendUser(id))
    } else if (key === 'setujui') {
      runBulkStatus(rows, 'Disetujui', <>{rows.length} akun telah <span className="text-green-500 font-medium">disetujui</span></>, (id) => adminApi.verifyUser(id, { status: 'approved' }))
    } else if (key === 'tangguhkan') {
      setBulkSuspendOpen(true)
    }
  }

  // Bulk tangguhkan pakai satu SuspendModal → suspendedUntil sama untuk semua terpilih.
  const handleBulkTangguhkan = ({ suspendedUntil }) => {
    const rows = selectedUsers
    setBulkSuspendOpen(false)
    runBulkStatus(rows, 'Ditangguhkan', <>{rows.length} akun telah <span className="text-orange-500 font-medium">ditangguhkan</span></>, (id) => adminApi.suspendUser(id, suspendedUntil))
  }

  const handleExport = () => {
    const csv = buildCsvContent(activeTab, sortedUsers)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', activeTab === 'verifikasi' ? 'verifikasi_akun-Export data.csv' : 'manajemen_akun-Export data.csv')
    document.body.appendChild(link); link.click(); document.body.removeChild(link)
  }

  return (
    <div className="h-screen bg-white flex font-sans overflow-hidden">
      <AdminSidebar activeTab={activeTab} onTabChange={handleTabChange} onSignOut={onSignOut} user={user} navFlags={navFlags} />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="px-10 py-8 border-b border-gray-100 shrink-0 bg-white">
          <h1 className="text-3xl font-bold text-[#0A1128]">
            {activeTab === 'verifikasi' && 'Verifikasi Akun'}
            {activeTab === 'manajemen' && 'Manajemen Akun'}
            {activeTab === 'pendaftaran-trainer' && 'Pendaftaran Pelatihan Trainer'}
            {activeTab === 'riwayat-pelatihan' && 'Riwayat Pelatihan'}
          </h1>
        </header>

        <div className="flex-1 overflow-auto p-10 bg-[#F7F8FC]">
          {apiError && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">
              {apiError}
            </div>
          )}

          {activeTab === 'verifikasi' && (
            <VerifikasiControls
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onExport={handleExport}
              subTab={verifSubTab}
              onSubTabChange={(t) => { setVerifSubTab(t); setSelectedIds([]) }}
              pendingCount={users.length}
              voucherCount={pendingVoucherUsers.length}
              selectedCount={selectedIds.length}
              bulkLimit={BULK_LIMIT}
              limitHit={limitHit}
              onBulkApprove={() => setBulkModal('approve')}
              onBulkReject={() => setBulkModal('reject')}
              onBulkConfirm={() => setBulkModal('confirm')}
              onClearSelection={clearSelection}
              onDismissLimit={() => setLimitHit(false)}
            />
          )}
          {activeTab === 'pendaftaran-trainer' && (
            <PendaftaranTrainerControls
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onAdd={() => setIsAddPendaftaranModalOpen(true)}
              selectedCount={selectedIds.length}
              bulkLimit={BULK_LIMIT}
              limitHit={limitHit}
              onClearSelection={clearSelection}
              onDismissLimit={() => setLimitHit(false)}
            />
          )}
          {activeTab === 'manajemen' && (
            <ManajemenControls
              activeFilter={activeFilter} onFilterChange={(f) => { setActiveFilter(f); setSelectedIds([]) }}
              selectedRoles={selectedRoles} onRolesChange={setSelectedRoles}
              selectedSubscriptions={selectedSubscriptions} onSubscriptionsChange={setSelectedSubscriptions}
              selectedPlans={selectedPlans} onPlansChange={setSelectedPlans}
              searchQuery={searchQuery} onSearchChange={setSearchQuery}
              onExport={handleExport}
              selectedCount={selectedIds.length}
              bulkLimit={BULK_LIMIT}
              limitHit={limitHit}
              onDismissLimit={() => setLimitHit(false)}
              onClearSelection={clearSelection}
              onBulkAction={handleManajemenBulk}
            />
          )}
          {activeTab === 'riwayat-pelatihan' && (
            <RiwayatPelatihanControls
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onAdd={() => setIsAddPelatihanModalOpen(true)}
              onExport={() => {
                const csv = [
                  'Nama Pelatihan,Daerah Pelatihan,Tgl. Mulai,Status,Nama Peserta,Last Updated',
                  ...riwayatPelatihanData.map(item => `"${item.nama}","${item.daerah}","${item.tglMulai}","${item.status}","${item.pesertaNama}","${item.lastUpdated}"`)
                ].join('\n')
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
                const url = URL.createObjectURL(blob)
                const link = document.createElement('a')
                link.setAttribute('href', url)
                link.setAttribute('download', 'riwayat_pelatihan-Export data.csv')
                document.body.appendChild(link); link.click(); document.body.removeChild(link)
              }}
              selectedCount={selectedIds.length}
              bulkLimit={BULK_LIMIT}
              limitHit={limitHit}
              onClearSelection={clearSelection}
              onDismissLimit={() => setLimitHit(false)}
            />
          )}

          <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm bg-white">
            <div className="overflow-x-auto">
              {activeTab === 'verifikasi' && verifSubTab === 'pending' && (
                <VerifikasiTable
                  users={sortedUsers}
                  sortConfig={sortConfig}
                  onSort={handleSort}
                  onApprove={handleVerify}
                  onReject={setRejectCandidate}
                  searchQuery={searchQuery}
                  selectedIds={selectedIds}
                  onToggleSelect={toggleSelect}
                  onToggleSelectAll={toggleSelectAll}
                  allSelected={allSelected}
                />
              )}
              {activeTab === 'verifikasi' && verifSubTab === 'voucher' && (
                <PendingVoucherTable
                  users={sortedUsers}
                  sortConfig={sortConfig}
                  onSort={handleSort}
                  onConfirm={setVoucherCandidate}
                  searchQuery={searchQuery}
                  selectedIds={selectedIds}
                  onToggleSelect={toggleSelect}
                  onToggleSelectAll={toggleSelectAll}
                  allSelected={allSelected}
                />
              )}
              {activeTab === 'manajemen' && (
                <ManajemenTable
                  users={sortedUsers}
                  sortConfig={sortConfig}
                  onSort={handleSort}
                  onRoleChange={handleRoleChange}
                  searchQuery={searchQuery}
                  activeFilter={activeFilter}
                  onActionClick={handleActionClick}
                  selectedIds={selectedIds}
                  onToggleSelect={toggleSelect}
                  onToggleSelectAll={toggleSelectAll}
                  allSelected={allSelected}
                />
              )}
              {activeTab === 'pendaftaran-trainer' && (
                <PendaftaranTrainerTable
                  data={pendaftaranData}
                  onToggleStatus={handleTogglePendaftaranStatus}
                  selectedIds={selectedIds}
                  onToggleSelect={toggleSelect}
                  onToggleSelectAll={() => toggleSelectAll(pendaftaranData.map(d => d.id))}
                  allSelected={selectedIds.length > 0 && pendaftaranData.every(d => selectedIds.includes(d.id))}
                  searchQuery={searchQuery}
                />
              )}
              {activeTab === 'riwayat-pelatihan' && (
                <RiwayatPelatihanTable
                  data={riwayatPelatihanData}
                  selectedIds={selectedIds}
                  onToggleSelect={toggleSelect}
                  searchQuery={searchQuery}
                  onEdit={setPerbaruiSession}
                  onDownload={handleDownloadRiwayat}
                  onViewPeserta={setPesertaSession}
                />
              )}
            </div>
          </div>
        </div>
      </main>

      <RejectModal  candidate={rejectCandidate}  onConfirm={handleConfirmReject} onCancel={() => setRejectCandidate(null)} />
      <ApproveModal
        candidate={approveCandidate}
        discourseGroups={discourseGroups}
        trainingSessions={trainingSessions}
        onConfirm={handleConfirmApprove}
        onCancel={() => setApproveCandidate(null)}
      />
      {bulkModal === 'approve' && (
        <BulkApproveModal
          candidates={selectedUsers}
          discourseGroups={discourseGroups}
          trainingSessions={trainingSessions}
          onConfirm={handleBulkApprove}
          onCancel={() => setBulkModal(null)}
        />
      )}
      {bulkModal === 'reject' && (
        <BulkRejectModal
          candidates={selectedUsers}
          onConfirm={handleBulkReject}
          onCancel={() => setBulkModal(null)}
        />
      )}
      {bulkModal === 'confirm' && (
        <BulkVoucherModal
          candidates={selectedUsers}
          onConfirm={handleBulkConfirmVoucher}
          onCancel={() => setBulkModal(null)}
        />
      )}
      <KonfirmasiVoucherModal
        candidate={voucherCandidate}
        onConfirm={handleConfirmVoucher}
        onCancel={() => setVoucherCandidate(null)}
      />
      <AddPendaftaranTrainerModal
        isOpen={isAddPendaftaranModalOpen}
        onClose={() => setIsAddPendaftaranModalOpen(false)}
        onSave={handleAddPendaftaran}
      />
      {actionModal.type === 'ubah-role' && (
        <UbahRoleModal 
          user={actionModal.user} 
          onConfirm={handleConfirmUbahRole} 
          onCancel={() => setActionModal({ type: null, user: null })} 
        />
      )}
      {actionModal.type === 'kirim-voucher' && (
        <KirimVoucherModal
          user={actionModal.user}
          onConfirm={handleConfirmKirimVoucher}
          onCancel={() => setActionModal({ type: null, user: null })}
        />
      )}
      {actionModal.type === 'hapus-akun' && (
        <HapusAkunModal
          user={actionModal.user}
          onConfirm={handleConfirmHapusAkun}
          onCancel={() => setActionModal({ type: null, user: null })}
        />
      )}
      {actionModal.type === 'pulihkan-akun' && (
        <PulihkanAkunModal
          user={actionModal.user}
          onConfirm={handleConfirmPulihkanAkun}
          onCancel={() => setActionModal({ type: null, user: null })}
        />
      )}
      {actionModal.type === 'setujui-akun' && (
        <SetujuiAkunModal
          user={actionModal.user}
          discourseGroups={discourseGroups}
          trainingSessions={trainingSessions}
          onConfirm={handleConfirmSetujuiAkun}
          onCancel={() => setActionModal({ type: null, user: null })}
        />
      )}
      {actionModal.type === 'tangguhkan-akun' && (
        <SuspendModal
          user={actionModal.user}
          onConfirm={handleConfirmTangguhkanAkun}
          onCancel={() => setActionModal({ type: null, user: null })}
        />
      )}
      {bulkSuspendOpen && (
        <SuspendModal
          user={{ name: `${selectedIds.length} akun terpilih` }}
          onConfirm={handleBulkTangguhkan}
          onCancel={() => setBulkSuspendOpen(false)}
        />
      )}
      <AddPelatihanModal
        isOpen={isAddPelatihanModalOpen}
        onClose={() => setIsAddPelatihanModalOpen(false)}
        onSave={handleAddPelatihan}
      />
      <PerbaruiRiwayatModal
        isOpen={!!perbaruiSession}
        session={perbaruiSession}
        onClose={() => setPerbaruiSession(null)}
        onSave={handleUpdatePelatihan}
        onDelete={handleDeleteRiwayat}
      />
      <DaftarPesertaModal
        isOpen={!!pesertaSession}
        session={pesertaSession}
        onClose={() => setPesertaSession(null)}
      />
      <AdminToast toast={toast} onUndo={handleUndoToast} />
    </div>
  )
}
