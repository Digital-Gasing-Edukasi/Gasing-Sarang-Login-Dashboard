import React, { useState, useRef, useEffect } from 'react'
import { Eye, EyeOff, Mail, Lock, LogIn, Calendar, CheckCircle2, User } from 'lucide-react'

// ── shadcn/ui components ──────────────────────────────────────────────────────
import { Button }   from '@/components/ui/button'
import { Input }    from '@/components/ui/input'
import { Label }    from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'

import { cn } from '@/lib/utils'

// ─── DAERAH LIST ─────────────────────────────────────────────────────────────
const DAERAH_OPTIONS = [
  'Jakarta', 'Bandung', 'Surabaya', 'Yogyakarta', 'Semarang',
  'Medan', 'Makassar', 'Palembang', 'Bali', 'Bogor',
  'Bekasi', 'Tangerang', 'Depok', 'Malang', 'Solo',
]

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
    <button
      type="button"
      onClick={onToggle}
      className="absolute right-3 z-10 text-muted-foreground hover:text-foreground transition-colors"
    >
      {show ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  )
}

function Divider() {
  return <div className="flex items-center my-1"><div className="flex-1 h-px bg-border" /></div>
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
              )}>
                {s.label}
              </span>
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

// ─── LEFT PANEL ──────────────────────────────────────────────────────────────
function LeftPanel() {
  return (
    <div className="hidden lg:flex w-[46%] bg-secondary grid-pattern relative flex-col items-center justify-center overflow-hidden">
      <div className="relative flex items-center justify-center">
        <div className="w-72 h-72 rounded-full border border-border absolute" />
        <div className="w-48 h-48 rounded-full border border-border absolute" />
        <div className="absolute w-px h-80 bg-border" />
        <div className="absolute h-px w-80 bg-border" />
        <div className="w-16 h-16 bg-background border border-border rounded-2xl flex items-center justify-center shadow-sm z-10">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">G</span>
          </div>
        </div>
      </div>
      <div className="absolute bottom-8 text-center">
        <p className="text-xs text-muted-foreground font-medium tracking-widest uppercase">Gasing Circle</p>
        <p className="text-xs text-muted-foreground mt-1">Platform Komunitas Guru GASING</p>
      </div>
    </div>
  )
}

// ─── RIGHT PANEL ─────────────────────────────────────────────────────────────
function RightPanel({ children }) {
  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background">
      <div className="flex-1 flex flex-col justify-center px-10 lg:px-16 py-12 max-w-md w-full mx-auto">
        {children}
      </div>
      <div className="pb-6 px-10 lg:px-16">
        <p className="text-xs text-muted-foreground text-center">©2026 Gasing Circle. All rights reserved.</p>
      </div>
    </div>
  )
}

// ─── PAGE: LOGIN ─────────────────────────────────────────────────────────────
function LoginPage({ onNavigate }) {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [remember, setRemember] = useState(false)

  return (
    <RightPanel>
      <div className="flex items-center gap-2.5 mb-10 animate-fade-in-up">
        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-base">G</span>
        </div>
        <span className="font-semibold text-foreground text-base">Gasing Circle</span>
      </div>

      <div className="animate-fade-in-up delay-100">
        <h1 className="text-2xl font-bold text-foreground mb-1">Selamat Datang Kembali</h1>
        <p className="text-sm text-muted-foreground mb-8">Masukkan detail Anda untuk masuk ke akun.</p>
      </div>

      <div className="space-y-4 animate-fade-in-up delay-200">
        <div className="space-y-1.5">
          <Label htmlFor="login-email">Email</Label>
          <IconInput id="login-email" icon={Mail} type="email"
            placeholder="Masukkan email Anda" value={email} onChange={e => setEmail(e.target.value)} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="login-pass">Password</Label>
          <IconInput id="login-pass" icon={Lock} type={showPass ? 'text' : 'password'}
            placeholder="Masukkan password Anda" value={password} onChange={e => setPassword(e.target.value)}
            iconRight={<TogglePassword show={showPass} onToggle={() => setShowPass(v => !v)} />} />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Checkbox id="remember" checked={remember} onCheckedChange={setRemember} />
            <Label htmlFor="remember" className="font-normal text-muted-foreground cursor-pointer">
              Ingatkan saya
            </Label>
          </div>
          <button className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors">
            Lupa password?
          </button>
        </div>

        <Button className="w-full" onClick={() => {}}>Masuk ke Komunitas</Button>
      </div>

      <Divider />

      <div className="animate-fade-in-up delay-300 text-center">
        <p className="text-sm text-muted-foreground">
          Belum punya akun?{' '}
          <button onClick={() => onNavigate('signup-buat-akun')}
            className="font-semibold text-foreground hover:underline underline-offset-2">
            Daftar Sekarang
          </button>
        </p>
      </div>
    </RightPanel>
  )
}

// ─── PAGE: SIGN UP STEP 1 ────────────────────────────────────────────────────
function SignUpBuatAkunPage({ onNavigate }) {
  const [email, setEmail]             = useState('')
  const [password, setPassword]       = useState('')
  const [confirm, setConfirm]         = useState('')
  const [showPass, setShowPass]       = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  return (
    <RightPanel>
      <StepIndicator currentStep={1} />
      <div className="animate-fade-in-up delay-100">
        <h1 className="text-2xl font-bold text-foreground mb-1">Daftar Akun Baru</h1>
        <p className="text-sm text-muted-foreground mb-8">Silakan isi data di bawah ini untuk buat akun.</p>
      </div>

      <div className="space-y-4 animate-fade-in-up delay-200">
        <div className="space-y-1.5">
          <Label htmlFor="reg-email">Email</Label>
          <IconInput id="reg-email" icon={Mail} type="email"
            placeholder="Masukkan email" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="reg-pass">Password</Label>
          <IconInput id="reg-pass" icon={Lock} type={showPass ? 'text' : 'password'}
            placeholder="Masukkan password" value={password} onChange={e => setPassword(e.target.value)}
            iconRight={<TogglePassword show={showPass} onToggle={() => setShowPass(v => !v)} />} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="reg-confirm">Konfirmasi Password</Label>
          <IconInput id="reg-confirm" icon={Lock} type={showConfirm ? 'text' : 'password'}
            placeholder="Konfirmasi password Anda" value={confirm} onChange={e => setConfirm(e.target.value)}
            iconRight={<TogglePassword show={showConfirm} onToggle={() => setShowConfirm(v => !v)} />} />
        </div>
        <Button className="w-full" onClick={() => onNavigate('signup-verifikasi-data')}>Lanjutkan</Button>
      </div>

      <Divider />
      <div className="animate-fade-in-up delay-300 space-y-4">
        <p className="text-xs text-muted-foreground text-center">
          Dengan mengklik lanjutkan, Anda menyetujui{' '}
          <a href="#" className="underline text-foreground/70 hover:text-foreground">Ketentuan Layanan</a>
          {' '}dan Kebijakan{' '}
          <a href="#" className="underline text-foreground/70 hover:text-foreground">Privasi kami.</a>
        </p>
        <button onClick={() => onNavigate('login')}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mx-auto">
          <LogIn size={15} /> Login
        </button>
      </div>
    </RightPanel>
  )
}

// ─── PAGE: SIGN UP STEP 2 ────────────────────────────────────────────────────
function SignUpVerifikasiDataPage({ onNavigate }) {
  const [nama, setNama]       = useState('')
  const [username, setUsername] = useState('')
  const [tgl, setTgl]         = useState('')
  const [daerah, setDaerah]   = useState('')
  const [sekolah, setSekolah] = useState('')

  return (
    <RightPanel>
      <StepIndicator currentStep={2} />
      <div className="animate-fade-in-up delay-100">
        <h1 className="text-2xl font-bold text-foreground mb-1">Verifikasi Data</h1>
        <p className="text-sm text-muted-foreground mb-8">Silakan masukkan verifikasi data diri yang sesuai.</p>
      </div>

      <div className="space-y-4 animate-fade-in-up delay-200">
        <div className="space-y-1.5">
          <Label htmlFor="nama">Nama Lengkap</Label>
          <IconInput id="nama" icon={User} placeholder="Masukkan nama lengkap Anda"
            value={nama} onChange={e => setNama(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="username">Username</Label>
          <IconInput id="username" icon={User} placeholder="Masukkan username Anda"
            value={username} onChange={e => setUsername(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tgl">Tanggal Lahir</Label>
          <IconInput id="tgl" icon={Calendar} type="date"
            value={tgl} onChange={e => setTgl(e.target.value)} />
        </div>

        {/* Shadcn Select — menggantikan custom dropdown sebelumnya */}
        <div className="space-y-1.5">
          <Label>Alumni pelatihan GASING di mana?</Label>
          <Select value={daerah} onValueChange={setDaerah}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih Daerah" />
            </SelectTrigger>
            <SelectContent>
              {DAERAH_OPTIONS.map(d => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="sekolah">Alumni pelatihan GASING dari sekolah mana?</Label>
          <Input id="sekolah" placeholder="Masukkan sekolah Anda saat itu"
            value={sekolah} onChange={e => setSekolah(e.target.value)} />
        </div>

        <Button className="w-full" onClick={() => onNavigate('signup-otp')}>Lanjutkan</Button>
      </div>

      <Divider />
      <div className="animate-fade-in-up delay-300 space-y-4">
        <p className="text-xs text-muted-foreground text-center">
          Dengan mengklik lanjutkan, Anda menyetujui{' '}
          <a href="#" className="underline text-foreground/70 hover:text-foreground">Ketentuan Layanan</a>
          {' '}dan Kebijakan{' '}
          <a href="#" className="underline text-foreground/70 hover:text-foreground">Privasi kami.</a>
        </p>
        <button onClick={() => onNavigate('login')}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mx-auto">
          <LogIn size={15} /> Login
        </button>
      </div>
    </RightPanel>
  )
}

// ─── OTP INPUT (tetap custom — shadcn tidak memiliki padanannya) ──────────────
function OtpInput({ onComplete }) {
  const [values, setValues] = useState(Array(6).fill(''))
  const refs = useRef([])

  const handleChange = (i, val) => {
    const v = val.replace(/\D/g, '').slice(-1)
    const next = [...values]; next[i] = v; setValues(next)
    if (v && i < 5) refs.current[i + 1]?.focus()
    if (next.every(x => x !== '')) onComplete?.(next.join(''))
  }
  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !values[i] && i > 0) refs.current[i - 1]?.focus()
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
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)} onPaste={handlePaste}
          className={cn('otp-input', v && 'filled')} />
      ))}
    </div>
  )
}

function useCountdown(seconds) {
  const [remaining, setRemaining] = useState(seconds)
  useEffect(() => {
    if (remaining <= 0) return
    const t = setTimeout(() => setRemaining(r => r - 1), 1000)
    return () => clearTimeout(t)
  }, [remaining])
  const mm = String(Math.floor(remaining / 60)).padStart(2, '0')
  const ss = String(remaining % 60).padStart(2, '0')
  return { display: `${mm}:${ss}`, expired: remaining === 0, reset: () => setRemaining(seconds) }
}

// ─── PAGE: OTP ────────────────────────────────────────────────────────────────
function SignUpOtpPage({ onNavigate }) {
  const { display, expired, reset } = useCountdown(600)
  const [otpDone, setOtpDone] = useState(false)

  return (
    <RightPanel>
      <StepIndicator currentStep={2} />
      <div className="animate-fade-in-up delay-100 text-center">
        <h1 className="text-2xl font-bold text-foreground mb-1">Silakan Selesaikan Verifikasi</h1>
        <p className="text-sm text-muted-foreground mb-1">Masukkan kode yang telah kami kirimkan ke email</p>
        <p className="text-sm font-semibold text-foreground mb-8">jok*******@gmail.com.</p>
      </div>

      <div className="animate-fade-in-up delay-200 space-y-6">
        <OtpInput onComplete={() => setOtpDone(true)} />
        {/* shadcn Button — disabled prop sudah built-in dengan styling opacity-50 */}
        <Button className="w-full" disabled={!otpDone} onClick={() => onNavigate('signup-review')}>
          Verifikasi Kode OTP
        </Button>
        <div className="text-center">
          {expired ? (
            <button onClick={reset} className="text-sm text-foreground font-medium underline underline-offset-2">
              Kirim ulang kode
            </button>
          ) : (
            <p className="text-sm text-muted-foreground">
              Kode ini akan kedaluwarsa dalam <span className="font-bold text-foreground">{display}</span>
            </p>
          )}
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

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState('login')
  const pages = {
    'login':                  <LoginPage onNavigate={setPage} />,
    'signup-buat-akun':       <SignUpBuatAkunPage onNavigate={setPage} />,
    'signup-verifikasi-data': <SignUpVerifikasiDataPage onNavigate={setPage} />,
    'signup-otp':             <SignUpOtpPage onNavigate={setPage} />,
    'signup-review':          <SignUpReviewPage onNavigate={setPage} />,
  }
  return (
    <div className="flex min-h-screen">
      <LeftPanel />
      {pages[page] ?? pages['login']}
    </div>
  )
}
