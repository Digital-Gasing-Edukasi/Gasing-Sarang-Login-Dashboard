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
import { authApi, regionsApi, tokenStorage } from '@/lib/api'

// ── Post-login pages ──────────────────────────────────────────────────────────
import SubscriptionPage  from '@/pages/SubscriptionPage'
import PaymentSuccessPage from '@/pages/PaymentSuccessPage'

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
    { n: 2, label: 'Verifikasi OTP' },
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
      {/* Heading */}
      <div className="px-24 pt-36 relative z-10">
        <div className="relative inline-block">
          <h1 className="text-[3.6rem] font-bold text-white leading-snug">Bertumbuh</h1>
          {/* Curved arrow decoration */}
          <svg className="absolute -top-3 left-[215px]" width="58" height="42" viewBox="0 0 58 42" fill="none">
            <path d="M6 36 C 12 8 40 2 52 20" stroke="#4ADE80" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
            <path d="M46 13 L52 20 L44 22" stroke="#4ADE80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </svg>
        </div>
        <h1 className="text-[3.6rem] font-bold text-white leading-snug">Bersama Dengan</h1>
        <h1 className="text-[3.6rem] font-bold text-[#4ADE80] leading-snug">Gasing Circle!</h1>
        {/* Hand-drawn underline */}
        <svg className="mt-2" width="238" height="14" viewBox="0 0 238 14" fill="none">
          <path d="M2 10 Q 60 2 119 8 Q 178 13 236 7" stroke="#4ADE80" strokeWidth="3" strokeLinecap="round" fill="none"/>
        </svg>
      </div>

      {/* Illustration */}
      <div className="relative flex-1 flex items-end mt-12">
        {/* Tick decoration */}
        <svg className="absolute left-8 bottom-[46%] z-10" width="28" height="48" viewBox="0 0 28 48" fill="none">
          <line x1="5" y1="44" x2="11" y2="4" stroke="#4ADE80" strokeWidth="3.5" strokeLinecap="round"/>
          <line x1="17" y1="44" x2="23" y2="4" stroke="#4ADE80" strokeWidth="3.5" strokeLinecap="round"/>
        </svg>
        <img
          src="/illustration.png"
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
function LoginPage({ onNavigate, onLoginSuccess }) {
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
      tokenStorage.setTokens(data.accessToken, data.refreshToken)
      onLoginSuccess({ email })
    } catch (e) {
      setErrors({ general: e.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <RightPanel>
      {/* Logo */}
      <div className="flex items-center justify-center gap-2.5 mb-8 animate-fade-in-up">
      {/* Jika Logo Nya sudah ada, Un-Commment Bagian ini 
        <img src="/Logo.png" alt="Logo" className="h-10 w-auto object-contain" /> */}
      <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
        <span className="font-semibold text-foreground text-base">Logo</span>
      </div>

      <div className="animate-fade-in-up delay-100 text-center">
        <h1 className="text-2xl font-bold text-foreground mb-8">Selamat Datang Kembali</h1>
      </div>

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
  const [email, setEmail]             = useState('')
  const [password, setPassword]       = useState('')
  const [confirm, setConfirm]         = useState('')
  const [name, setName]               = useState('')
  const [birthdate, setBirthdate]     = useState('')
  const [regionId, setRegionId]       = useState('')
  const [showPass, setShowPass]       = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')
  const [regions, setRegions]         = useState([])
  const [regionsLoading, setRegionsLoading] = useState(true)

  useEffect(() => {
    regionsApi.list()
      .then(data => setRegions(Array.isArray(data) ? data : (data.data || [])))
      .catch(() => setRegions([]))
      .finally(() => setRegionsLoading(false))
  }, [])

  const handleRegister = async () => {
    setError('')
    if (!email || !password || !name || !birthdate) { setError('Semua field wajib diisi'); return }
    if (password !== confirm) { setError('Konfirmasi password tidak cocok'); return }
    if (password.length < 8) { setError('Password minimal 8 karakter'); return }
    setLoading(true)
    try {
      const data = await authApi.register({ email, password, name, birthdate })
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
      <StepIndicator currentStep={1} />
      <div className="animate-fade-in-up delay-100">
        <h1 className="text-2xl font-bold text-foreground mb-1">Daftar Akun Baru</h1>
        <p className="text-sm text-muted-foreground mb-6">Silakan isi data di bawah ini untuk buat akun.</p>
      </div>

      <div className="space-y-4 animate-fade-in-up delay-200">
        <ErrorAlert message={error} />
        <div className="space-y-1.5">
          <Label>Nama Lengkap</Label>
          <IconInput icon={User} placeholder="Masukkan nama lengkap"
            value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Email</Label>
          <IconInput icon={Mail} type="email" placeholder="Masukkan email"
            value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Tanggal Lahir</Label>
          <IconInput icon={Calendar} type="date"
            value={birthdate} onChange={e => setBirthdate(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Daerah Pelatihan GASING</Label>
          <Select value={regionId} onValueChange={setRegionId} disabled={regionsLoading}>
            <SelectTrigger>
              <SelectValue placeholder={regionsLoading ? 'Memuat...' : 'Pilih daerah'} />
            </SelectTrigger>
            <SelectContent>
              {regions.map(r => (
                <SelectItem key={r.id} value={r.id}>{r.regionName || r.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Password</Label>
          <IconInput icon={Lock} type={showPass ? 'text' : 'password'}
            placeholder="Minimal 8 karakter" value={password}
            onChange={e => setPassword(e.target.value)}
            iconRight={<TogglePassword show={showPass} onToggle={() => setShowPass(v => !v)} />} />
        </div>
        <div className="space-y-1.5">
          <Label>Konfirmasi Password</Label>
          <IconInput icon={Lock} type={showConfirm ? 'text' : 'password'}
            placeholder="Ulangi password" value={confirm}
            onChange={e => setConfirm(e.target.value)}
            iconRight={<TogglePassword show={showConfirm} onToggle={() => setShowConfirm(v => !v)} />} />
        </div>
        <Button className="w-full" onClick={handleRegister} disabled={loading}>
          {loading ? <><Loader2 size={16} className="animate-spin" /> Mendaftarkan...</> : 'Lanjutkan'}
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

// ─── PAGE: FORGOT PASSWORD ────────────────────────────────────────────────────
function ForgotPasswordPage({ onNavigate }) {
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [sent, setSent]       = useState(false)

  const handleSend = async () => {
    if (!email) { setError('Email wajib diisi'); return }
    setError(''); setLoading(true)
    try {
      await authApi.forgotPassword(email)
      setSent(true)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  if (sent) return (
    <RightPanel>
      <div className="animate-fade-in-up text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mx-auto">
          <Mail size={28} className="text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Cek Email Anda</h1>
        <p className="text-sm text-muted-foreground">
          Jika email terdaftar, link reset password telah dikirim ke <strong>{email}</strong>.
        </p>
        <Button className="w-full" onClick={() => onNavigate('login')}>
          <LogIn size={16} /> Kembali ke Login
        </Button>
      </div>
    </RightPanel>
  )

  return (
    <RightPanel>
      <div className="animate-fade-in-up delay-100">
        <h1 className="text-2xl font-bold text-foreground mb-1">Lupa Password</h1>
        <p className="text-sm text-muted-foreground mb-8">Masukkan email Anda dan kami akan kirimkan link untuk reset password.</p>
      </div>
      <div className="space-y-4 animate-fade-in-up delay-200">
        <ErrorAlert message={error} />
        <div className="space-y-1.5">
          <Label>Email</Label>
          <IconInput icon={Mail} type="email" placeholder="Masukkan email terdaftar"
            value={email} onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()} />
        </div>
        <Button className="w-full" onClick={handleSend} disabled={loading}>
          {loading ? <><Loader2 size={16} className="animate-spin" /> Mengirim...</> : 'Kirim Link Reset'}
        </Button>
      </div>
      <Divider />
      <div className="text-center">
        <button onClick={() => onNavigate('login')}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mx-auto">
          <LogIn size={15} /> Kembali ke Login
        </button>
      </div>
    </RightPanel>
  )
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage]             = useState('login')
  const [otpToken, setOtpToken]     = useState('')
  const [regEmail, setRegEmail]     = useState('')
  const [currentUser, setCurrentUser] = useState(null)
  const [activePlanName, setActivePlanName] = useState('')

  // Cek query param ?payment=success dari Midtrans redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const paymentStatus = params.get('payment')
    const planName = params.get('plan') // opsional, kalau backend kirim nama plan di redirect URL

    if (paymentStatus === 'success') {
      if (planName) setActivePlanName(decodeURIComponent(planName))
      setPage('payment-success')
      // Bersihkan URL
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  const handleOtpToken = (token, email) => {
    setOtpToken(token)
    setRegEmail(email)
  }

  const handleLoginSuccess = (user) => {
    setCurrentUser(user)
    setPage('subscription')
  }

  const handleSignOut = () => {
    tokenStorage.clear()
    setCurrentUser(null)
    setPage('login')
  }

  // ── Halaman post-login (full screen, tanpa LeftPanel) ──────────────────────
  if (page === 'subscription') {
    return (
      <SubscriptionPage
        user={currentUser}
        onSignOut={handleSignOut}
      />
    )
  }

  if (page === 'payment-success') {
    return (
      <PaymentSuccessPage
        user={currentUser}
        onSignOut={handleSignOut}
        activePlanName={activePlanName}
      />
    )
  }

  // ── Halaman auth (split layout dengan LeftPanel) ───────────────────────────
  const authPages = {
    'login':           <LoginPage onNavigate={setPage} onLoginSuccess={handleLoginSuccess} />,
    'signup':          <SignUpPage onNavigate={setPage} onOtpToken={handleOtpToken} />,
    'signup-otp':      <SignUpOtpPage onNavigate={setPage} otpToken={otpToken} email={regEmail} />,
    'signup-review':   <SignUpReviewPage onNavigate={setPage} />,
    'forgot-password': <ForgotPasswordPage onNavigate={setPage} />,
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <LeftPanel />
      {authPages[page] ?? authPages['login']}
    </div>
  )
}
