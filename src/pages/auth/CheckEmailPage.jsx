import { useState, useEffect } from 'react'
import { Mail, LogIn, Loader2 } from 'lucide-react'
import { AuthFullLayout } from '@/components/layout/AuthFullLayout'
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
            <h1 className="font-poppins text-2xl font-semibold text-foreground mb-6">Cek Email Kamu</h1>
            <p className="text-sm text-muted-foreground leading-relaxed mb-8">
              Kami telah mengirimkan tautan pemulihan ke email{" "}
              <span className="font-bold text-foreground">{email}</span>. Jika kamu belum
              menerima email tersebut, periksa folder spam.
            </p>
          </div>

          <div className="space-y-6 animate-fade-in-up delay-100">
            <ErrorAlert message={error} />
            <button
              onClick={handleResend}
              disabled={!canResend || loading}
              className={cn(
                'w-full rounded-full py-3.5 text-[15px] border font-semibold text-white transition-colors',
                canResend && !loading
                  ? 'bg-[#0033EC] hover:bg-[#0033EC]/90 cursor-pointer'
                  : 'border-1 border-[#525359]/30 text-[#030b1f]/30 cursor-not-allowed'
              )}
            >
              {loading
                ? <span className="flex items-center justify-center gap-2"><Loader2 size={16} className="animate-spin" /> Mengirim...</span>
                : <>Kirim Ulang Tautan{!canResend && <span className="text-[#FF004D]/30"> ({seconds})</span>}</>
              }
            </button>

            <button onClick={() => onNavigate('login')}
              className="flex items-center justify-center gap-1.5 text-[14px] font-semibold text-[#0033EC] hover:opacity-80 transition-opacity mx-auto pt-1">
              <LogIn size={20} /> Kembali ke Login
            </button>
          </div>
        </AuthFullLayout>
      </div>

      {/* ═══════════════════════════ DESKTOP (dark) ═══════════════════════════ */}
      <div className="hidden lg:block">
        <AuthDarkLayout>
          <div className="text-center animate-fade-in-up">
            <div className="w-20 h-20 rounded-full border-2 border-dashed border-[#4ADE80]/50 bg-[#22c55e]/10 flex items-center justify-center mx-auto mb-6">
              <Mail size={32} className="text-[#4ADE80]" />
            </div>
            <h1 className="font-cera-pro text-[48px] font-bold text-white mb-4">Cek Email Kamu</h1>
              <p className="text-[14px] text-white mb-10">
              Kami telah mengirimkan tautan pemulihan ke email{" "}
              <span className="text-[14px] font-bold text-white mt-1 mb-2">{email}</span>. Jika kamu belum
              menerima email tersebut, periksa folder spam.
            </p>
          </div>

          <div className="space-y-10 animate-fade-in-up delay-100">
            {error && <p className="text-sm text-red-300 text-center">{error}</p>}
            <button
              onClick={handleResend}
              disabled={!canResend || loading}
              className={cn(
                'w-full rounded-full py-3.5 text-[15px] text-[#030B1F] font-semibold border border-white/0 bg-white transition-colors',
                canResend && !loading
                  ? 'text-030B1F hover:bg-white cursor-pointer'
                  : 'text-030B1F/40 bg-white/30 cursor-not-allowed'
              )}
            >
              {loading
                ? <span className="flex items-center justify-center gap-2"><Loader2 size={16} className="animate-spin" /> Mengirim...</span>
                : <>Kirim Ulang Link{!canResend && <span className="text-[#FF004D]/30"> ({seconds})</span>}</>
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
