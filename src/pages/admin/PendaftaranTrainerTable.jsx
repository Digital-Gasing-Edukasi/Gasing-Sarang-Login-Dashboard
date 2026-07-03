import { ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

function fmtBatasWaktu(v) {
  if (!v) return '-'
  const d = new Date(v)
  if (isNaN(d)) return v
  return d.toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function PendaftaranTrainerTable({ data, onToggleStatus, searchQuery }) {
  const filteredData = data.filter(item => {
    if (!searchQuery) return true
    return (item.nama || '').toLowerCase().includes(searchQuery.toLowerCase())
  })

  return (
    <table className="w-full text-left text-sm whitespace-nowrap">
      <thead className="bg-[#0A1128] text-white">
        <tr>
          <th className="px-4 py-4 font-medium rounded-tl-lg">Nama Pelatihan</th>
          <th className="px-4 py-4 font-medium">Link</th>
          <th className="px-4 py-4 font-medium">Periode</th>
          <th className="px-4 py-4 font-medium">Batas Waktu</th>
          <th className="px-4 py-4 font-medium">Status</th>
          <th className="px-4 py-4 font-medium text-center rounded-tr-lg">Tampilkan di Home?</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {filteredData.length > 0 ? (
          filteredData.map(item => (
            <tr key={item.id} className="group hover:bg-[#F9FAFB] transition-colors">
              <td className="px-4 py-4">
                <div className="font-bold text-[#0A1128]">{item.nama}</div>
              </td>
              <td className="px-4 py-4">
                {item.url ? (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-medium text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    {item.threadId}
                    <ExternalLink size={14} />
                  </a>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
              <td className="px-4 py-4 text-[#0A1128] font-medium">{item.periode}</td>
              <td className="px-4 py-4 text-[#0A1128] font-medium">{fmtBatasWaktu(item.batasWaktu)}</td>
              <td className="px-4 py-4">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
                    item.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                  )}
                >
                  {item.isActive ? 'Aktif' : 'Berakhir'}
                </span>
              </td>
              <td className="px-4 py-4">
                <div className="flex items-center justify-center">
                  <button
                    onClick={() => onToggleStatus(item.id)}
                    className={cn(
                      "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                      item.isActive ? "bg-green-500" : "bg-gray-300"
                    )}
                  >
                    <span
                      className={cn(
                        "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                        item.isActive ? "translate-x-6" : "translate-x-1"
                      )}
                    />
                  </button>
                </div>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="6" className="px-4 py-12 text-center text-gray-500">
              Tidak ada data pendaftaran pelatihan {searchQuery ? `untuk pencarian "${searchQuery}"` : ''}.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  )
}
