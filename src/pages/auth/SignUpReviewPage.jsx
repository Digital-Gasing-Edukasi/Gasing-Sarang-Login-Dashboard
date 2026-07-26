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
        onButton={() => onNavigate("login")}
      >
        Akun kamu sedang kami tinjau maksimal{" "}
        <span className="font-semibold text-white">1×24 jam</span> untuk
        memastikan kamu terdaftar sebagai Trainer di Sarang Gasing.
        <br />
        <br />
        Mohon cek email secara berkala untuk status pengajuan akunmu.
      </MobileReviewNotice>

      {/* DESKTOP — tema gelap, sejalan dengan halaman pembayaran */}
      <div className="hidden lg:block">
        <AuthDarkLayout>
          <div className="text-center animate-fade-in-up">
            <h1 className="font-cera-pro text-[48px] font-black leading-[140%] text-white/90 text-center mb-4">
              Terima Kasih Telah Mendaftar!
            </h1>
            <p className="text-base font-normal leading-6 text-white/90 text-center mb-9">
              Akun kamu sedang kami tinjau maksimal{" "}
              <span className="font-bold text-white/90">24 jam</span> untuk memastikan
              kamu terdaftar sebagai Trainer di Sarang Gasing.
            </p>
          </div>

          <div className="space-y-6 animate-fade-in-up delay-100">
            <p className="text-base font-normal leading-6 text-white/90 text-center">
              Mohon cek email secara berkala untuk status pengajuan akunmu.
            </p> 

            <DarkPrimaryButton variant="white" onClick={() => onNavigate("login")}>
              Kembali Ke Login
            </DarkPrimaryButton>
          </div>
        </AuthDarkLayout>
      </div>
    </>
  );
}
