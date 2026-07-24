import { useState, useMemo, useEffect } from 'react'
import { X, ArrowDownUp, Loader2 } from 'lucide-react'
import { adminApi } from '@/lib/api'
import { mapToUserRiwayat } from './mappers'

// Ambil array dari berbagai bentuk envelope: [...] | {data:[...]} | {data:{data:[...]}} | {items:[...]}.
const asList = (d) => {
  if (Array.isArray(d)) return d
  if (Array.isArray(d?.data)) return d.data
  if (Array.isArray(d?.data?.data)) return d.data.data
  if (Array.isArray(d?.items)) return d.items
  return []
}

// Header kolom yang bisa di-sort. Toggle asc/desc per klik.
function SortableHeader({ label, sortKey, sortConfig, onSort }) {
  const active = sortConfig?.key === sortKey
  return (
    <div
      className="flex items-center gap-2 cursor-pointer select-none whitespace-nowrap"
      onClick={() => onSort(sortKey)}
    >
      {label}
      <ArrowDownUp size={14} className={active ? 'text-white' : 'text-white/50'} />
    </div>
  )
}

// Modal detail "Riwayat Pelatihan" — dibuka dari kolom Riwayat Pelatihan (Lihat Detail)
// di Manajemen Akun. Menampilkan tabel histori: Nama Pelatihan, Daerah, Tgl. Mulai, Email.
// Baris ke-8 sengaja terpotong + di-blur (fade bawah) sebagai indikasi "masih ada lagi".
//
// Sumber data: GET /admin/users/training-history/{userId} (fetch saat modal dibuka).
// Sebelum fetch selesai / kalau gagal → fallback ke user.riwayatList (embed di list).
export function RiwayatDetailModal({ user, onClose }) {
  const [sortConfig, setSortConfig] = useState(null)
  const [fetched, setFetched] = useState(null) // rows dari endpoint (null = belum)
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)

  // Fetch riwayat tiap kali user berganti. Reset state dulu biar tidak nampilin
  // data user sebelumnya.
  useEffect(() => {
    if (!user) return
    let alive = true
    setFetched(null); setSortConfig(null); setLoading(true)
    setTotal(user.riwayatCount || (user.riwayatList?.length ?? 0))
    adminApi.listUserTrainingHistories(user.id)
      .then((res) => {
        if (!alive) return
        const list = asList(res).map((h, i) => mapToUserRiwayat(h, i, user.email))
        setFetched(list)
        // `||` (bukan `??`) supaya total 0 / list kosong jatuh ke count embed.
        setTotal(res?.meta?.total || list.length || user.riwayatCount || (user.riwayatList?.length ?? 0))
      })
      .catch(() => { if (alive) setFetched(null) }) // fallback ke embed
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [user])

  // Fetch KOSONG jangan nimpa data embed: cuma pakai `fetched` kalau ada isinya.
  // (array kosong dari endpoint yang belum keisi ≠ alasan buat hapus tampilan.)
  const rows = (fetched && fetched.length) ? fetched : (user?.riwayatList ?? [])

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev?.key === key) return { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
      return { key, dir: 'asc' }
    })
  }

  const sorted = useMemo(() => {
    if (!sortConfig) return rows
    const { key, dir } = sortConfig
    const mult = dir === 'asc' ? 1 : -1
    return [...rows].sort((a, b) => {
      if (key === 'tglMulai') return (a.startMs - b.startMs) * mult
      return String(a[key] || '').localeCompare(String(b[key] || ''), 'id') * mult
    })
  }, [rows, sortConfig])

  if (!user) return null

  // Blur muncul hanya saat baris > 7 (baris ke-8 = yang terpotong).
  const showFade = sorted.length > 7

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden">
        <div className="px-8 pt-7 pb-5 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[#0A1128]">Riwayat Pelatihan</h2>
            <p className="text-sm font-semibold text-gray-400 mt-1">
              {user.name} <span className="mx-1.5">•</span> Total {total} Pelatihan
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors mt-1">
            <X size={22} />
          </button>
        </div>

        <div className="px-8 pb-8">
          <div className="rounded-xl border border-gray-100 overflow-hidden relative">
            {/* Cap tinggi ~7.5 baris → baris ke-8 kepotong. overflow-hidden = tidak scroll. */}
            <div className="overflow-hidden" style={{ maxHeight: 340 }}>
              <table className="w-full text-left text-sm">
                <thead className="bg-[#0A1128] text-white">
                  <tr>
                    <th className="px-6 py-4 font-semibold">
                      <SortableHeader label="Nama Pelatihan" sortKey="nama" sortConfig={sortConfig} onSort={handleSort} />
                    </th>
                    <th className="px-6 py-4 font-semibold">
                      <SortableHeader label="Daerah Pelatihan" sortKey="daerah" sortConfig={sortConfig} onSort={handleSort} />
                    </th>
                    <th className="px-6 py-4 font-semibold">
                      <SortableHeader label="Tgl. Mulai" sortKey="tglMulai" sortConfig={sortConfig} onSort={handleSort} />
                    </th>
                    <th className="px-6 py-4 font-semibold">Email</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading && sorted.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center text-gray-400">
                        <Loader2 size={22} className="animate-spin mx-auto text-blue-500" />
                        <span className="block mt-2 text-sm">Memuat riwayat…</span>
                      </td>
                    </tr>
                  ) : sorted.length > 0 ? sorted.map((r) => (
                    <tr key={r.id}>
                      <td className="px-6 py-4 align-top">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-[#0A1128] whitespace-normal">{r.nama}</span>
                          {r.isNew && (
                            <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0">New</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 align-top text-[#0A1128] whitespace-normal max-w-[200px] leading-snug">{r.daerah}</td>
                      <td className="px-6 py-4 align-top text-[#0A1128] whitespace-nowrap">{r.tglMulai}</td>
                      <td className="px-6 py-4 align-top text-[#0A1128] whitespace-nowrap">{r.email}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center text-gray-400">
                        Belum ada riwayat pelatihan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Fade + blur di bawah: kesan baris ke-8 terpotong & masih ada lanjutannya. */}
            {showFade && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white via-white/85 to-transparent backdrop-blur-[1px]" />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
