import { useRef, useState } from 'react'
import { Search, Download, Filter, Check, X, Link2, Users, MonitorPlay, GraduationCap } from 'lucide-react'
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

// Switcher sub-menu Verifikasi Akun: Pending (akun) & Pending Voucher Setup.
function SubTabSwitcher({ subTab, onSubTabChange, pendingCount = 0, voucherCount = 0 }) {
  const fmt = (n) => (n > 99 ? '99+' : String(n))
  const tabs = [
    { id: 'pending', label: 'Pending', count: pendingCount },
    { id: 'voucher', label: 'Pending Voucher Setup', count: voucherCount },
  ]
  return (
    <div className="flex items-center gap-1 bg-gray-50/70 border border-gray-100 p-1.5 rounded-full">
      {tabs.map(t => {
        const active = subTab === t.id
        return (
          <button
            key={t.id}
            onClick={() => onSubTabChange(t.id)}
            className={cn(
              'flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-colors',
              active ? 'bg-[#0A1128] text-white shadow-sm' : 'text-gray-500 hover:text-[#0A1128]'
            )}
          >
            {t.label}
            <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-full bg-blue-600 text-white text-xs font-bold">
              {fmt(t.count)}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export function VerifikasiControls({
  searchQuery, onSearchChange, onExport,
  subTab = 'pending', onSubTabChange, pendingCount = 0, voucherCount = 0,
  selectedCount = 0, bulkLimit = 10, limitHit = false,
  onBulkApprove, onBulkReject, onBulkConfirm, onClearSelection, onDismissLimit,
}) {
  // Mode bulk: aktif saat ada baris terpilih. Ganti toolbar biasa dengan action-bar.
  if (selectedCount > 0) {
    return (
      <div className="relative mb-6">
        {/* Tooltip limit — dark, dismissible (klik X). Muncul saat coba lewati batas. */}
        {limitHit && (
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4 bg-[#0A1128] text-white text-base font-medium px-6 py-4 rounded-2xl shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
            <span>Maksimal {bulkLimit} akun dapat dipilih sekaligus.</span>
            <button onClick={onDismissLimit} className="text-white/70 hover:text-white transition-colors shrink-0">
              <X size={18} />
            </button>
          </div>
        )}

        <div className="flex items-center gap-4 bg-gray-50 border border-gray-100 rounded-full px-3 py-2.5">
          <button
            onClick={onClearSelection}
            className="w-11 h-11 rounded-full border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 flex items-center justify-center shrink-0 transition-colors"
          >
            <X size={18} />
          </button>

          <span className="inline-flex items-center px-3 py-1 rounded-full bg-orange-100 text-orange-500 text-sm font-bold">
            {selectedCount}/{bulkLimit}
          </span>
          <span className="text-sm font-medium text-[#0A1128]">Akun dipilih</span>

          <div className="h-7 w-px bg-gray-200 mx-1" />

          {subTab === 'voucher' ? (
            <button
              onClick={onBulkConfirm}
              className="px-7 py-2.5 rounded-full border-2 border-green-400 bg-green-50/50 text-green-600 text-sm font-semibold hover:bg-green-50 transition-colors"
            >
              Konfirmasi
            </button>
          ) : (
            <>
              <button
                onClick={onBulkApprove}
                className="px-7 py-2.5 rounded-full border-2 border-green-400 bg-green-50/50 text-green-600 text-sm font-semibold hover:bg-green-50 transition-colors"
              >
                Setujui
              </button>
              <button
                onClick={onBulkReject}
                className="px-7 py-2.5 rounded-full border-2 border-red-300 bg-red-50/50 text-red-500 text-sm font-semibold hover:bg-red-50 transition-colors"
              >
                Tolak
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between mb-6">
      <SubTabSwitcher
        subTab={subTab}
        onSubTabChange={onSubTabChange}
        pendingCount={pendingCount}
        voucherCount={voucherCount}
      />
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

// Opsi filter (value = nilai yang dicocokkan ke field row; label = tampilan).
const LANGGANAN_OPTIONS = [
  { value: 'Active',     label: 'Aktif' },
  { value: 'Not Active', label: 'Non-Aktif' },
]
const PLAN_OPTIONS = [
  { value: 'Tahunan', label: 'Tahunan' },
  { value: 'Bulanan', label: 'Bulanan' },
]
const ROLE_OPTIONS = [
  { value: 'Trainer Utama', label: 'Trainer Utama', Icon: Link2 },
  { value: 'Trainer Aula',  label: 'Trainer Aula',  Icon: Users },
  { value: 'Trainer Kelas', label: 'Trainer Kelas', Icon: MonitorPlay },
  { value: 'Guru',          label: 'Guru',          Icon: GraduationCap },
]

// 4 tab utama Manajemen Akun (struktur tabel besar). id = status kanonik
// (lihat parseManajemenStatus di mappers.js). Tanpa "Semua" — tiap tab 1 tabel.
const MANAJEMEN_TABS = [
  { id: 'Disetujui',    label: 'Disetujui' },
  { id: 'Ditolak',      label: 'Ditolak' },
  { id: 'Ditangguhkan', label: 'Ditangguhkan' },
  { id: 'Baru Dihapus', label: 'Baru Dihapus' },
]

function CheckRow({ checked, onToggle, Icon, iconColor, label }) {
  return (
    <label className="flex items-center gap-3 py-2 cursor-pointer select-none">
      <span className={cn(
        'w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0',
        checked ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'
      )}>
        {checked && <Check size={13} className="text-white" strokeWidth={3} />}
      </span>
      <input type="checkbox" checked={checked} onChange={onToggle} className="sr-only" />
      {Icon && <Icon size={16} className={iconColor || 'text-gray-400'} />}
      <span className="text-sm text-[#0A1128]">{label}</span>
    </label>
  )
}

function FilterSection({ title, children }) {
  return (
    <div className="mb-6">
      <h4 className="font-bold text-[#0A1128] mb-1">{title}</h4>
      {children}
    </div>
  )
}

// Drawer filter kanan (Langganan / Jenis Paket / Role). Terapkan langsung saat toggle.
function FilterDrawer({
  open, onClose,
  selectedSubscriptions, onSubscriptionsChange,
  selectedPlans, onPlansChange,
  selectedRoles, onRolesChange,
}) {
  const toggle = (list, value, setList) =>
    setList(list.includes(value) ? list.filter(x => x !== value) : [...list, value])

  return (
    <div className={cn('fixed inset-0 z-[90]', open ? '' : 'pointer-events-none')}>
      <div
        className={cn('absolute inset-0 bg-black/30 transition-opacity duration-300', open ? 'opacity-100' : 'opacity-0')}
        onClick={onClose}
      />
      <aside className={cn(
        'absolute top-0 right-0 h-full w-[340px] max-w-[85vw] bg-white shadow-2xl p-6 overflow-y-auto transition-transform duration-300',
        open ? 'translate-x-0' : 'translate-x-full'
      )}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-[#0A1128]">Filters</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-[#0A1128] transition-colors">
            <X size={20} />
          </button>
        </div>

        <FilterSection title="Langganan">
          {LANGGANAN_OPTIONS.map(o => (
            <CheckRow key={o.value} label={o.label}
              checked={selectedSubscriptions.includes(o.value)}
              onToggle={() => toggle(selectedSubscriptions, o.value, onSubscriptionsChange)} />
          ))}
        </FilterSection>

        <FilterSection title="Jenis Paket">
          {PLAN_OPTIONS.map(o => (
            <CheckRow key={o.value} label={o.label}
              checked={selectedPlans.includes(o.value)}
              onToggle={() => toggle(selectedPlans, o.value, onPlansChange)} />
          ))}
        </FilterSection>

        <FilterSection title="Role">
          {ROLE_OPTIONS.map(o => (
            <CheckRow key={o.value} label={o.label} Icon={o.Icon} iconColor="text-blue-500"
              checked={selectedRoles.includes(o.value)}
              onToggle={() => toggle(selectedRoles, o.value, onRolesChange)} />
          ))}
        </FilterSection>
      </aside>
    </div>
  )
}

export function ManajemenControls({
  activeFilter, onFilterChange,
  selectedRoles, onRolesChange,
  selectedSubscriptions, onSubscriptionsChange,
  selectedPlans = [], onPlansChange,
  searchQuery, onSearchChange,
  onExport,
}) {
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const activeCount = selectedRoles.length + selectedSubscriptions.length + selectedPlans.length

  return (
    <div className="flex items-center justify-between mb-6">
      {/* 4 tab utama: tiap tab merender tabel dengan kolom berbeda (full / reduced) */}
      <div className="flex items-center gap-1 bg-gray-50/70 border border-gray-100 p-1.5 rounded-full">
        {MANAJEMEN_TABS.map(tab => {
          const isActive = activeFilter === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => onFilterChange(tab.id)}
              className={cn(
                'px-5 py-2 rounded-full text-sm font-semibold transition-colors whitespace-nowrap',
                isActive ? 'bg-[#0A1128] text-white shadow-sm' : 'text-gray-500 hover:text-[#0A1128]'
              )}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        <div className="w-[280px]">
          <SearchInput value={searchQuery} onChange={onSearchChange} />
        </div>

        {/* Filter button (buka drawer). Badge saat ada filter aktif. */}
        <button
          onClick={() => setIsFilterOpen(true)}
          className={cn(
            'relative w-[42px] h-[42px] rounded-full border flex items-center justify-center transition-colors shrink-0 shadow-sm',
            activeCount > 0 ? 'border-blue-600 text-blue-600 bg-blue-50' : 'border-gray-200 text-[#0A1128] hover:bg-gray-50'
          )}
        >
          <Filter size={18} strokeWidth={2} />
          {activeCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </button>

        <button onClick={onExport} className="flex items-center gap-2 bg-[#0A1128] hover:bg-[#0A1128]/90 text-white px-5 py-2.5 rounded-full text-sm font-medium transition-colors shadow-sm">
          <Download size={16} /> Export List
        </button>
      </div>

      <FilterDrawer
        open={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        selectedSubscriptions={selectedSubscriptions} onSubscriptionsChange={onSubscriptionsChange}
        selectedPlans={selectedPlans} onPlansChange={onPlansChange}
        selectedRoles={selectedRoles} onRolesChange={onRolesChange}
      />
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
