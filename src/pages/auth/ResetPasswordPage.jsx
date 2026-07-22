import { useState, useEffect } from 'react'
import { Lock, Loader2, Check, Circle, Eye, EyeOff, LogIn } from 'lucide-react'
import { AuthDarkLayout, DarkInput, DarkTogglePassword, DarkPrimaryButton } from '@/components/shared/DarkAuth'
import { SuccessToast }              from '@/components/shared/SuccessToast'
import { cn }      from '@/lib/utils'
import { authApi } from '@/lib/api'
import { Logo } from '@/components/shared/Logo'


// Input password bertema gelap khusus layar mobile.
function DarkPwdInput({ value, onChange, placeholder, show, onToggle, error }) {
  return (
    <div className="relative">
      <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={cn(
          'w-full rounded-full bg-white/[0.06] border pl-12 pr-12 py-3.5 text-[15px] text-white placeholder:text-white/30 outline-none transition-colors focus:border-[#a78bfa]/70 focus:bg-white/[0.09]',
          error ? 'border-red-400/70' : 'border-white/12'
        )}
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
      >
        {show ? <Eye size={18} /> : <EyeOff size={18} />}
      </button>
    </div>
  )
}

export function ResetPasswordPage({ token, email, onNavigate }) {
  const [password, setPassword]       = useState('')
  const [confirm, setConfirm]         = useState('')
  const [showPass, setShowPass]       = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading]         = useState(false)
  const [errors, setErrors]           = useState({})
  const [success, setSuccess]         = useState(false)

  const clearFieldError = (field) =>
    setErrors(prev => ({ ...prev, [field]: '' }))
  const [redirectSecs, setRedirectSecs] = useState(10)

  useEffect(() => {
    if (!success) return
    if (redirectSecs <= 0) { onNavigate('login'); return }
    const t = setTimeout(() => setRedirectSecs(s => s - 1), 1000)
    return () => clearTimeout(t)
  }, [success, redirectSecs])

  const passwordRules = [
    { label: 'Minimal 10 karakter', ok: password.length >= 10 },
    { label: 'Minimal 1 huruf kapital', ok: /[A-Z]/.test(password) },
    { label: 'Minimal 1 angka', ok: /\d/.test(password) },
    { label: 'Minimal 1 karakter spesial', ok: /[^A-Za-z0-9]/.test(password) },
  ]
  const allRulesOk = passwordRules.every(r => r.ok)

  const handleReset = async () => {
    const next = {}
    if (!password)                 next.password = 'Password baru wajib diisi.'
    else if (!allRulesOk)          next.password = 'Password belum memenuhi semua ketentuan.'
    if (!confirm)                  next.confirm  = 'Konfirmasi password wajib diisi.'
    else if (password !== confirm) next.confirm  = 'Konfirmasi password tidak cocok.'
    if (Object.keys(next).length) { setErrors(next); return }

    setErrors({}); setLoading(true)
    try {
      await authApi.resetPassword(token, email, password)
      setSuccess(true)
    } catch (e) {
      setErrors({ general: e.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {success && <SuccessToast message="Berhasil ubah password baru" />}

      {/* ═══════════════ MOBILE (tema gelap, sesuai reference) ═══════════════ */}
      <div
        className="lg:hidden relative min-h-screen flex flex-col text-white px-6 pt-4 pb-8"
        style={{
          background:
            'radial-gradient(ellipse at 50% 0%, #4c1d95 0%, #2e1065 40%, #1a0b3d 75%, #120833 100%)',
        }}
      >
        {/* Logo — padding kiri/atas 16px (px-6 induk dikompensasi -ml-2) */}
        <div className="flex items-center -ml-2 mb-8 shrink-0">
          <Logo variant="mobile" />
        </div>

        {success ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center animate-fade-in-up">
            <div className="w-20 h-20 rounded-full bg-[#22c55e] flex items-center justify-center mb-7 shadow-[0_0_40px_rgba(34,197,94,0.4)]">
              <Check size={40} strokeWidth={3} className="text-white" />
            </div>
            <h1 className="text-[26px] font-bold mb-3">Berhasil mengubah password!</h1>
            <p className="text-white/55 text-[14px] leading-relaxed max-w-xs mb-8">
              Password kamu berhasil diperbarui. Silakan login dengan password baru.
            </p>
            <button
              onClick={() => onNavigate('login')}
              className="px-10 py-3.5 rounded-full bg-white text-[#1a0b3d] font-bold text-[15px] hover:bg-white/90 active:scale-[0.98] transition-all"
            >
              Kembali Ke Login
            </button>
            <p className="text-[13px] text-white/40 mt-6">
              Mengalihkan dalam <span className="font-semibold text-white/70">{redirectSecs}</span> detik...
            </p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col animate-fade-in-up">
            <h1 className="font-cera-pro text-[28px] font-bold mb-6">Ubah Password</h1>

            <div className="space-y-4">
              {errors.general && (
                <p className="text-sm text-red-300 text-center">{errors.general}</p>
              )}

              <div className="space-y-1.5">
                <label className="text-[14px] font-medium text-white/80">Password Baru</label>
                <DarkPwdInput
                  value={password}
                  placeholder="Masukkan password baru"
                  show={showPass}
                  onToggle={() => setShowPass(v => !v)}
                  error={errors.password}
                  onChange={e => { setPassword(e.target.value); clearFieldError('password') }}
                />
                {errors.password && <p className="text-xs text-red-300">{errors.password}</p>}
              </div>

              {/* Ketentuan password — muncul hanya saat mulai ngetik */}
              {password.length > 0 && (
                <ul className="space-y-2 py-1">
                  {passwordRules.map(rule => (
                    <li
                      key={rule.label}
                      className={cn(
                        'flex items-center gap-2 text-[13px] transition-colors',
                        rule.ok ? 'text-[#4ADE80]' : 'text-white/45'
                      )}
                    >
                      {rule.ok ? (
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#22c55e] text-white shrink-0">
                          <Check size={11} strokeWidth={3} />
                        </span>
                      ) : (
                        <Circle size={16} className="text-white/25 shrink-0" />
                      )}
                      {rule.label}
                    </li>
                  ))}
                </ul>
              )}

              <div className="space-y-1.5">
                <label className="text-[14px] font-medium text-white/80">Konfirmasi Password Baru</label>
                <DarkPwdInput
                  value={confirm}
                  placeholder="Ulangi password baru"
                  show={showConfirm}
                  onToggle={() => setShowConfirm(v => !v)}
                  error={errors.confirm}
                  onChange={e => { setConfirm(e.target.value); clearFieldError('confirm') }}
                />
                {errors.confirm && <p className="text-xs text-red-300">{errors.confirm}</p>}
              </div>

              <button
                onClick={handleReset}
                disabled={loading || !password || !confirm}
                className="w-full py-4 rounded-2xl font-bold text-[15px] bg-white text-[#1a0b3d] hover:bg-white/90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
              >
                {loading ? <><Loader2 size={18} className="animate-spin" /> Memproses...</> : 'Ubah Password'}
              </button>

              <button
                onClick={() => onNavigate('login')}
                className="flex items-center gap-1.5 text-[14px] text-white/55 underline underline-offset-2 hover:text-white transition-colors mx-auto pt-1"
              >
                <LogIn size={15} /> Kembali Ke Login
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════ DESKTOP (dark) ═══════════════════════════ */}
      <div className="hidden lg:block">
        <AuthDarkLayout>
          {success ? (
            <div className="flex flex-col items-center text-center animate-fade-in-up">
              <div className="w-20 h-20 rounded-full bg-[#22c55e] flex items-center justify-center mb-7 shadow-[0_0_40px_rgba(34,197,94,0.4)]">
                <Check size={40} strokeWidth={3} className="text-white" />
              </div>
              <h1 className="text-[28px] font-bold text-white mb-3">Berhasil mengubah password!</h1>
              <p className="text-white/55 text-[15px] leading-relaxed max-w-sm mb-8">
                Password kamu berhasil diperbarui. Silakan login dengan password baru.
              </p>
              <button
                onClick={() => onNavigate('login')}
                className="px-10 py-3.5 rounded-full bg-white text-[#1a0b3d] font-bold text-[15px] hover:bg-white/90 active:scale-[0.98] transition-all"
              >
                Kembali Ke Login
              </button>
              <p className="text-[13px] text-white/40 mt-6">
                Mengalihkan dalam <span className="font-semibold text-white/70">{redirectSecs}</span> detik...
              </p>
            </div>
          ) : (
            <>
              <div className="animate-fade-in-up mb-8">
                <h1 className="font-cera-pro text-[48px] font-bold text-white">Ubah Password</h1>
              </div>

              <div className="space-y-5 animate-fade-in-up delay-100">
                {errors.general && (
                  <p className="text-sm text-red-300 text-center">{errors.general}</p>
                )}

                <div className="space-y-2">
                  <label className="text-[14px] font-semibold text-white/85">Password Baru</label>
                  <DarkInput icon={Lock} type={showPass ? 'text' : 'password'}
                    placeholder="Masukkan password baru" value={password} error={errors.password}
                    onChange={e => { setPassword(e.target.value); clearFieldError('password') }}
                    iconRight={<DarkTogglePassword show={showPass} onToggle={() => setShowPass(v => !v)} />} />
                  {errors.password && <p className="text-xs text-red-300">{errors.password}</p>}

                  {password.length > 0 && (
                    <ul className="space-y-2 pt-2">
                      {passwordRules.map(rule => (
                        <li
                          key={rule.label}
                          className={cn(
                            'flex items-center gap-2 text-[13px] transition-colors',
                            rule.ok ? 'text-[#4ADE80]' : 'text-white/45'
                          )}
                        >
                          {rule.ok ? (
                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#22c55e] text-white shrink-0">
                              <Check size={11} strokeWidth={3} />
                            </span>
                          ) : (
                            <Circle size={16} className="text-white/25 shrink-0" />
                          )}
                          {rule.label}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[14px] font-semibold text-white/85">Konfirmasi Password Baru</label>
                  <DarkInput icon={Lock} type={showConfirm ? 'text' : 'password'}
                    placeholder="Ulangi password baru" value={confirm} error={errors.confirm}
                    onChange={e => { setConfirm(e.target.value); clearFieldError('confirm') }}
                    iconRight={<DarkTogglePassword show={showConfirm} onToggle={() => setShowConfirm(v => !v)} />} />
                  {errors.confirm && <p className="text-xs text-red-300">{errors.confirm}</p>}
                </div>

                <DarkPrimaryButton onClick={handleReset} disabled={loading || success || !password || !confirm}>
                  {loading ? <><Loader2 size={18} className="animate-spin" /> Memproses...</> : 'Ubah Password'}
                </DarkPrimaryButton>
              </div>
            </>
          )}
        </AuthDarkLayout>
      </div>
    </>
  )
}
