import { Logo } from '@/components/shared/Logo'

const DEFAULT_BG =
  'radial-gradient(ellipse at 50% 20%, #4c1d95 0%, #2e1065 40%, #1a0b3d 75%, #120833 100%)'

// Layar notifikasi "sedang ditinjau" bertema gelap untuk mobile (lg:hidden).
// Dipakai layar sukses Perbaikan Data (flow 8) & sukses Signup (flow 9).
// Logo Sarang Gasing di pojok kiri-atas; judul/teks/tombol di tengah layar.
// Desktop tetap pakai versi terang masing-masing halaman.
// `backgroundImage` opsional: pemanggil bisa menimpa wallpaper default
// (mis. sukses Signup pakai login-success-bg.png).
export function MobileReviewNotice({ title, children, buttonLabel = 'Kembali ke Login', onButton, backgroundImage }) {
  const background = backgroundImage ? `url(${backgroundImage})` : DEFAULT_BG
  return (
    <div
      className="lg:hidden relative min-h-screen flex flex-col text-white animate-fade-in-up bg-cover bg-center bg-no-repeat bg-[#0D0B2E]"
      style={{ backgroundImage: background }}
    >
      {/* Logo pojok kiri-atas (padding 16px) */}
      <div className="shrink-0 px-4 pt-4">
        <Logo variant="mobile" />
      </div>

      {/* Konten di tengah layar */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4 pb-8">
        <h1 className="font-cera-pro mb-6 text-[26px] font-bold leading-tight">{title}</h1>
        <p className="mb-10 max-w-sm text-[14px] leading-relaxed text-white/70">{children}</p>
        <button
          onClick={onButton}
          className="w-full rounded-full bg-white py-3.5 text-[15px] font-bold text-[#1a0b3d] transition-all hover:bg-white/90 active:scale-[0.98]"
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  )
}
