import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Search, ArrowUpDown, Filter, Calendar, Heart, MessageCircle, MoreHorizontal, ChevronDown, Bookmark, Share2, Book } from "lucide-react";
import { gaNews } from "../data";
import { charBlue, headerGANews } from "../assets";

// Badge kategori kecil.
function CategoryPill({ children }) {
  return (
    <span className="rounded-full border border-green-300 px-3 py-0.5 text-xs font-semibold text-green-600">
      {children}
    </span>
  );
}

// Body artikel statis (dummy) — dipakai reading pane desktop.
function ArticleBody({ article }) {
  return (
    <>
      <p className="text-xs italic text-slate-500">{article.date}</p>
      <div className="mt-2 flex items-center gap-2">
        <CategoryPill>{article.category}</CategoryPill>
      </div>
      <h1 className="mt-3 text-2xl font-extrabold leading-tight text-slate-800">
        {article.title}
      </h1>
      <p className="mt-3 text-sm text-slate-500">{article.excerpt}</p>

      <div className="mt-5 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-pink-500 to-purple-600">
          <img
            src={charBlue}
            alt=""
            aria-hidden
            className="h-9 w-9 object-contain"
          />
        </span>
        <div>
          <p className="font-bold text-slate-800">Tamu Gasing</p>
          <p className="flex items-center gap-1 text-sm font-semibold text-blue-600">
            <Book size={13} /> Trainer Utama
          </p>
        </div>
      </div>

      <img
        src={article.image}
        alt={article.title}
        className="mt-5 h-64 w-full rounded-2xl object-cover"
      />

      <div className="mt-5 space-y-4 text-[15px] leading-relaxed text-slate-700">
        <p>
          Belakangan ini aku cukup sering harus menghitung penjumlahan angka
          dalam jumlah banyak, mulai dari data pengeluaran, rekap pekerjaan,
          hingga angka-angka random yang harus dijumlahkan manual. Masalahnya,
          makin banyak angkanya biasanya makin gampang salah hitung 😅
        </p>
        <p>
          Kadang baru sadar ada angka yang kelewat, salah input, atau total
          akhirnya beda saat dicek ulang. Apalagi kalau hitungnya masih manual
          tanpa bantuan spreadsheet atau calculator formula tertentu.
        </p>
      </div>

      <img
        src={article.image}
        alt=""
        aria-hidden
        className="mt-5 h-64 w-full rounded-2xl object-cover"
      />

      <div className="mt-5 text-[15px] leading-relaxed text-slate-700">
        <p>
          Aku penasaran, apakah kalian punya tips atau metode khusus supaya
          proses penjumlahan banyak angka jadi lebih cepat, rapi, dan minim
          error? Misalnya:
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5">
          <li>cara membagi angka supaya lebih mudah dihitung,</li>
          <li>teknik hitung cepat,</li>
          <li>kebiasaan untuk double-check hasil,</li>
          <li>penggunaan tools tertentu,</li>
          <li>
            atau mungkin metode yang sering dipakai saat kerja atau sekolah.
          </li>
        </ul>
        <p className="mt-4">
          Kalau ada contoh cara yang biasa kalian pakai juga boleh banget
          dibagikan. Siapa tahu bisa membantu orang lain yang sering struggle
          saat menghitung angka dalam jumlah banyak 🙌
        </p>
      </div>

      <div className="mt-6 flex justify-end">
        <button className="flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-sm font-bold text-blue-600">
          <Share2 size={15} /> Share
        </button>
      </div>

      <div className="mt-4 flex items-center gap-5 border-t border-slate-100 pt-4 text-sm text-slate-400">
        <span className="flex items-center gap-1.5">
          <Heart size={16} /> 1.2k
        </span>
        <span className="flex items-center gap-1.5">
          <MessageCircle size={16} /> 45.4k
        </span>
        <span className="ml-auto flex items-center gap-3">
          <Bookmark size={16} /> <Share2 size={16} />
        </span>
      </div>
    </>
  );
}

export default function GANewsScreen() {
  const [selected] = useState(gaNews[0].id);
  const article = gaNews.find((n) => n.id === selected) || gaNews[0];

  return (
    <div className="relative flex min-h-screen flex-col bg-slate-50 lg:bg-transparent">
      {/* Header — pola banner asli + mask (konsisten dgn kategori lain) */}
      <div
        className="relative h-28 overflow-hidden bg-cover bg-center px-4 pt-6 text-white lg:h-40 lg:rounded-3xl lg:px-8"
        style={{
          backgroundImage: `url(${headerGANews})`,
          mask: "radial-gradient(120% 40px at bottom, transparent 98%, black 100%)",
        }}
      >
        <div className="relative flex items-center justify-between">
          <Link to="/komunitas/home" className="p-1 lg:hidden">
            <ChevronLeft className="h-6 w-6 text-white" />
          </Link>
          <h1 className="text-lg font-bold tracking-wide lg:mx-auto lg:pt-6 lg:text-3xl">Gasing Academy News</h1>
          <button className="p-1 lg:hidden">
            <Search className="h-6 w-6 text-white" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-2 flex items-center gap-2 px-4 py-4 lg:px-2">
        <button className="flex items-center justify-between gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm lg:flex-none">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-slate-500" />
            <span>Terbaru</span>
          </div>
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </button>
        <button className="flex flex-1 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm lg:flex-none">
          <Filter className="h-4 w-4 text-slate-500" />
          <span>Kategori</span>
        </button>
        <button className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm">
          <Calendar className="h-4 w-4 text-slate-500" />
        </button>
        <div className="ml-auto hidden lg:block lg:w-80">
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-400 shadow-sm">
            <Search className="h-4 w-4" /> Cari berita...
          </div>
        </div>
      </div>

      {/* ===== Mobile: list kartu ===== */}
      <div className="lg:hidden relative">
        <div style={{ "--blur-start": "200px" }} className="blur-effect-mobile flex-1 px-4 pb-20">
          {gaNews.map((news) => (
            <div key={news.id} className="mb-5 overflow-hidden rounded-xl bg-white shadow-sm">
              <img src={news.image} alt={news.title} className="h-40 w-full object-cover" />
              <div className="p-4">
                <h2 className="text-[15px] font-bold leading-snug text-slate-800">{news.title}</h2>
                <div className="mt-5 flex items-center justify-between text-xs text-slate-400">
                  <span>{news.time}</span>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <Heart className="h-[18px] w-[18px]" />
                      <span className="font-medium text-slate-500">{news.likes}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MessageCircle className="h-[18px] w-[18px]" />
                      <span className="font-medium text-slate-500">{news.comments}</span>
                    </div>
                    <MoreHorizontal className="ml-1 h-5 w-5" />
                  </div>
                </div>
              </div>
            </div>
          ))}
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

      {/* ===== Desktop: reading pane (terkunci → blur, CTA di tengah bawah) ===== */}
      <div className="relative hidden px-2 pb-8 lg:block">
        <div className="blur-effect-desktop grid gap-5 lg:grid-cols-[300px_1fr]">
          {/* List kiri */}
          <div className="flex flex-col gap-3">
            {gaNews.map((news, i) => {
              const active = news.id === selected;
              return (
                <div
                  key={news.id}
                  className={
                    "flex gap-3 rounded-2xl p-3 text-left " +
                    (active ? "bg-white shadow-md ring-1 ring-blue-100" : "bg-white/60")
                  }
                >
                  <img src={news.image} alt="" aria-hidden className="h-16 w-20 shrink-0 rounded-lg object-cover" />
                  <div className="min-w-0">
                    <h3 className="line-clamp-2 text-sm font-bold leading-snug text-slate-800">{news.title}</h3>
                    {i === 0 && <p className="mt-1 line-clamp-1 text-xs text-slate-400">{news.excerpt}</p>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Artikel kanan */}
          <article className="rounded-3xl bg-white p-8 shadow-sm">
            <ArticleBody article={article} />
          </article>
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
