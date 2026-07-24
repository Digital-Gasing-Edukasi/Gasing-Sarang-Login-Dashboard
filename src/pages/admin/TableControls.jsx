import { useRef, useState, useEffect } from 'react'
import { Search, Download, Filter, Check, X } from 'lucide-react'
import { ROLE_META } from './roleOptions'
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

// Search collapsible: default = tombol bulat; klik → melebar jadi input (auto-focus).
// Menciut lagi saat blur & kosong. Tombol X: bersihkan + ciutkan.
function ExpandableSearch({ value, onChange, placeholder = 'Cari user...' }) {
  const [open, setOpen] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => { if (open) inputRef.current?.focus() }, [open])

  if (!open && !value) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-[42px] h-[42px] rounded-full border border-gray-200 text-[#0A1128] hover:bg-gray-50 flex items-center justify-center shrink-0 shadow-sm transition-colors"
      >
        <Search size={18} />
      </button>
    )
  }

  return (
    <div className="relative w-[280px] animate-in fade-in slide-in-from-right-2 duration-200">
      <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        onBlur={() => { if (!value) setOpen(false) }}
        className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-full text-sm outline-none focus:border-[#0033EC] focus:ring-1 focus:ring-[#0033EC] transition-all"
      />
      <button
        onMouseDown={e => e.preventDefault()}
        onClick={() => { onChange(''); setOpen(false) }}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
      >
        <X size={14} />
      </button>
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
            <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-full bg-blue-600 text-white text-xs font-bold leading-none tabular-nums">
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

        <div className="flex items-center gap-4 w-full bg-gray-100 border border-gray-200 rounded-full px-3 py-2.5">
          <button
            onClick={onClearSelection}
            className="w-11 h-11 rounded-full border border-gray-200 bg-gray-200 text-gray-600 hover:bg-gray-300 flex items-center justify-center shrink-0 transition-colors"
          >
            <X size={18} />
          </button>

          <span className="inline-flex items-center px-3 py-1 rounded-full bg-orange-100 text-orange-500 text-sm font-bold">
            {selectedCount}/{bulkLimit}
          </span>
          <span className="text-sm font-medium text-[#0A1128]">Akun dipilih</span>

          <div className="h-7 w-px bg-gray-300 mx-1" />

          {subTab === 'voucher' ? (
            <button
              onClick={onBulkConfirm}
              className="px-7 py-2.5 rounded-full border border-green-500 bg-transparent text-green-600 text-sm font-semibold hover:bg-green-50 transition-colors"
            >
              Konfirmasi
            </button>
          ) : (
            <>
              <button
                onClick={onBulkApprove}
                className="px-7 py-2.5 rounded-full border border-green-500 bg-transparent text-green-600 text-sm font-semibold hover:bg-green-50 transition-colors"
              >
                Setujui
              </button>
              <button
                onClick={onBulkReject}
                className="px-7 py-2.5 rounded-full border border-red-400 bg-transparent text-red-500 text-sm font-semibold hover:bg-red-50 transition-colors"
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

// Switcher sub-menu Verifikasi Pembayaran: Menunggu Verifikasi & Pembayaran Ditolak.
function PembayaranSubTabSwitcher({ subTab, onSubTabChange, menungguCount = 0, ditolakCount = 0 }) {
  const fmt = (n) => (n > 99 ? '99+' : String(n))
  const tabs = [
    { id: 'menunggu', label: 'Menunggu Verifikasi', count: menungguCount },
    { id: 'ditolak',  label: 'Pembayaran Ditolak',  count: ditolakCount },
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
            <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-full bg-blue-600 text-white text-xs font-bold leading-none tabular-nums">
              {fmt(t.count)}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export function VerifikasiPembayaranControls({
  searchQuery, onSearchChange, onExport,
  subTab = 'menunggu', onSubTabChange, menungguCount = 0, ditolakCount = 0,
}) {
  return (
    <div className="flex items-center justify-between mb-6">
      <PembayaranSubTabSwitcher
        subTab={subTab}
        onSubTabChange={onSubTabChange}
        menungguCount={menungguCount}
        ditolakCount={ditolakCount}
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
const ROLE_OPTIONS = ['Trainer Utama', 'Trainer Aula', 'Trainer Kelas', 'Guru'].map(r => ({
  value: r, label: r, Icon: ROLE_META[r].Icon, color: ROLE_META[r].color,
}))

// 4 tab utama Manajemen Akun (struktur tabel besar). id = status kanonik
// (lihat parseManajemenStatus di mappers.js). Tanpa "Semua" — tiap tab 1 tabel.
const MANAJEMEN_TABS = [
  { id: 'Disetujui',    label: 'Disetujui' },
  { id: 'Ditolak',      label: 'Ditolak' },
  { id: 'Ditangguhkan', label: 'Ditangguhkan' },
  { id: 'Baru Dihapus', label: 'Baru Dihapus' },
]

function CheckRow({ checked, onToggle, Icon, iconColor, color, label }) {
  return (
    <label className="flex items-center gap-3 py-2 cursor-pointer select-none">
      <span className={cn(
        'w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0',
        checked ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'
      )}>
        {checked && <Check size={13} className="text-white" strokeWidth={3} />}
      </span>
      <input type="checkbox" checked={checked} onChange={onToggle} className="sr-only" />
      {Icon && <Icon size={16} className={color ? '' : (iconColor || 'text-gray-400')} style={color ? { color } : undefined} />}
      <span className={cn('text-sm', color ? 'font-medium' : 'text-[#0A1128]')} style={color ? { color } : undefined}>{label}</span>
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

// Drawer filter kanan (Langganan / Jenis Paket / Role).
// Centang = draft lokal, belum mengubah tabel. Baru commit ke parent saat "Terapkan".
// "Reset All" mengosongkan semua filter (draft + yang sedang aktif di tabel).
function FilterDrawer({
  open, onClose,
  selectedSubscriptions, onSubscriptionsChange,
  selectedPlans, onPlansChange,
  selectedRoles, onRolesChange,
}) {
  const [draftSubs, setDraftSubs] = useState(selectedSubscriptions)
  const [draftPlans, setDraftPlans] = useState(selectedPlans)
  const [draftRoles, setDraftRoles] = useState(selectedRoles)

  // Tiap kali drawer dibuka, draft disinkronkan ulang dari filter yang sedang aktif
  // supaya perubahan yang tidak jadi diterapkan (tutup tanpa "Terapkan") ikut dibuang.
  useEffect(() => {
    if (!open) return
    setDraftSubs(selectedSubscriptions)
    setDraftPlans(selectedPlans)
    setDraftRoles(selectedRoles)
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (list, value, setList) =>
    setList(list.includes(value) ? list.filter(x => x !== value) : [...list, value])

  const handleReset = () => {
    setDraftSubs([]); setDraftPlans([]); setDraftRoles([])
    onSubscriptionsChange([]); onPlansChange([]); onRolesChange([])
  }

  const handleApply = () => {
    onSubscriptionsChange(draftSubs)
    onPlansChange(draftPlans)
    onRolesChange(draftRoles)
    onClose()
  }

  return (
    <div className={cn('fixed inset-0 z-[90]', open ? '' : 'pointer-events-none')}>
      <div
        className={cn('absolute inset-0 bg-black/30 transition-opacity duration-300', open ? 'opacity-100' : 'opacity-0')}
        onClick={onClose}
      />
      <aside className={cn(
        'absolute top-0 right-0 h-full w-[340px] max-w-[85vw] bg-white shadow-2xl flex flex-col transition-transform duration-300',
        open ? 'translate-x-0' : 'translate-x-full'
      )}>
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <h3 className="text-lg font-bold text-[#0A1128]">Filters</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-[#0A1128] transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6">
          <FilterSection title="Langganan">
            {LANGGANAN_OPTIONS.map(o => (
              <CheckRow key={o.value} label={o.label}
                checked={draftSubs.includes(o.value)}
                onToggle={() => toggle(draftSubs, o.value, setDraftSubs)} />
            ))}
          </FilterSection>

          <FilterSection title="Jenis Paket">
            {PLAN_OPTIONS.map(o => (
              <CheckRow key={o.value} label={o.label}
                checked={draftPlans.includes(o.value)}
                onToggle={() => toggle(draftPlans, o.value, setDraftPlans)} />
            ))}
          </FilterSection>

          <FilterSection title="Role">
            {ROLE_OPTIONS.map(o => (
              <CheckRow key={o.value} label={o.label} Icon={o.Icon} color={o.color}
                checked={draftRoles.includes(o.value)}
                onToggle={() => toggle(draftRoles, o.value, setDraftRoles)} />
            ))}
          </FilterSection>
        </div>

        <div className="flex items-center gap-3 px-6 py-5 border-t border-gray-100">
          <button
            onClick={handleReset}
            className="flex-1 py-3 rounded-full border border-gray-300 text-sm font-semibold text-[#0A1128] hover:bg-gray-50 transition-colors"
          >
            Reset All
          </button>
          <button
            onClick={handleApply}
            className="flex-1 py-3 rounded-full bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            Terapkan
          </button>
        </div>
      </aside>
    </div>
  )
}

// Aksi bulk per tab (mengikuti aksi baris masing-masing tab).
const BULK_ACTIONS_BY_TAB = {
  'Disetujui':    [{ key: 'tangguhkan', label: 'Tangguhkan', tone: 'warn' }, { key: 'hapus', label: 'Hapus', tone: 'danger' }],
  'Ditolak':      [{ key: 'setujui',    label: 'Setujui',    tone: 'ok' },   { key: 'hapus', label: 'Hapus', tone: 'danger' }],
  'Ditangguhkan': [{ key: 'pulihkan',   label: 'Pulihkan',   tone: 'info' }, { key: 'hapus', label: 'Hapus', tone: 'danger' }],
  'Baru Dihapus': [{ key: 'pulihkan',   label: 'Pulihkan',   tone: 'info' }],
}
const BULK_TONE = {
  ok:     'border border-green-500 text-green-600 hover:bg-green-50',
  warn:   'border border-orange-400 text-orange-500 hover:bg-orange-50',
  info:   'border border-blue-500 text-blue-600 hover:bg-blue-50',
  danger: 'border border-red-400 text-red-500 hover:bg-red-50',
}

export function ManajemenControls({
  activeFilter, onFilterChange,
  selectedRoles, onRolesChange,
  selectedSubscriptions, onSubscriptionsChange,
  selectedPlans = [], onPlansChange,
  searchQuery, onSearchChange,
  onExport,
  selectedCount = 0, bulkLimit = 10, limitHit = false, onDismissLimit,
  onClearSelection, onBulkAction,
}) {
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const activeCount = selectedRoles.length + selectedSubscriptions.length + selectedPlans.length
  // Tab reduced-view (Ditolak / Baru Dihapus) tak punya kolom Langganan/Paket/Role → filter disembunyikan.
  const showFilter = activeFilter !== 'Ditolak' && activeFilter !== 'Baru Dihapus'

  // Mode bulk: aktif saat ada baris terpilih. Ganti toolbar dengan action-bar per tab.
  if (selectedCount > 0) {
    const actions = BULK_ACTIONS_BY_TAB[activeFilter] || []
    return (
      <div className="relative mb-6">
        {limitHit && (
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4 bg-[#0A1128] text-white text-base font-medium px-6 py-4 rounded-2xl shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
            <span>Maksimal {bulkLimit} akun dapat dipilih sekaligus.</span>
            <button onClick={onDismissLimit} className="text-white/70 hover:text-white transition-colors shrink-0">
              <X size={18} />
            </button>
          </div>
        )}
        <div className="flex items-center gap-4 w-full bg-gray-100 border border-gray-200 rounded-full px-3 py-2.5">
          <button
            onClick={onClearSelection}
            className="w-11 h-11 rounded-full border border-gray-200 bg-gray-200 text-gray-600 hover:bg-gray-300 flex items-center justify-center shrink-0 transition-colors"
          >
            <X size={18} />
          </button>
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-orange-100 text-orange-500 text-sm font-bold">
            {selectedCount}/{bulkLimit}
          </span>
          <span className="text-sm font-medium text-[#0A1128]">Akun dipilih</span>
          <div className="h-7 w-px bg-gray-300 mx-1" />
          {actions.map(a => (
            <button
              key={a.key}
              onClick={() => onBulkAction && onBulkAction(a.key)}
              className={cn('px-7 py-2.5 rounded-full bg-transparent text-sm font-semibold transition-colors', BULK_TONE[a.tone])}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>
    )
  }

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
        <ExpandableSearch value={searchQuery} onChange={onSearchChange} />

        {/* Filter button (buka drawer). Saat ada filter aktif berubah jadi pill:
            [ikon filter | jumlah] + tombol X untuk hapus semua filter. */}
        {showFilter && (
          activeCount > 0 ? (
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setIsFilterOpen(true)}
                className="h-[42px] px-4 rounded-l-full border border-blue-600 text-blue-600 bg-blue-50 flex items-center gap-2.5 transition-colors hover:bg-blue-100 shadow-sm"
              >
                <Filter size={18} strokeWidth={2} />
                <span className="min-w-[22px] h-[22px] px-1.5 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center">
                  {activeCount}
                </span>
              </button>
              <button
                onClick={() => { onSubscriptionsChange([]); onPlansChange([]); onRolesChange([]) }}
                className="w-[42px] h-[42px] rounded-r-full border border-blue-600 bg-white text-[#0A1128] hover:bg-gray-50 flex items-center justify-center transition-colors shadow-sm"
              >
                <X size={18} strokeWidth={2} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsFilterOpen(true)}
              className="w-[42px] h-[42px] rounded-full border border-gray-200 text-[#0A1128] hover:bg-gray-50 flex items-center justify-center transition-colors shrink-0 shadow-sm"
            >
              <Filter size={18} strokeWidth={2} />
            </button>
          )
        )}

        <button onClick={onExport} className="flex items-center gap-2 bg-[#0A1128] hover:bg-[#0A1128]/90 text-white px-5 py-2.5 rounded-full text-sm font-medium transition-colors shadow-sm">
          <Download size={16} /> Export List
        </button>
      </div>

      <FilterDrawer
        open={isFilterOpen && showFilter}
        onClose={() => setIsFilterOpen(false)}
        selectedSubscriptions={selectedSubscriptions} onSubscriptionsChange={onSubscriptionsChange}
        selectedPlans={selectedPlans} onPlansChange={onPlansChange}
        selectedRoles={selectedRoles} onRolesChange={onRolesChange}
      />
    </div>
  )
}

export function PendaftaranTrainerControls({
  searchQuery, onSearchChange, onAdd,
  selectedCount = 0, bulkLimit = 100, limitHit = false,
  onClearSelection, onDismissLimit,
}) {
  if (selectedCount > 0) {
    return (
      <div className="relative mb-6">
        {limitHit && (
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4 bg-[#0A1128] text-white text-base font-medium px-6 py-4 rounded-2xl shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
            <span>Maksimal {bulkLimit} item dapat dipilih sekaligus.</span>
            <button onClick={onDismissLimit} className="text-white/70 hover:text-white transition-colors shrink-0"><X size={18} /></button>
          </div>
        )}
        <div className="flex items-center gap-4 w-full bg-gray-100 border border-gray-200 rounded-full px-3 py-2.5">
          <button onClick={onClearSelection} className="w-11 h-11 rounded-full border border-gray-200 bg-gray-200 text-gray-600 hover:bg-gray-300 flex items-center justify-center shrink-0 transition-colors">
            <X size={18} />
          </button>
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-orange-100 text-orange-500 text-sm font-bold">
            {selectedCount}/{bulkLimit}
          </span>
          <span className="text-sm font-medium text-[#0A1128]">Item dipilih</span>
        </div>
      </div>
    );
  }

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

export function RiwayatPelatihanControls({
  searchQuery, onSearchChange, onAdd, onExport,
  selectedCount = 0, bulkLimit = 100, limitHit = false,
  onClearSelection, onDismissLimit,
}) {
  if (selectedCount > 0) {
    return (
      <div className="relative mb-6">
        {limitHit && (
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4 bg-[#0A1128] text-white text-base font-medium px-6 py-4 rounded-2xl shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
            <span>Maksimal {bulkLimit} item dapat dipilih sekaligus.</span>
            <button onClick={onDismissLimit} className="text-white/70 hover:text-white transition-colors shrink-0"><X size={18} /></button>
          </div>
        )}
        <div className="flex items-center gap-4 w-full bg-gray-100 border border-gray-200 rounded-full px-3 py-2.5">
          <button onClick={onClearSelection} className="w-11 h-11 rounded-full border border-gray-200 bg-gray-200 text-gray-600 hover:bg-gray-300 flex items-center justify-center shrink-0 transition-colors">
            <X size={18} />
          </button>
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-orange-100 text-orange-500 text-sm font-bold">
            {selectedCount}/{bulkLimit}
          </span>
          <span className="text-sm font-medium text-[#0A1128]">Item dipilih</span>
        </div>
      </div>
    );
  }

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
