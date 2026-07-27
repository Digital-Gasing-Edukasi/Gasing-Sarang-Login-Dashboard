import heroImage from '@/assets/Mobile/placeholder.png'

// Hero ungu di ATAS layar auth khusus mobile (lg:hidden).
// Desktop pakai LeftPanel/AuthFullLayout — komponen ini tak dirender (lg:hidden).
// Satu gambar full-bleed (placeholder.png 390x844) sudah memuat judul + maskot.
// Kartu putih (RightPanel -mt-6) menutupi bagian fade bawah gambar.
export function MobileHero() {
  return (
    <div className="lg:hidden relative w-full shrink-0 overflow-hidden aspect-[390/460]">
      <img
        src={heroImage}
        alt="Ayo, bergabung bersama Sarang Gasing"
        draggable="false"
        className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover object-top"
      />
    </div>
  )
}
