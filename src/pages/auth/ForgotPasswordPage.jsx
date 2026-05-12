import { useState } from 'react'
import { Mail, LogIn, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label }  from '@/components/ui/label'
import { AuthFullLayout } from '@/components/layout/AuthFullLayout'
import { Divider }        from '@/components/layout/RightPanel'
import { IconInput }      from '@/components/shared/IconInput'
import { ErrorAlert }     from '@/components/shared/ErrorAlert'
import { authApi }        from '@/lib/api'

export function ForgotPasswordPage({ onNavigate, onEmailSent }) {
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
