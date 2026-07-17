import { useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Heart, MessageCircle, Clock, BookMarked, Music, ChevronRight, Play, Plus, TrendingUp, Gamepad2 } from "lucide-react";
import { materiTabs, materiList, musikGasing, permainanList } from "../data";
import { headerMateri, charBlue } from "../assets";

// Baris statistik kecil (like / comment / play).
function StatRow({ likes, comments, plays }) {
  return (
    <div className="flex items-center gap-3 text-xs text-slate-400">
      <span className="flex items-center gap-1"><Heart size={12} className="text-red-400" /> {likes}</span>
      <span className="flex items-center gap-1"><MessageCircle size={12} /> {comments}</span>
      <span className="ml-auto flex items-center gap-1"><Play size={12} /> {plays}</span>
    </div>
  );
}

// /komunitas/materi-gasing — grid materi (kiri) + Musik/Permainan (kanan, desktop).
export default function MateriGasingScreen() {
  const [tab, setTab] = useState(materiTabs[0]);

  return (
    <div className="flex flex-col">
      <div
        className="relative h-28 overflow-hidden bg-cover bg-center lg:h-40 lg:rounded-3xl"
        style={{
          backgroundImage: `url(${headerMateri})`,
          mask: "radial-gradient(120% 40px at bottom, transparent 98%, black 100%)",
        }}
      >
        <h1 className="relative pt-6 text-center text-xl font-extrabold text-white lg:pt-12 lg:text-4xl">Materi Gasing</h1>
        <img src={charBlue} alt="" aria-hidden className="absolute -right-1 top-1 h-24 w-auto object-contain lg:h-36" />
      </div>

      {/* ===== Mobile: Terkunci ===== */}
      <div className="lg:hidden relative">
        <div className="pointer-events-none select-none px-5 pt-5 pb-20">
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-orange-500" />
            <h2 className="font-bold text-slate-800">Metode</h2>
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {materiTabs.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={
                  "whitespace-nowrap rounded-full px-5 py-2 text-sm font-semibold transition-colors " +
                  (t === tab ? "bg-blue-600 text-white" : "border border-blue-300 bg-white text-blue-600")
                }
              >
                {t}
              </button>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {materiList.map((m) => (
              <a href={m.url} target="_blank" rel="noopener noreferrer" key={m.id} className="block overflow-hidden rounded-2xl bg-white shadow-sm transition-shadow hover:shadow-md">
                <div className="flex h-44 items-center justify-center bg-cover bg-center">
                  <img src={m.element} alt="" aria-hidden className="h-36 w-auto object-contain" />
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-slate-800">{m.title}</h3>
                  <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Heart size={13} /> {m.likes}</span>
                    <span className="flex items-center gap-1"><MessageCircle size={13} /> {m.comments}</span>
                    <span className="flex items-center gap-1"><Clock size={13} /> {m.reads}</span>
                    <span className="ml-auto flex items-center gap-1"><BookMarked size={13} /> {m.duration}</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
        
        {/* Progressive Blur Overlay */}
        <div className="pointer-events-none absolute inset-0 z-10 bg-white/20 backdrop-blur-[5px] [-webkit-mask-image:linear-gradient(to_bottom,transparent_0%,black_60vh)] [mask-image:linear-gradient(to_bottom,transparent_0%,black_60vh)]" />

        {/* Overlay CTA gabung */}
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 mx-auto flex h-40 max-w-[480px] items-end justify-center bg-gradient-to-t from-slate-50 via-slate-50/90 to-transparent pb-24">
          <div className="pointer-events-auto text-center">
            <p className="text-sm font-medium text-slate-600">
              Ayo bergabung dalam komunitas Sarang Gasing
            </p>
            <Link to="/register" className="text-sm font-bold text-[#0033EC]">
              Daftar
            </Link>
          </div>
        </div>
      </div>

      {/* ===== Desktop: Tetap ===== */}
      <div className="hidden px-5 pt-5 lg:grid lg:grid-cols-[1fr_340px] lg:gap-6 lg:px-2">
        {/* ===== Kiri: Metode + grid materi ===== */}
        <div className="pointer-events-none select-none blur-[5px]">
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-orange-500" />
            <h2 className="font-bold text-slate-800">Metode</h2>
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {materiTabs.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={
                  "whitespace-nowrap rounded-full px-5 py-2 text-sm font-semibold transition-colors " +
                  (t === tab ? "bg-blue-600 text-white" : "border border-blue-300 bg-white text-blue-600")
                }
              >
                {t}
              </button>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {materiList.map((m) => (
              <a href={m.url} target="_blank" rel="noopener noreferrer" key={m.id} className="block overflow-hidden rounded-2xl bg-white shadow-sm transition-shadow hover:shadow-md">
                <div className="flex h-44 items-center justify-center bg-cover bg-center">
                  <img src={m.element} alt="" aria-hidden className="h-36 w-auto object-contain" />
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-slate-800">{m.title}</h3>
                  <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Heart size={13} /> {m.likes}</span>
                    <span className="flex items-center gap-1"><MessageCircle size={13} /> {m.comments}</span>
                    <span className="flex items-center gap-1"><Clock size={13} /> {m.reads}</span>
                    <span className="ml-auto flex items-center gap-1"><BookMarked size={13} /> {m.duration}</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* ===== Kanan: Musik Gasing + Permainan + promo (desktop, terkunci → blur) ===== */}
        <aside className="pointer-events-none mt-8 hidden select-none flex-col gap-5 blur-[5px] lg:flex">
          {/* Musik Gasing */}
          <div className="rounded-2xl bg-white p-4 shadow-md">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800">
                <Music size={18} className="text-blue-600" /> Musik Gasing
              </h2>
              <span className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-slate-500">
                <ChevronRight size={16} />
              </span>
            </div>

            {/* Spotify-ish featured */}
            <div className="mt-3 flex items-center gap-3 rounded-xl bg-gradient-to-r from-blue-900 to-indigo-800 p-3 text-white">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-pink-600 text-2xl">🎵</div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase tracking-wide opacity-70">Preview · Owen Nathanael. GASIN</p>
                <h3 className="truncate font-bold">Gasing Medley</h3>
                <button className="mt-1 flex items-center gap-1 text-xs font-semibold opacity-90">
                  <Plus size={12} /> Save on Spotify
                </button>
              </div>
            </div>

            <div className="mt-3 flex flex-col divide-y divide-slate-100">
              {musikGasing.map((s) => (
                <div key={s.id} className="py-2.5">
                  <h4 className="flex items-center gap-1 text-sm font-bold text-slate-800">
                    {s.title} {s.trending && <TrendingUp size={13} className="text-green-500" />}
                  </h4>
                  <div className="mt-1"><StatRow likes={s.likes} comments={s.comments} plays={s.plays} /></div>
                </div>
              ))}
            </div>
          </div>

          {/* Permainan */}
          <div className="rounded-2xl bg-white p-4 shadow-md">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800">
                <Gamepad2 size={18} className="text-orange-500" /> Permainan
              </h2>
              <span className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-slate-500">
                <ChevronRight size={16} />
              </span>
            </div>
            <div className="mt-2 flex flex-col divide-y divide-slate-100">
              {permainanList.map((g) => (
                <div key={g.id} className="py-2.5">
                  <h4 className="flex items-center gap-1 text-sm font-bold text-slate-800">
                    {g.title} {g.trending && <TrendingUp size={13} className="text-green-500" />}
                  </h4>
                  <p className="line-clamp-1 text-xs text-slate-400">{g.desc}</p>
                  <div className="mt-1"><StatRow likes={g.likes} comments={g.comments} plays={g.plays} /></div>
                </div>
              ))}
            </div>
          </div>

          {/* Promo produk */}
          <div className="flex flex-col items-center rounded-2xl bg-gradient-to-br from-emerald-50 to-white p-6 text-center shadow-md">
            <div className="py-3 text-5xl" aria-hidden>📚🐙🎨</div>
            <h3 className="text-lg font-extrabold text-slate-800">Cari produk lain untuk mengajar anak dan siswa?</h3>
            <a href="#" className="mt-4 w-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-500 py-3 text-sm font-bold text-white shadow-lg">
              Ayo ke Gasing Think & Play!
            </a>
          </div>
        </aside>
      </div>
    </div>
  );
}
