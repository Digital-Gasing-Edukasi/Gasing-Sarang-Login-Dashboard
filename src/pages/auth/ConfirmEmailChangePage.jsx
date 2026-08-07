import { useState, useEffect, useRef } from 'react'
import { CheckCircle2, XCircle, Loader2, LogIn } from 'lucide-react'
import { AuthDarkLayout, DarkPrimaryButton } from '@/components/shared/DarkAuth'
import { Logo } from '@/components/shared/Logo'
import { profileApi } from '@/lib/api'

// Layar konfirmasi ubah email — dibuka dari link email:
//   {baseurl}/confirm-email-change?token=xxxx
// Token diparse di App.jsx (lalu dibuang dari URL) dan diteruskan sbg prop.
// Page langsung menembak POST /profile/confirm-email { token } saat mount;
// user tidak mengisi apa pun, cuma melihat hasil (loading → sukses / gagal).

const REDIRECT_SECS = 10

export function ConfirmEmailChangePage({ token, onNavigate }) {
  // 'loading' | 'success' | 'error'
  const [status, setStatus] = useState('loading')
  const [errorMsg, setErrorMsg] = useState('')
  const [redirectSecs, setRedirectSecs] = useState(REDIRECT_SECS)
  // Guard StrictMode double-invoke di dev — token one-time, jangan dobel tembak.
  const firedRef = useRef(false)

  useEffect(() => {
    if (firedRef.current) return
    firedRef.current = true

    if (!token) {
      setStatus('error')
      setErrorMsg('Link tidak valid atau sudah kedaluwarsa. Silakan ajukan ulang perubahan email dari halaman profil.')
      return
    }

    profileApi
      .confirmEmailChange(token)
      .then(() => setStatus('success'))
      .catch((e) => {
        setStatus('error')
        setErrorMsg(e?.message || 'Gagal mengonfirmasi perubahan email. Coba lagi nanti.')
      })
  }, [token])

  // Auto-redirect ke login setelah sukses.
  useEffect(() => {
    if (status !== 'success') return
    if (redirectSecs <= 0) { onNavigate('login'); return }
    const t = setTimeout(() => setRedirectSecs((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [status, redirectSecs])

  // ── Konten per-status (dipakai mobile & desktop) ──
  const title =
    status === 'loading' ? 'Memverifikasi Perubahan Email'
    : status === 'success' ? 'Email Berhasil Diubah'
    : 'Gagal Mengubah Email'

  const body =
    status === 'loading' ? 'Mohon tunggu sebentar, kami sedang memproses konfirmasi perubahan email kamu.'
    : status === 'success' ? 'Alamat email kamu sudah diperbarui. Silakan login kembali menggunakan email barumu.'
    : errorMsg

  const StatusIcon = ({ size }) =>
    status === 'loading' ? <Loader2 size={size} className="animate-spin text-white/80" />
    : status === 'success' ? <CheckCircle2 size={size} strokeWidth={1.75} className="text-[#22c55e]" />
    : <XCircle size={size} strokeWidth={1.75} className="text-red-400" />

  return (
    <>
      {/* ═══════════════ MOBILE (gradient ungu, sesuai layar auth lain) ═══════════════ */}
      <div
        className="lg:hidden relative min-h-screen flex flex-col items-center justify-center text-center text-white px-8 animate-fade-in-up"
        style={{
          background:
            'radial-gradient(ellipse at 50% 20%, #4c1d95 0%, #2e1065 40%, #1a0b3d 75%, #120833 100%)',
        }}
      >
        <div className="absolute top-4 left-4 flex items-center">
          <Logo variant="mobile" />
        </div>

        <div className="mb-7 flex h-[86px] w-[86px] items-center justify-center rounded-full border-2 border-dashed border-white/40">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white">
            <StatusIcon size={28} />
          </div>
        </div>
        <h1 className="font-cera-pro mb-4 text-[26px] font-bold leading-tight">{title}</h1>
        <p className="mb-9 max-w-xs text-[14px] leading-relaxed text-white/70">{body}</p>

        {status !== 'loading' && (
          <>
            <button
              onClick={() => onNavigate('login')}
              className="rounded-full bg-white px-10 py-3.5 text-[15px] font-bold text-[#1a0b3d] transition-all hover:bg-white/90 active:scale-[0.98]"
            >
              Kembali ke Login
            </button>
            {status === 'success' && (
              <p className="mt-6 text-[13px] text-white/40">
                Mengalihkan dalam <span className="font-semibold text-white/70">{redirectSecs}</span> detik...
              </p>
            )}
          </>
        )}
      </div>

      {/* ═══════════════════════════ DESKTOP (dark) ═══════════════════════════ */}
      <div className="hidden lg:block">
        <AuthDarkLayout>
          <div className="flex flex-col items-center text-center animate-fade-in-up">
            <div className="mb-7 flex h-20 w-20 items-center justify-center rounded-full bg-white/[0.06] border border-white/12">
              <StatusIcon size={40} />
            </div>
            <h1 className="font-cera-pro text-[40px] font-bold leading-[130%] text-white/90 mb-3">
              {title}
            </h1>
            <p className="text-base font-normal leading-6 text-white/70 max-w-md mb-9">
              {body}
            </p>

            {status !== 'loading' && (
              <div className="w-full max-w-[320px] space-y-4">
                <DarkPrimaryButton variant="white" onClick={() => onNavigate('login')}>
                  <LogIn size={18} /> Kembali ke Login
                </DarkPrimaryButton>
                {status === 'success' && (
                  <p className="text-[13px] text-white/40">
                    Mengalihkan dalam <span className="font-semibold text-white/70">{redirectSecs}</span> detik...
                  </p>
                )}
              </div>
            )}
          </div>
        </AuthDarkLayout>
      </div>
    </>
  )
}
