import leftImg from '@/assets/dark-mode/placeholder-left.png'

// Panel kiri (desktop, lg+) untuk semua halaman auth.
// Tema gelap: satu ilustrasi composite (bg + bulan + bintang + awan + maskot).
export function LeftPanel() {
  return (
    <div className="hidden lg:flex w-[46%] sticky top-0 h-screen flex-col overflow-hidden shrink-0 bg-[#0D0B2E]">
      {/* ilustrasi composite, anchor ke bawah biar maskot + awan tetap kelihatan */}
      <img
        src={leftImg}
        alt="Sarang Gasing"
        draggable="false"
        className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover object-bottom"
      />

      {/* judul */}
      <div className="relative z-10 px-16 pt-24 xl:pt-28">
        <h1 className="font-cera-pro text-[48px] font-bold leading-[1.08] text-white">
          Ayo, bergabung
          <br />
          bersama
          <br />
          Sarang Gasing
        </h1>
      </div>
    </div>
  )
}
