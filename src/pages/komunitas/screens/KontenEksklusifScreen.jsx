import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, SlidersHorizontal, ChevronRight, Play } from "lucide-react";
import { kontenEksklusif, kontenSebelumnya } from "../data";
import { headerEksklusif } from "../assets";

// Kartu konten (thumb + judul + badge). `blur` = state login-gate.
function KontenCard({ item, video }) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
      <div
        className="relative flex h-44 items-center justify-center bg-cover bg-center"
        style={item.img ? { backgroundImage: `url(${item.img})` } : { backgroundColor: item.thumb }}
      >
        {item.month && (
          <span className="absolute left-3 top-3 rounded-md bg-orange-500 px-2 py-0.5 text-xs font-bold text-white">{item.month}</span>
        )}
        {video && (
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/80 text-blue-600 shadow-md">
            <Play size={20} className="ml-0.5" />
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
  );
}

// /komunitas/konten-ekslusif — Bulan Ini (terbuka) + Bulan Sebelumnya (blur/gate).
export default function KontenEksklusifScreen() {
  const [filterOpen, setFilterOpen] = useState(false);

  return (
    <div className="relative flex flex-col">
      <div
        className="relative h-28 overflow-hidden bg-cover bg-top px-5 pt-6 text-white lg:h-40 lg:rounded-3xl"
        style={{
          backgroundImage: `url(${headerEksklusif})`,
          mask: "radial-gradient(120% 40px at bottom, transparent 98%, black 100%)",
        }}
      >
        <div className="flex items-center justify-between">
          <h1 className="w-full text-center text-xl font-extrabold lg:pt-6 lg:text-4xl">Konten Eksklusif</h1>
          <Search size={22} className="absolute right-5 text-white lg:hidden" />
        </div>
      </div>

      {/* ===== Mobile: Terkunci ===== */}
      <div className="lg:hidden relative">
        <div style={{ "--blur-start": "360px" }} className="blur-effect-mobile px-5 pt-5 pb-20">
          {/* Toolbar: Filters + search (desktop) */}
          <div className="flex items-center justify-between">
            <div className="relative">
              <button
                onClick={() => setFilterOpen((v) => !v)}
                className="inline-flex items-center gap-2 rounded-full border border-blue-300 bg-white px-4 py-2 text-sm font-medium text-blue-600"
              >
                <SlidersHorizontal size={16} /> Filters
              </button>
              {filterOpen && (
                <div className="absolute left-0 top-11 z-20 w-48 rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
                  <label className="flex items-center gap-2 py-1.5 text-sm text-slate-700">
                    <input type="checkbox" className="rounded" /> Materi Spesial
                  </label>
                  <label className="flex items-center gap-2 py-1.5 text-sm text-slate-700">
                    <input type="checkbox" className="rounded" /> Worksheet
                  </label>
                </div>
              )}
            </div>
            <div className="hidden lg:block lg:w-80">
              <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-400 shadow-sm">
                <Search className="h-4 w-4" /> Cari konten...
              </div>
            </div>
          </div>

          {/* ===== Bulan Ini ===== */}
          <div className="mt-5 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-300">
              <ChevronRight size={14} />
            </span>
            <h2 className="font-bold text-slate-800">Bulan Ini</h2>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {kontenEksklusif.map((item) => (
              <KontenCard key={item.id} item={item} video={item.video} />
            ))}
          </div>

          {/* ===== Bulan Sebelumnya (blur + login-gate) ===== */}
          <div className="relative mt-8 pb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-300">
                  <ChevronRight size={14} />
                </span>
                <h2 className="font-bold text-slate-800">Bulan Sebelumnya</h2>
              </div>
              {/* Toggle RGP / Formatif */}
              <div className="flex rounded-full bg-slate-200 p-0.5 text-xs font-semibold">
                <span className="rounded-full bg-violet-600 px-3 py-1 text-white">RGP</span>
                <span className="px-3 py-1 text-slate-500">Formatif</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {kontenSebelumnya.map((item) => (
                <KontenCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        </div>


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
      <div className="hidden lg:block px-5 pt-5 lg:px-2">
        {/* Toolbar: Filters + search (desktop) */}
        <div className="flex items-center justify-between">
          <div className="relative">
            <button
              onClick={() => setFilterOpen((v) => !v)}
              className="inline-flex items-center gap-2 rounded-full border border-blue-300 bg-white px-4 py-2 text-sm font-medium text-blue-600"
            >
              <SlidersHorizontal size={16} /> Filters
            </button>
            {filterOpen && (
              <div className="absolute left-0 top-11 z-20 w-48 rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
                <label className="flex items-center gap-2 py-1.5 text-sm text-slate-700">
                  <input type="checkbox" className="rounded" /> Materi Spesial
                </label>
                <label className="flex items-center gap-2 py-1.5 text-sm text-slate-700">
                  <input type="checkbox" className="rounded" /> Worksheet
                </label>
              </div>
            )}
          </div>
          <div className="hidden lg:block lg:w-80">
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-400 shadow-sm">
              <Search className="h-4 w-4" /> Cari konten...
            </div>
          </div>
        </div>

        {/* ===== Bulan Ini ===== */}
        <div className="blur-effect-desktop">
          <div className="mt-5 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-300">
              <ChevronRight size={14} />
            </span>
            <h2 className="font-bold text-slate-800">Bulan Ini</h2>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {kontenEksklusif.map((item) => (
              <KontenCard key={item.id} item={item} video={item.video} />
            ))}
          </div>
        </div>

        {/* ===== Bulan Sebelumnya (blur + login-gate) ===== */}
        <div className="relative mt-8 pb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-300">
                <ChevronRight size={14} />
              </span>
              <h2 className="font-bold text-slate-800">Bulan Sebelumnya</h2>
            </div>
            {/* Toggle RGP / Formatif */}
            <div className="flex rounded-full bg-slate-200 p-0.5 text-xs font-semibold">
              <span className="rounded-full bg-violet-600 px-3 py-1 text-white">Aktif</span>
              <span className="px-3 py-1 text-slate-500">Tidak Aktif</span>
            </div>
          </div>

          <div className="blur-effect-desktop mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {kontenSebelumnya.map((item) => (
              <KontenCard key={item.id} item={item} />
            ))}
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
