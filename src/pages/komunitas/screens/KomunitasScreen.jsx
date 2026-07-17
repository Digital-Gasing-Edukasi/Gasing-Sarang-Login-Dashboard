import { Link } from "react-router-dom";
import { Bookmark, HelpCircle, TrendingUp, ChevronRight, ChevronDown, Heart, MessageCircle, Eye, Pin, ScrollText, Trophy, BadgeCheck, Flame } from "lucide-react";
import { trendingTopics, terbaruTopics, challenges } from "../data";
import { headerKomunitas, charBlue } from "../assets";

// Baris topik (Trending / Terbaru).
function TopicRow({ t, showImage }) {
  return (
    <div className="py-3">
      <div className="flex gap-3">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
          style={{ backgroundColor: t.authorColor }}
        >
          {t.author}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="flex items-start gap-1 font-bold leading-snug text-slate-800">
            {t.pinned && <Pin size={14} className="mt-1 shrink-0 text-slate-400" />}
            {t.verified && <BadgeCheck size={15} className="mt-0.5 shrink-0 text-blue-500" />}
            <span className="line-clamp-2">{t.title}</span>
          </h3>
          <p className="mt-1 line-clamp-2 text-sm text-slate-400">{t.excerpt}</p>
          {showImage && t.image && (
            <img src={t.image} alt="" aria-hidden className="mt-2 h-28 w-full rounded-lg object-cover" />
          )}
          <div className="mt-2 flex items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1"><Heart size={13} /> {t.likes}</span>
            <span className="flex items-center gap-1"><MessageCircle size={13} /> {t.comments}</span>
            <span className="flex items-center gap-1"><Eye size={13} /> 4.4k</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Kartu challenge (kolom kanan desktop).
function ChallengeCard({ c }) {
  return (
    <div className="rounded-2xl bg-white/90 p-4 shadow-sm">
      <div className="flex gap-3">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
          style={{ backgroundColor: c.authorColor }}
        >
          {c.author}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="flex items-start gap-1 font-bold leading-snug text-slate-800">
            <Pin size={14} className="mt-1 shrink-0 text-slate-400" />
            <span className="line-clamp-2">{c.title}</span>
          </h3>
          <p className="mt-1 line-clamp-2 text-sm text-slate-400">{c.excerpt}</p>
          <div className="mt-2 flex items-center gap-2">
            <Flame size={15} className="text-red-500" />
            <span className="rounded-full bg-violet-50 px-3 py-0.5 text-xs font-semibold text-violet-600">{c.tag}</span>
          </div>
          <div className="mt-2 flex items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1"><Heart size={13} /> {c.likes}</span>
            <span className="flex items-center gap-1"><MessageCircle size={13} /> {c.comments}</span>
            <span className="flex items-center gap-1"><Eye size={13} /> {c.reads}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Kartu section dengan header + tombol chevron.
function SectionCard({ icon, title, children, className = "" }) {
  return (
    <div className={"relative overflow-hidden rounded-2xl bg-white p-4 shadow-lg " + className}>
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800">{icon} {title}</h2>
        <span className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200">
          <ChevronRight size={16} />
        </span>
      </div>
      {children}
    </div>
  );
}

// /komunitas/komunitas — header ungu + maskot; mobile = kartu Trending, desktop = dashboard 2 kolom.
export default function KomunitasScreen() {
  return (
    <div className="flex flex-col">
      {/* Header ungu */}
      <div
        className="relative bg-cover bg-center px-5 pb-20 pt-4 text-white lg:rounded-3xl lg:pb-24"
        style={{ backgroundImage: `url(${headerKomunitas})` }}
      >
        <div className="flex items-center justify-end gap-4">
          <Bookmark size={20} />
          <HelpCircle size={20} />
        </div>
        <div className="relative mt-6 flex items-center justify-center">
          <img src={charBlue} alt="" aria-hidden className="absolute left-0 -top-1 h-20 w-auto object-contain lg:h-28" />
          <h1 className="text-2xl font-extrabold lg:text-4xl">Komunitas</h1>
        </div>
      </div>

      {/* ===== Mobile: kartu Trending tunggal ===== */}
      <div className="-mt-12 px-4 lg:hidden">
        <SectionCard icon={<TrendingUp size={20} className="text-green-500" />} title="Top 10 Trending">
          <div className="mt-3 flex flex-col divide-y divide-slate-100">
            {trendingTopics.map((t) => (
              <TopicRow key={t.id} t={t} showImage />
            ))}
          </div>
          {/* Overlay CTA gabung (fake login-gate) */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 top-1/2 flex items-end justify-center bg-gradient-to-t from-white via-white/90 to-transparent pb-4">
            <div className="pointer-events-auto text-center">
              <p className="text-sm font-medium text-slate-600">Ayo bergabung dalam komunitas Sarang Gasing</p>
              <Link to="/register" className="text-sm font-bold text-[#0033EC]">Daftar</Link>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* ===== Desktop: dashboard 2 kolom (semua terkunci → blur, CTA di tengah bawah) ===== */}
      <div className="relative -mt-16 hidden px-2 pb-8 lg:block">
        <div className="pointer-events-none grid select-none grid-cols-2 gap-5 blur-[5px]">
          {/* Kolom kiri */}
          <div className="flex flex-col gap-5">
            <SectionCard icon={<TrendingUp size={20} className="text-green-500" />} title="Top 10 Trending">
              <div className="mt-3 flex flex-col divide-y divide-slate-100">
                {trendingTopics.map((t) => (
                  <TopicRow key={t.id} t={t} showImage={t.pinned} />
                ))}
              </div>
            </SectionCard>

            <SectionCard icon={<ScrollText size={20} className="text-blue-500" />} title="Terbaru">
              <div className="mt-3 flex flex-col divide-y divide-slate-100">
                {terbaruTopics.map((t) => (
                  <TopicRow key={t.id} t={t} />
                ))}
              </div>
            </SectionCard>
          </div>

          {/* Kolom kanan */}
          <div className="flex flex-col gap-5">
            {/* Panduan Komunitas */}
            <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
              <div className="flex w-full items-center justify-between px-5 py-4">
                <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800">
                  <HelpCircle size={20} className="text-orange-500" /> Panduan Komunitas
                </h2>
                <ChevronDown size={20} className="text-slate-400" />
              </div>
            </div>

            {/* Challenges Bulan Ini */}
            <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
              <div className="flex items-center justify-between bg-gradient-to-r from-teal-400 to-cyan-500 px-5 py-4 text-white">
                <h2 className="flex items-center gap-2 text-lg font-bold">
                  <Trophy size={20} /> Challenges Bulan Ini
                </h2>
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20">
                  <ChevronRight size={16} />
                </span>
              </div>
              <div className="flex flex-col gap-4 p-4">
                {challenges.map((c) => (
                  <ChallengeCard key={c.id} c={c} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Daftar — melayang di tengah bawah */}
        <div className="fixed bottom-8 left-1/2 z-40 -translate-x-1/2 rounded-2xl bg-white px-10 py-5 text-center shadow-2xl ring-1 ring-slate-200">
          <p className="text-sm font-medium text-slate-600">Ayo bergabung dalam komunitas Sarang Gasing</p>
          <Link to="/register" className="text-sm font-bold text-[#0033EC]">Daftar</Link>
        </div>
      </div>
    </div>
  );
}
