// Dataset user: tabel Verifikasi (waiting) + Manajemen (eligible) + lookup by id.
// Dipindah dari AdminDashboardPage.jsx. Guard 429 dipertahankan verbatim:
//
// - mapToManajemen baca discourseGroupsRef (ref, bukan state) supaya loadUsers
//   bisa useCallback([]) stabil — kalau ikut state, identity-nya berubah tiap
//   groups/regions ke-load lalu memicu ulang mount-effect → semua loader nembak
//   2x → 429.
// - trainingRegionsRef dipakai loadPembayaran tanpa jadi dep, alasan sama.
import { useState, useRef, useEffect, useCallback } from 'react'
import { adminApi, regionsApi } from '@/lib/api'
import { mapToVerifikasi, mapToManajemen, isManajemenEligible } from '../mappers'

export function useAdminUsers({ setApiError }) {
  const [users, setUsers]                   = useState([])
  const [managementUsers, setManagementUsers] = useState([])
  // Lookup user hasil GET /admin/users (mapToManajemen), keyed by id. Diisi sekali
  // saat load Manajemen, dipakai ulang tabel lain (mis. Verifikasi Pembayaran) buat
  // isi kolom yang tidak di-embed response payment (role, alumni, lokasi, dst).
  const [usersById, setUsersById] = useState({})
  const [loadingUsers, setLoadingUsers]     = useState(false)

  const [discourseGroups, setDiscourseGroups] = useState([])
  // Ref agar mapToManajemen selalu baca daftar group terbaru tanpa memicu ulang loadUsers.
  const discourseGroupsRef = useRef([])
  const [trainingRegions, setTrainingRegions] = useState([])
  // Ref regions terbaru → loadPembayaran bisa useCallback([]) (stabil) tanpa
  // ikut trainingRegions. Kalau ikut, identity-nya berubah saat loadUsers nge-set
  // regions dan memicu ulang mount-effect → semua loader nembak 2x → 429.
  const trainingRegionsRef = useRef([])

  // bridges (diisi page): onVoucher(rows) teruskan hasil sub-tab voucher ke
  // useVerifikasi; onReset() buang seleksi bulk lama setelah reload verifikasi.
  const loadUsers = useCallback(async (tab, currentRegions = [], bridges = {}) => {
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
        // Dua sub-tab = dua request: WAITING(0) → tabel Pending, PENDING_VOUCHER(3) →
        // tabel Pending Voucher Setup. Tidak bisa satu request tanpa filter karena
        // /admin/users dipaginasi (limit default 20).
        const res = await adminApi.getUsers({ 'filter[verifiedStatus]': 'waiting' })
        const rawList = Array.isArray(res) ? res : res.data || []
        // Defensif: kalau server tidak memfilter, saring lagi di klien.
        const isWaiting = (u) => u.verifiedStatus === 0 || u.verifiedStatus === 'waiting' ||
          (u.verifiedStatus != 1 && u.verifiedStatus != -1 && u.verifiedStatus != 3)
        setUsers(rawList.filter(isWaiting).map(u => mapToVerifikasi(u, regions, discourseGroupsRef.current)))

        // Sub-tab Pending Voucher Setup. Dibungkus try/catch supaya kegagalan di sini
        // (mis. nilai filter tidak dikenal server) tidak ikut mengosongkan tabel Pending.
        try {
          const vRes = await adminApi.getUsers({ 'filter[verifiedStatus]': 'pending_voucher' })
          const vRaw = Array.isArray(vRes) ? vRes : vRes.data || []
          const isPendingVoucher = (u) => u.verifiedStatus === 3 || u.verifiedStatus === 'pending_voucher'
          bridges.onVoucher?.(vRaw.filter(isPendingVoucher).map(u => mapToVerifikasi(u, regions, discourseGroupsRef.current)))
        } catch (e) {
          console.error('Failed to load pending voucher users', e)
        }
        bridges.onReset?.() // buang seleksi lama setelah reload
      } else {
        const res = await adminApi.getUsers({})
        const rawList = Array.isArray(res) ? res : res.data || []
        // Map sekali; simpan pasangan {raw, row} supaya bisa dipakai dua-duanya.
        const mapped = rawList.map(u => ({ raw: u, row: mapToManajemen(u, regions, discourseGroupsRef.current) }))
        // Lookup by id dari SEMUA user (belum disaring eligible) → tabel lain bisa
        // join by userId walau user-nya bukan status Manajemen.
        setUsersById(Object.fromEntries(mapped.map(({ row }) => [row.id, row])))
        // Masuk Manajemen: approved, rejected, DAN revise (revise ikut tab Ditolak —
        // lihat isManajemenEligible). WAITING/pending-voucher tetap disaring keluar.
        setManagementUsers(mapped.filter(({ raw }) => isManajemenEligible(raw)).map(({ row }) => row))
      }
    } catch (err) {
      setApiError(err.message || 'Gagal memuat data')
    } finally {
      setLoadingUsers(false)
    }
  }, [setApiError])

  // NOTE: trigger loadUsers(activeTab) SENGAJA di page (bukan di sini) — cabang
  // verifikasi butuh bridges milik useVerifikasi yang baru ada setelah semua hook
  // dipanggil. Lihat useEffect [activeTab] di AdminDashboardPage.

  // Jaga ref regions selalu terbaru (dipakai loadPembayaran tanpa jadi dep).
  useEffect(() => { trainingRegionsRef.current = trainingRegions }, [trainingRegions])

  useEffect(() => {
    discourseGroupsRef.current = discourseGroups
    if (discourseGroups.length) loadUsers('manajemen', trainingRegions)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [discourseGroups, loadUsers])

  return {
    users, setUsers,
    managementUsers, setManagementUsers,
    usersById, setUsersById,
    loadingUsers,
    discourseGroups, setDiscourseGroups, discourseGroupsRef,
    trainingRegions, setTrainingRegions, trainingRegionsRef,
    loadUsers,
  }
}
