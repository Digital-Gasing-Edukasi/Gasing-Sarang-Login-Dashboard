import leftImg from '@/assets/dark-mode/placeholder-left.png';
import tamuIcon from '@/assets/Icon/tamu.svg';
import { useNavigate } from 'react-router-dom';
import { PAGE_PATHS } from '@/lib/routes';
export const APP_VERSION = import.meta.env.VITE_APP_VERSION;

// Panel kiri (desktop, lg+) untuk semua halaman auth.
// Tema gelap: satu ilustrasi composite (bg + bulan + bintang + awan + maskot).
// Audit #6: copyright desktop di kiri-bawah placeholder image.
// Audit #7: tombol ikon "Lanjut Sebagai Tamu" di kanan-atas placeholder image.
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

      {/* Masuk sebagai tamu → halaman komunitas (publik, tanpa auth). */}
      <button
        type="button"
        onClick={() => navigate(PAGE_PATHS.komunitas)}
        aria-label="Masuk sebagai tamu"
        title="Masuk sebagai tamu"
        className="absolute top-6 right-6 z-20 flex h-[38px] w-[38px] items-center rounded-full justify-center transition hover:bg-white/20 active:scale-95"
      >
        <img src={tamuIcon} alt="" draggable="false" className="h-[38px] w-[38px] select-none" />
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
        <p className="mt-1 text-[11px] text-white/40 select-all">
          v{" "}
          {APP_VERSION}
        </p>
      </div>
    </div>
  )
}
