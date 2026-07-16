import { Search, SlidersHorizontal, ChevronRight, Play } from "lucide-react";
import { kontenEksklusif } from "../data";

// /komunitas/konten-ekslusif — header pink→oranye + filter + daftar video.
export default function KontenEksklusifScreen() {
  return (
    <div className="flex flex-col">
      <div
        className="relative bg-gradient-to-r from-pink-500 via-fuchsia-500 to-orange-400 px-5 pb-10 pt-6 text-white"
        style={{ mask: "radial-gradient(120% 60px at bottom, transparent 98%, black 100%)" }}
      >
        <div className="flex items-center justify-between">
          <h1 className="w-full text-center text-xl font-extrabold">Konten Eksklusif</h1>
          <Search size={22} className="absolute right-5 text-white" />
        </div>
      </div>

      <div className="px-5 pt-5">
        <button className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-600">
          <SlidersHorizontal size={16} /> Filters
        </button>

        <div className="mt-5 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-300">
            <ChevronRight size={14} />
          </span>
          <h2 className="font-bold text-slate-800">Bulan Ini</h2>
        </div>

        <div className="mt-4 flex flex-col gap-5">
          {kontenEksklusif.map((item) => (
            <div key={item.id} className="overflow-hidden rounded-2xl bg-white shadow-sm">
              <div
                className="relative flex h-44 items-center justify-center bg-cover bg-center"
                style={item.img ? { backgroundImage: `url(${item.img})` } : { backgroundColor: item.thumb }}
              >
                {item.video && (
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/40">
                    <Play size={22} className="ml-0.5 text-white" fill="white" />
                  </span>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-bold leading-snug text-slate-800">{item.title}</h3>
                <span className="mt-3 inline-block rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-600">
                  {item.badge}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
