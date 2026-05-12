import React, { useState, useRef, useEffect } from 'react'
import {
  Eye, EyeOff, Mail, Lock, LogIn,
  Calendar, CheckCircle2, Loader2, AlertCircle, User
} from 'lucide-react'

import { Button }   from '@/components/ui/button'
import { Input }    from '@/components/ui/input'
import { Label }    from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'

import { cn } from '@/lib/utils'
import { authApi, profileApi, regionsApi, discourseApi, tokenStorage } from '@/lib/api'

import SubscriptionPage    from '@/pages/SubscriptionPage'
import PaymentSuccessPage  from '@/pages/PaymentSuccessPage'
import AdminDashboardPage  from '@/pages/AdminDashboardPage'
import MidtransTestPage    from '@/pages/MidtransTestPage'
import illustrationImg     from '@/assets/illustration.png'
import illustrationForgotImg from '@/assets/illustrasi_forgotPassword.png'

// ─── SHARED UI ───────────────────────────────────────────────────────────────
function IconInput({ icon: Icon, iconRight, className, ...props }) {
  return (
    <div className="relative flex items-center">
      {Icon && (
        <span className="absolute left-3 text-muted-foreground pointer-events-none z-10">
          <Icon size={16} />
        </span>
      )}
      <Input className={cn(Icon && 'pl-10', iconRight && 'pr-10', className)} {...props} />
      {iconRight}
    </div>
  )
}

function TogglePassword({ show, onToggle }) {
  return (
    <button type="button" onClick={onToggle}
      className="absolute right-3 z-10 text-muted-foreground hover:text-foreground transition-colors">
      {show ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  )
}

function Divider() {
  return <div className="flex items-center my-1"><div className="flex-1 h-px bg-border" /></div>
}

function ErrorAlert({ message }) {
  if (!message) return null
  return (
    <div className="flex items-start gap-2.5 rounded-lg bg-red-50 border border-red-200 px-3.5 py-3 text-sm text-red-700 animate-fade-in">
      <AlertCircle size={16} className="mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  )
}

// ─── STEP INDICATOR ──────────────────────────────────────────────────────────
function StepIndicator({ currentStep }) {
  const steps = [
    { n: 1, label: 'Buat Akun' },
    { n: 2, label: 'Verifikasi Data' },
    { n: 3, label: 'Review' },
  ]
  return (
    <div className="flex items-start gap-0 mb-8 animate-fade-in-up">
      {steps.map((s, i) => {
        const done   = currentStep > s.n
        const active = currentStep === s.n
        return (
          <React.Fragment key={s.n}>
            <div className="flex flex-col items-center">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300',
                done || active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              )}>
                {done ? <CheckCircle2 size={16} /> : s.n}
              </div>
              <span className={cn(
                'text-xs mt-1.5 font-medium whitespace-nowrap',
                active ? 'text-foreground' : 'text-muted-foreground'
              )}>{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={cn(
                'h-0.5 flex-1 mt-4 mx-1 transition-all duration-500',
                currentStep > s.n ? 'bg-primary' : 'bg-muted'
              )} />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

function LeftPanel() {
  return (
    <div
      className="hidden lg:flex w-[46%] sticky top-0 h-screen flex-col overflow-hidden shrink-0"
      style={{ background: 'radial-gradient(ellipse at 72% 42%, #7C3AED 0%, #5B21B6 22%, #3B0764 52%, #0D0B2E 100%)' }}
    >
      <div className="px-24 pt-36 relative z-10">
        <div className="relative inline-block">
          <h1 className="text-[3.6rem] font-bold text-white leading-snug">Bertumbuh</h1>
          <svg className="absolute -top-3 left-[215px]" width="58" height="42" viewBox="0 0 58 42" fill="none">
            <path d="M6 36 C 12 8 40 2 52 20" stroke="#4ADE80" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
            <path d="M46 13 L52 20 L44 22" stroke="#4ADE80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </svg>
        </div>
        <h1 className="text-[3.6rem] font-bold text-white leading-snug">Bersama Dengan</h1>
        <h1 className="text-[3.6rem] font-bold text-[#4ADE80] leading-snug">Gasing Circle!</h1>
        <svg className="mt-2" width="238" height="14" viewBox="0 0 238 14" fill="none">
          <path d="M2 10 Q 60 2 119 8 Q 178 13 236 7" stroke="#4ADE80" strokeWidth="3" strokeLinecap="round" fill="none"/>
        </svg>
      </div>
      <div className="relative flex-1 flex items-end mt-12">
        <svg className="absolute left-8 bottom-[46%] z-10" width="28" height="48" viewBox="0 0 28 48" fill="none">
          <line x1="5" y1="44" x2="11" y2="4" stroke="#4ADE80" strokeWidth="3.5" strokeLinecap="round"/>
          <line x1="17" y1="44" x2="23" y2="4" stroke="#4ADE80" strokeWidth="3.5" strokeLinecap="round"/>
        </svg>
        <img
          src={illustrationImg}
          alt="Gasing Circle Community"
          className="w-full object-contain object-bottom select-none"
        />
      </div>
    </div>
  )
}

function RightPanel({ children }) {
  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background overflow-y-auto">
      <div className="flex-1 flex flex-col justify-center px-10 lg:px-16 py-12 max-w-md w-full mx-auto">
        {children}
      </div>
      <div className="pb-6">
        <p className="text-xs text-muted-foreground text-center">©2026 Gasing Circle. All rights reserved.</p>
      </div>
    </div>
  )
}

// ─── PAGE: LOGIN ─────────────────────────────────────────────────────────────
function LoginPage({ onNavigate, onLoginSuccess, isSsoMode = false }) {
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
          {errors.email && (
            <p className="text-xs text-red-500">{errors.email}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="login-pass">Password</Label>
          <IconInput id="login-pass" icon={Lock} type={showPass ? 'text' : 'password'}
            placeholder="Masukkan password Anda" value={password}
            className={errors.password ? 'border-red-500 focus-visible:ring-red-200' : ''}
            onChange={e => { setPassword(e.target.value); clearFieldError('password') }}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            iconRight={<TogglePassword show={showPass} onToggle={() => setShowPass(v => !v)} />} />
          {errors.password && (
            <p className="text-xs text-red-500">{errors.password}</p>
          )}
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

// ─── PAGE: SIGN UP ────────────────────────────────────────────────────────────
function SignUpPage({ onNavigate, onOtpToken }) {
  const [step, setStep]               = useState(1)
  const [username, setUsername]       = useState('')
  const [email, setEmail]             = useState('')
  const [password, setPassword]       = useState('')
  const [confirm, setConfirm]         = useState('')
  const [name, setName]               = useState('')
  const [birthdate, setBirthdate]     = useState('')
  const [regionId, setRegionId]       = useState('')
  const [schoolName, setSchoolName]   = useState('')
  const [showPass, setShowPass]       = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')
  const [regions, setRegions]         = useState([])
  const [regionsLoading, setRegionsLoading] = useState(true)

  useEffect(() => {
    regionsApi.list()
      .then(data => {
        const list = Array.isArray(data) ? data : (data.data || data.items || [])
        console.log('[regionsApi] response:', data, '→ list:', list)
        setRegions(list)
      })
      .catch(err => {
        console.error('[regionsApi] gagal memuat training regions:', err)
        setRegions([])
      })
      .finally(() => setRegionsLoading(false))
  }, [])

  const handleNextToData = () => {
    setError('')
    if (!username || !email || !password || !confirm) { setError('Semua field wajib diisi'); return }
    if (password !== confirm) { setError('Konfirmasi password tidak cocok'); return }
    if (password.length < 8) { setError('Password minimal 8 karakter'); return }
    setStep(2)
  }

  const handleRegister = async () => {
    setError('')
    if (!name || !birthdate || !regionId || !schoolName) { setError('Semua field wajib diisi'); return }
    setLoading(true)
    try {
      const data = await authApi.register({ username, email, password, name, birthdate, trainingRegionId: regionId, schoolName })
      onOtpToken(data.token, email)
      onNavigate('signup-otp')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <RightPanel>
      <StepIndicator currentStep={step === 1 ? 1 : 2} />
      
      {step === 1 ? (
        <>
          <div className="animate-fade-in-up delay-100">
            <h1 className="text-2xl font-bold text-foreground mb-1">Daftar Akun Baru</h1>
            <p className="text-sm text-muted-foreground mb-6">Silakan isi data di bawah ini untuk buat akun.</p>
          </div>

          <div className="space-y-4 animate-fade-in-up delay-200">
            <ErrorAlert message={error} />
            <div className="space-y-1.5">
              <Label>Username</Label>
              <Input type="text" placeholder="Masukkan username"
                value={username} onChange={e => setUsername(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <IconInput icon={Mail} type="email" placeholder="Masukkan email"
                value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Password</Label>
              <IconInput icon={Lock} type={showPass ? 'text' : 'password'}
                placeholder="Masukkan password" value={password}
                onChange={e => setPassword(e.target.value)}
                iconRight={<TogglePassword show={showPass} onToggle={() => setShowPass(v => !v)} />} />
            </div>
            <div className="space-y-1.5">
              <Label>Konfirmasi Password</Label>
              <IconInput icon={Lock} type={showConfirm ? 'text' : 'password'}
                placeholder="Konfirmasi password" value={confirm}
                onChange={e => setConfirm(e.target.value)}
                iconRight={<TogglePassword show={showConfirm} onToggle={() => setShowConfirm(v => !v)} />} />
            </div>
            <Button className="w-full" onClick={handleNextToData}>
              Lanjutkan
            </Button>
          </div>

          <Divider />
          <div className="animate-fade-in-up delay-300 space-y-3">
            <p className="text-xs text-muted-foreground text-center">
              Dengan mendaftar, Anda menyetujui{' '}
              <a href="#" className="underline text-foreground/70 hover:text-foreground">Ketentuan Layanan</a>
              {' '}dan{' '}
              <a href="#" className="underline text-foreground/70 hover:text-foreground">Kebijakan Privasi</a> kami.
            </p>
            <button onClick={() => onNavigate('login')}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mx-auto">
              <LogIn size={15} /> Sudah punya akun? Login
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="animate-fade-in-up delay-100 relative">
            <button onClick={() => setStep(1)} className="absolute -top-8 left-0 text-sm text-muted-foreground hover:text-foreground">
              &larr; Kembali
            </button>
            <h1 className="text-2xl font-bold text-foreground mb-1">Verifikasi Data</h1>
            <p className="text-sm text-muted-foreground mb-6">Silakan masukkan verifikasi data diri yang sesuai.</p>
          </div>

          <div className="space-y-4 animate-fade-in-up delay-200">
            <ErrorAlert message={error} />
            <div className="space-y-1.5">
              <Label>Nama Lengkap</Label>
              <Input placeholder="Masukkan nama lengkap" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Tanggal Lahir</Label>
              <IconInput icon={Calendar} type="date" value={birthdate} onChange={e => setBirthdate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Dimana kamu mendapat pelatihan Gasing pertama?</Label>
              <Select value={regionId} onValueChange={setRegionId} disabled={regionsLoading}>
                <SelectTrigger>
                  <SelectValue placeholder={regionsLoading ? 'Memuat...' : 'Pilih'} />
                </SelectTrigger>
                <SelectContent>
                  {regions.map(r => (
                    <SelectItem key={r.id} value={r.id}>{r.regionName || r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Nama Sekolah</Label>
              <Input placeholder="Masukkan nama sekolah" value={schoolName} onChange={e => setSchoolName(e.target.value)} />
            </div>
            <Button className="w-full" onClick={handleRegister} disabled={loading}>
              {loading ? <><Loader2 size={16} className="animate-spin" /> Mendaftarkan...</> : 'Lanjutkan'}
            </Button>
          </div>

          <div className="animate-fade-in-up delay-300 mt-6 space-y-3">
            <p className="text-xs text-muted-foreground text-center">
              Dengan mengklik lanjutkan, Anda menyetujui{' '}
              <a href="#" className="underline text-blue-500 hover:text-blue-600">Ketentuan Layanan</a>
              {' '}dan{' '}
              <a href="#" className="underline text-blue-500 hover:text-blue-600">Kebijakan Privasi</a> kami.
            </p>
            <button onClick={() => onNavigate('login')}
              className="flex items-center gap-1.5 text-sm text-foreground font-semibold hover:text-foreground/80 transition-colors mx-auto mt-4">
              <LogIn size={15} /> Login
            </button>
          </div>
        </>
      )}
    </RightPanel>
  )
}

// ─── OTP INPUT ────────────────────────────────────────────────────────────────
function OtpInput({ onComplete, disabled }) {
  const [values, setValues] = useState(Array(6).fill(''))
  const refs = useRef([])

  const handleChange = (i, val) => {
    const v = val.replace(/\D/g, '').slice(-1)
    const next = [...values]; next[i] = v; setValues(next)
    if (v && i < 5) refs.current[i + 1]?.focus()
    if (next.every(x => x !== '')) onComplete?.(next.join(''))
  }
  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace') {
      if (values[i]) { const n = [...values]; n[i] = ''; setValues(n) }
      else if (i > 0) refs.current[i - 1]?.focus()
    }
  }
  const handlePaste = (e) => {
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (paste.length === 6) { setValues(paste.split('')); refs.current[5]?.focus(); onComplete?.(paste) }
    e.preventDefault()
  }

  return (
    <div className="flex gap-2 justify-center">
      {values.map((v, i) => (
        <input key={i} ref={el => refs.current[i] = el}
          type="text" inputMode="numeric" maxLength={1} value={v}
          disabled={disabled}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)} onPaste={handlePaste}
          className={cn('otp-input', v && 'filled', disabled && 'opacity-50 cursor-not-allowed')} />
      ))}
    </div>
  )
}

function useCountdown(s) {
  const [r, setR] = useState(s)
  useEffect(() => {
    if (r <= 0) return
    const t = setTimeout(() => setR(x => x - 1), 1000)
    return () => clearTimeout(t)
  }, [r])
  const mm = String(Math.floor(r / 60)).padStart(2, '0')
  const ss = String(r % 60).padStart(2, '0')
  return { display: `${mm}:${ss}`, expired: r === 0, reset: () => setR(s) }
}

// ─── PAGE: OTP ────────────────────────────────────────────────────────────────
function SignUpOtpPage({ onNavigate, otpToken, email }) {
  const { display, expired, reset } = useCountdown(600)
  const [otpCode, setOtpCode]       = useState('')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
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

// ─── PAGE: REVIEW ─────────────────────────────────────────────────────────────
function SignUpReviewPage({ onNavigate }) {
  return (
    <RightPanel>
      <StepIndicator currentStep={3} />
      <div className="animate-fade-in-up delay-100 text-center">
        <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={32} className="text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-6">Terima Kasih Telah Mendaftar</h1>
      </div>
      <div className="animate-fade-in-up delay-200 space-y-4 text-center mb-8">
        <div className="bg-secondary rounded-xl p-4 border border-border">
          <p className="text-sm font-semibold text-foreground mb-1">Akun Anda sedang kami review maks. 1×24 jam</p>
          <p className="text-sm text-muted-foreground">untuk memastikan Anda sudah terdaftar secara official sebagai Trainer Guru di GASING Academy.</p>
        </div>
        <div className="bg-secondary rounded-xl p-4 border border-border">
          <p className="text-sm text-foreground/80">
            <span className="font-semibold">Mohon cek email secara berkala</span>{' '}
            untuk informasi status pengajuan akunmu.
          </p>
        </div>
      </div>
      <div className="animate-fade-in-up delay-300">
        <Button className="w-full" onClick={() => onNavigate('login')}>
          <LogIn size={16} /> Back To Login
        </Button>
      </div>
    </RightPanel>
  )
}

// ─── ILLUSTRATIONS ────────────────────────────────────────────────────────────

function EnvelopeCluster({ flip = false, className = '' }) {
  return (
    <svg
      viewBox="0 0 240 220"
      fill="none"
      aria-hidden="true"
      className={className}
      style={flip ? { transform: 'scaleX(-1)' } : {}}
    >
      {/* Main envelope (bottom-left, slightly rotated) */}
      <g transform="translate(10,90) rotate(-14,55,40)">
        <rect x="0" y="0" width="110" height="76" rx="7" fill="white" stroke="#0F172A" strokeWidth="2.5"/>
        <path d="M0 0 L55 40 L110 0" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      </g>

      {/* Green plant / leaf elements */}
      <path d="M2 195 C -8 168 18 145 38 156 C 22 172 6 188 2 195 Z" fill="#4ADE80"/>
      <path d="M-4 215 C -18 185 12 158 35 172 C 16 190 -1 210 -4 215 Z" fill="#4ADE80"/>
      <path d="M42 210 C 28 188 38 165 58 168 C 52 186 44 205 42 210 Z" fill="#4ADE80"/>

      {/* Smaller envelope (upper-right, different angle) */}
      <g transform="translate(128,14) rotate(12,38,28)">
        <rect x="0" y="0" width="76" height="54" rx="6" fill="white" stroke="#0F172A" strokeWidth="2"/>
        <path d="M0 0 L38 28 L76 0" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      </g>

      {/* Tiny envelope (middle) */}
      <g transform="translate(155,105) rotate(-6,28,20)">
        <rect x="0" y="0" width="56" height="40" rx="5" fill="white" stroke="#0F172A" strokeWidth="1.5"/>
        <path d="M0 0 L28 20 L56 0" stroke="#0F172A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      </g>

      {/* Green plant top-right */}
      <path d="M218 65 C 232 42 248 52 242 70 C 232 72 220 68 218 65 Z" fill="#4ADE80"/>
      <path d="M230 82 C 248 60 262 74 254 92 C 242 92 228 86 230 82 Z" fill="#4ADE80"/>

      {/* Vine / stem lines */}
      <path d="M10 200 Q 30 170 55 160" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <path d="M225 70 Q 235 90 230 115" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    </svg>
  )
}

// ─── FULL-WIDTH LAYOUT (for forgot password flow) ─────────────────────────────
function AuthFullLayout({ children, illustration = 'robot' }) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="flex items-center gap-2.5 px-8 py-5 shrink-0">
        <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
        <span className="font-semibold text-foreground">Gasing Circle</span>
      </header>
      <div className="h-px bg-border shrink-0" />

      {/* Main area */}
      <div className="flex-1 relative overflow-hidden flex flex-col">
        {/* Corner illustrations */}
        {illustration === 'forgotPassword' ? (
          <>
            <div className="absolute bottom-0 left-0 w-64 sm:w-80 lg:w-96 translate-y-8 pointer-events-none select-none">
              <img src={illustrationForgotImg} alt="" draggable="false" className="w-full h-full" />
            </div>
            <div className="absolute bottom-0 right-0 w-64 sm:w-80 lg:w-96 translate-y-8 pointer-events-none select-none">
              <img src={illustrationForgotImg} alt="" draggable="false" className="w-full h-full" style={{ transform: 'scaleX(-1)' }} />
            </div>
          </>
        ) : (
          <>
            <div className="absolute bottom-0 left-0 w-44 sm:w-56 lg:w-64 pointer-events-none select-none">
              <EnvelopeCluster />
            </div>
            <div className="absolute bottom-0 right-0 w-44 sm:w-56 lg:w-64 pointer-events-none select-none">
              <EnvelopeCluster flip />
            </div>
          </>
        )}

        {/* Page content */}
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-[420px] relative z-10">
            {children}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="pb-6 shrink-0">
        <p className="text-xs text-muted-foreground text-center">©2026 Gasing Circle. All rights reserved.</p>
      </div>
    </div>
  )
}

// ─── SUCCESS TOAST ────────────────────────────────────────────────────────────
function SuccessToast({ message }) {
  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-gray-900 text-white px-5 py-3 rounded-full shadow-xl animate-fade-in whitespace-nowrap">
      <span className="text-sm font-medium">{message}</span>
      <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shrink-0">
        <CheckCircle2 size={14} className="text-white" />
      </div>
    </div>
  )
}

// ─── PAGE: LUPA PASSWORD ──────────────────────────────────────────────────────
function ForgotPasswordPage({ onNavigate, onEmailSent }) {
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const handleSend = async () => {
    if (!email) { setError('Email wajib diisi'); return }
    setError(''); setLoading(true)
    try {
      await authApi.forgotPassword(email)
      onEmailSent(email)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthFullLayout illustration="forgotPassword">
      <div className="animate-fade-in-up">
        <h1 className="text-3xl font-bold text-foreground mb-3">Lupa Password?</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Masukkan email Anda dan kami akan mengirimkan tautan untuk mengatur ulang kata sandi Anda.
        </p>
      </div>

      <div className="space-y-4 animate-fade-in-up delay-100">
        <ErrorAlert message={error} />
        <div className="space-y-1.5">
          <Label>Email</Label>
          <IconInput icon={Mail} type="email" placeholder="Masukkan email Anda"
            value={email}
            onChange={e => { setEmail(e.target.value); setError('') }}
            onKeyDown={e => e.key === 'Enter' && handleSend()} />
        </div>
        <Button className="w-full" onClick={handleSend} disabled={loading}>
          {loading ? <><Loader2 size={16} className="animate-spin" /> Mengirim...</> : 'Kirim Tautan'}
        </Button>
      </div>

      <Divider />

      <div className="text-center">
        <button onClick={() => onNavigate('login')}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mx-auto">
          <LogIn size={15} /> Kembali Ke login
        </button>
      </div>
    </AuthFullLayout>
  )
}

// ─── PAGE: CEK EMAIL ──────────────────────────────────────────────────────────
function CheckEmailPage({ email, onNavigate }) {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [seconds, setSeconds] = useState(30)
  const canResend = seconds === 0

  useEffect(() => {
    if (seconds <= 0) return
    const t = setTimeout(() => setSeconds(s => s - 1), 1000)
    return () => clearTimeout(t)
  }, [seconds])

  const handleResend = async () => {
    if (!canResend || loading) return
    setError(''); setLoading(true)
    try {
      await authApi.forgotPassword(email)
      setSeconds(30)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthFullLayout illustration="envelope">
      <div className="text-center animate-fade-in-up">
        {/* Dashed icon circle */}
        <div className="w-20 h-20 rounded-full border-2 border-dashed border-green-300 bg-green-50 flex items-center justify-center mx-auto mb-6">
          <Mail size={30} className="text-green-500" />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-4">Cek Email Anda</h1>
        <p className="text-sm text-muted-foreground">
          Kami telah mengirimkan tautan pemulihan ke email
        </p>
        <p className="text-sm font-bold text-foreground mt-1 mb-2">{email}</p>
        <p className="text-sm text-muted-foreground mb-8">
          Jika Anda belum menerima email tersebut, periksa folder spam.
        </p>
      </div>

      <div className="space-y-2 animate-fade-in-up delay-100">
        <ErrorAlert message={error} />
        <button
          onClick={handleResend}
          disabled={!canResend || loading}
          className={cn(
            'w-full border rounded-full py-3 px-4 text-sm font-medium transition-colors',
            canResend && !loading
              ? 'border-border text-foreground hover:bg-muted cursor-pointer'
              : 'border-border text-muted-foreground cursor-not-allowed'
          )}
        >
          {loading
            ? <span className="flex items-center justify-center gap-2"><Loader2 size={14} className="animate-spin" /> Mengirim...</span>
            : <>Kirim Ulang Link{!canResend && <span className="text-orange-500"> ({seconds})</span>}</>
          }
        </button>
      </div>

      <Divider />

      <div className="text-center">
        <button onClick={() => onNavigate('login')}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mx-auto">
          <LogIn size={15} /> Kembali ke Login
        </button>
      </div>
    </AuthFullLayout>
  )
}

// ─── PAGE: UBAH PASSWORD ──────────────────────────────────────────────────────
function ResetPasswordPage({ token, email, onNavigate }) {
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

  const handleReset = async () => {
    setError('')
    if (!password)          { setError('Password baru wajib diisi'); return }
    if (password.length < 8){ setError('Password minimal 8 karakter'); return }
    if (password !== confirm){ setError('Konfirmasi password tidak cocok'); return }
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

// ─── PAGE: SSO CALLBACK ───────────────────────────────────────────────────────
function SsoCallbackPage({ sso, sig, onNavigate }) {
  const [error, setError] = useState('')
  const calledRef = useRef(false)

  useEffect(() => {
    if (calledRef.current) return
    calledRef.current = true

    console.log('[SSO] Mengirim gateway request', { sso, sig })
    discourseApi.gateway(sso, sig)
      .then(data => {
        console.log('[SSO] Full response:', JSON.stringify(data))
        const redirectUrl = data.redirectUrl || data.redirect_url || data.url || data.ssoUrl
        if (redirectUrl) {
          window.location.href = redirectUrl
        } else {
          console.error('[SSO] redirectUrl tidak ditemukan dalam response:', JSON.stringify(data))
          setError('Respons SSO tidak valid dari server.')
        }
      })
      .catch(e => {
        console.error('[SSO] Gateway error:', e.message)
        setError(e.message || 'Gagal verifikasi SSO')
      })
  }, [sso, sig])

  return (
    <RightPanel>
      <div className="flex flex-col items-center justify-center text-center space-y-4 animate-fade-in-up">
        {error ? (
          <>
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <AlertCircle size={32} className="text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Verifikasi Gagal</h1>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button className="mt-4" onClick={() => onNavigate('login')}>
              Kembali ke Login
            </Button>
          </>
        ) : (
          <>
            <Loader2 size={48} className="animate-spin text-primary mb-4" />
            <h1 className="text-2xl font-bold text-foreground">Memverifikasi Akun...</h1>
            <p className="text-sm text-muted-foreground">Mohon tunggu sebentar, kami sedang menghubungkan akun Anda.</p>
          </>
        )}
      </div>
    </RightPanel>
  )
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  // const [page, setPage]             = useState('login')
  const [page, setPage]             = useState('subscription')
  const [otpToken, setOtpToken]     = useState('')
  const [regEmail, setRegEmail]     = useState('')
  const [fpEmail, setFpEmail]       = useState('')
  const [resetToken, setResetToken] = useState('')
  const [resetEmail, setResetEmail] = useState('')
  const [ssoParams, setSsoParams]   = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [activePlanName, setActivePlanName] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const paymentStatus = params.get('payment')
    const token = params.get('token')
    const emailParam = params.get('email')
    const adminParam = params.get('admin')
    const midtransTest = params.get('midtrans-test')

    const ssoParam = params.get('sso')
    const sigParam  = params.get('sig')

    if (midtransTest === 'true') {
      setPage('midtrans-test')
      // Tidak replace URL agar bisa refresh kembali ke halaman test
    } else if (ssoParam && sigParam) {
      setSsoParams({ sso: ssoParam, sig: sigParam })
      window.history.replaceState({}, '', window.location.pathname)
      // Kalau sudah punya token, skip login langsung ke SSO callback
      if (tokenStorage.getAccess()) {
        setPage('sso-callback')
      } else {
        setPage('login')
      }
    } else if (adminParam === 'true') {
      setPage('admin-dashboard')
      window.history.replaceState({}, '', window.location.pathname)
    } else if (paymentStatus === 'success') {
      const planName = params.get('plan')
      if (planName) setActivePlanName(decodeURIComponent(planName))
      setPage('payment-success')
      window.history.replaceState({}, '', window.location.pathname)
    } else if (token) {
      setResetToken(token)
      if (emailParam) setResetEmail(decodeURIComponent(emailParam))
      setPage('reset-password')
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  const handleOtpToken = (token, email) => {
    setOtpToken(token)
    setRegEmail(email)
  }

  const handleLoginSuccess = (user) => {
    setCurrentUser(user)
    if (user?.superadmin === true || user?.superAdmin === true) {
      setPage('admin-dashboard')
      return
    }
    if (ssoParams) {
      setPage('sso-callback')
    } else {
      setPage('subscription')
      // window.location.href = import.meta.env.VITE_DISCOURSE_URL
    }
  }

  const handleSignOut = () => {
    tokenStorage.clear()
    setCurrentUser(null)
    setPage('login')
  }

  const handleEmailSent = (email) => {
    setFpEmail(email)
    setPage('check-email')
  }

  const handlePaymentSuccess = (planName) => {
    if (planName) setActivePlanName(planName)
    setPage('payment-success')
  }

  const handlePaymentPending = () => {
    // Pembayaran pending → arahkan ke admin dashboard untuk lihat status
    setPage('admin-dashboard')
  }

  // ── Full-screen pages (no split layout) ───────────────────────────────────
  if (page === 'midtrans-test') {
    return <MidtransTestPage />
  }
  if (page === 'subscription') {
    return (
      <SubscriptionPage
        user={currentUser}
        onSignOut={handleSignOut}
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentPending={handlePaymentPending}
      />
    )
  }
  if (page === 'payment-success') {
    return <PaymentSuccessPage user={currentUser} onSignOut={handleSignOut} activePlanName={activePlanName} />
  }
  if (page === 'forgot-password') {
    return <ForgotPasswordPage onNavigate={setPage} onEmailSent={handleEmailSent} />
  }
  if (page === 'check-email') {
    return <CheckEmailPage email={fpEmail} onNavigate={setPage} />
  }
  if (page === 'reset-password') {
    return <ResetPasswordPage token={resetToken} email={resetEmail} onNavigate={setPage} />
  }
  if (page === 'admin-dashboard') {
    return <AdminDashboardPage user={currentUser} onSignOut={handleSignOut} />
  }

  // ── Split layout pages (login / signup) ───────────────────────────────────
  const authPages = {
    'login':         <LoginPage onNavigate={setPage} onLoginSuccess={handleLoginSuccess} isSsoMode={!!ssoParams} />,
    'signup':        <SignUpPage onNavigate={setPage} onOtpToken={handleOtpToken} />,
    'signup-otp':    <SignUpOtpPage onNavigate={setPage} otpToken={otpToken} email={regEmail} />,
    'signup-review': <SignUpReviewPage onNavigate={setPage} />,
    'sso-callback':  ssoParams ? <SsoCallbackPage sso={ssoParams.sso} sig={ssoParams.sig} onNavigate={setPage} /> : null
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <LeftPanel />
      {authPages[page] ?? authPages['login']}
    </div>
  )
}
