import heroBg from '@/assets/Mobile/hero_bg.png'
import stars from '@/assets/Mobile/stars.png'
import blobs from '@/assets/Mobile/blobs.png'
import heroMascot from '@/assets/Mobile/hero_mascot.png'

// Hero ungu yang tampil di ATAS layar auth khusus mobile (lg:hidden).
// Desktop pakai LeftPanel/AuthFullLayout — komponen ini tak dirender (lg:hidden).
// Aset: wallpaper hero_bg + bintang stars + blob blobs + maskot hero_mascot.
export function MobileHero({ title }) {
  return (
    <div className="lg:hidden relative w-full shrink-0 overflow-hidden px-7 pt-11 pb-6">
      {/* wallpaper ungu */}
      <img src={heroBg} alt="" className="absolute inset-0 h-full w-full object-cover" />
      {/* taburan bintang */}
      <img
        src={stars}
        alt=""
        className="pointer-events-none absolute inset-x-0 top-0 w-full select-none object-cover opacity-90"
      />

      {/* judul */}
      <h1 className="font-cera-pro relative z-10 text-[26px] font-bold leading-tight text-white">
        {title ?? (
          <>
            Ayo, bergabung
            <br />
            bersama <span className="text-[#FACC15]">Sarang Gasing</span>
          </>
        )}
      </h1>

      {/* blob + maskot menempel di dasar hero */}
      <div className="relative z-10 mt-5 h-[150px]">
        <img
          src={blobs}
          alt=""
          className="pointer-events-none absolute inset-x-0 bottom-0 w-full select-none object-contain"
        />
        <img
          src={heroMascot}
          alt=""
          draggable="false"
          className="pointer-events-none absolute bottom-0 left-1/2 w-[80%] max-w-[300px] -translate-x-1/2 select-none object-contain"
        />
      </div>
    </div>
  )
}
