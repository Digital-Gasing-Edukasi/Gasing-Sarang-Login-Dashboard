import { useState, useEffect } from 'react'
import { Lock, Loader2, Check, Circle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label }  from '@/components/ui/label'
import { AuthFullLayout }            from '@/components/layout/AuthFullLayout'
import { IconInput, TogglePassword } from '@/components/shared/IconInput'
import { ErrorAlert }                from '@/components/shared/ErrorAlert'
import { SuccessToast }              from '@/components/shared/SuccessToast'
import { cn }      from '@/lib/utils'
import { authApi } from '@/lib/api'

export function ResetPasswordPage({ token, email, onNavigate }) {
  const [password, setPassword]       = useState('')
  const [confirm, setConfirm]         = useState('')
  const [showPass, setShowPass]       = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')
  const [success, setSuccess]         = useState(false)
  const [redirectSecs, setRedirectSecs] = useState(10)

  useEffect(() => {
    if (!success) return
    if (redirectSecs <= 0) { onNavigate('login'); return }
    const t = setTimeout(() => setRedirectSecs(s => s - 1), 1000)
    return () => clearTimeout(t)
  }, [success, redirectSecs])

  const passwordRules = [
    { label: 'Memiliki minimal 8 karakter', ok: password.length >= 8 },
    { label: 'Memiliki minimal 1 huruf kapital', ok: /[A-Z]/.test(password) },
    {
      label: 'Memiliki minimal 1 angka dan 1 karakter spesial',
      ok: /\d/.test(password) && /[^A-Za-z0-9]/.test(password),
    },
  ]
  const allRulesOk = passwordRules.every(r => r.ok)

  const handleReset = async () => {
    setError('')
    if (!password)    { setError('Password baru wajib diisi'); return }
    if (!allRulesOk)  { setError('Password belum memenuhi semua ketentuan'); return }
    if (password !== confirm) { setError('Konfirmasi password tidak cocok'); return }
    setLoading(true)
    try {
      await authApi.resetPassword(token, email, password)
      setSuccess(true)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {success && <SuccessToast message="Berhasil ubah password baru" />}
      {success && <div className="fixed inset-0 bg-white/50 z-40 pointer-events-none" />}
      <AuthFullLayout illustration="forgotPassword">
        <div className={cn('transition-opacity duration-300', success && 'opacity-50')}>
          <div className="animate-fade-in-up mb-8">
            <h1 className="text-3xl font-bold text-foreground">Ubah Password</h1>
          </div>

          <div className="space-y-4 animate-fade-in-up delay-100">
            <ErrorAlert message={error} />
            <div className="space-y-1.5">
              <Label>Password Baru</Label>
              <IconInput icon={Lock} type={showPass ? 'text' : 'password'}
                placeholder="Masukkan password baru" value={password}
                onChange={e => setPassword(e.target.value)}
                iconRight={<TogglePassword show={showPass} onToggle={() => setShowPass(v => !v)} />} />
            </div>
            <div className="space-y-1.5">
              <Label>Konfirmasi Password Baru</Label>
              <IconInput icon={Lock} type={showConfirm ? 'text' : 'password'}
                placeholder="Ulangi password baru" value={confirm}
                onChange={e => setConfirm(e.target.value)}
                iconRight={<TogglePassword show={showConfirm} onToggle={() => setShowConfirm(v => !v)} />} />
            </div>
            <Button className="w-full" onClick={handleReset} disabled={loading || success}>
              {loading ? <><Loader2 size={16} className="animate-spin" /> Memproses...</> : 'Ubah Password'}
            </Button>

            <ul className="space-y-1.5">
              {passwordRules.map(rule => (
                <li
                  key={rule.label}
                  className={cn(
                    'flex items-center gap-2 text-xs transition-colors',
                    rule.ok ? 'text-green-600' : 'text-muted-foreground'
                  )}
                >
                  {rule.ok ? (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-green-600 text-white">
                      <Check size={11} strokeWidth={3} />
                    </span>
                  ) : (
                    <Circle size={16} className="text-muted-foreground/50" />
                  )}
                  {rule.label}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {success && (
          <p className="text-center text-sm text-muted-foreground mt-6 animate-fade-in">
            Mengalihkan ke halaman login dalam{' '}
            <span className="font-semibold text-foreground">{redirectSecs}</span> detik...
          </p>
        )}
      </AuthFullLayout>
    </>
  )
}
