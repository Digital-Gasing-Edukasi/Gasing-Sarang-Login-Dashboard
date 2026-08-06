import { useState } from 'react'
import { Clock, UserSearch, UserX, ShieldAlert, LogOut, AlertCircle, ServerCrash, Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { WA_URL } from '@/components/shared/PaymentStatusLayout'

// "panduan komunitas" / "ketentuan komunitas" → halaman Ketentuan Layanan (TOS).
// "syarat" → halaman Kebijakan Privasi. Dibuka di tab baru, sama seperti tautan
// legal di SignUpPage.
const COMMUNITY_URL = '/register/id/TOS'
const TERMS_URL = '/register/id/privacy'

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

// Durasi tangguhan dari objek suspended.duration ({year,month,day,hour,min,sec}).
// Gabung unit non-nol jadi label ID: "18 Jam 59 Menit". Maks 2 unit terbesar.
const DURATION_UNITS = [
  ['year', 'Tahun'], ['month', 'Bulan'], ['day', 'Hari'],
  ['hour', 'Jam'], ['min', 'Menit'], ['sec', 'Detik'],
]
function durationLabel(duration) {
  if (!duration || typeof duration !== 'object') return ''
  const parts = DURATION_UNITS
    .map(([key, label]) => [Number(duration[key]) || 0, label])
    .filter(([n]) => n > 0)
    .map(([n, label]) => `${n} ${label}`)
  return parts.slice(0, 2).join(' ')
}

// Modal blocking di atas halaman login.
// type   : 'pending' (flow 7) | 'expired' (flow 6) | 'suspended' | 'error' (flow 4)
//        | 'payment_rejected' (payment terakhir ditolak admin; meta.variant =
//          'receipt' | 'amount' | 'account', lihat evaluatePaymentGate)
// onClose→ tutup / logout / dismiss: bersihkan sesi.
// onRenew→ lanjut ke halaman langganan (skenario 'expired' & 'payment_rejected').
// onRetry→ tutup modal untuk mencoba lagi (skenario 'error'; default onClose).
export function LoginStatusModal({ type, meta = {}, onClose, onRenew, onRetry, onReupload, onReregister }) {
  const [confirmLogout, setConfirmLogout] = useState(false)

  if (type === 'suspended') return <SuspendedModal meta={meta} onClose={onClose} />
  if (type === 'rejected') return <RejectedModal meta={meta} onClose={onClose} onReregister={onReregister} />
  if (type === 'payment_rejected') return <PaymentRejectedModal meta={meta} onClose={onClose} onRenew={onRenew} onReupload={onReupload} />

  // Flow 4 — internal server error. Mobile: bottom-sheet (gaya sama layar status
  // lain). Desktop: kartu tengah (otomatis via Shell varian 'sheet' + lg:).
  if (type === 'error') {
    return (
      <Shell tone="red" icon={ServerCrash}>
        <h2 className="text-2xl font-bold text-foreground lg:mb-3">Terjadi Kesalahan</h2>
        <p className="text-[15px] text-muted-foreground leading-relaxed lg:mb-8">
          Server sedang mengalami gangguan internal (Error 500). Mohon tunggu sebentar, lalu coba lagi.
        </p>
        <div className="flex flex-col gap-3 w-full lg:items-center">
          <ActionButton label="Coba Lagi" variant="primary" onClick={() => (onRetry || onClose)?.()} />
        </div>
      </Shell>
    )
  }

  // Flow 6 — konfirmasi logout (dari tombol "Log Out" di modal expired).
  if (confirmLogout) {
    return (
      <Shell icon={LogOut} tone="orange">
        <h2 className="text-2xl font-bold text-foreground lg:mb-3">Yakin Log Out?</h2>
        <p className="text-[15px] text-muted-foreground leading-relaxed lg:mb-8">
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
      // Tinggi sheet mobile sesuai desain Figma (iPhone base). Desktop auto.
      sheetClass: 'min-h-[471px] lg:min-h-0',
    },
    expired: {
      icon: Clock,
      title: 'Masa Berlangganan Berakhir',
      body: 'Masa berlangganan kamu telah habis. Ayo perbarui langgananmu untuk kembali mendapatkan akses ke Sarang Gasing!',
      actions: [
        { label: 'Log Out', variant: 'outline', icon: LogOut, kind: 'logout' },
        { label: 'Perbarui Langganan', variant: 'primary', kind: 'renew' },
      ],
      sheetClass: 'min-h-[275px] lg:min-h-0',
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
    <Shell tone="orange" icon={Icon} sheetClass={cfg.sheetClass}>
      <h2 className="text-2xl font-bold text-foreground lg:mb-3">{cfg.title}</h2>
      <div className="text-[15px] text-muted-foreground leading-relaxed lg:mb-8">{cfg.body}</div>
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
  const dur = durationLabel(meta.duration)
  const reason = String(meta.reason || '') || 'Melanggar panduan komunitas'

  return (
    <Shell tone="red" icon={ShieldAlert}>
      <h2 className="text-2xl font-bold text-foreground lg:mb-2 lg:text-xl lg:font-semibold">
        Akun Kamu Ditangguhkan
      </h2>
      {/* Kalimat generik (desain terbaru): alasan spesifik ada di baris "Alasan:". */}
      <p className="text-[15px] text-[#424857] leading-relaxed lg:mb-8 lg:text-base">
        Akun kamu ditangguhkan karena melanggar panduan komunitas. Silakan baca{' '}
        <a href={COMMUNITY_URL} target="_blank" rel="noopener noreferrer" className="font-semibold text-[#0033EC] underline hover:opacity-80">panduan komunitas</a>{' '}
        kami untuk menghindari pelanggaran serupa.
      </p>

      <div className="w-full space-y-2 text-left lg:mb-10">
        <DetailRow label="Alasan:" value={reason} />
        {dur && <DetailRow label="Durasi tangguhan:" value={dur} />}
        <DetailRow label="Ditangguhkan hingga:" value={untilStr} />
      </div>

      <div className="flex items-center gap-4 w-full">
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

  // Rekening dari backend (meta.bank via evaluatePaymentGate) menimpa fallback
  // RECEIVER_BANK. Hanya nilai terdefinisi yang menimpa (spread membuang
  // undefined otomatis? tidak — saring dulu).
  const bankOverride = Object.fromEntries(
    Object.entries(meta.bank || {}).filter(([, v]) => v != null && v !== '')
  )
  const bank = { ...RECEIVER_BANK, ...bankOverride }

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
      // Mobile (Figma): teks ringkas. Desktop: pertahankan teks lama.
      body: (
        <>
          <span className="lg:hidden">Rekening tujuan yang kamu gunakan salah. Gunakan detail rekening resmi Sarang Gasing di bawah ini.</span>
          <span className="hidden lg:inline">Tujuan rekening pembayaran yang kamu gunakan salah. Dana tidak masuk ke rekening resmi Sarang Gasing. Silakan gunakan detail rekening di bawah ini.</span>
        </>
      ),
      primaryLabel: 'Ulang Pembayaran',
      content: (
        <div className="w-full">
          {/* Kartu rekening: mobile = stacked 2-baris + copy (Figma); desktop = 1-baris (look lama). */}
          <div className="text-left rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] px-3 py-3 shadow-[0px_4px_6px_rgba(0,0,0,0.04)] divide-y divide-gray-100 lg:rounded-xl lg:border-gray-100 lg:bg-gray-50/60 lg:px-4 lg:py-1 lg:shadow-none">
            <StackedRow label="Bank Tujuan" value={bank.bank} />
            <StackedRow label="No. Rekening">
              <span className="text-base font-semibold text-[#0033EC] lg:text-sm lg:font-bold">{bank.accountNumber}</span>
              {/* Tombol salin hanya mobile — desktop tetap seperti sebelumnya. */}
              <span className="lg:hidden"><CopyButton value={bank.accountNumber} /></span>
            </StackedRow>
            <StackedRow label="Atas Nama (a.n)" value={bank.accountName} />
          </div>
          <p className="text-xs text-muted-foreground text-center mt-4 leading-relaxed opacity-80 lg:opacity-100">
            <span className="lg:hidden">
              Ada pertanyaan soal pembayaran yang ditolak?{' '}
              <a href={WA_URL} target="_blank" rel="noopener noreferrer" className="font-semibold text-[#0033EC] underline hover:opacity-80">Hubungi admin</a>
            </span>
            <span className="hidden lg:inline">
              Jika kamu memiliki pertanyaan lebih lanjut terkait pembayaran yang ditolak, silakan hubungi admin kami untuk mendapatkan bantuan.
            </span>
          </p>
        </div>
      ),
    },
  }[variant] || {}

  return (
    <Shell tone="red" icon={AlertCircle}>
      <h2 className="text-2xl font-bold text-foreground lg:mb-3">Pembayaran Ditolak</h2>
      <p className="text-[14px] text-muted-foreground leading-relaxed text-center lg:mb-6">{V.body}</p>
      <div className="w-full lg:mb-8">{V.content}</div>
      {/* Mobile (Figma): tumpuk vertikal (primary atas). Desktop: baris berdampingan
          seperti sebelumnya (row-reverse → Log Out kiri, primary kanan). */}
      <div className="flex flex-col gap-3 w-full lg:flex-row-reverse lg:items-center lg:gap-4">
        <ActionButton label={V.primaryLabel} variant="primary" onClick={() => (V.onPrimary || onRenew)?.()} />
        <ActionButton label="Log Out" variant="outline" onClick={() => onClose?.()} />
      </div>
    </Shell>
  )
}

// Baris kartu rekening.
//  Mobile (Figma): bertumpuk — label kecil abu di atas, value bold 16px di bawah.
//  Desktop: 1-baris (label kiri, value kanan) seperti AccountRow lama.
function StackedRow({ label, value, children }) {
  return (
    <div className="flex flex-col gap-1 px-1 py-2.5 first:pt-1 last:pb-1 lg:flex-row lg:items-center lg:justify-between lg:gap-4 lg:px-4 lg:py-3.5 lg:first:pt-3.5 lg:last:pb-3.5">
      <span className="text-xs font-medium text-[#424857] lg:text-sm lg:font-normal lg:text-muted-foreground">{label}</span>
      {children ? (
        <span className="flex items-center gap-2 lg:justify-end">{children}</span>
      ) : (
        <span className="text-base font-semibold text-[#061446] break-words lg:text-sm lg:font-bold lg:text-right lg:text-foreground">{value}</span>
      )}
    </div>
  )
}

// Tombol salin nomor rekening (pola sama TransferBankPage) — ikon berubah
// jadi centang ~1.5s setelah disalin.
function CopyButton({ value }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard?.writeText(String(value).replace(/\D/g, ''))
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* noop */
    }
  }
  return (
    <button type="button" onClick={copy} aria-label="Salin nomor rekening" className="text-[#0033EC] transition-opacity hover:opacity-70">
      {copied ? <Check size={16} /> : <Copy size={16} />}
    </button>
  )
}

// Modal "Akun Belum Dapat Disetujui" — pendaftaran ditolak admin
// (verifiedStatus = -1). meta.reasons = daftar alasan penolakan.
const DEFAULT_REJECT_REASONS = [
  'Tanggal lahir tidak sesuai',
  'Riwayat pelatihan tidak ditemukan',
  'Nama sekolah tidak sesuai',
]

function RejectedModal({ meta = {}, onClose, onReregister }) {
  const reasons = Array.isArray(meta.reasons) && meta.reasons.length ? meta.reasons : DEFAULT_REJECT_REASONS

  return (
    <Shell tone="red" icon={UserX}>
      <h2 className="text-2xl font-bold text-foreground lg:mb-3">Akun Belum Dapat Disetujui</h2>
      <p className="text-[14px] text-muted-foreground leading-relaxed text-center lg:mb-6">
        Tim kami telah selesai memeriksa data kamu. Mohon maaf, pendaftaran akun kamu saat ini belum dapat kami setujui karena belum memenuhi{' '}
        <a href={TERMS_URL} target="_blank" rel="noopener noreferrer" className="font-medium text-[#0033EC] underline hover:opacity-80">syarat</a>{' '}
        dan{' '}
        <a href={COMMUNITY_URL} target="_blank" rel="noopener noreferrer" className="font-medium text-[#0033EC] underline hover:opacity-80">ketentuan komunitas</a>.
      </p>

      <div className="w-full text-left rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] px-3 py-3 lg:mb-6">
        <p className="text-xs font-semibold text-foreground mb-3">Alasan Penolakan:</p>
        <ul className="space-y-2">
          {reasons.map((r) => (
            <li key={r} className="flex items-center gap-2 text-sm font-medium text-[#424857]">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-100 shrink-0">
                <AlertCircle size={13} className="text-red-500" />
              </span>
              {r}
            </li>
          ))}
        </ul>
      </div>

      <p className="text-xs text-muted-foreground text-center leading-relaxed opacity-80 lg:mb-6">
        Jika kamu merasa ini adalah kesalahan, silakan{' '}
        <a href={WA_URL} target="_blank" rel="noopener noreferrer" className="font-semibold text-[#0033EC] underline hover:opacity-80">Hubungi Kami</a>{' '}
        untuk bantuan lebih lanjut.
      </p>

      {/* Mobile (Figma): tumpuk vertikal. Desktop: baris berdampingan. */}
      <div className="flex flex-col gap-3 w-full lg:flex-row-reverse lg:items-center lg:gap-4">
        <ActionButton label="Daftar Ulang" variant="primary" onClick={() => (onReregister || onClose)?.()} />
        <ActionButton label="Log Out" variant="outline" onClick={() => onClose?.()} />
      </div>
    </Shell>
  )
}

// Desain terbaru: kotak abu compact (#f3f4f6), label kecil kiri, nilai kanan.
function DetailRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 bg-[#f3f4f6] rounded-md px-3 py-2">
      <span className="text-xs font-medium text-[#424857] shrink-0">{label}</span>
      <span className="text-[13px] font-medium text-foreground text-right">{value}</span>
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
function Shell({ tone, icon: Icon, children, variant = 'sheet', sheetClass }) {
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
            ? 'w-full rounded-t-[28px] px-6 pb-8 pt-5 flex flex-col items-center gap-5 lg:block lg:w-full lg:max-w-[520px] lg:rounded-[24px] lg:px-8 lg:pt-16'
            : 'w-full max-w-[520px] rounded-[24px] px-8 pt-16 pb-8',
          sheet && sheetClass
        )}
      >
        {/* Drag handle — hanya bottom-sheet mobile */}
        {sheet && <div className="mx-auto h-1.5 w-11 rounded-full bg-gray-200 lg:hidden" />}

        <div className={cn('mx-auto w-[68px] h-[68px] rounded-full border-2 border-dashed flex items-center justify-center', sheet ? 'lg:mb-6' : 'mb-6', t.ring)}>
          <div className={cn('w-[52px] h-[52px] rounded-full flex items-center justify-center', t.bg)}>
            <Icon size={26} className={t.icon} />
          </div>
        </div>
        <div className={cn('flex flex-col items-center justify-center w-full', sheet && 'gap-5 lg:gap-0')}>
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
        // Desktop: lebar tombol CTA dibatasi — min 173px (kasus 2 tombol),
        // maks 368px (kasus 1 tombol). Mobile tetap full-width.
        'flex-1 flex items-center justify-center gap-2 font-semibold px-6 py-3.5 rounded-full transition-colors whitespace-nowrap lg:min-w-[173px] lg:max-w-[368px]',
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
