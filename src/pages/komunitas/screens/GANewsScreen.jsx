import { Link } from "react-router-dom";
import { ChevronLeft, Search, ArrowUpDown, Filter, Calendar, Heart, MessageCircle, MoreHorizontal, ChevronDown } from "lucide-react";

const mockNews = [
  {
    id: 1,
    title: "Apakah ada tips menghitung penjumlahan banyak angka?",
    time: "14 jam lalu",
    likes: "1.2k",
    comments: 0,
    image: "https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&q=80&w=800",
  },
  {
    id: 2,
    title: "Metode Gasing Dorong Inovasi Baru dan Mutu Pendidikan di Buleleng",
    time: "2 hari lalu",
    likes: "134",
    comments: 2,
    image: "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=800",
  },
  {
    id: 3,
    title: "Pelatihan Gasing di Berbagai Daerah Terus Berkembang",
    time: "3 hari lalu",
    likes: "500",
    comments: 10,
    image: "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&q=80&w=800",
  }
];

export default function GANewsScreen() {
  return (
    <div className="relative flex min-h-screen flex-col bg-slate-50">
      {/* Header */}
      <div 
        className="relative flex items-center justify-between bg-gradient-to-r from-blue-500 to-cyan-400 px-4 pb-6 pt-6 text-white shadow-sm"
        style={{ borderBottomLeftRadius: '50% 12px', borderBottomRightRadius: '50% 12px' }}
      >
        <Link to="/komunitas/home" className="p-1">
          <ChevronLeft className="h-6 w-6 text-white" />
        </Link>
        <h1 className="text-lg font-bold tracking-wide">Gasing Academy News</h1>
        <button className="p-1">
          <Search className="h-6 w-6 text-white" />
        </button>
      </div>

      {/* Filters */}
      <div className="mt-2 flex items-center gap-2 px-4 py-4">
        <button className="flex flex-1 items-center justify-between gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-slate-500" />
            <span>Terbaru</span>
          </div>
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </button>
        <button className="flex flex-1 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm">
          <Filter className="h-4 w-4 text-slate-500" />
          <span>Kategori</span>
        </button>
        <button className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm">
          <Calendar className="h-4 w-4 text-slate-500" />
        </button>
      </div>

      {/* News List */}
      <div className="flex-1 px-4 pb-20">
        {mockNews.map((news) => (
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
    </div>
  );
}
