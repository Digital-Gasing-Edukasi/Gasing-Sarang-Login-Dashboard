import { useRef, useState } from 'react'
import { Search, Download, Filter, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

function SearchInput({ value, onChange, placeholder = 'Cari user...' }) {
  return (
    <div className="relative">
      <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-full text-sm outline-none focus:border-[#D946EF] focus:ring-1 focus:ring-[#D946EF] transition-all"
      />
      {value && (
        <button onClick={() => onChange('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
          <X size={14} />
        </button>
      )}
    </div>
  )
}

export function VerifikasiControls({ totalCount, searchQuery, onSearchChange, onExport }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-[#0A1128]">Total:</span>
        <div className="flex items-center gap-2 bg-[#FDF4FF] px-3 py-1.5 rounded-full">
          <span className="w-6 h-6 rounded-full bg-[#D946EF] text-white text-xs flex items-center justify-center font-bold">
            {totalCount}
          </span>
          <span className="text-sm font-bold text-[#D946EF]">Review</span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="w-[300px]">
          <SearchInput value={searchQuery} onChange={onSearchChange} />
        </div>
        <button onClick={onExport} className="flex items-center gap-2 bg-[#0A1128] hover:bg-[#0A1128]/90 text-white px-5 py-2.5 rounded-full text-sm font-medium transition-colors">
          <Download size={16} /> Export List
        </button>
      </div>
    </div>
  )
}

const ALL_ROLES          = ['Trainer Utama', 'Trainer Aula', 'Trainer Kelas', 'Guru']
const ALL_SUBSCRIPTIONS  = ['Not Active', 'Active', 'Expired']
const STATUS_FILTERS = [
  { id: 'Semua', label: 'Semua' },
  { id: 'Approved', label: 'Disetujui' },
  { id: 'Pending', label: 'Ditangguhkan' },
  { id: 'Rejected', label: 'Ditolak' },
  { id: 'Deleted', label: 'Baru Dihapus' }
]

export function ManajemenControls({
  activeFilter, onFilterChange,
  selectedRoles, onRolesChange,
  selectedSubscriptions, onSubscriptionsChange,
  searchQuery, onSearchChange,
  onExport,
}) {
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const filterRef = useRef(null)

  const toggleItem = (list, item, setList) => {
    if (list.includes(item)) setList(list.filter(x => x !== item))
    else setList([...list, item])
  }

  return (
    <div className="flex items-center justify-between mb-6">
      {/* Status filter pills */}
      <div className="flex items-center gap-2 bg-gray-50/50 border border-gray-100 p-1.5 rounded-full">
        {STATUS_FILTERS.map(status => {
          const isSelected = activeFilter === status.id
          return (
            <button
              key={status.id}
              onClick={() => onFilterChange(status.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors',
                isSelected ? 'bg-[#0A1128] text-white shadow-sm' : 'text-gray-500 hover:text-[#0A1128] bg-transparent'
              )}
            >
              <div className={cn(
                'w-4 h-4 rounded flex items-center justify-center border',
                isSelected ? 'border-blue-600 bg-blue-600' : 'border-gray-300 bg-white'
              )}>
                {isSelected && <Check size={12} className="text-white" strokeWidth={3} />}
              </div>
              {status.label}
            </button>
          )
        })}
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3 relative" ref={filterRef}>
        {/* Filter button */}
        <button
          onClick={() => setIsFilterOpen(v => !v)}
          className={cn(
            'w-[42px] h-[42px] rounded-full border flex items-center justify-center transition-colors shrink-0 shadow-sm',
            isFilterOpen ? 'border-blue-600 text-blue-600 bg-blue-50' : 'border-gray-200 text-[#0A1128] hover:bg-gray-50'
          )}
        >
          <Filter size={18} strokeWidth={2} />
        </button>

        {/* Filter popover */}
        {isFilterOpen && (
          <div className="absolute top-14 left-0 w-[320px] bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 p-6 z-50">
            {/* Role */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div
                  className={cn('w-4 h-4 rounded border flex items-center justify-center cursor-pointer', selectedRoles.length === ALL_ROLES.length ? 'border-blue-600 bg-blue-600' : 'border-gray-300 bg-white')}
                  onClick={() => onRolesChange(selectedRoles.length === ALL_ROLES.length ? [] : [...ALL_ROLES])}
                >
                  {selectedRoles.length === ALL_ROLES.length && <Check size={12} className="text-white" strokeWidth={3} />}
                </div>
                <span className="font-bold text-[#0A1128]">Role</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {ALL_ROLES.map(role => (
                  <button
                    key={role}
                    onClick={() => toggleItem(selectedRoles, role, onRolesChange)}
                    className={cn(
                      'px-4 py-1.5 rounded-full text-sm transition-colors border',
                      selectedRoles.includes(role) ? 'border-blue-600 text-blue-600 bg-blue-50 font-medium' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    )}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            {/* Berlangganan */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div
                  className={cn('w-4 h-4 rounded border flex items-center justify-center cursor-pointer', selectedSubscriptions.length === ALL_SUBSCRIPTIONS.length ? 'border-blue-600 bg-blue-600' : 'border-gray-300 bg-white')}
                  onClick={() => onSubscriptionsChange(selectedSubscriptions.length === ALL_SUBSCRIPTIONS.length ? [] : [...ALL_SUBSCRIPTIONS])}
                >
                  {selectedSubscriptions.length === ALL_SUBSCRIPTIONS.length && <Check size={12} className="text-white" strokeWidth={3} />}
                </div>
                <span className="font-bold text-[#0A1128]">Berlangganan</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {ALL_SUBSCRIPTIONS.map(sub => (
                  <button
                    key={sub}
                    onClick={() => toggleItem(selectedSubscriptions, sub, onSubscriptionsChange)}
                    className={cn(
                      'px-4 py-1.5 rounded-full text-sm transition-colors border',
                      selectedSubscriptions.includes(sub) ? 'border-blue-600 text-blue-600 bg-blue-50 font-medium' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    )}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="w-[280px]">
          <SearchInput value={searchQuery} onChange={onSearchChange} />
        </div>
        <button onClick={onExport} className="flex items-center gap-2 bg-[#0A1128] hover:bg-[#0A1128]/90 text-white px-5 py-2.5 rounded-full text-sm font-medium transition-colors shadow-sm">
          <Download size={16} /> Export List
        </button>
      </div>
    </div>
  )
}

export function PendaftaranTrainerControls({ searchQuery, onSearchChange, onAdd }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onAdd}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-full text-sm font-medium transition-colors shadow-sm"
        >
          <span className="text-lg leading-none">+</span> Pendaftaran Pelatihan
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="w-[300px]">
          <SearchInput value={searchQuery} onChange={onSearchChange} />
        </div>
      </div>
    </div>
  )
}

export function RiwayatPelatihanControls({ searchQuery, onSearchChange, onAdd, onExport }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onAdd}
          className="flex items-center gap-2 border border-gray-200 text-[#0A1128] hover:bg-gray-50 px-5 py-2.5 rounded-full text-sm font-medium transition-colors shadow-sm"
        >
          <span className="text-lg leading-none">+</span> Tambah Pelatihan Baru
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="w-[300px]">
          <SearchInput value={searchQuery} onChange={onSearchChange} placeholder="Cari riwayat pelatihan..." />
        </div>
        {onExport && (
          <button onClick={onExport} className="flex items-center gap-2 bg-[#0A1128] hover:bg-[#0A1128]/90 text-white px-5 py-2.5 rounded-full text-sm font-medium transition-colors shadow-sm">
            <Download size={16} /> Export List
          </button>
        )}
      </div>
    </div>
  )
}
