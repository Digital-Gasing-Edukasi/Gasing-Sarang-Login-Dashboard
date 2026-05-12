import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RightPanel } from '@/components/layout/RightPanel'
import { StepIndicator } from '@/components/layout/StepIndicator'
import { OtpInput }     from '@/components/shared/OtpInput'
import { ErrorAlert }   from '@/components/shared/ErrorAlert'
import { useCountdown } from '@/hooks/useCountdown'
import { authApi }      from '@/lib/api'

export function SignUpOtpPage({ onNavigate, otpToken, email }) {
  const { display, expired, reset } = useCountdown(600)
  const [otpCode, setOtpCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const maskedEmail = email ? email.replace(/(.{3}).*(@.*)/, '$1*****$2') : 'email Anda'

  const handleVerify = async () => {
    if (otpCode.length !== 6) { setError('Masukkan 6 digit OTP'); return }
    setError(''); setLoading(true)
    try {
      await authApi.confirmEmail(otpToken, otpCode)
      onNavigate('signup-review')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <RightPanel>
      <StepIndicator currentStep={2} />
      <div className="animate-fade-in-up delay-100 text-center">
        <h1 className="text-2xl font-bold text-foreground mb-1">Verifikasi Email</h1>
        <p className="text-sm text-muted-foreground mb-1">Masukkan kode yang kami kirimkan ke</p>
        <p className="text-sm font-semibold text-foreground mb-8">{maskedEmail}</p>
      </div>
      <div className="animate-fade-in-up delay-200 space-y-6">
        <ErrorAlert message={error} />
        <OtpInput disabled={loading} onComplete={code => { setOtpCode(code); setError('') }} />
        <Button className="w-full" disabled={loading || otpCode.length !== 6} onClick={handleVerify}>
          {loading ? <><Loader2 size={16} className="animate-spin" /> Memverifikasi...</> : 'Verifikasi Kode OTP'}
        </Button>
        <div className="text-center">
          {expired
            ? <button onClick={reset} className="text-sm text-foreground font-medium underline underline-offset-2">Kirim ulang kode</button>
            : <p className="text-sm text-muted-foreground">Kode kedaluwarsa dalam <span className="font-bold text-foreground">{display}</span></p>
          }
        </div>
      </div>
    </RightPanel>
  )
}
