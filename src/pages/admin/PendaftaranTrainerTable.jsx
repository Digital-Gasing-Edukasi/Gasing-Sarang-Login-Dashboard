import { cn } from '@/lib/utils'

export function PendaftaranTrainerTable({ data, onToggleStatus, searchQuery }) {
  const filteredData = data.filter(item => {
    if (!searchQuery) return true
    return item.nama.toLowerCase().includes(searchQuery.toLowerCase())
  })

  return (
    <table className="w-full text-left text-sm whitespace-nowrap">
      <thead className="bg-[#0A1128] text-white">
        <tr>
          <th className="px-4 py-4 font-medium rounded-tl-lg">Nama Pendaftaran / Pelatihan</th>
          <th className="px-4 py-4 font-medium">Kuota</th>
          <th className="px-4 py-4 font-medium">Periode</th>
          <th className="px-4 py-4 font-medium">Batas Waktu Pendaftaran</th>
          <th className="px-4 py-4 font-medium text-center rounded-tr-lg">Status</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {filteredData.length > 0 ? (
          filteredData.map(item => (
            <tr key={item.id} className="group hover:bg-[#F9FAFB] transition-colors">
              <td className="px-4 py-4">
                <div className="font-bold text-[#0A1128]">{item.nama}</div>
              </td>
              <td className="px-4 py-4 text-[#0A1128] font-medium">{item.kuota}</td>
              <td className="px-4 py-4 text-[#0A1128] font-medium">{item.periode}</td>
              <td className="px-4 py-4 text-[#0A1128] font-medium">{item.batasDaftar}</td>
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
            <td colSpan="5" className="px-4 py-12 text-center text-gray-500">
              Tidak ada data pendaftaran pelatihan {searchQuery ? `untuk pencarian "${searchQuery}"` : ''}.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  )
}
