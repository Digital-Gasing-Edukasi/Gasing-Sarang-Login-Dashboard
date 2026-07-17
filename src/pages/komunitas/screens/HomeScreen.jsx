import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Heart, MessageCircle, BadgeCheck, Video, CheckCircle2 } from "lucide-react";
import { GUEST_NAME, trendingTopics, terbaruTopics, gaNews, materiUpdates, meetupUpcoming } from "../data";
import { logoRect, charPurple, charOrange, thumbFunMath, thumbAngka, newsIcon } from "../assets";

// Kartu dashboard generik (header + tombol chevron).
function DashCard({ title, titleNode, action = true, children, className = "" }) {
  return (
    <div className={"rounded-2xl bg-white p-5 shadow-md " + className}>
      <div className="flex items-center justify-between">
        {titleNode || <h2 className="text-lg font-bold text-slate-800">{title}</h2>}
        {action && (
          <Link to="#" className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-slate-500">
            <ChevronRight size={16} />
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}

// Baris ringkas topik (Ada Apa di Komunitas).
function MiniTopic({ t }) {
  return (
    <div className="flex gap-3 py-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: t.authorColor }}>
        {t.author}
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="flex items-start gap-1 text-sm font-bold leading-snug text-slate-800">
          {t.verified && <BadgeCheck size={14} className="mt-0.5 shrink-0 text-blue-500" />}
          <span className="line-clamp-2">{t.title}</span>
        </h3>
        <p className="mt-1 text-xs text-slate-400">1w · Ben menjawab 3 menit yang lalu</p>
        <div className="mt-1.5 flex items-center gap-3">
          <span className="rounded-full bg-orange-50 px-2.5 py-0.5 text-[11px] font-semibold text-orange-500">Challenge</span>
          <span className="flex items-center gap-1 text-xs text-slate-400"><Heart size={12} /> {t.likes}</span>
          <span className="flex items-center gap-1 text-xs text-slate-400"><MessageCircle size={12} /> {t.comments}</span>
        </div>
      </div>
    </div>
  );
}

// /komunitas/home — mobile: teaser sederhana; desktop: dashboard 2 kolom.
export default function HomeScreen() {
  const [tab, setTab] = useState("trending");
  const topics = tab === "trending" ? trendingTopics : terbaruTopics;

  return (
    <div className="relative flex flex-col">
      {/* Hero biru "Hai, ..." — desktop: full-width (break out padding wrapper) + arch bawah concave */}
      <div className="relative bg-gradient-to-br from-blue-700 to-blue-400 px-5 pb-24 pt-4 text-white lg:-mx-6 lg:-mt-6 lg:px-10 lg:pb-20 lg:pt-10">
        {/* Arch bawah: dome warna bg meniru lengkungan cekung (concave) */}
        <div className="pointer-events-none absolute inset-x-0 bottom-[-1px] h-10 rounded-t-[50%] bg-[#F1F2F7]" />
        <div className="flex items-center justify-between lg:hidden">
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

        <div className="relative mt-14 min-h-[80px] lg:mt-0 lg:flex lg:min-h-[140px] lg:items-center lg:justify-center">
          {/* Maskot kiri (desktop) */}
          <img src={charPurple} alt="" aria-hidden className="absolute -left-2 -bottom-10 hidden h-40 w-auto object-contain lg:block lg:-bottom-4 lg:left-6" />
          <h1 className="text-3xl font-extrabold leading-tight lg:text-center lg:text-4xl">
            Hai, <br className="lg:hidden" /> {GUEST_NAME}!
          </h1>
          {/* Maskot kanan */}
          <img src={charOrange} alt="" aria-hidden className="absolute -right-2 -bottom-10 h-36 w-auto object-contain lg:right-6 lg:-bottom-4 lg:h-40" />
          <img src={charPurple} alt="" aria-hidden className="absolute -right-2 -bottom-10 h-36 w-auto object-contain lg:hidden" />
        </div>
      </div>

      {/* ===== Mobile: teaser sederhana ===== */}
      <div className="lg:hidden">
        <div className="-mt-16 px-5">
          <div className="rounded-2xl bg-white p-5 shadow-lg">
            <h2 className="text-center text-lg font-bold text-slate-800">Konten Eksklusif</h2>
            <p className="mx-auto mt-1 max-w-[270px] text-center text-sm text-[#424857]">
              Yuk belajar trik perkalian 2 digit, dan dapatkan soal-soal penjumlahan &lt;5.
            </p>
            <img src={thumbFunMath} alt="Fun Math Trick for Kids" className="mt-4 h-40 w-full rounded-xl object-cover" />
          </div>
        </div>
        <div className="mt-4 px-5">
          <div className="rounded-2xl bg-white/70 p-5 opacity-70 blur-[1px]">
            <h2 className="text-center text-lg font-bold text-slate-400">Virtual Meet-Up Berikutnya</h2>
            <div className="mt-3 h-24 rounded-xl bg-yellow-100/60" />
          </div>
        </div>
        {/* Overlay CTA gabung */}
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 mx-auto flex h-40 max-w-[480px] items-end justify-center bg-gradient-to-t from-slate-50 via-slate-50/90 to-transparent pb-24">
          <div className="pointer-events-auto text-center">
            <p className="text-sm font-medium text-slate-600">Ayo bergabung dalam komunitas Sarang Gasing</p>
            <Link to="/register" className="text-sm font-bold text-[#0033EC]">Daftar</Link>
          </div>
        </div>
      </div>

      {/* ===== Desktop: dashboard 2 kolom ===== */}
      <div className="mt-6 hidden px-2 pb-8 lg:block">
        {/* Row 1 (bebas dilihat) */}
        <div className="grid grid-cols-2 gap-5">
        {/* Row 1 — Konten Eksklusif */}
        <DashCard action={false} titleNode={
          <div className="w-full text-center">
            <h2 className="text-lg font-bold text-slate-800">Konten Eksklusif</h2>
            <p className="mx-auto mt-1 max-w-[300px] text-sm text-[#424857]">
              Yuk belajar trik perkalian 2 digit, dan dapatkan soal-soal penjumlahan &lt;5.
            </p>
          </div>
        }>
          <img src={thumbFunMath} alt="Fun Math Trick for Kids" className="mt-4 h-56 w-full rounded-xl object-cover" />
        </DashCard>

        {/* Row 1 — Virtual Meet-Up Berikutnya */}
        <DashCard titleNode={<h2 className="text-lg font-bold italic text-slate-800">Virtual Meet-Up <span className="not-italic">Berikutnya</span></h2>}>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {meetupUpcoming.slice(0, 2).map((m, i) => (
              <div key={m.id} className="relative h-56 overflow-hidden rounded-xl bg-cover bg-center" style={{ backgroundImage: `url(${thumbAngka})` }}>
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                {i === 0 && (
                  <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-slate-900/80 px-3 py-1 text-xs font-bold text-white">
                    <CheckCircle2 size={13} /> Sudah Daftar
                  </span>
                )}
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <p className="flex items-center gap-1 text-[11px] opacity-80"><Video size={11} /> {m.date}</p>
                  <h3 className="line-clamp-2 text-sm font-bold">{m.title}</h3>
                </div>
              </div>
            ))}
          </div>
        </DashCard>
        </div>

        {/* Row 2 & 3 (terkunci): blur + CTA gabung */}
        <div className="relative mt-5">
          <div className="pointer-events-none grid select-none grid-cols-2 gap-5 blur-[5px]">
        {/* Row 2 — Ada Apa di Komunitas Gasing? */}
        <DashCard title="Ada Apa di Komunitas Gasing?">
          <div className="mt-3 flex gap-5 border-b border-slate-100 text-sm font-semibold">
            <button onClick={() => setTab("trending")} className={"pb-2 " + (tab === "trending" ? "border-b-2 border-blue-600 text-blue-600" : "text-slate-400")}>Trending</button>
            <button onClick={() => setTab("terbaru")} className={"pb-2 " + (tab === "terbaru" ? "border-b-2 border-blue-600 text-blue-600" : "text-slate-400")}>Terbaru</button>
          </div>
          <div className="flex flex-col divide-y divide-slate-100">
            {topics.map((t) => <MiniTopic key={t.id} t={t} />)}
          </div>
        </DashCard>

        {/* Row 2 — Gasing Academy News */}
        <DashCard title="Gasing Academy News">
          <div className="mt-3 flex flex-col divide-y divide-slate-100">
            {gaNews.slice(0, 3).map((n) => (
              <Link to="/komunitas/ga-news" key={n.id} className="flex gap-3 py-3">
                <img src={n.image} alt="" aria-hidden className="h-14 w-16 shrink-0 rounded-lg object-cover" />
                <div className="min-w-0">
                  <h3 className="line-clamp-2 text-sm font-bold leading-snug text-slate-800">{n.title}</h3>
                  <p className="mt-1 text-xs text-slate-400">{n.date} · {n.time}</p>
                </div>
              </Link>
            ))}
          </div>
        </DashCard>

        {/* Row 3 — Update Materi Gasing */}
        <DashCard title="Update Materi Gasing">
          <div className="mt-3 flex flex-col divide-y divide-slate-100">
            {materiUpdates.map((u) => (
              <div key={u.id} className="flex gap-3 py-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-blue-500 text-xs font-bold text-white">GA</span>
                <div className="min-w-0 flex-1">
                  <h3 className="line-clamp-1 text-sm font-bold text-slate-800">{u.title}</h3>
                  <p className="mt-1 text-xs text-slate-400">1w · {u.author} menjawab {u.time}</p>
                  <div className="mt-1.5 flex items-center gap-3">
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600">{u.tag}</span>
                    <span className="flex items-center gap-1 text-xs text-slate-400"><Heart size={12} /> {u.likes}</span>
                    <span className="flex items-center gap-1 text-xs text-slate-400"><MessageCircle size={12} /> {u.comments}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DashCard>

        {/* Row 3 — Promo produk */}
        <div className="relative flex flex-col items-center justify-end overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-50 to-white p-6 text-center shadow-md">
          <div className="flex flex-1 items-center justify-center gap-3 py-4 text-6xl" aria-hidden>📚🐙🎨🐢</div>
          <h3 className="text-xl font-extrabold text-slate-800">Cari produk lain untuk mengajar anak dan siswa?</h3>
          <Link to="#" className="mt-4 w-full max-w-xs rounded-full bg-gradient-to-r from-blue-600 to-indigo-500 py-3 text-sm font-bold text-white shadow-lg">
            Ayo ke Gasing Think & Play!
          </Link>
        </div>
          </div>

          {/* Modal Daftar - melayang di tengah bawah */}
          <div className="fixed bottom-8 left-1/2 z-40 w-11/12 max-w-sm -translate-x-1/2 rounded-2xl bg-white px-10 py-5 text-center shadow-2xl ring-1 ring-slate-200">
            <p className="text-sm font-medium text-slate-600">Ayo bergabung dalam komunitas Sarang Gasing</p>
            <Link to="/register" className="text-sm font-bold text-[#0033EC]">Daftar</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
