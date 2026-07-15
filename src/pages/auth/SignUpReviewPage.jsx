import { CheckCircle2, LogIn } from 'lucide-react'
import { MobileReviewNotice } from '@/components/shared/MobileReviewNotice'
import { AuthDarkLayout, DarkPrimaryButton } from '@/components/shared/DarkAuth'

// Greeting setelah pendaftaran (OTP terverifikasi): akun masuk antrean review admin.
export function SignUpReviewPage({ onNavigate }) {
  return (
    <>
      {/* MOBILE — layar gelap "Terima Kasih Telah Mendaftar!" */}
      <MobileReviewNotice
        icon={CheckCircle2}
        iconTone="green"
        title="Terima Kasih Telah Mendaftar!"
        onButton={() => onNavigate('login')}
      >
        Akun kamu sedang kami tinjau maksimal{' '}
        <span className="font-semibold text-white">1×24 jam</span> untuk memastikan
        kamu terdaftar sebagai Trainer di GASING Academy.
        <br /><br />
        Mohon cek email secara berkala untuk status pengajuan akunmu.
      </MobileReviewNotice>

      {/* DESKTOP — tema gelap, sejalan dengan halaman pembayaran */}
      <div className="hidden lg:block">
        <AuthDarkLayout>
          <div className="text-center animate-fade-in-up">
            <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-[#22c55e] shadow-[0_0_40px_rgba(34,197,94,0.4)]">
              <CheckCircle2 size={38} strokeWidth={2.2} className="text-white" />
            </div>
            <h1 className="font-cera-pro text-[48px] font-bold leading-tight text-white mb-4">
              Terima Kasih Telah Mendaftar!
            </h1>
            <p className="text-[15px] leading-relaxed text-white/60 mb-9">
              Akun kamu sedang kami tinjau maksimal{' '}
              <span className="font-semibold text-white">1×24 jam</span> untuk memastikan
              kamu terdaftar sebagai Trainer di GASING Academy.
            </p>
          </div>

          <div className="space-y-6 animate-fade-in-up delay-100">
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-7 py-6 text-center">
              <p className="text-[15px] leading-relaxed text-white/70">
                <span className="font-semibold text-white">Mohon cek email secara berkala</span>{' '}
                untuk mengetahui status pengajuan akunmu.
              </p>
            </div>

            <DarkPrimaryButton onClick={() => onNavigate('login')}>
              <LogIn size={17} /> Kembali Ke Login
            </DarkPrimaryButton>
          </div>
        </AuthDarkLayout>
      </div>
    </>
  )
}
