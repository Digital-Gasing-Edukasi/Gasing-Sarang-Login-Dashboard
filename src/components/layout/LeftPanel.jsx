import illustrationImg from '@/assets/illustration.png'

export function LeftPanel() {
  return (
    <div
      className="hidden lg:flex w-[46%] sticky top-0 h-screen flex-col overflow-hidden shrink-0"
      style={{ background: 'radial-gradient(ellipse at 72% 42%, #7C3AED 0%, #5B21B6 22%, #3B0764 52%, #0D0B2E 100%)' }}
    >
      <div className="px-24 pt-36 relative z-10">
        <div className="relative inline-block">
          <h1 className="text-[3.6rem] font-bold text-white leading-snug">Bertumbuh</h1>
          <svg className="absolute -top-3 left-[215px]" width="58" height="42" viewBox="0 0 58 42" fill="none">
            <path d="M6 36 C 12 8 40 2 52 20" stroke="#4ADE80" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
            <path d="M46 13 L52 20 L44 22" stroke="#4ADE80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </svg>
        </div>
        <h1 className="text-[3.6rem] font-bold text-white leading-snug">Bersama Dengan</h1>
        <h1 className="text-[3.6rem] font-bold text-[#4ADE80] leading-snug">Gasing Circle!</h1>
        <svg className="mt-2" width="238" height="14" viewBox="0 0 238 14" fill="none">
          <path d="M2 10 Q 60 2 119 8 Q 178 13 236 7" stroke="#4ADE80" strokeWidth="3" strokeLinecap="round" fill="none"/>
        </svg>
      </div>
      <div className="relative flex-1 flex items-end mt-12">
        <svg className="absolute left-8 bottom-[46%] z-10" width="28" height="48" viewBox="0 0 28 48" fill="none">
          <line x1="5" y1="44" x2="11" y2="4" stroke="#4ADE80" strokeWidth="3.5" strokeLinecap="round"/>
          <line x1="17" y1="44" x2="23" y2="4" stroke="#4ADE80" strokeWidth="3.5" strokeLinecap="round"/>
        </svg>
        <img
          src={illustrationImg}
          alt="Gasing Circle Community"
          className="w-full object-contain object-bottom select-none"
        />
      </div>
    </div>
  )
}
