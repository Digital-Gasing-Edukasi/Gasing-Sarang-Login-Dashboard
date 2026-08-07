import { useState, useRef, useEffect } from 'react'
import { Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RightPanel } from '@/components/layout/RightPanel'
// import { discourseApi } from '@/lib/api'  // dipakai oleh alur SSO login lama (dinonaktifkan di bawah)

export function SsoCallbackPage({ sso, sig, onNavigate, onSignOut }) {
  const [error, setError] = useState('')
  const calledRef = useRef(false)

  useEffect(() => {
    if (calledRef.current) return
    calledRef.current = true

    // ── DINONAKTIFKAN: verifikasi SSO login + pantul balik ke Discourse ──────
    // Sebelumnya callback dari Discourse (sso+sig) diverifikasi ke backend lalu
    // browser dipantulkan kembali ke Discourse. Sekarang redirect dari Discourse
    // dipakai sebagai TRIGGER SIGN OUT (single logout): sesi lokal dibersihkan
    // dan user dikembalikan ke halaman login.
    //
    // discourseApi.gateway(sso, sig)
    //   .then(data => {
    //     const redirectUrl = data.redirectUrl || data.redirect_url || data.url || data.ssoUrl
    //     if (redirectUrl) {
    //       window.location.href = redirectUrl
    //     } else {
    //       setError('Respons SSO tidak valid dari server.')
    //     }
    //   })
    //   .catch(e => setError(e.message || 'Gagal verifikasi SSO'))

    // Redirect dari Discourse → picu sign out sesi lokal.
    onSignOut?.()
  }, [sso, sig, onSignOut])

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
            <h1 className="text-2xl font-bold text-foreground">Keluar dari Akun...</h1>
            <p className="text-sm text-muted-foreground">Mohon tunggu sebentar, kami sedang mengakhiri sesi Anda.</p>
          </>
        )}
      </div>
    </RightPanel>
  )
}
