import { Link } from "react-router-dom";
import { Bookmark, HelpCircle, TrendingUp, ChevronRight, Heart, MessageCircle, Pin } from "lucide-react";
import { trendingTopics } from "../data";
import { headerKomunitas, charBlue } from "../assets";

// /komunitas/komunitas — header ungu + maskot, Top 10 Trending.
export default function KomunitasScreen() {

  return (
    <div className="flex flex-col">
      {/* Header ungu */}
      <div
        className="relative bg-cover bg-center px-5 pb-20 pt-4 text-white"
        style={{ backgroundImage: `url(${headerKomunitas})` }}
      >
        <div className="flex items-center justify-end gap-4">
          <Bookmark size={20} />
          <HelpCircle size={20} />
        </div>
        <div className="relative mt-6 flex items-center justify-center">
          <img src={charBlue} alt="" aria-hidden className="absolute left-0 -top-1 h-20 w-auto object-contain" />
          <h1 className="text-2xl font-extrabold">Komunitas</h1>
        </div>
      </div>

      {/* Kartu Trending (overlap) */}
      <div className="-mt-12 px-4">
        <div className="relative overflow-hidden rounded-2xl bg-white p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800">
              <TrendingUp size={20} className="text-green-500" /> Top 10 Trending
            </h2>
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200">
              <ChevronRight size={16} />
            </span>
          </div>

          <div className="mt-3 flex flex-col divide-y divide-slate-100">
            {trendingTopics.map((t) => (
              <div key={t.id} className="py-3">
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
                      <span className="line-clamp-2">{t.title}</span>
                    </h3>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-400">{t.excerpt}</p>
                    {t.image && (
                      <img
                        src={t.image}
                        alt=""
                        aria-hidden
                        className="mt-2 h-28 w-full rounded-lg object-cover"
                      />
                    )}
                    <div className="mt-2 flex items-center gap-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1"><Heart size={13} /> {t.likes}</span>
                      <span className="flex items-center gap-1"><MessageCircle size={13} /> {t.comments}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Overlay CTA gabung (fake login-gate) */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 top-1/2 flex items-end justify-center bg-gradient-to-t from-white via-white/90 to-transparent pb-4">
            <div className="pointer-events-auto text-center">
              <p className="text-sm font-medium text-slate-600">
                Ayo bergabung dalam komunitas Sarang Gasing
              </p>
              <Link to="/register" className="text-sm font-bold text-[#0033EC]">Daftar</Link>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
