import { useState } from 'react'
import { Mail, Lock, Loader2 } from 'lucide-react'
import { Button }   from '@/components/ui/button'
import { Label }    from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { RightPanel, Divider } from '@/components/layout/RightPanel'
import { IconInput, TogglePassword } from '@/components/shared/IconInput'
import { ErrorAlert } from '@/components/shared/ErrorAlert'
import { authApi, profileApi, tokenStorage } from '@/lib/api'

export function LoginPage({ onNavigate, onLoginSuccess, isSsoMode = false }) {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [remember, setRemember] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [errors, setErrors]     = useState({})

  const clearFieldError = (field) =>
    setErrors(prev => ({ ...prev, [field]: '' }))

  const handleLogin = async () => {
    const next = {}
    if (!email)    next.email    = 'Pastikan email tidak kosong.'
    if (!password) next.password = 'Pastikan password tidak kosong.'
    if (Object.keys(next).length) { setErrors(next); return }

    setErrors({}); setLoading(true)
    try {
      const data = await authApi.login(email, password)
      tokenStorage.setTokens(data.accessToken, data.refreshToken, remember)
      const profile = await profileApi.getMe()
      onLoginSuccess(profile)
    } catch (e) {
      setErrors({ general: e.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <RightPanel>
      <div className="flex items-center justify-center gap-2.5 mb-8 animate-fade-in-up">
        <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
        <span className="font-semibold text-foreground text-base">Logo</span>
      </div>
      <div className="animate-fade-in-up delay-100 text-center">
        <h1 className="text-2xl font-bold text-foreground mb-8">Selamat Datang Kembali</h1>
      </div>

      {isSsoMode && (
        <div className="animate-fade-in-up rounded-lg bg-blue-50 border border-blue-200 px-3.5 py-3 text-sm text-blue-700 text-center">
          Login untuk melanjutkan ke Komunitas Gasing Circle.
        </div>
      )}

      <div className="space-y-4 animate-fade-in-up delay-200">
        <ErrorAlert message={errors.general} />

        <div className="space-y-1">
          <Label htmlFor="login-email">Email</Label>
          <IconInput id="login-email" icon={Mail} type="email"
            placeholder="Masukkan email Anda" value={email}
            className={errors.email ? 'border-red-500 focus-visible:ring-red-200' : ''}
            onChange={e => { setEmail(e.target.value); clearFieldError('email') }}
            onKeyDown={e => e.key === 'Enter' && handleLogin()} />
          {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
        </div>

        <div className="space-y-1">
          <Label htmlFor="login-pass">Password</Label>
          <IconInput id="login-pass" icon={Lock} type={showPass ? 'text' : 'password'}
            placeholder="Masukkan password Anda" value={password}
            className={errors.password ? 'border-red-500 focus-visible:ring-red-200' : ''}
            onChange={e => { setPassword(e.target.value); clearFieldError('password') }}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            iconRight={<TogglePassword show={showPass} onToggle={() => setShowPass(v => !v)} />} />
          {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Checkbox id="remember" checked={remember} onCheckedChange={setRemember} />
            <Label htmlFor="remember" className="font-normal text-muted-foreground cursor-pointer">
              Ingatkan saya
            </Label>
          </div>
          <button onClick={() => onNavigate('forgot-password')}
            className="text-sm text-primary font-medium hover:underline underline-offset-2 transition-colors">
            Lupa Password?
          </button>
        </div>

        <Button className="w-full" onClick={handleLogin} disabled={loading}>
          {loading ? <><Loader2 size={16} className="animate-spin" /> Memproses...</> : 'Login'}
        </Button>
      </div>

      <Divider />

      <div className="animate-fade-in-up delay-300 text-center">
        <p className="text-sm text-muted-foreground">
          Belum punya akun?{' '}
          <button onClick={() => onNavigate('signup')}
            className="font-semibold text-primary hover:underline underline-offset-2">
            Daftar Sekarang
          </button>
        </p>
      </div>
    </RightPanel>
  )
}
