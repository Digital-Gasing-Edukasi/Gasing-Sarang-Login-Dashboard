import { useState, useEffect } from 'react'
import { Loader2, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RightPanel } from '@/components/layout/RightPanel'
import { StepBar, StepProgress, StepHeader } from '@/components/layout/StepIndicator'
import { OtpInput }     from '@/components/shared/OtpInput'
import { useCountdown } from '@/hooks/useCountdown'
import { authApi, tokenStorage } from '@/lib/api'
import { readOtpSession } from '@/lib/otpSession'
import { translateApiError } from '@/lib/errorMessages'

// Jeda antar-kirim-ulang OTP (detik). Backend tidak mengembalikan cooldown/retryAfter,
// hanya melindungi diri dengan rate-limit (429). Jadi gerbang UX ini murni sisi klien.
const RESEND_COOLDOWN = 180

// Satu wording untuk semua kegagalan verifikasi kode (salah/kedaluwarsa/dicabut).
const OTP_INVALID_MSG = 'Kode OTP tidak valid. Coba lagi.'

export function SignUpOtpPage({ onNavigate, otpToken, email, onOtpToken, onVerified }) {
  // Setiap resend mencabut token lama & memberi token baru; simpan lokal supaya
  // confirmEmail/resend berikutnya selalu memakai token TERAKHIR, bukan prop awal.
  // otpToken/email juga di-backup ke sessionStorage (useAuthSession) sehingga
  // reload di tengah jalan (umum di mobile) tidak kehilangan keduanya.
  // Cooldown awal ikut backup (aliran login-provisional: proteksi BE, mis. 8
  // detik) — bukan selalu 180 detik. Setelah kirim-ulang, cooldown penuh.
  const [token, setToken] = useState(otpToken)
  const [initialCooldown] = useState(() => readOtpSession().cooldownSecs ?? RESEND_COOLDOWN)
  const { display, expired, reset } = useCountdown(initialCooldown)
  const [otpCode, setOtpCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError]     = useState('')
  const [info, setInfo]       = useState('')
  // Aliran login (tanpa sesi penuh): sukses verifikasi → dialog tunggu admin
  // 1x24 jam, bukan halaman review pendaftaran.
  const [showPendingDialog, setShowPendingDialog] = useState(false)

  // Tanpa otpToken (deep-link langsung / sesi hilang total) halaman tak bisa
  // berfungsi — verify/resend pasti error. Paksa logout + balik ke login
  // daripada menampilkan form rusak.
  useEffect(() => {
    if (!otpToken) {
      tokenStorage.clear()
      onNavigate('login')
    }
  }, [otpToken, onNavigate])

  if (!otpToken) return null

  const maskedEmail = email ? email.replace(/(.{3}).*(@.*)/, '$1*****$2') : 'email Anda'

  const handleVerify = async () => {
    if (otpCode.length !== 6) { setError('Masukkan 6 digit OTP'); setInfo(''); return }
    setError(''); setInfo(''); setLoading(true)
    try {
      await authApi.confirmEmail(token, otpCode)
      // Asal aliran dibaca SEBELUM backup dihapus onVerified.
      const origin = readOtpSession().origin || 'register'
      onVerified?.() // sesi OTP sekali-pakai: hapus backup agar tak tertinggal
      if (origin === 'login') {
        // Tanpa sesi auth penuh tak ada halaman sukses yang valid → dialog
        // tunggu verifikasi admin (tombolnya bersih-bersih + ke login).
        setShowPendingDialog(true)
        return
      }
      onNavigate('signup-review')
    } catch (e) {
      // Kode salah/kedaluwarsa (400/401/422) → wording seragam, jangan bocorkan
      // pesan mentah backend. 429 & error lain tetap apa adanya biar informatif.
      // Audit #45: error & sukses mutually exclusive — info selalu dibersihkan di sini.
      setInfo('')
      setError([400, 401, 422].includes(e.status) ? OTP_INVALID_MSG : translateApiError(e.message))
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!expired || resending) return
    setError(''); setInfo(''); setResending(true)
    try {
      const res = await authApi.resendOtp(token)
      // Server mencabut token lama → pakai token baru untuk verify/resend lanjutan.
      // Respons resend BE membawa email (bisa mask, mis. t*******1@email.com) —
      // pakai itu bila ada (aliran login: email awal tak dikenal).
      if (res?.token) {
        const nextEmail = res.email || email
        setToken(res.token)
        onOtpToken?.(res.token, nextEmail) // sinkron state di App agar tidak basi.
      }
      reset(RESEND_COOLDOWN) // cooldown penuh setelah kirim-ulang.
      setInfo('Kode OTP baru telah dikirim ke email Anda.')
    } catch (e) {
      // 429 = user menembak resend terlalu cepat lewat rate-limit backend.
      setError(e.status === 429
        ? 'Terlalu banyak permintaan. Tunggu sebentar lalu coba lagi.'
        : translateApiError(e.message))
    } finally {
      setResending(false)
    }
  }

  // Dialog pasca-verifikasi khusus aliran login (tanpa sesi auth penuh):
// admin sedang memverifikasi, tunggu 1x24 jam. Satu aksi "Kembali ke Login"
// yang bersih-bersih total dulu (token + draft + OTP) demi keamanan.
function PendingVerificationDialog({ onBackToLogin }) {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#030B1F]/30 backdrop-blur animate-fade-in p-4">
      <div className="bg-white w-full max-w-[480px] rounded-[24px] shadow-2xl px-6 py-8 lg:px-8 text-center animate-fade-in-up">
        <div className="mx-auto w-[68px] h-[68px] rounded-full border-2 border-dashed border-orange-300 flex items-center justify-center mb-6">
          <div className="w-[52px] h-[52px] rounded-full bg-orange-100 flex items-center justify-center">
            <Clock size={26} className="text-orange-500" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-3">Verifikasi Berhasil!</h2>
        <p className="text-[15px] text-muted-foreground leading-relaxed mb-8">
          Email kamu berhasil diverifikasi. Admin sedang memverifikasi akunmu, mohon tunggu
          maksimal <span className="font-semibold text-foreground">1x24 jam</span>. Cek email
          secara berkala untuk info selanjutnya.
        </p>
        <Button className="w-full rounded-full" onClick={onBackToLogin}>
          Kembali ke Login
        </Button>
      </div>
    </div>
  )
}

  // "Kembali ke Login" dari dialog verifikasi admin: bersih-bersih total
  // (token sesi + draft pendaftaran + backup OTP) lalu ke login.
  const handleBackToLogin = () => {
    tokenStorage.clear()
    try {
      sessionStorage.removeItem('otp-session')
      sessionStorage.removeItem('signup-draft')
    } catch {
      /* noop */
    }
    setShowPendingDialog(false)
    onNavigate('login')
  }

  // Satu definisi CTA; dipakai di footer sticky (mobile + desktop app-shell).
  const cta = (
    <Button className="w-full rounded-full" disabled={loading || otpCode.length !== 6} onClick={handleVerify}>
      {loading ? <><Loader2 size={16} className="animate-spin" /> Memverifikasi...</> : 'Konfirmasi'}
    </Button>
  )

  // Blok "Kirim Ulang" / countdown. Desktop app-shell menaruhnya di footer
  // (di bawah CTA); mobile tetap pakai versi di dalam konten.
  // Audit #34: blok selalu di bawah Input OTP (gap 24px via space-y-6 parent).
  // Audit #35: gap 4px antara copy & tombol via gap-1.
  const resendBlock = (
    <div className="text-center">
      {expired
        ? <p className="text-sm text-muted-foreground">
            {/* Prefix "Tidak menerima kode?" hanya desktop; mobile tombol saja. */}
            <span className="hidden lg:inline">Tidak menerima kode? </span>
            <button
              onClick={handleResend}
              disabled={resending}
              className="align-middle text-[#0033EC] font-medium underline underline-offset-2 disabled:opacity-50 inline-flex items-center gap-1"
            >
              {resending ? <><Loader2 size={14} className="animate-spin" /> Mengirim ulang...</> : 'Kirim Ulang'}</button>
          </p>
        : <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">Tidak menerima kode? <span className="font-bold text-[#EF4444]">{display}</span></p>}
    </div>
  )

  // Isi footer sticky: CTA + (desktop) blok kirim-ulang di bawahnya.
  const footerNode = (
    <div className="space-y-4">
      {cta}
      <div className="hidden lg:block">{resendBlock}</div>
    </div>
  )

  // Spacer fleksibel desktop app-shell: konten OTP pendek → mekar sampai max 148.
  // gapTop = title→body (min 20), gapBottom = body→cta (min 40). Mobile disembunyiin.
  const gapTop = (
    <div aria-hidden className="hidden lg:block flex-1 min-h-[20px] max-h-[148px]" />
  )
  const gapBottom = (
    <div aria-hidden className="hidden lg:block flex-1 min-h-[40px] max-h-[148px]" />
  )

  return (
    <RightPanel
      stickyFooter={footerNode}
      lockDesktop
      progress={1}      topBar={
        <>
          {/* MOBILE: header tanpa back — data sudah ter-submit di step 2, kembali
              hanya akan mengulang registrasi dari awal (audit #38). */}
          <div className="lg:hidden">
            <StepBar title="Verifikasi OTP" onClose={() => onNavigate('login')} />
          </div>
          {/* DESKTOP: progress tersegmen + counter, tanpa back (alasan sama). */}
          <div className="hidden lg:block">
            <StepProgress current={3} total={3} />
          </div>
        </>
      }
    >
      <StepHeader>
        <h1 className="hidden lg:block mb-5 text-2xl font-bold text-foreground">Verifikasi OTP</h1>
        {/* Aliran login-provisional: email belum dikenal (datang belakangan via
            resend) → info email disembunyikan sampai ada. */}
        {email ? (
          <>
            <p className="text-sm text-muted-foreground mb-1">Masukkan kode yang telah kami kirimkan ke email</p>
            {/* Desktop: jarak title→body diambil alih spacer, jadi mb dinolkan. */}
            <p className="text-sm font-semibold text-foreground mb-8 lg:mb-0">{maskedEmail}</p>
          </>
        ) : null}
      </StepHeader>
      {gapTop}
      <div className="animate-fade-in-up delay-200 space-y-6 lg:shrink-0">
        {error && (
          <p className="text-sm text-center font-medium text-[#EF4444] animate-fade-in" role="alert" aria-live="assertive">
            {error}
          </p>
        )}
        {info && <p className="text-sm text-center text-green-600">{info}</p>}
        {/* error di OtpInput → outline 6 kotak jadi merah, reset begitu user mengetik lagi */}
        <OtpInput disabled={loading} error={!!error} onChange={code => { setOtpCode(code); setError('') }} />
        {/* CTA & kirim-ulang pindah ke footer sticky (mobile + desktop app-shell).
            Blok ini versi MOBILE saja; desktop menaruhnya di footer. */}
        <div className="lg:hidden">{resendBlock}</div>
      </div>
      {gapBottom}
      {showPendingDialog && (
        <PendingVerificationDialog onBackToLogin={handleBackToLogin} />
      )}
    </RightPanel>
  )
}
