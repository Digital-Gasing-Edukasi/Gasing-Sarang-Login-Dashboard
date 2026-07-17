import { Link } from "react-router-dom";
import { GUEST_NAME } from "../data";
import { logoRect, charPurple, thumbFunMath, newsIcon } from "../assets";

// /komunitas/home — hero biru "Hai, Ery!" + kartu Konten Eksklusif + intip Virtual.
export default function HomeScreen() {
  return (
    <div className="relative flex flex-col h-screen overflow-hidden">
      {/* Hero biru dengan lengkung bawah */}
      <div
        className="relative bg-gradient-to-br from-blue-700 to-blue-400 px-5 pb-24 pt-4 text-white"
        style={{ mask: "radial-gradient(120% 90px at bottom, transparent 98%, black 100%)" }}
      >
        <div className="flex items-center justify-between">
          <img src={logoRect} alt="Sarang Gasing" className="h-8 w-auto" />
          <div className="flex items-center gap-3">
            <Link to="/komunitas/ga-news" className="flex items-center justify-center">
              <img src={newsIcon} alt="News" className="h-6 w-6 brightness-0 invert" />
            </Link>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-purple-600 text-xs font-bold">
              TG
            </span>
          </div>
        </div>

        <div className="relative mt-14 min-h-[80px]">
          <h1 className="text-3xl font-extrabold leading-tight">
            Hai, <br /> {GUEST_NAME}!
          </h1>
          <img
            src={charPurple}
            alt=""
            aria-hidden
            className="absolute -right-2 -bottom-10 h-36 w-auto object-contain"
          />
        </div>
      </div>

      {/* Kartu Konten Eksklusif (overlap ke hero) */}
      <div className="-mt-16 px-5">
        <div className="rounded-2xl bg-white p-5 shadow-lg">
          <h2 className="text-center text-lg font-bold text-slate-800">Konten Eksklusif</h2>
          <p className="mx-auto mt-1 max-w-[270px] text-center text-sm text-[#424857]">
            Yuk belajar trik perkalian 2 digit, dan dapatkan soal-soal penjumlahan &lt;5.
          </p>
          <img
            src={thumbFunMath}
            alt="Fun Math Trick for Kids"
            className="mt-4 h-40 w-full rounded-xl object-cover"
          />
        </div>
      </div>

      {/* Intip Virtual Meet-Up (blur, seperti mockup) */}
      <div className="mt-4 px-5">
        <div className="rounded-2xl bg-white/70 p-5 opacity-70 blur-[1px]">
          <h2 className="text-center text-lg font-bold text-slate-400">Virtual Meet-Up Berikutnya</h2>
          <div className="mt-3 h-24 rounded-xl bg-yellow-100/60" />
        </div>
      </div>

      {/* Overlay CTA gabung (fake login-gate) */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-50 h-1/2 flex items-end justify-center bg-gradient-to-t from-slate-50 via-slate-50/90 to-transparent pb-6">
        <div className="pointer-events-auto text-center">
          <p className="text-sm font-medium text-slate-600">
            Ayo bergabung dalam komunitas Sarang Gasing
          </p>
          <Link to="/register" className="text-sm font-bold text-[#0033EC]">Daftar</Link>
        </div>
      </div>
    </div>
  );
}
