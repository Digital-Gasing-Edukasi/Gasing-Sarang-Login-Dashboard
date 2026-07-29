import { SearchX } from 'lucide-react'
import { cn } from '@/lib/utils'

// STYLE A — scroll pakai scrollbar BROWSER (document), 2 sumbu:
//   vertical  → halaman manjang, scrollbar browser kanan
//   horizontal→ tabel lebih lebar dari viewport → scrollbar browser bawah (sticky di bawah page)
// Syarat: SEMUA ancestor dari <thead> harus overflow:visible (root/main/konten/card),
//   biar <thead> sticky-nya ngunci ke DOCUMENT (bukan ke container). Makanya card di sini
//   TIDAK pakai overflow-hidden. `stickTop` = tinggi (header + controls) yang dibekukan.
// Batas A: freeze kolom (sticky-left) TIDAK dipakai — di body-scroll dia ngunci ke tepi
//   viewport dan nyangkut di belakang sidebar. Jadi cuma baris header yang beku.

const STATUS_CLASSES = {
  Disetujui:     'bg-green-50 text-green-500',
  Ditangguhkan:  'bg-orange-50 text-orange-500',
  Ditolak:       'border border-pink-200 text-pink-500 bg-transparent',
  'Baru Dihapus':'border border-red-200 text-red-500 bg-transparent',
}
const SUBSCRIPTION_CLASSES = {
  Active:      'text-green-500',
  'Not Active':'text-gray-400',
  Expired:     'text-red-500',
}

const Td = ({ children, className }) => (
  <td className={cn('px-4 py-4 text-[#0A1128] font-medium', className)}>{children}</td>
)

export function DaftarUserTable({ users = [], searchQuery = '', stickTop = 0 }) {
  // thead beku di bawah zona header+controls. z tinggi biar nutup baris yg lewat.
  const thStyle = { top: stickTop }
  const th = 'px-4 py-4 font-medium sticky z-20 bg-[#0A1128]'

  return (
    <div className="w-max min-w-full rounded-2xl border border-gray-200 shadow-sm bg-white">
      <table className="w-full text-left text-sm whitespace-nowrap">
        <thead className="bg-[#0A1128] text-white">
          <tr>
            <th style={thStyle} className={th}>Nama Pengguna</th>
            <th style={thStyle} className={th}>Email</th>
            <th style={thStyle} className={th}>Status Member</th>
            <th style={thStyle} className={th}>Langganan</th>
            <th style={thStyle} className={th}>Jenis Paket</th>
            <th style={thStyle} className={th}>Tgl. Berakhir</th>
            <th style={thStyle} className={th}>Role</th>
            <th style={thStyle} className={th}>Riwayat Pelatihan</th>
            <th style={thStyle} className={th}>Tgl. Lahir</th>
            <th style={thStyle} className={th}>Lokasi</th>
            <th style={thStyle} className={th}>Asal Sekolah</th>
            <th style={thStyle} className={th}>Last Updated</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {users.length > 0 ? users.map(u => (
            <tr key={u.id} className="transition-colors hover:bg-[#F9FAFB]">
              <td className="px-4 py-4">
                <div className="font-bold text-[#0A1128] flex items-center">
                  {u.name}
                  {u.isNew && (
                    <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold ml-2">New</span>
                  )}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">{u.username}</div>
              </td>
              <Td>{u.email || '-'}</Td>
              <td className="px-4 py-4">
                <span className={cn('inline-flex items-center px-3 py-1 rounded-full text-xs font-bold', STATUS_CLASSES[u.accountStatus] || 'bg-gray-50 text-gray-500')}>
                  {u.accountStatus || '-'}
                </span>
              </td>
              <td className="px-4 py-4">
                <span className={cn('font-bold', SUBSCRIPTION_CLASSES[u.subscription] || 'text-gray-400')}>
                  {u.subscription === 'Active' ? 'Aktif' : u.subscription === 'Expired' ? 'Expired' : 'Non-Aktif'}
                </span>
              </td>
              <Td>{u.plan || '-'}</Td>
              <Td>{u.endDate || '-'}</Td>
              <Td>{u.role || '-'}</Td>
              <Td>{u.riwayatCount || '-'}</Td>
              <Td>{u.birthdate || '-'}</Td>
              <Td className="whitespace-normal break-words max-w-[200px] leading-snug align-top">{u.lokasi || '-'}</Td>
              <Td className="whitespace-normal break-words max-w-[200px] leading-snug align-top">{u.school || '-'}</Td>
              <Td>{u.lastUpdated || '-'}</Td>
            </tr>
          )) : (
            <tr>
              <td colSpan={12} className="px-4 py-16">
                {searchQuery ? (
                  <div className="flex flex-col items-center text-center gap-2">
                    <div className="w-14 h-14 rounded-full border border-gray-200 flex items-center justify-center text-gray-300 mb-1">
                      <SearchX size={26} />
                    </div>
                    <p className="font-bold text-[#0A1128]">Tidak bisa menemukan "{searchQuery}"</p>
                    <p className="text-sm text-gray-400">Coba cari lagi menggunakan ejaan atau kata kunci berbeda.</p>
                  </div>
                ) : (
                  <p className="text-center text-gray-500">Belum ada data user.</p>
                )}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
