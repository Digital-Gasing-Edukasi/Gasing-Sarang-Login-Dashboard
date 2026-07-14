import { useState, useRef, useEffect } from 'react'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const ID_MONTHS_FULL = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const ID_MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
const DAY_LABELS = ['Sn', 'Sl', 'Rb', 'Km', 'Jm', 'Sb', 'Mg'] // Senin-first

// ── Helpers (exported: reused by the modal for the API payload + row label) ──────
export function toYMD(d) {
  if (!d) return ''
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

export function formatIdDate(d) {
  if (!d) return ''
  return `${d.getDate()} ${ID_MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`
}

const sameDay = (a, b) =>
  a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

// Monday-first grid, padded to full weeks with nulls.
function buildMonthGrid(year, month) {
  const first = new Date(year, month, 1)
  const offset = (first.getDay() + 6) % 7 // Sun=0 → 6, Mon=1 → 0
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < offset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

function MonthView({ year, month, showPrev, showNext, onPrev, onNext, startDate, endDate, onDayClick }) {
  const cells = buildMonthGrid(year, month)
  const inRange = (d) => startDate && endDate && d > startDate && d < endDate
  const isEndpoint = (d) => sameDay(d, startDate) || sameDay(d, endDate)

  return (
    <div className="w-[220px]">
      <div className="flex items-center justify-between mb-3 h-6">
        <button
          type="button"
          onClick={onPrev}
          className={cn('text-gray-400 hover:text-[#0A1128] transition-colors', !showPrev && 'invisible')}
        >
          <ChevronLeft size={18} />
        </button>
        <span className="text-sm font-bold text-[#0A1128]">{ID_MONTHS_FULL[month]} {year}</span>
        <button
          type="button"
          onClick={onNext}
          className={cn('text-gray-400 hover:text-[#0A1128] transition-colors', !showNext && 'invisible')}
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-y-1 text-center">
        {DAY_LABELS.map((d) => (
          <span key={d} className="text-[11px] font-medium text-gray-400 py-1">{d}</span>
        ))}
        {cells.map((d, i) => {
          if (!d) return <span key={i} />
          const endpoint = isEndpoint(d)
          const between = inRange(d)
          return (
            <button
              key={i}
              type="button"
              onClick={() => onDayClick(d)}
              className={cn(
                'h-8 w-8 mx-auto flex items-center justify-center text-sm rounded-full transition-colors',
                endpoint && 'bg-blue-600 text-white font-semibold',
                between && 'bg-blue-50 text-blue-600 rounded-none',
                !endpoint && !between && 'text-[#0A1128] hover:bg-gray-100',
              )}
            >
              {d.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function CalendarRangePicker({ startDate, endDate, onChange, placeholder = 'Pilih rentang tanggal' }) {
  const [open, setOpen] = useState(false)
  const [viewDate, setViewDate] = useState(() => startDate || new Date())
  const ref = useRef(null)

  useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const handleDayClick = (d) => {
    // No start yet, or a full range already picked → begin a fresh range.
    if (!startDate || (startDate && endDate)) {
      onChange({ startDate: d, endDate: null })
      return
    }
    // Have a start, picking the end. Clicking before start restarts the range.
    if (d < startDate) onChange({ startDate: d, endDate: null })
    else onChange({ startDate, endDate: d })
  }

  const label = startDate
    ? `${formatIdDate(startDate)}${endDate ? ' - ' + formatIdDate(endDate) : ''}`
    : ''

  const y = viewDate.getFullYear()
  const m = viewDate.getMonth()
  const nextMonth = { y: m === 11 ? y + 1 : y, m: (m + 1) % 12 }
  const shift = (delta) => setViewDate(new Date(y, m + delta, 1))

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-left focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
      >
        <CalendarIcon size={16} className="text-gray-400 shrink-0" />
        <span className={cn(label ? 'text-[#0A1128]' : 'text-gray-400')}>{label || placeholder}</span>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 flex gap-6 bg-white rounded-xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-4">
          <MonthView
            year={y}
            month={m}
            showPrev
            showNext={false}
            onPrev={() => shift(-1)}
            onNext={() => shift(1)}
            startDate={startDate}
            endDate={endDate}
            onDayClick={handleDayClick}
          />
          <MonthView
            year={nextMonth.y}
            month={nextMonth.m}
            showPrev={false}
            showNext
            onPrev={() => shift(-1)}
            onNext={() => shift(1)}
            startDate={startDate}
            endDate={endDate}
            onDayClick={handleDayClick}
          />
        </div>
      )}
    </div>
  )
}
