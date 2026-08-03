import { ExternalLink, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TableShell, FreezeBlurRight } from './TableShell'
import { RowActionMenu } from './ManajemenTable'

function isPastDeadline(v) {
  if (!v) return false
  const t = new Date(v).getTime()
  if (isNaN(t)) return false
  return t <= Date.now()
}

function fmtBatasWaktu(v) {
  if (!v) return '-'
  const d = new Date(v)
  if (isNaN(d)) return v
  return d.toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// Menu aksi untuk baris berstatus "Berakhir" (isActive=false).
const ENDED_MENU = [
  { type: 'hapus-pelatihan', label: 'Hapus Pelatihan', Icon: Trash2, danger: true },
]

export function PendaftaranTrainerTable({
  data,
  onToggleStatus,
  onDelete,
  searchQuery,
}) {
  const filteredData = data.filter(item => {
    if (!searchQuery) return true
    return (item.nama || '').toLowerCase().includes(searchQuery.toLowerCase())
  })

  return (
    <TableShell>
    <table className="w-full text-left text-sm whitespace-nowrap">
      <thead className="bg-[#0A1128] text-white sticky top-0 z-20">
        <tr>
          <th className="px-4 py-4 font-medium align-bottom">Nama Pelatihan</th>
          <th className="px-4 py-4 font-medium align-bottom">Link</th>
          <th className="px-4 py-4 font-medium align-bottom">Periode</th>
          <th className="px-4 py-4 font-medium align-bottom">Batas Waktu</th>
          <th className="px-4 py-4 font-medium align-bottom">Status</th>
          <th className="px-4 py-4 font-medium text-center sticky right-0 z-30 bg-[#0A1128] relative">Tampilkan di Home?<FreezeBlurRight /></th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {filteredData.length > 0 ? (
          filteredData.map(item => {
            const expired = isPastDeadline(item.batasWaktu);
            const ended = !item.isActive;
            return (
            <tr key={item.id} className="group transition-colors hover:bg-[#F9FAFB]">
              <td className="px-4 py-4">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#0A1128]">{item.nama}</span>
                  {item.isNew && (
                    <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0">New</span>
                  )}
                </div>
              </td>
              <td className="px-4 py-4">
                {item.url ? (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-medium text-link hover:text-link/80 underline"
                  >
                    {item.threadId}
                    <ExternalLink size={14} />
                  </a>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
              <td className="px-4 py-4 text-[#0A1128] font-medium">{item.periode}</td>
              <td className={cn('px-4 py-4 font-medium', expired ? 'text-gray-400' : 'text-[#0A1128]')}>
                {fmtBatasWaktu(item.batasWaktu)}
              </td>
              <td className="px-4 py-4">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
                    item.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                  )}
                >
                  {expired ? 'Berakhir' : 'Aktif'}
                </span>
              </td>
              <td className="px-4 py-4 sticky right-0 z-10 transition-colors relative bg-white group-hover:bg-[#F9FAFB]">
                <FreezeBlurRight />
                <div className="flex items-center justify-center">
                  {expired ? (
                    <RowActionMenu
                      items={ENDED_MENU}
                      user={item}
                      onAction={(type, row) => { if (type === 'hapus-pelatihan') onDelete && onDelete(row) }}
                    />
                  ) : (
                    <button
                      onClick={() => onToggleStatus(item.id)}
                      disabled={expired}
                      title={expired ? 'Batas waktu pendaftaran sudah lewat' : undefined}
                      className={cn(
                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                        item.isActive ? "bg-green-500" : "bg-gray-300",
                        expired && "cursor-not-allowed opacity-50"
                      )}
                    >
                      <span
                        className={cn(
                          "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                          item.isActive ? "translate-x-6" : "translate-x-1"
                        )}
                      />
                    </button>
                  )}
                </div>
              </td>
            </tr>
            )
          })
        ) : (
          <tr>
            <td colSpan="6" className="px-4 py-12 text-center text-gray-500">
              Tidak ada data pendaftaran pelatihan {searchQuery ? `untuk pencarian "${searchQuery}"` : ''}.
            </td>
          </tr>
        )}
      </tbody>
    </table>
    </TableShell>
  )
}
