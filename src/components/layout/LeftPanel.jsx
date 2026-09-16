import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import leftImg from '@/assets/dark-mode/placeholder-left.png'
import { isStaging } from '@/lib/env'

// Panel kiri (desktop, lg+) untuk semua halaman auth.
// Tema gelap: satu ilustrasi composite (bg + bulan + bintang + awan + maskot).
// Audit #6: copyright desktop di kiri-bawah placeholder image.
// Audit #7: tombol ikon "Lanjut Sebagai Tamu" di kiri-atas placeholder image.
export function LeftPanel() {
  const navigate = useNavigate()
  return (
    <div className="hidden lg:flex w-1/2 sticky top-0 h-screen flex-col overflow-hidden shrink-0 bg-[#0D0B2E]">
      {/* ilustrasi composite, anchor ke bawah biar maskot + awan tetap kelihatan */}
      <img
        src={leftImg}
        alt="Sarang Gasing"
        draggable="false"
        className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover object-bottom"
      />

      {/* Audit #7: icon button tamu — kiri atas image, desktop saja */}
      <button
        onClick={() => navigate('/komunitas/forum')}
        aria-label="Lanjut Sebagai Tamu"
        title="Lanjut Sebagai Tamu"
        className="absolute left-6 top-6 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20"
      >
        <ArrowRight size={20} />
      </button>

      {/* judul */}
      <div className="relative z-10 px-20 pt-20 lg:pt-16">
        <p className="font-cera-pro text-[20px] fhd:text-[28px] font-light lg:font-regular leading-tight text-white mb-2">Sudah ikut pelatihan Gasing?</p>
        <h1 className="font-cera-pro text-[clamp(60px,3.5vw,60px)] font-bold leading-[1.25] text-white">
          Ayo, bergabung
          <br />
          bersama
          <br />
          Sarang Gasing!
        </h1>
      </div>

      {/* Audit #6/#23/#41: copyright kiri-bawah image, desktop saja */}
      <div className="absolute bottom-6 left-6 z-20 text-left">
        <p className="text-xs text-white/70">©2026 Gasing Academy. All rights reserved.</p>
        {isStaging() && (
          <p className="mt-1 text-[11px] text-white/40 select-all">
            build {typeof __BUILD_DATE__ !== 'undefined' ? __BUILD_DATE__ : 'dev'}
          </p>
        )}
      </div>
    </div>
  )
}
