import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RightPanel } from '@/components/layout/RightPanel'
import { StepBar, StepProgress, StepHeader } from '@/components/layout/StepIndicator'
import { OtpInput }     from '@/components/shared/OtpInput'
import { useCountdown } from '@/hooks/useCountdown'
import { authApi }      from '@/lib/api'

// Jeda antar-kirim-ulang OTP (detik). Backend tidak mengembalikan cooldown/retryAfter,
// hanya melindungi diri dengan rate-limit (429). Jadi gerbang UX ini murni sisi klien.
const RESEND_COOLDOWN = 120

// Satu wording untuk semua kegagalan verifikasi kode (salah/kedaluwarsa/dicabut).
const OTP_INVALID_MSG = 'Kode OTP tidak valid. Coba lagi.'

export function SignUpOtpPage({ onNavigate, otpToken, email, onOtpToken }) {
  // Setiap resend mencabut token lama & memberi token baru; simpan lokal supaya
  // confirmEmail/resend berikutnya selalu memakai token TERAKHIR, bukan prop awal.
  const [token, setToken] = useState(otpToken)
  const { display, expired, reset } = useCountdown(RESEND_COOLDOWN)
  const [otpCode, setOtpCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError]     = useState('')
  const [info, setInfo]       = useState('')

  const maskedEmail = email ? email.replace(/(.{3}).*(@.*)/, '$1*****$2') : 'email Anda'

  const handleVerify = async () => {
    if (otpCode.length !== 6) { setError('Masukkan 6 digit OTP'); return }
    setError(''); setLoading(true)
    try {
      await authApi.confirmEmail(token, otpCode)
      onNavigate('signup-review')
    } catch (e) {
      // Kode salah/kedaluwarsa (400/401/422) → wording seragam, jangan bocorkan
      // pesan mentah backend. 429 & error lain tetap apa adanya biar informatif.
      setError([400, 401, 422].includes(e.status) ? OTP_INVALID_MSG : e.message)
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
      if (res?.token) {
        setToken(res.token)
        onOtpToken?.(res.token, email) // sinkron state di App agar tidak basi.
      }
      reset()               // mulai lagi cooldown 120 detik.
      setInfo('Kode OTP baru telah dikirim ke email Anda.')
    } catch (e) {
      // 429 = user menembak resend terlalu cepat lewat rate-limit backend.
      setError(e.status === 429
        ? 'Terlalu banyak permintaan. Tunggu sebentar lalu coba lagi.'
        : e.message)
    } finally {
      setResending(false)
    }
  }

  // Satu definisi CTA; dipakai di footer sticky (mobile + desktop app-shell).
  const cta = (
    <Button className="w-full rounded-full" disabled={loading || otpCode.length !== 6} onClick={handleVerify}>
      {loading ? <><Loader2 size={16} className="animate-spin" /> Memverifikasi...</> : 'Konfirmasi'}
    </Button>
  )

  // Blok "Kirim ulang kode" / countdown. Desktop app-shell menaruhnya di footer
  // (di bawah CTA); mobile tetap pakai versi di dalam konten.
  const resendBlock = (
    <div className="text-center">
      {expired
        ? <p className="text-sm text-muted-foreground">
            {/* Prefix "Tidak menerima kode?" hanya desktop; mobile tombol saja. */}
            <span className="hidden lg:inline">Tidak menerima kode? </span>
            <button
              onClick={handleResend}
              disabled={resending}
              className="align-middle text-[#0033EC] font-medium underline underline-offset-2 disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              {resending ? <><Loader2 size={14} className="animate-spin" /> Mengirim ulang...</> : 'Kirim ulang kode'}
            </button>
          </p>
        : <p className="text-sm text-muted-foreground flex items-center justify-center gap-[4px]">Tidak menerima kode? <span className="font-bold text-[#EF4444]">{display}</span></p>
      }
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
      progress={1}
      topBar={
        <>
          {/* MOBILE: header lama + fill bar. */}
          <div className="lg:hidden">
            <StepBar title="Verifikasi OTP" onBack={() => onNavigate('signup', { step: 2 })} onClose={() => onNavigate('login')} />
          </div>
          {/* DESKTOP: progress tersegmen + counter + back bulat. */}
          <div className="hidden lg:block">
            <StepProgress current={3} total={3} onBack={() => onNavigate('signup', { step: 2 })} />
          </div>
        </>
      }
    >
      <StepHeader>
        <h1 className="hidden lg:block mb-5 text-2xl font-bold text-foreground">Verifikasi OTP</h1>
        <p className="text-sm text-muted-foreground mb-1">Masukkan kode yang telah kami kirimkan ke email</p>
        {/* Desktop: jarak title→body diambil alih spacer, jadi mb dinolkan. */}
        <p className="text-sm font-semibold text-foreground mb-8 lg:mb-0">{maskedEmail}</p>
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
    </RightPanel>
  )
}
