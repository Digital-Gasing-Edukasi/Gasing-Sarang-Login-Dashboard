import { useState, useEffect } from 'react'
import { Mail, LogIn, Loader2 } from 'lucide-react'
import { AuthFullLayout } from '@/components/layout/AuthFullLayout'
import { Divider }        from '@/components/layout/RightPanel'
import { ErrorAlert }     from '@/components/shared/ErrorAlert'
import { AuthDarkLayout, DarkGhostButton, DarkDivider } from '@/components/shared/DarkAuth'
import { cn }             from '@/lib/utils'
import { authApi }        from '@/lib/api'

export function CheckEmailPage({ email, onNavigate }) {
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
    <>
      {/* ═══════════════════════════ MOBILE ═══════════════════════════ */}
      <div className="lg:hidden">
        <AuthFullLayout illustration="envelope">
          <div className="text-center animate-fade-in-up">
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
              className="flex items-center gap-1.5 text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors mx-auto">
              <LogIn size={15} /> Kembali ke Login
            </button>
          </div>
        </AuthFullLayout>
      </div>

      {/* ═══════════════════════════ DESKTOP (dark) ═══════════════════════════ */}
      <div className="hidden lg:block">
        <AuthDarkLayout>
          <div className="text-center animate-fade-in-up">
            <div className="w-20 h-20 rounded-full border-2 border-dashed border-[#4ADE80]/50 bg-[#22c55e]/10 flex items-center justify-center mx-auto mb-7">
              <Mail size={32} className="text-[#4ADE80]" />
            </div>
            <h1 className="font-cera-pro text-[48px] font-bold text-white mb-4">Cek Email Kamu</h1>
            <p className="text-[15px] text-white/60">
              Kami telah mengirimkan tautan pemulihan ke email
            </p>
            <p className="text-[15px] font-bold text-white mt-1 mb-2">{email}</p>
            <p className="text-[15px] text-white/60 mb-9">
              Jika kamu belum menerima email tersebut, periksa folder spam.
            </p>
          </div>

          <div className="space-y-3 animate-fade-in-up delay-100">
            {error && <p className="text-sm text-red-300 text-center">{error}</p>}
            <button
              onClick={handleResend}
              disabled={!canResend || loading}
              className={cn(
                'w-full rounded-full py-3.5 text-[15px] font-bold border border-white/25 transition-colors',
                canResend && !loading
                  ? 'text-white hover:bg-white/[0.06] cursor-pointer'
                  : 'text-white/40 cursor-not-allowed'
              )}
            >
              {loading
                ? <span className="flex items-center justify-center gap-2"><Loader2 size={16} className="animate-spin" /> Mengirim...</span>
                : <>Kirim Ulang Link{!canResend && <span className="text-[#facc15]"> ({seconds})</span>}</>
              }
            </button>

            <DarkDivider />

            <DarkGhostButton onClick={() => onNavigate('login')}>
              <LogIn size={17} /> Kembali ke Login
            </DarkGhostButton>
          </div>
        </AuthDarkLayout>
      </div>
    </>
  )
}
