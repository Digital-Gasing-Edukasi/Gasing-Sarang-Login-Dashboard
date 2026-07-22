import { useState } from 'react'
import { Mail, LogIn, Loader2, ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label }  from '@/components/ui/label'
import { AuthFullLayout } from '@/components/layout/AuthFullLayout'
import { IconInput }      from '@/components/shared/IconInput'
import { AuthDarkLayout, DarkInput, DarkPrimaryButton, DarkGhostButton, DarkDivider } from '@/components/shared/DarkAuth'
import { authApi }        from '@/lib/api'

const ERR_INPUT = '!border-red-500 focus-visible:!border-red-500 focus-visible:ring-red-200'
const EMAIL_RE  = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function ForgotPasswordPage({ onNavigate, onEmailSent }) {
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors]   = useState({})

  const clearFieldError = (field) =>
    setErrors(prev => ({ ...prev, [field]: '' }))

  const handleSend = async () => {
    const next = {}
    if (!email)                 next.email = 'Email wajib diisi.'
    else if (!EMAIL_RE.test(email)) next.email = 'Format email tidak valid.'
    if (Object.keys(next).length) { setErrors(next); return }

    setErrors({}); setLoading(true)
    try {
      await authApi.forgotPassword(email)
      onEmailSent(email)
    } catch (e) {
      setErrors({ email: e.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* ═══════════════════════════ MOBILE ═══════════════════════════ */}
      <div className="lg:hidden">
        <AuthFullLayout illustration="forgotPassword">
          <div className="animate-fade-in-up">
            <div className="relative flex items-center justify-center mb-5">
              <button
                onClick={() => onNavigate('login')}
                aria-label="Kembali ke login"
                className="absolute left-0 text-foreground hover:text-muted-foreground transition-colors">
                <ChevronLeft size={22} />
              </button>
              <h1 className="font-cera-pro text-xl font-bold text-foreground">Lupa Password?</h1>
            </div>
            <p className="text-sm text-muted-foreground mb-7">
              Masukkan email kamu yang terdaftar. Kami akan mengirimkan tautan untuk mengubah password kamu.
            </p>
          </div>

          <div className="space-y-5 animate-fade-in-up delay-100">
            <div className="space-y-1.5">
              <Label>Email</Label>
              <IconInput icon={Mail} type="email" placeholder="Masukkan email kamu"
                value={email}
                className={errors.email ? ERR_INPUT : ''}
                onChange={e => { setEmail(e.target.value); clearFieldError('email') }}
                onKeyDown={e => e.key === 'Enter' && handleSend()} />
              {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
            </div>
            <Button className="w-full rounded-full" onClick={handleSend} disabled={loading || !email}>
              {loading ? <><Loader2 size={16} className="animate-spin" /> Mengirim...</> : 'Kirim Tautan'}
            </Button>
          </div>
        </AuthFullLayout>
      </div>

      {/* ═══════════════════════════ DESKTOP (dark) ═══════════════════════════ */}
      <div className="hidden lg:block">
        <AuthDarkLayout>
          <div className="animate-fade-in-up">
            <h1 className="font-cera-pro text-[48px] font-bold text-white mb-4">Lupa Password?</h1>
            <p className="text-[15px] text-white/60 leading-relaxed mb-10 max-w-[440px]">
              Masukkan email kamu yang terdaftar dan kami akan mengirimkan tautan untuk mengatur ulang kata sandi kamu.
            </p>
          </div>

          <div className="space-y-5 animate-fade-in-up delay-100">
            <div className="space-y-2">
              <label className="text-[14px] font-semibold text-white/85">Email</label>
              <DarkInput icon={Mail} type="email" placeholder="Masukkan email"
                value={email} error={errors.email}
                onChange={e => { setEmail(e.target.value); clearFieldError('email') }}
                onKeyDown={e => e.key === 'Enter' && handleSend()} />
              {errors.email && <p className="text-xs text-red-300">{errors.email}</p>}
            </div>

            <DarkPrimaryButton variant="white" onClick={handleSend} disabled={loading || !email}>
              {loading ? <><Loader2 size={18} className="animate-spin" /> Mengirim...</> : 'Kirim Tautan'}
            </DarkPrimaryButton>

            <DarkDivider />

            <DarkGhostButton onClick={() => onNavigate('login')}>
              <LogIn size={17} /> Kembali Ke Login
            </DarkGhostButton>
          </div>
        </AuthDarkLayout>
      </div>
    </>
  )
}
