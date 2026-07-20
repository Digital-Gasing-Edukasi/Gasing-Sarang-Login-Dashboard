import { useState } from 'react'
import { Mail, Lock, Loader2 } from 'lucide-react'
import { Button }   from '@/components/ui/button'
import { Label }    from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { RightPanel, Divider } from '@/components/layout/RightPanel'
import { MobileHero } from '@/components/layout/MobileHero'
import { IconInput, TogglePassword } from '@/components/shared/IconInput'
import { LoginStatusModal } from '@/components/shared/LoginStatusModal'
import { NoConnectionBanner } from '@/components/shared/NoConnectionBanner'
import { authApi, profileApi, tokenStorage } from '@/lib/api'
import { Logo } from '@/components/shared/Logo'

const ERR_INPUT = '!border-red-500 focus-visible:!border-red-500 focus-visible:ring-red-200'
const EMAIL_RE  = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Deteksi kegagalan jaringan (offline / server tak terjangkau) → banner flow 5.
const isNetworkError = (e) =>
  e instanceof TypeError ||
  (typeof navigator !== 'undefined' && navigator.onLine === false) ||
  /failed to fetch|networkerror|load failed|fetch/i.test(e?.message || '')

export function LoginPage({ onNavigate, onLoginSuccess, isSsoMode = false }) {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [remember, setRemember] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [errors, setErrors]     = useState({})
  // gate: modal saat proses login gagal — 'error' (server 5xx) atau 'suspended'
  // (backend tolak akun ditangguhkan). Status pending/expired (login sukses tapi
  // profil diblokir) di-guard terpusat di App.handleLoginSuccess.
  const [gate, setGate]         = useState(null)
  // noConn: banner "Tidak Ada Koneksi" (flow 5).
  const [noConn, setNoConn]     = useState(false)

  const clearFieldError = (field) =>
    setErrors(prev => ({ ...prev, [field]: '' }))

  const handleLogin = async () => {
    const next = {}
    if (!email)                 next.email    = 'Pastikan email tidak kosong.'
    else if (!EMAIL_RE.test(email)) next.email = "Format email tidak sesuai.";
    if (!password)              next.password = 'Pastikan password tidak kosong.'
    if (Object.keys(next).length) { setErrors(next); return }

    setErrors({}); setNoConn(false); setLoading(true)
    try {
      const data = await authApi.login(email, password)
      tokenStorage.setTokens(data.accessToken, data.refreshToken, remember)
      const profile = await profileApi.getMe()
      // Guard status akun (pending/expired/suspended) ditangani terpusat di
      // App.handleLoginSuccess — berlaku juga saat restore sesi (reload).
      onLoginSuccess(profile)
    } catch (e) {
      if (isNetworkError(e)) {
        setNoConn(true)                    // flow 5 — tidak ada koneksi
      } else if (/suspend|ditangguhkan/i.test(e?.message || '')) {
        // Backend tolak login akun ditangguhkan (mis. "Account is suspended").
        const d = e?.data || {}
        setGate({
          type: 'suspended',
          until: d.suspendedUntil || d.until || d.suspended?.until || null,
          reason: d.suspendReason || d.reason || d.suspended?.reason || 'Melanggar panduan komunitas',
        })
      } else if (e?.status >= 500) {
        setGate({ type: 'error' })         // flow 4 — server bermasalah
      } else {
        setErrors({
          password: "Password salah. Coba lagi atau pilih “Lupa Password?”",
        }); // salah kredensial / validasi
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <RightPanel mobileHero={<MobileHero />}>
      <div className="hidden lg:flex items-center justify-center mb-8 animate-fade-in-up">
        <Logo variant="split" />
      </div>
      <div className="animate-fade-in-up delay-100 text-center lg:text-center">
        <h1 className="text-2xl font-bold text-foreground mb-8 lg:mt-0 mt-2">
          <span className="lg:hidden">Selamat Datang!</span>
          <span className="hidden lg:inline">Selamat Datang!</span>
        </h1>
      </div>

      {isSsoMode && (
        <div className="animate-fade-in-up rounded-lg bg-blue-50 border border-blue-200 px-3.5 py-3 text-sm text-blue-700 text-center">
          Login untuk melanjutkan ke Komunitas Sarang Gasing.
        </div>
      )}

      <div className="space-y-4 animate-fade-in-up delay-200">
        <div className="space-y-1">
          <Label htmlFor="login-email">Email</Label>
          <IconInput
            id="login-email"
            icon={Mail}
            type="email"
            placeholder="Masukkan email kamu"
            value={email}
            className={errors.email ? ERR_INPUT : ""}
            onChange={(e) => {
              setEmail(e.target.value);
              clearFieldError("email");
            }}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />
          {errors.email && (
            <p className="text-xs text-red-500">{errors.email}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="login-pass">Password</Label>
          <IconInput
            id="login-pass"
            icon={Lock}
            type={showPass ? "text" : "password"}
            placeholder="Masukkan password kamu"
            value={password}
            className={errors.password ? ERR_INPUT : ""}
            onChange={(e) => {
              setPassword(e.target.value);
              clearFieldError("password");
            }}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            iconRight={
              <TogglePassword
                show={showPass}
                onToggle={() => setShowPass((v) => !v)}
              />
            }
          />
          {errors.password && (
            <p className="text-xs text-red-500">{errors.password}</p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Checkbox
              id="remember"
              checked={remember}
              onCheckedChange={setRemember}
            />
            <Label
              htmlFor="remember"
              className="font-normal text-muted-foreground cursor-pointer"
            >
              Ingat saya
            </Label>
          </div>
          <button
            onClick={() => onNavigate("forgot-password")}
            className="text-sm text-[#0033EC] font-medium underline underline-offset-2 transition-colors"
          >
            Lupa Password?
          </button>
        </div>

        <Button
          className="!mt-8 w-full rounded-full"
          onClick={handleLogin}
          disabled={loading || !email || !password}
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Memproses...
            </>
          ) : (
            "Login"
          )}
        </Button>
      </div>

      <div className="mt-6 animate-fade-in-up delay-300 text-center">
        <p className="text-sm text-muted-foreground">
          Belum punya akun?{" "}
          <button
            onClick={() => onNavigate("signup")}
            className="font-semibold text-[#0033EC] underline underline-offset-2"
          >
            Daftar Sekarang
          </button>
        </p>

        {/* Fake login: masuk sebagai tamu → halaman komunitas statis (ADR-0004) */}
        <button
          onClick={() => onNavigate("komunitas")}
          className="mt-2 text-[14px] font-bold text-[#424857] transition-opacity hover:opacity-70"
        >
          Lanjut Sebagai Tamu
        </button>
      </div>

      {noConn && <NoConnectionBanner onClose={() => setNoConn(false)} />}

      {gate && (
        <LoginStatusModal
          type={gate.type}
          meta={gate}
          onClose={() => {
            tokenStorage.clear();
            setGate(null);
          }}
          onRenew={() => {
            const p = gate.profile;
            setGate(null);
            onLoginSuccess(p);
          }}
          onRetry={() => setGate(null)}
        />
      )}
    </RightPanel>
  );
}
