import { useState } from 'react'
import { AlertTriangle, ChevronDown, ChevronLeft, ChevronRight, Bold, Italic, Underline, Link2, List } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatIdDate } from './CalendarRangePicker'

// Preset durasi penangguhan (Komponen). ms dari sekarang.
const PRESETS = [
  { key: '6h',  label: '6 Jam',    ms: 6  * 3600e3 },
  { key: '12h', label: '12 Jam',   ms: 12 * 3600e3 },
  { key: '24h', label: '24 Jam',   ms: 24 * 3600e3 },
  { key: '3d',  label: '3 Hari',   ms: 3  * 24 * 3600e3 },
  { key: '1w',  label: '1 Minggu', ms: 7  * 24 * 3600e3 },
  { key: '1mo', label: '1 Bulan',  ms: 30 * 24 * 3600e3 },
]

const REASONS = [
  'Melanggar aturan komunitas',
  'Konten tidak pantas',
  'Terindikasi spam',
  'Tindakan yang dianggap merugikan pelaksanaan di dalam komunitas',
]

const ID_MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const DAY_LABELS = ['Sn', 'Sl', 'Rb', 'Km', 'Jm', 'Sb', 'Mg']

const pad = (n) => String(n).padStart(2, '0')
// suspendedUntil payload backend: "YYYY-MM-DD HH:mm:ss".
const fmtDateTime = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:00`

function buildGrid(y, m) {
  const first = new Date(y, m, 1)
  const offset = (first.getDay() + 6) % 7 // Senin-first
  const days = new Date(y, m + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < offset; i++) cells.push(null)
  for (let d = 1; d <= days; d++) cells.push(new Date(y, m, d))
  while (cells.length % 7) cells.push(null)
  return cells
}

function MiniCalendar({ value, onChange }) {
  const [view, setView] = useState(value || new Date())
  const y = view.getFullYear(), m = view.getMonth()
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const same = (a, b) => a && b && a.toDateString() === b.toDateString()
  return (
    <div className="border border-gray-200 rounded-xl p-3">
      <div className="flex items-center justify-between mb-2">
        <button type="button" onClick={() => setView(new Date(y, m - 1, 1))} className="text-gray-400 hover:text-[#0A1128]"><ChevronLeft size={18} /></button>
        <span className="text-sm font-bold text-[#0A1128]">{ID_MONTHS[m]} {y}</span>
        <button type="button" onClick={() => setView(new Date(y, m + 1, 1))} className="text-gray-400 hover:text-[#0A1128]"><ChevronRight size={18} /></button>
      </div>
      <div className="grid grid-cols-7 gap-y-1 text-center">
        {DAY_LABELS.map(d => <span key={d} className="text-[11px] font-medium text-gray-400 py-1">{d}</span>)}
        {buildGrid(y, m).map((d, i) => {
          if (!d) return <span key={i} />
          const past = d < today
          const sel = same(d, value)
          return (
            <button
              key={i} type="button" disabled={past} onClick={() => onChange(d)}
              className={cn(
                'h-8 w-8 mx-auto flex items-center justify-center text-sm rounded-full transition-colors',
                sel ? 'bg-blue-600 text-white font-semibold' : past ? 'text-gray-300 cursor-not-allowed' : 'text-[#0A1128] hover:bg-gray-100'
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

function Field({ label, children }) {
  return (
    <div className="mb-5">
      <label className="block text-sm font-semibold text-[#0A1128] mb-1.5">{label}</label>
      {children}
    </div>
  )
}

// Tangguhkan Akun — durasi via Preset (dropdown) atau Manual (kalender + jam),
// alasan (dropdown), pesan email opsional. onConfirm({ suspendedUntil, reason, emailMessage }).
export function SuspendModal({ user, onConfirm, onCancel }) {
  const [mode, setMode]     = useState('preset') // 'preset' | 'manual'
  const [preset, setPreset] = useState('')
  const [date, setDate]     = useState(null)
  const [time, setTime]     = useState('23:59')
  const [reason, setReason] = useState('')
  const [email, setEmail]   = useState('')

  if (!user) return null

  const computeUntil = () => {
    if (mode === 'preset') {
      const p = PRESETS.find(x => x.key === preset)
      return p ? new Date(Date.now() + p.ms) : null
    }
    if (date) {
      const [h, mi] = time.split(':').map(Number)
      const d = new Date(date); d.setHours(h || 0, mi || 0, 0, 0)
      return d
    }
    return null
  }
  const until = computeUntil()
  const valid = !!until && !!reason

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[24px] w-full max-w-[480px] shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-7">
          <h3 className="text-xl font-bold text-[#0A1128] mb-4">Tangguhkan Akun</h3>

          <div className="flex items-start gap-3 bg-orange-50 border border-orange-100 rounded-xl p-3 mb-5">
            <AlertTriangle size={18} className="text-orange-500 shrink-0 mt-0.5" />
            <p className="text-xs text-orange-600 leading-relaxed">
              Untuk menjaga keamanan komunitas, pengguna yang ditangguhkan tidak dapat mengakses akunnya sampai waktu yang ditentukan.
            </p>
          </div>

          <Field label="Tangguhkan pengguna hingga">
            <div className="inline-flex bg-gray-50 border border-gray-100 rounded-full p-1 mb-3">
              {[['preset', 'Preset'], ['manual', 'Manual']].map(([mo, lbl]) => (
                <button
                  key={mo} type="button" onClick={() => setMode(mo)}
                  className={cn('px-5 py-1.5 rounded-full text-sm font-medium transition-colors', mode === mo ? 'bg-[#0A1128] text-white' : 'text-gray-500')}
                >
                  {lbl}
                </button>
              ))}
            </div>

            {mode === 'preset' ? (
              <div className="relative">
                <select
                  value={preset} onChange={e => setPreset(e.target.value)}
                  className={cn('w-full appearance-none border border-gray-200 rounded-xl py-3 pl-4 pr-9 text-sm outline-none focus:border-blue-500', preset ? 'text-[#0A1128]' : 'text-gray-400')}
                >
                  <option value="" disabled>Pilih durasi</option>
                  {PRESETS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            ) : (
              <div className="space-y-3">
                <MiniCalendar value={date} onChange={setDate} />
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Jam aktif kembali</label>
                  <input
                    type="time" value={time} onChange={e => setTime(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl py-2.5 px-4 text-sm outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            {until && (
              <p className="text-xs text-gray-500 mt-2">
                Berakhir: <span className="font-semibold text-[#0A1128]">{formatIdDate(until)}, {pad(until.getHours())}:{pad(until.getMinutes())}</span>
              </p>
            )}
          </Field>

          <Field label="Alasan penangguhan Pengguna">
            <div className="relative">
              <select
                value={reason} onChange={e => setReason(e.target.value)}
                className={cn('w-full appearance-none border border-gray-200 rounded-xl py-3 pl-4 pr-9 text-sm outline-none focus:border-blue-500', reason ? 'text-[#0A1128]' : 'text-gray-400')}
              >
                <option value="" disabled>Pilih alasan</option>
                {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </Field>

          <Field label="Pesan email (opsional)">
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-100 text-gray-400">
                {[Bold, Italic, Underline, Link2, List].map((I, i) => (
                  <span key={i} className="p-1 hover:text-[#0A1128] cursor-default"><I size={15} /></span>
                ))}
              </div>
              <textarea
                value={email} onChange={e => setEmail(e.target.value)} rows={3}
                placeholder="Tulis pesan tambahan untuk pengguna (opsional)"
                className="w-full px-4 py-2.5 text-sm outline-none resize-none placeholder:text-gray-400"
              />
            </div>
          </Field>
        </div>

        <div className="flex items-center gap-3 p-6 pt-0">
          <button onClick={onCancel} className="flex-1 font-semibold text-[#0A1128] border border-gray-200 bg-white hover:bg-gray-50 px-6 py-3 rounded-full transition-colors">
            Batalkan
          </button>
          <button
            disabled={!valid}
            onClick={() => onConfirm({ suspendedUntil: fmtDateTime(until), reason, emailMessage: email })}
            className="flex-1 font-semibold px-6 py-3 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Tangguhkan
          </button>
        </div>
      </div>
    </div>
  )
}
