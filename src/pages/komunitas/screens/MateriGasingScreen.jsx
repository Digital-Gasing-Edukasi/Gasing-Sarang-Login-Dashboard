import { useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Heart, MessageCircle, Clock, BookMarked } from "lucide-react";
import { materiTabs, materiList } from "../data";
import { headerMateri, charBlue } from "../assets";

// /komunitas/materi-gasing — header teal + maskot, tab metode, kartu materi.
export default function MateriGasingScreen() {
  const [tab, setTab] = useState(materiTabs[0]);

  return (
    <div className="flex flex-col">
      <div
        className="relative h-28 overflow-hidden bg-cover bg-center"
        style={{
          backgroundImage: `url(${headerMateri})`,
          mask: "radial-gradient(120% 40px at bottom, transparent 98%, black 100%)",
        }}
      >
        <h1 className="relative pt-6 text-center text-xl font-extrabold text-white">Materi Gasing</h1>
        <img src={charBlue} alt="" aria-hidden className="absolute -right-1 top-1 h-24 w-auto object-contain" />
      </div>

      <div className="px-5 pt-5">
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
                (t === tab
                  ? "bg-blue-600 text-white"
                  : "border border-blue-300 bg-white text-blue-600")
              }
            >
              {t}
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-4">
          {materiList.map((m) => (
            <Link to={`/komunitas/materi-gasing/${m.slug}`} key={m.id} className="block overflow-hidden rounded-2xl bg-white shadow-sm">
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
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
