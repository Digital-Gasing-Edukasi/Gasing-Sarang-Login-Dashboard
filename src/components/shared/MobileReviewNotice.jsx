// Layar notifikasi "sedang ditinjau" bertema gelap untuk mobile (lg:hidden).
// Dipakai layar sukses Perbaikan Data (flow 8) & sukses Signup (flow 9).
// Desktop tetap pakai versi terang masing-masing halaman.
export function MobileReviewNotice({ icon: Icon, iconTone = 'orange', title, children, buttonLabel = 'Kembali ke Login', onButton }) {
  const iconColor = iconTone === 'green' ? 'text-[#22c55e]' : 'text-orange-500'
  return (
    <div
      className="lg:hidden relative min-h-screen flex flex-col items-center justify-center text-center text-white px-8 animate-fade-in-up"
      style={{
        background:
          'radial-gradient(ellipse at 50% 20%, #4c1d95 0%, #2e1065 40%, #1a0b3d 75%, #120833 100%)',
      }}
    >
      <div className="mb-7 flex h-[86px] w-[86px] items-center justify-center rounded-full border-2 border-dashed border-white/40">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white">
          {Icon && <Icon size={28} strokeWidth={1.75} className={iconColor} />}
        </div>
      </div>
      <h1 className="mb-4 text-[26px] font-bold leading-tight">{title}</h1>
      <p className="mb-9 max-w-xs text-[14px] leading-relaxed text-white/70">{children}</p>
      <button
        onClick={onButton}
        className="rounded-full bg-white px-10 py-3.5 text-[15px] font-bold text-[#1a0b3d] transition-all hover:bg-white/90 active:scale-[0.98]"
      >
        {buttonLabel}
      </button>
    </div>
  )
}
