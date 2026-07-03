import { useState } from 'react'
import { ArrowDownUp, Pencil, Download, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const STATUS_CLASSES = {
  Saved:      'bg-green-50 text-green-600',
  Processing: 'bg-amber-50 text-amber-600',
  Pending:    'bg-purple-50 text-purple-500',
  Error:      'bg-red-50 text-red-500',
}

const ID_MONTHS = {
  jan: 0, feb: 1, mar: 2, apr: 3, mei: 4, jun: 5,
  jul: 6, agu: 7, sep: 8, okt: 9, nov: 10, des: 11,
}

function parseIdDate(str) {
  if (!str) return 0
  const m = String(str).trim().split(/\s+/)
  if (m.length < 3) return 0
  const day = parseInt(m[0], 10)
  const month = ID_MONTHS[m[1].toLowerCase().slice(0, 3)] ?? 0
  const year = parseInt(m[2], 10)
  return new Date(year, month, day).getTime()
}

function SortableHeader({ label, sublabel, sortKey, sortConfig, onSort }) {
  return (
    <div className="select-none whitespace-nowrap">
      {sublabel && <div className="text-[11px] font-normal text-white/40 mb-0.5">{sublabel}</div>}
      <div
        className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors"
        onClick={() => onSort(sortKey)}
      >
        {label}
        <ArrowDownUp size={14} className={sortConfig.key === sortKey ? 'text-white' : 'text-white/50'} />
      </div>
    </div>
  )
}

export function RiwayatPelatihanTable({ data, searchQuery, onEdit, onDownload, onDelete, onViewPeserta }) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  const filteredData = data.filter(item => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      item.nama.toLowerCase().includes(q) ||
      (item.daerah || '').toLowerCase().includes(q) ||
      (item.pesertaNama || '').toLowerCase().includes(q) ||
      (item.pesertaEmail || '').toLowerCase().includes(q)
    )
  })

  const sortedData = sortConfig.key
    ? [...filteredData].sort((a, b) => {
        let valA = a[sortConfig.key] ?? ''
        let valB = b[sortConfig.key] ?? ''
        if (sortConfig.key === 'tglMulai' || sortConfig.key === 'lastUpdatedDate') {
          valA = parseIdDate(valA); valB = parseIdDate(valB)
        } else if (typeof valA === 'string') {
          valA = valA.toLowerCase(); valB = valB.toLowerCase()
        }
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
    : filteredData

  return (
    <table className="w-full text-left text-sm whitespace-nowrap">
      <thead className="bg-[#0A1128] text-white">
        <tr>
          <th className="px-4 py-4 font-medium align-bottom">
            <SortableHeader label="Nama Pelatihan" sortKey="nama" sortConfig={sortConfig} onSort={handleSort} />
          </th>
          <th className="px-4 py-4 font-medium align-bottom">
            <SortableHeader label="Daerah Pelatihan" sortKey="daerah" sortConfig={sortConfig} onSort={handleSort} />
          </th>
          <th className="px-4 py-4 font-medium align-bottom">
            <SortableHeader label="Tgl. Mulai" sortKey="tglMulai" sortConfig={sortConfig} onSort={handleSort} />
          </th>
          <th className="px-4 py-4 font-medium align-bottom">
            <SortableHeader label="Status" sortKey="status" sortConfig={sortConfig} onSort={handleSort} />
          </th>
          <th className="px-4 py-4 font-medium align-bottom">
            <SortableHeader label="Nama Peserta" sublabel="Peserta Guru Pelatihan" sortKey="pesertaNama" sortConfig={sortConfig} onSort={handleSort} />
          </th>
          <th className="px-4 py-4 font-medium align-bottom text-center">Action</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {sortedData.length > 0 ? (
          sortedData.map(item => (
            <tr key={item.id} className="group hover:bg-[#F9FAFB] transition-colors">
              <td className="px-4 py-4">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#0A1128] whitespace-normal max-w-[220px]">{item.nama}</span>
                  {item.isNew && (
                    <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0">New</span>
                  )}
                </div>
              </td>
              <td className="px-4 py-4 text-[#0A1128] font-medium">{item.daerah}</td>
              <td className="px-4 py-4 text-[#0A1128] font-medium">{item.tglMulai}</td>
              <td className="px-4 py-4">
                <span className={cn('inline-flex items-center px-3 py-1 rounded-full text-xs font-bold', STATUS_CLASSES[item.status] || 'bg-gray-100 text-gray-500')}>
                  {item.status}
                </span>
              </td>
              <td className="px-4 py-4">
                <div className="font-medium text-[#0A1128]">{item.pesertaNama || '-'}</div>
                {item.pesertaLainnya > 0 && (
                  <button
                    onClick={() => onViewPeserta && onViewPeserta(item)}
                    className="text-xs text-blue-500 hover:underline"
                  >
                    {item.pesertaLainnya}+ lainnya
                  </button>
                )}
              </td>
              <td className="px-4 py-4">
                <div className="flex items-center justify-center gap-1">
                  <button
                    onClick={() => onEdit && onEdit(item)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-[#0A1128] transition-colors"
                    title="Perbarui riwayat pelatihan"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => onDownload && onDownload(item)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-[#0A1128] transition-colors"
                    title="Unduh data"
                  >
                    <Download size={15} />
                  </button>
                  <button
                    onClick={() => onDelete && onDelete(item)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors"
                    title="Hapus riwayat pelatihan"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="6" className="px-4 py-12 text-center text-gray-500">
              Tidak ada data riwayat pelatihan {searchQuery ? `untuk pencarian "${searchQuery}"` : ''}.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  )
}
