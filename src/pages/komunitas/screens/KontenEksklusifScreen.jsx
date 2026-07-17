import { Link } from "react-router-dom";
import { Search, SlidersHorizontal, ChevronRight, Play } from "lucide-react";
import { kontenEksklusif } from "../data";
import { headerEksklusif } from "../assets";

// /komunitas/konten-ekslusif — header pink→oranye + filter + daftar video.
export default function KontenEksklusifScreen() {
  return (
    <div className="relative flex flex-col h-screen overflow-hidden">
      <div
        className="relative h-28 overflow-hidden bg-cover bg-top px-5 pt-6 text-white"
        style={{
          backgroundImage: `url(${headerEksklusif})`,
          mask: "radial-gradient(120% 40px at bottom, transparent 98%, black 100%)",
        }}
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
          {kontenEksklusif.map((item, index) => {
            const isBlurred = index > 0;
            return (
              <div key={item.id} className="relative">
                {isBlurred && (
                  <div className="absolute inset-0 z-10 rounded-2xl bg-white/30 backdrop-blur-[4px]" />
                )}
                <div className={`overflow-hidden rounded-2xl bg-white shadow-sm ${isBlurred ? "pointer-events-none select-none" : ""}`}>
                  <div
                    className="relative flex h-44 items-center justify-center bg-cover bg-center"
                    style={item.img ? { backgroundImage: `url(${item.img})` } : { backgroundColor: item.thumb }}
                  />
                  <div className="p-4">
                    <h3 className="font-bold leading-snug text-slate-800">{item.title}</h3>
                    <span className="mt-3 inline-block rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-600">
                      {item.badge}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Overlay CTA gabung (fake login-gate) */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-50 h-1/2 flex items-end justify-center bg-gradient-to-t from-white via-white/90 to-transparent pb-6">
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
