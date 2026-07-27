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
//        | 'payment_rejected' (payment terakhir ditolak admin; meta.variant =
//          'receipt' | 'amount' | 'account', lihat evaluatePaymentGate)
// onClose→ tutup / logout / dismiss: bersihkan sesi.
// onRenew→ lanjut ke halaman langganan (skenario 'expired' & 'payment_rejected').
// onRetry→ tutup modal untuk mencoba lagi (skenario 'error'; default onClose).
export function LoginStatusModal({ type, meta = {}, onClose, onRenew, onRetry, onReupload }) {
  const [confirmLogout, setConfirmLogout] = useState(false)

  if (type === 'suspended') return <SuspendedModal meta={meta} onClose={onClose} />
  if (type === 'payment_rejected') return <PaymentRejectedModal meta={meta} onClose={onClose} onRenew={onRenew} onReupload={onReupload} />

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
        <p className="text-sm leading-normal">
          <span className="font-medium text-foreground">
            Akun kamu sedang kami tinjau maksimal dalam waktu 24 jam
          </span>
          <span className="text-[#424857]"> untuk memastikan kamu sudah terdaftar sebagai Trainer di Gasing Academy.</span>
          <br /><br />
          <span className="font-medium text-foreground">Mohon cek email secara berkala</span>
          <span className="text-[#424857]"> untuk status pengajuan akunmu.</span>
        </p>
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
      <div className="text-[15px] text-muted-foreground leading-relaxed mb-8">{cfg.body}</div>
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

// Rekening resmi Sarang Gasing (varian 'account'). Sumber tunggal juga di
// TransferBankPage (DEFAULT_BANK) — backend belum kembalikan detail rekening.
const RECEIVER_BANK = {
  bank: 'Bank Mandiri',
  accountNumber: '1760007700071',
  accountName: 'Yayasan Teknologi Indonesia Jaya',
}

// "Rp 1.500.000". Angka non-valid → "Rp 0".
function fmtRupiah(raw) {
  const n = Number(raw)
  if (!raw || isNaN(n)) return 'Rp 0'
  return 'Rp ' + n.toLocaleString('id-ID')
}

const RECEIPT_TIPS = [
  'Pastikan pencahayaan cukup terang',
  'Foto tidak goyang atau buram',
  'Seluruh bagian struk terlihat jelas (atas ke bawah)',
]

// Modal "Pembayaran Ditolak" — 3 varian (meta.variant):
//   receipt → bukti tak terbaca, unggah ulang bukti (+ tips foto struk)
//   amount  → nominal salah, ulang pembayaran (+ total tagihan)
//   account → rekening tujuan salah, ulang pembayaran (+ rekening resmi)
function PaymentRejectedModal({ meta = {}, onClose, onRenew, onReupload }) {
  const variant = meta.variant || 'receipt'

  const V = {
    receipt: {
      body: 'Bukti pembayaran yang kamu unggah tidak dapat terbaca dengan jelas (buram, gelap, atau terpotong). Silakan unggah kembali foto struk pembayaran yang lebih jelas.',
      primaryLabel: 'Upload Bukti Pembayaran',
      // Unggah ulang bukti → langsung ke halaman pembayaran (paket terakhir),
      // bukan pilih paket lagi.
      onPrimary: onReupload,
      content: (
        <div className="w-full text-left rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3.5">
          <p className="text-sm font-bold text-foreground mb-2">Tips Foto Struk yang Baik:</p>
          <ul className="space-y-1.5">
            {RECEIPT_TIPS.map((t) => (
              <li key={t} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      ),
    },
    amount: {
      body: 'Nominal pembayaran yang kamu transfer tidak sesuai dengan jumlah tagihan. Mohon lakukan pembayaran ulang sesuai dengan rincian berikut.',
      primaryLabel: 'Ulang Pembayaran',
      content: (
        <div className="w-full">
          <div className="flex items-center justify-between gap-4 bg-gray-50 rounded-xl px-4 py-4">
            <span className="text-sm text-muted-foreground shrink-0">Total Tagihan:</span>
            <span className="text-lg font-bold text-red-500">{fmtRupiah(meta.amount)}</span>
          </div>
          <p className="text-xs text-muted-foreground italic text-center mt-4 leading-relaxed">
            * Pembayaran yang tidak sesuai akan dikembalikan ke rekening yang kamu gunakan untuk pembayaran.
          </p>
        </div>
      ),
    },
    account: {
      body: 'Tujuan rekening pembayaran yang kamu gunakan salah. Dana tidak masuk ke rekening resmi Sarang Gasing. Silakan gunakan detail rekening di bawah ini.',
      primaryLabel: 'Ulang Pembayaran',
      content: (
        <div className="w-full">
          <div className="text-left rounded-xl border border-gray-100 bg-gray-50/60 divide-y divide-gray-100">
            <AccountRow label="Bank Tujuan:" value={RECEIVER_BANK.bank} />
            <AccountRow label="No. Rekening:" value={RECEIVER_BANK.accountNumber} valueClass="text-[#0033EC]" />
            <AccountRow label="Atas Nama (a.n):" value={RECEIVER_BANK.accountName} />
          </div>
          <p className="text-xs text-muted-foreground text-center mt-4 leading-relaxed">
            Jika kamu memiliki pertanyaan lebih lanjut terkait pembayaran yang ditolak, silakan hubungi admin kami untuk mendapatkan bantuan.
          </p>
        </div>
      ),
    },
  }[variant] || {}

  return (
    <Shell tone="red" icon={AlertCircle}>
      <h2 className="text-2xl font-bold text-foreground mb-3">Pembayaran Ditolak</h2>
      <p className="text-[14px] text-muted-foreground leading-relaxed text-center mb-6">{V.body}</p>
      <div className="w-full mb-8">{V.content}</div>
      <div className="flex items-center gap-4 w-full">
        <ActionButton label="Log Out" variant="outline" onClick={() => onClose?.()} />
        <ActionButton label={V.primaryLabel} variant="primary" onClick={() => (V.onPrimary || onRenew)?.()} />
      </div>
    </Shell>
  )
}

function AccountRow({ label, value, valueClass = 'text-foreground' }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3.5">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className={cn('text-sm font-bold text-right', valueClass)}>{value}</span>
    </div>
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
            ? 'w-full rounded-t-[28px] px-6 pb-8 pt-5 lg:w-full lg:max-w-[520px] lg:rounded-[24px] lg:px-8 lg:pt-16'
            : 'w-full max-w-[520px] rounded-[24px] px-8 pt-16 pb-8'
        )}
      >
        {/* Drag handle — hanya bottom-sheet mobile */}
        {sheet && <div className="mx-auto mb-5 h-1.5 w-11 rounded-full bg-gray-200 lg:hidden" />}

        <div className={cn('mx-auto mb-6 w-[68px] h-[68px] rounded-full border-2 border-dashed flex items-center justify-center', t.ring)}>
          <div className={cn('w-[52px] h-[52px] rounded-full flex items-center justify-center', t.bg)}>
            <Icon size={26} className={t.icon} />
          </div>
        </div>
        <div className="flex flex-col items-center justify-center w-full">
          {children}
        </div>
      </div>
    </div>
  )
}

function ActionButton({ label, variant, icon: Icon, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex-1 flex items-center justify-center gap-2 font-semibold px-6 py-3.5 rounded-full transition-colors whitespace-nowrap',
        variant === 'primary'
          ? 'bg-[#0033EC] text-white hover:bg-[#0029BD]'
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
