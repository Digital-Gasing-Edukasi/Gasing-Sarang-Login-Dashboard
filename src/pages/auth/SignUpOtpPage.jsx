import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RightPanel } from '@/components/layout/RightPanel'
import { StepBar } from '@/components/layout/StepIndicator'
import { OtpInput }     from '@/components/shared/OtpInput'
import { ErrorAlert }   from '@/components/shared/ErrorAlert'
import { useCountdown } from '@/hooks/useCountdown'
import { authApi }      from '@/lib/api'

// Jeda antar-kirim-ulang OTP (detik). Backend tidak mengembalikan cooldown/retryAfter,
// hanya melindungi diri dengan rate-limit (429). Jadi gerbang UX ini murni sisi klien.
const RESEND_COOLDOWN = 120

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
      setError(e.message)
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

  return (
    <RightPanel>
      <StepBar current={3} total={3} onBack={() => onNavigate('signup')} />
      <div className="animate-fade-in-up delay-100 text-center">
        <h1 className="text-2xl font-bold text-foreground mb-1">Verifikasi Email</h1>
        <p className="text-sm text-muted-foreground mb-1">Masukkan kode yang kami kirimkan ke</p>
        <p className="text-sm font-semibold text-foreground mb-8">{maskedEmail}</p>
      </div>
      <div className="animate-fade-in-up delay-200 space-y-6">
        <ErrorAlert message={error} />
        {info && <p className="text-sm text-center text-green-600">{info}</p>}
        <OtpInput disabled={loading} onChange={code => { setOtpCode(code); setError('') }} />
        <Button className="w-full rounded-full" disabled={loading || otpCode.length !== 6} onClick={handleVerify}>
          {loading ? <><Loader2 size={16} className="animate-spin" /> Memverifikasi...</> : 'Verifikasi Kode OTP'}
        </Button>
        <div className="text-center">
          {expired
            ? <button
                onClick={handleResend}
                disabled={resending}
                className="text-sm text-[#0033EC] font-medium underline underline-offset-2 disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {resending ? <><Loader2 size={14} className="animate-spin" /> Mengirim ulang...</> : 'Kirim ulang kode'}
              </button>
            : <p className="text-sm text-muted-foreground">Tidak menerima kode? Kirim ulang dalam <span className="font-bold text-foreground">{display}</span></p>
          }
        </div>
      </div>
    </RightPanel>
  )
}
