import leftImg from '@/assets/dark-mode/placeholder-left.png'

// Panel kiri (desktop, lg+) untuk semua halaman auth.
// Tema gelap: satu ilustrasi composite (bg + bulan + bintang + awan + maskot).
export function LeftPanel() {
  return (
    <div className="hidden lg:flex w-1/2 sticky top-0 h-screen flex-col overflow-hidden shrink-0 bg-[#0D0B2E]">
      {/* ilustrasi composite, anchor ke bawah biar maskot + awan tetap kelihatan */}
      <img
        src={leftImg}
        alt="Sarang Gasing"
        draggable="false"
        className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover object-bottom"
      />

      {/* judul */}
      <div className="relative z-10 px-20 pt-20">
        <p className="font-cera-pro text-[20px] fhd:text-[28px] font-light leading-tight text-white mb-2">Sudah ikut pelatihan Gasing?</p>
        <h1 className="font-cera-pro text-[clamp(60px,3.5vw,60px)] font-bold leading-[1.25] text-white">
          Ayo, bergabung
          <br />
          bersama
          <br />
          Sarang Gasing!
        </h1>
      </div>
    </div>
  )
}
