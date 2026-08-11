import heroImage from '@/assets/Mobile/placeholder.png'

// Hero ungu di ATAS layar auth khusus mobile (lg:hidden).
// Desktop pakai LeftPanel/AuthFullLayout — komponen ini tak dirender (lg:hidden).
// Satu gambar full-bleed (placeholder.png 390x844) sudah memuat judul + maskot.
// Hero flex-1: mengisi sisa ruang di atas kartu agar layar pas 100dvh tanpa
// scroll (390x844). object-top jaga judul+maskot tetap kelihatan saat terpotong.
// Kartu putih (RightPanel -mt-6) menutupi bagian fade bawah gambar.
export function MobileHero() {
  return (
    <div className="lg:hidden relative w-full flex-1 min-h-0 overflow-hidden">
      <img
        src={heroImage}
        alt="Ayo, bergabung bersama Sarang Gasing"
        draggable="false"
        className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover object-top"
      />
    </div>
  )
}
