import React, { useState, useRef, useEffect } from 'react'
import {
  Eye, EyeOff, Mail, Lock, LogIn, ArrowRight,
  Calendar, ChevronDown, CheckCircle2, User
} from 'lucide-react'

// ─── UTILITY ─────────────────────────────────────────────────────────────────
const cn = (...classes) => classes.filter(Boolean).join(' ')

// ─── UI PRIMITIVES ─────────────────────────────────────────────────────────
function Input({ icon: Icon, iconRight, type = 'text', placeholder, value, onChange, className, ...props }) {
  return (
    <div className="relative flex items-center">
      {Icon && (
        <span className="absolute left-3 text-gray-400 pointer-events-none">
          <Icon size={16} />
        </span>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={cn(
          'w-full h-11 rounded-lg border border-gray-200 bg-white text-sm text-gray-900',
          'placeholder:text-gray-400 transition-all duration-200',
          'focus:outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/8',
          'hover:border-gray-300',
          Icon ? 'pl-10' : 'pl-3.5',
          iconRight ? 'pr-10' : 'pr-3.5',
          className
        )}
        {...props}
      />
      {iconRight}
    </div>
  )
}

function Button({ children, variant = 'primary', className, disabled, ...props }) {
  const base = 'w-full h-11 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer'
  const variants = {
    primary: 'bg-gray-900 text-white hover:bg-gray-800 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed',
    ghost: 'bg-transparent text-gray-500 hover:text-gray-900'
  }
  return (
    <button className={cn(base, variants[variant], className)} disabled={disabled} {...props}>
      {children}
    </button>
  )
}

function Label({ children }) {
  return <label className="block text-sm font-medium text-gray-800 mb-1.5">{children}</label>
}

function Divider() {
  return (
    <div className="flex items-center gap-3 my-1">
      <div className="flex-1 h-px bg-gray-100" />
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
        const done = currentStep > s.n
        const active = currentStep === s.n
        return (
          <React.Fragment key={s.n}>
            <div className="flex flex-col items-center">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300',
                done || active ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-500'
              )}>
                {done ? <CheckCircle2 size={16} /> : s.n}
              </div>
              <span className={cn(
                'text-xs mt-1.5 font-medium whitespace-nowrap',
                active ? 'text-gray-900' : done ? 'text-gray-600' : 'text-gray-400'
              )}>{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={cn(
                'h-0.5 flex-1 mt-4 mx-1 transition-all duration-500',
                currentStep > s.n ? 'bg-gray-900' : 'bg-gray-200'
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
    <div className="hidden lg:flex w-[46%] bg-gray-50 grid-pattern relative flex-col items-center justify-center overflow-hidden">
      {/* Decorative circle */}
      <div className="relative flex items-center justify-center">
        <div className="w-72 h-72 rounded-full border border-gray-200 absolute" />
        <div className="w-48 h-48 rounded-full border border-gray-200 absolute" />
        {/* Crosshair */}
        <div className="absolute w-px h-80 bg-gray-200" />
        <div className="absolute h-px w-80 bg-gray-200" />
        {/* Center placeholder */}
        <div className="w-16 h-16 bg-white border border-gray-200 rounded-2xl flex items-center justify-center shadow-sm z-10">
          <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
            <span className="text-white font-display font-bold text-sm">G</span>
          </div>
        </div>
      </div>
      {/* Bottom branding */}
      <div className="absolute bottom-8 text-center">
        <p className="text-xs text-gray-400 font-medium tracking-widest uppercase">Gasing Circle</p>
        <p className="text-xs text-gray-400 mt-1">Platform Komunitas Guru GASING</p>
      </div>
    </div>
  )
}

// ─── RIGHT PANEL WRAPPER ─────────────────────────────────────────────────────
function RightPanel({ children }) {
  return (
    <div className="flex-1 flex flex-col min-h-screen bg-white">
      <div className="flex-1 flex flex-col justify-center px-10 lg:px-16 py-12 max-w-md w-full mx-auto">
        {children}
      </div>
      <div className="pb-6 px-10 lg:px-16">
        <p className="text-xs text-gray-400 text-center">©2026 Gasing Circle. All rights reserved.</p>
      </div>
    </div>
  )
}

// ─── PAGE: LOGIN ─────────────────────────────────────────────────────────────
function LoginPage({ onNavigate }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [remember, setRemember] = useState(false)

  return (
    <RightPanel>
      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-10 animate-fade-in-up">
        <div className="w-9 h-9 rounded-xl bg-gray-900 flex items-center justify-center">
          <span className="text-white font-display font-bold text-base">G</span>
        </div>
        <span className="font-semibold text-gray-900 text-base">Gasing Circle</span>
      </div>

      <div className="animate-fade-in-up delay-100">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Selamat Datang Kembali</h1>
        <p className="text-sm text-gray-500 mb-8">Masukkan detail Anda untuk masuk ke akun.</p>
      </div>

      <div className="space-y-4 animate-fade-in-up delay-200">
        <div>
          <Label>Email</Label>
          <Input icon={Mail} type="email" placeholder="Masukkan email Anda" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div>
          <Label>Password</Label>
          <Input
            icon={Lock}
            type={showPass ? 'text' : 'password'}
            placeholder="Masukkan password Anda"
            value={password}
            onChange={e => setPassword(e.target.value)}
            iconRight={
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer group">
            <div
              onClick={() => setRemember(!remember)}
              className={cn(
                'w-4 h-4 rounded border-2 flex items-center justify-center transition-all',
                remember ? 'bg-gray-900 border-gray-900' : 'border-gray-300 group-hover:border-gray-400'
              )}
            >
              {remember && <div className="w-2 h-2 bg-white rounded-sm" />}
            </div>
            <span className="text-sm text-gray-600">Ingatkan saya</span>
          </label>
          <button className="text-sm text-gray-500 hover:text-gray-900 transition-colors underline underline-offset-2">
            Lupa password?
          </button>
        </div>

        <Button onClick={() => {}}>
          Masuk ke Komunitas
        </Button>
      </div>

      <Divider />

      <div className="animate-fade-in-up delay-300 text-center">
        <p className="text-sm text-gray-500">
          Belum punya akun?{' '}
          <button
            onClick={() => onNavigate('signup-buat-akun')}
            className="font-semibold text-gray-900 hover:underline underline-offset-2 transition-all"
          >
            Daftar Sekarang
          </button>
        </p>
      </div>
    </RightPanel>
  )
}

// ─── PAGE: SIGN UP STEP 1 ────────────────────────────────────────────────────
function SignUpBuatAkunPage({ onNavigate }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleNext = () => {
    onNavigate('signup-verifikasi-data')
  }

  return (
    <RightPanel>
      <StepIndicator currentStep={1} />

      <div className="animate-fade-in-up delay-100">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Daftar Akun Baru</h1>
        <p className="text-sm text-gray-500 mb-8">Silakan isi data di bawah ini untuk buat akun.</p>
      </div>

      <div className="space-y-4 animate-fade-in-up delay-200">
        <div>
          <Label>Email</Label>
          <Input icon={Mail} type="email" placeholder="Masukkan email" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div>
          <Label>Password</Label>
          <Input
            icon={Lock}
            type={showPass ? 'text' : 'password'}
            placeholder="Masukkan password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            iconRight={
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 text-gray-400 hover:text-gray-600 transition-colors">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
          />
        </div>
        <div>
          <Label>Konfirmasi Password</Label>
          <Input
            icon={Lock}
            type={showConfirm ? 'text' : 'password'}
            placeholder="Konfirmasi password Anda"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            iconRight={
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 text-gray-400 hover:text-gray-600 transition-colors">
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
          />
        </div>

        <Button onClick={handleNext}>Lanjutkan</Button>
      </div>

      <Divider />

      <div className="animate-fade-in-up delay-300 space-y-4">
        <p className="text-xs text-gray-400 text-center">
          Dengan mengklik lanjutkan, Anda menyetujui{' '}
          <a href="#" className="underline text-gray-600 hover:text-gray-900">Ketentuan Layanan</a>
          {' '}dan Kebijakan{' '}
          <a href="#" className="underline text-gray-600 hover:text-gray-900">Privasi kami.</a>
        </p>
        <button
          onClick={() => onNavigate('login')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors mx-auto"
        >
          <LogIn size={15} />
          Login
        </button>
      </div>
    </RightPanel>
  )
}

// ─── PAGE: SIGN UP STEP 2A — FORM DATA ───────────────────────────────────────
const DAERAH_OPTIONS = [
  'Jakarta', 'Bandung', 'Surabaya', 'Yogyakarta', 'Semarang',
  'Medan', 'Makassar', 'Palembang', 'Bali', 'Bogor',
  'Bekasi', 'Tangerang', 'Depok', 'Malang', 'Solo'
]

function SignUpVerifikasiDataPage({ onNavigate }) {
  const [nama, setNama] = useState('')
  const [username, setUsername] = useState('')
  const [tgl, setTgl] = useState('')
  const [daerah, setDaerah] = useState('')
  const [sekolah, setSekolah] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)

  const handleNext = () => onNavigate('signup-otp')

  return (
    <RightPanel>
      <StepIndicator currentStep={2} />

      <div className="animate-fade-in-up delay-100">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Verifikasi Data</h1>
        <p className="text-sm text-gray-500 mb-8">Silakan masukkan verifikasi data diri yang sesuai.</p>
      </div>

      <div className="space-y-4 animate-fade-in-up delay-200">
        <div>
          <Label>Nama Lengkap</Label>
          <Input icon={User} placeholder="Masukkan nama lengkap Anda" value={nama} onChange={e => setNama(e.target.value)} />
        </div>
        <div>
          <Label>Username</Label>
          <Input icon={User} placeholder="Masukkan username Anda" value={username} onChange={e => setUsername(e.target.value)} />
        </div>
        <div>
          <Label>Tanggal Lahir</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              <Calendar size={16} />
            </span>
            <input
              type="date"
              value={tgl}
              onChange={e => setTgl(e.target.value)}
              placeholder="Tanggal lahir Anda"
              className="w-full h-11 pl-10 pr-3.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/8 hover:border-gray-300 transition-all"
            />
          </div>
        </div>

        {/* Custom dropdown */}
        <div>
          <Label>Alumni pelatihan GASING di mana?</Label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowDropdown(!showDropdown)}
              className={cn(
                'w-full h-11 px-3.5 rounded-lg border border-gray-200 bg-white text-sm text-left flex items-center justify-between',
                'hover:border-gray-300 transition-all focus:outline-none focus:border-gray-900',
                !daerah && 'text-gray-400'
              )}
            >
              <span>{daerah || 'Pilih Daerah'}</span>
              <ChevronDown size={16} className={cn('text-gray-400 transition-transform', showDropdown && 'rotate-180')} />
            </button>
            {showDropdown && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-auto animate-fade-in">
                {DAERAH_OPTIONS.map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => { setDaerah(d); setShowDropdown(false) }}
                    className={cn(
                      'w-full px-3.5 py-2.5 text-sm text-left hover:bg-gray-50 transition-colors',
                      daerah === d && 'bg-gray-50 font-medium'
                    )}
                  >
                    {d}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <Label>Alumni pelatihan GASING dari sekolah mana?</Label>
          <Input placeholder="Masukkan sekolah Anda saat itu" value={sekolah} onChange={e => setSekolah(e.target.value)} />
        </div>

        <Button onClick={handleNext}>Lanjutkan</Button>
      </div>

      <Divider />

      <div className="animate-fade-in-up delay-300 space-y-4">
        <p className="text-xs text-gray-400 text-center">
          Dengan mengklik lanjutkan, Anda menyetujui{' '}
          <a href="#" className="underline text-gray-600 hover:text-gray-900">Ketentuan Layanan</a>
          {' '}dan Kebijakan{' '}
          <a href="#" className="underline text-gray-600 hover:text-gray-900">Privasi kami.</a>
        </p>
        <button
          onClick={() => onNavigate('login')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors mx-auto"
        >
          <LogIn size={15} />
          Login
        </button>
      </div>
    </RightPanel>
  )
}

// ─── PAGE: SIGN UP STEP 2B — OTP ─────────────────────────────────────────────
function OtpInput({ onComplete }) {
  const [values, setValues] = useState(Array(6).fill(''))
  const refs = useRef([])

  const handleChange = (i, val) => {
    const v = val.replace(/\D/g, '').slice(-1)
    const next = [...values]
    next[i] = v
    setValues(next)
    if (v && i < 5) refs.current[i + 1]?.focus()
    if (next.every(x => x !== '')) onComplete?.(next.join(''))
  }

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !values[i] && i > 0) {
      refs.current[i - 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (paste.length === 6) {
      setValues(paste.split(''))
      refs.current[5]?.focus()
      onComplete?.(paste)
    }
    e.preventDefault()
  }

  return (
    <div className="flex gap-2 justify-center">
      {values.map((v, i) => (
        <input
          key={i}
          ref={el => refs.current[i] = el}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={v}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)}
          onPaste={handlePaste}
          className={cn('otp-input', v && 'filled')}
        />
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

function SignUpOtpPage({ onNavigate }) {
  const { display, expired, reset } = useCountdown(600)
  const [otpDone, setOtpDone] = useState(false)

  return (
    <RightPanel>
      <StepIndicator currentStep={2} />

      <div className="animate-fade-in-up delay-100 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Silakan Selesaikan Verifikasi</h1>
        <p className="text-sm text-gray-500 mb-2">Masukkan kode yang telah kami kirimkan ke email</p>
        <p className="text-sm font-semibold text-gray-900 mb-8">jok*******@gmail.com.</p>
      </div>

      <div className="animate-fade-in-up delay-200 space-y-6">
        <OtpInput onComplete={() => setOtpDone(true)} />

        <Button
          disabled={!otpDone}
          onClick={() => onNavigate('signup-review')}
          className={cn(!otpDone && 'opacity-50 !bg-gray-400')}
        >
          Verifikasi Kode OTP
        </Button>

        <div className="text-center">
          {expired ? (
            <button
              onClick={reset}
              className="text-sm text-gray-900 font-medium underline underline-offset-2"
            >
              Kirim ulang kode
            </button>
          ) : (
            <p className="text-sm text-gray-500">
              Kode ini akan kedaluwarsa dalam{' '}
              <span className="font-bold text-gray-900">{display}</span>
            </p>
          )}
        </div>
      </div>
    </RightPanel>
  )
}

// ─── PAGE: SIGN UP STEP 3 — REVIEW ───────────────────────────────────────────
function SignUpReviewPage({ onNavigate }) {
  return (
    <RightPanel>
      <StepIndicator currentStep={3} />

      <div className="animate-fade-in-up delay-100 text-center">
        {/* Success icon */}
        <div className="w-16 h-16 rounded-full bg-gray-900 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={32} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Terima Kasih Telah Mendaftar</h1>
      </div>

      <div className="animate-fade-in-up delay-200 space-y-4 text-center mb-8">
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
          <p className="text-sm font-semibold text-gray-900 mb-1">
            Akun Anda sedang kami review maks. 1×24 jam
          </p>
          <p className="text-sm text-gray-500">
            untuk memastikan Anda sudah terdaftar secara official sebagai Trainer Guru di GASING Academy.
          </p>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Mohon cek email secara berkala</span>{' '}
            untuk informasi status pengajuan akunmu.
          </p>
        </div>
      </div>

      <div className="animate-fade-in-up delay-300">
        <Button onClick={() => onNavigate('login')}>
          <LogIn size={16} />
          Back To Login
        </Button>
      </div>
    </RightPanel>
  )
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState('login')

  const pages = {
    'login': <LoginPage onNavigate={setPage} />,
    'signup-buat-akun': <SignUpBuatAkunPage onNavigate={setPage} />,
    'signup-verifikasi-data': <SignUpVerifikasiDataPage onNavigate={setPage} />,
    'signup-otp': <SignUpOtpPage onNavigate={setPage} />,
    'signup-review': <SignUpReviewPage onNavigate={setPage} />,
  }

  return (
    <div className="flex min-h-screen">
      <LeftPanel />
      {pages[page] ?? pages['login']}
    </div>
  )
}
