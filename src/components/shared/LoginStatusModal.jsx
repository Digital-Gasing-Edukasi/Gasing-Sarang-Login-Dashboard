import { useState } from 'react'
import { Clock, UserSearch, ShieldAlert, LogOut, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

// "panduan komunitas" → halaman Ketentuan Layanan (TOS). Dibuka di tab baru,
// sama seperti tautan TOS di SignUpPage.
const COMMUNITY_URL = '/register/id/TOS'

const ID_MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

// "14 Agustus 2026, 13:05" (nama bulan penuh, jam 24)
function fmtDateID(value) {
  if (!value) return '-'
  const d = new Date(typeof value === 'string' ? value.replace(' ', 'T') : value)
  if (isNaN(d)) return '-'
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${d.getDate()} ${ID_MONTHS[d.getMonth()]} ${d.getFullYear()}, ${hh}:${mm}`
}

// Durasi manusiawi dari sekarang → until: "1 Bulan" / "1 Minggu" / "3 Hari" / "6 Jam".
function durationLabel(value) {
  if (!value) return ''
  const d = new Date(typeof value === 'string' ? value.replace(' ', 'T') : value)
  if (isNaN(d)) return ''
  const ms = d.getTime() - Date.now()
  if (ms <= 0) return ''
  const days = Math.round(ms / 86400e3)
  if (days >= 28) return `${Math.round(days / 30)} Bulan`
  if (days >= 7 && days % 7 === 0) return `${days / 7} Minggu`
  if (days >= 1) return `${days} Hari`
  return `${Math.max(1, Math.round(ms / 3600e3))} Jam`
}

// Modal blocking di atas halaman login.
// type   : 'pending' (flow 7) | 'expired' (flow 6) | 'suspended' | 'error' (flow 4)
// onClose→ tutup / logout / dismiss: bersihkan sesi.
// onRenew→ lanjut ke halaman langganan (skenario 'expired').
// onRetry→ tutup modal untuk mencoba lagi (skenario 'error'; default onClose).
export function LoginStatusModal({ type, meta = {}, onClose, onRenew, onRetry }) {
  const [confirmLogout, setConfirmLogout] = useState(false)

  if (type === 'suspended') return <SuspendedModal meta={meta} onClose={onClose} />

  // Flow 4 — server error. Kartu tengah (bukan bottom-sheet).
  if (type === 'error') {
    return (
      <Shell tone="red" icon={AlertCircle} variant="center">
        <h2 className="text-xl font-bold text-foreground mb-2">Terjadi Kesalahan</h2>
        <p className="text-[14px] text-muted-foreground leading-relaxed mb-6">
          Server sedang bermasalah. Coba beberapa saat lagi.
        </p>
        <div className="flex">
          <ActionButton label="Coba Lagi" variant="primary" onClick={() => (onRetry || onClose)?.()} />
        </div>
      </Shell>
    )
  }

  // Flow 6 — konfirmasi logout (dari tombol "Log Out" di modal expired).
  if (confirmLogout) {
    return (
      <Shell icon={LogOut} tone="orange">
        <h2 className="text-2xl font-bold text-foreground mb-3">Yakin Log Out?</h2>
        <p className="text-[15px] text-muted-foreground leading-relaxed mb-8">
          Kamu akan keluar dari akunmu dan perlu login kembali untuk melanjutkan.
        </p>
        <div className="flex items-center gap-4">
          <ActionButton label="Batal" variant="outline" onClick={() => setConfirmLogout(false)} />
          <ActionButton label="Ya, Keluar" variant="danger" onClick={() => onClose?.()} />
        </div>
      </Shell>
    )
  }

  const CONFIG = {
    pending: {
      icon: UserSearch,
      title: 'Kami Sedang Meninjau Akunmu',
      body: (
        <>
          <span className="font-semibold text-foreground">Akun kamu sedang kami tinjau maksimal dalam waktu 24 jam</span>{' '}
          untuk memastikan kamu sudah terdaftar sebagai Trainer di Gasing Academy.
          <br /><br />
          <span className="font-semibold text-foreground">Mohon cek email secara berkala</span>{' '}
          untuk status pengajuan akunmu.
        </>
      ),
      actions: [{ label: 'Oke', variant: 'primary', kind: 'close' }],
    },
    expired: {
      icon: Clock,
      title: 'Masa Berlangganan Berakhir',
      body: 'Masa berlangganan kamu telah habis. Ayo perbarui langgananmu untuk kembali mendapatkan akses ke Sarang Gasing!',
      actions: [
        { label: 'Log Out', variant: 'outline', icon: LogOut, kind: 'logout' },
        { label: 'Perbarui Langganan', variant: 'primary', kind: 'renew' },
      ],
    },
  }

  const cfg = CONFIG[type]
  if (!cfg) return null
  const Icon = cfg.icon
  const run = (kind) => {
    if (kind === 'renew') return onRenew?.()
    if (kind === 'logout') return setConfirmLogout(true)
    return onClose?.()
  }

  return (
    <Shell tone="orange" icon={Icon}>
      <h2 className="text-2xl font-bold text-foreground mb-3">{cfg.title}</h2>
      <p className="text-[15px] text-muted-foreground leading-relaxed mb-8">{cfg.body}</p>
      <div className="flex items-center gap-4">
        {cfg.actions.map((a) => (
          <ActionButton key={a.label} {...a} onClick={() => run(a.kind)} />
        ))}
      </div>
    </Shell>
  )
}

function SuspendedModal({ meta, onClose }) {
  const untilStr = fmtDateID(meta.until)
  const dur = durationLabel(meta.until)
  const reason = meta.reason || 'Melanggar panduan komunitas'

  return (
    <Shell tone="red" icon={ShieldAlert}>
      <h2 className="text-2xl font-bold text-foreground mb-3">
        Akun Kamu Ditangguhkan
      </h2>
      <p className="text-[15px] text-muted-foreground leading-relaxed mb-6">
        Akun kamu ditangguhkan karena {reason.toLowerCase()}. Silakan baca{' '}
        <a href={COMMUNITY_URL} target="_blank" rel="noopener noreferrer" className="font-semibold text-[#0033EC] underline hover:opacity-80">panduan komunitas</a>{' '}
        kami untuk menghindari pelanggaran serupa.
      </p>

      <div className="space-y-2 mb-8 text-left">
        <DetailRow label="Alasan:" value={reason} />
        {dur && <DetailRow label="Durasi tangguhan:" value={dur} />}
        <DetailRow label="Ditangguhkan hingga:" value={untilStr} />
      </div>

      <div className="flex items-center gap-4">
        <ActionButton label="Hubungi Kami" variant="outline" onClick={onClose} />
        <ActionButton label="Saya Mengerti" variant="primary" onClick={onClose} />
      </div>
    </Shell>
  )
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 bg-gray-50 rounded-xl px-4 py-3">
      <span className="text-sm font-semibold text-foreground shrink-0">{label}</span>
      <span className="text-sm text-muted-foreground text-right">{value}</span>
    </div>
  )
}

// Ring dashed + inner soft circle. tone: 'orange' | 'red'.
const TONES = {
  orange: { ring: 'border-orange-300', bg: 'bg-orange-100', icon: 'text-orange-500' },
  red:    { ring: 'border-red-300',    bg: 'bg-red-100',    icon: 'text-red-500' },
}

// variant:
//   'sheet'  (default) → mobile: bottom-sheet (naik dari bawah, rounded-top, ada handle);
//                        desktop: kartu tengah.
//   'center'          → kartu tengah di semua ukuran (dipakai modal error).
function Shell({ tone, icon: Icon, children, variant = 'sheet' }) {
  const t = TONES[tone] || TONES.orange
  const sheet = variant === 'sheet'

  return (
    <div
      className={cn(
        'fixed inset-0 z-[120] flex justify-center bg-black/30 backdrop-blur-sm animate-fade-in',
        sheet ? 'items-end lg:items-center p-0 lg:p-4' : 'items-center p-4'
      )}
    >
      <div
        className={cn(
          'bg-white shadow-2xl text-center animate-fade-in-up',
          sheet
            ? 'w-full rounded-t-[28px] px-6 pb-8 pt-5 lg:w-full lg:max-w-[440px] lg:rounded-[24px] lg:px-8 lg:pt-8'
            : 'w-full max-w-[360px] rounded-[24px] px-7 py-8'
        )}
      >
        {/* Drag handle — hanya bottom-sheet mobile */}
        {sheet && <div className="mx-auto mb-5 h-1.5 w-11 rounded-full bg-gray-200 lg:hidden" />}

        <div className={cn('mx-auto mb-6 w-[68px] h-[68px] rounded-full border-2 border-dashed flex items-center justify-center', t.ring)}>
          <div className={cn('w-[52px] h-[52px] rounded-full flex items-center justify-center', t.bg)}>
            <Icon size={26} className={t.icon} />
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}

function ActionButton({ label, variant, icon: Icon, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex-1 flex items-center justify-center gap-2 font-semibold px-6 py-3.5 rounded-full transition-colors',
        variant === 'primary'
          ? 'bg-blue-600 text-white hover:bg-blue-700'
          : variant === 'danger'
          ? 'bg-red-500 text-white hover:bg-red-600'
          : 'border border-gray-200 bg-white text-foreground hover:bg-gray-50'
      )}
    >
      {Icon && <Icon size={18} />}
      {label}
    </button>
  )
}
