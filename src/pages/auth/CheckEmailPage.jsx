import { useState, useEffect } from 'react'
import { Mail, LogIn, Loader2 } from 'lucide-react'
import { AuthFullLayout } from '@/components/layout/AuthFullLayout'
import { Divider }        from '@/components/layout/RightPanel'
import { ErrorAlert }     from '@/components/shared/ErrorAlert'
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
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mx-auto">
          <LogIn size={15} /> Kembali ke Login
        </button>
      </div>
    </AuthFullLayout>
  )
}
