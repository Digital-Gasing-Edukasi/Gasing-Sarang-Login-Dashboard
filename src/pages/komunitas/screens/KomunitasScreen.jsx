import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bookmark, ChevronLeft, ChevronRight, ChevronDown, Search, ArrowDownUp, MoreHorizontal, Heart, MessageCircle, Eye, Pin, BadgeCheck } from "lucide-react";
import { forumPosts } from "../data";

// Baris post Forum (dipakai mobile & desktop — layout identik).
function ForumRow({ p }) {
  // Menghasilkan inisial dari judul jika tidak ada author
  const getInitials = (title) => {
    return title.split(' ').map(word => word[0]).join('').slice(0, 2).toUpperCase();
  };

  return (
    <a href={p.url} target="_blank" rel="noopener noreferrer" className="flex gap-3 py-4">
      <span className="relative shrink-0">
        {p.avatarImg ? (
          <>
            <img src={p.avatarImg} alt="" aria-hidden className="h-10 w-10 rounded-full bg-slate-200 object-cover" />
            {p.verified && (
              <BadgeCheck size={15} className="absolute -bottom-0.5 -right-0.5 rounded-full bg-white text-blue-500" />
            )}
          </>
        ) : (
          // Fallback ke avatar inisial jika tidak ada gambar
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500 text-sm font-bold text-white">
            {getInitials(p.title)}
          </span>
        )}
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
          style={{ backgroundColor: p.authorColor }}
        >
          {p.author}
        </span>
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="flex items-center gap-1.5 font-bold text-slate-800">
          {p.pinned && <Pin size={15} className="shrink-0 -rotate-45 text-slate-500" fill="currentColor" />}
          <span className="truncate">{p.title}</span>
        </h3>
        <p className="mt-1 line-clamp-2 text-sm italic leading-relaxed text-slate-400">{p.excerpt}</p>
        <div className="mt-3 flex items-center text-xs text-slate-400">
          <span className="flex items-center gap-1.5"><Heart size={15} /> {p.likes}</span>
          <span className="ml-5 flex items-center gap-1.5"><MessageCircle size={15} /> {p.comments}</span>
          <span className="ml-5 flex items-center gap-1.5"><Eye size={15} /> {p.views}</span>
          <span className="ml-auto flex items-center gap-4">
            <Bookmark size={16} />
            <MoreHorizontal size={16} />
          </span>
        </div>
      </div>
    </a>
  );
}

// /komunitas/komunitas — layar Forum. Sama persis mobile & desktop, cuma
// desktop di-center (max-w) & header full-bleed (lg:-mx/-my counter padding page).
export default function KomunitasScreen() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState(forumPosts);
  const [sortOrder, setSortOrder] = useState("terbaru");
  const [searchQuery, setSearchQuery] = useState("");
  // State untuk menampilkan/menyembunyikan input search di mobile
  const [searchVisible, setSearchVisible] = useState(false);

  const handleSort = () => {
    const newOrder = sortOrder === "a-z" ? "z-a" : "a-z";
    setSortOrder(newOrder);

    const sortedPosts = [...posts].sort((a, b) => {
      if (a.pinned) return -1; // Keep pinned post at the top
      if (b.pinned) return 1;
      return newOrder === "a-z"
        ? a.title.localeCompare(b.title)
        : b.title.localeCompare(a.title);
    });
    setPosts(sortedPosts);
  };

  // Filter posts berdasarkan query pencarian
  const filteredPosts = posts.filter(post => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      post.title.toLowerCase().includes(query) ||
      (post.excerpt && post.excerpt.toLowerCase().includes(query))
    );
  });

  return (
    <div className="flex flex-col lg:-mx-6 lg:-my-6">
      {/* Header ungu Forum (full-bleed, judul di tengah) */}
      <div className="flex items-center justify-between bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 px-5 py-4 text-white lg:py-6">
        {searchVisible && !window.matchMedia('(min-width: 1024px)').matches ? (
          <div className="relative w-full">
            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onBlur={() => setSearchVisible(false)}
              placeholder="Cari di forum..."
              className="w-full rounded-full bg-white py-2 pl-10 pr-4 text-sm text-slate-800 placeholder:text-slate-400"
              autoFocus
            />
          </div>
        ) : (
          <>
            <button onClick={() => navigate("/komunitas/home")} aria-label="Kembali" className="lg:invisible">
              <ChevronLeft size={24} />
            </button>
            <h1 className="text-lg font-bold lg:text-2xl">Forum</h1>
            <button onClick={() => setSearchVisible(true)} aria-label="Cari" className="lg:hidden">
              <Search size={20} />
            </button>
            <div className="hidden lg:block w-8 h-8" />
          </>
        )}
      </div>

      {/* Konten Forum */}
      <div className="min-h-[60vh] bg-white lg:min-h-screen">
        <div className="mx-auto w-full lg:max-w-4xl lg:px-4">
          {/* Search & Sort (desktop) */}
          <div className="hidden items-center gap-4 px-4 pt-6 lg:flex">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari di forum..."
                className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-11 pr-4 text-sm text-slate-800 placeholder:text-slate-400 shadow-sm"
              />
            </div>
            <button
              onClick={handleSort}
              className="flex w-48 items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm"
            >
              <span className="flex items-center gap-2">
                <ArrowDownUp size={16} /> {sortOrder === "a-z" ? "A-Z" : sortOrder === "z-a" ? "Z-A" : "Terbaru"}
              </span>
              <ChevronDown size={18} className="text-slate-400" />
            </button>
          </div>

          {/* Sort dropdown */}
          <div className="px-4 pt-4 lg:hidden">
            <button
              onClick={handleSort}
              className="flex w-48 items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm"
            >
              <span className="flex items-center gap-2">
                <ArrowDownUp size={16} /> {sortOrder === "a-z" ? "A-Z" : sortOrder === "z-a" ? "Z-A" : "Terbaru"}
              </span>
              <ChevronDown size={18} className="text-slate-400" />
            </button>
          </div>

          {/* List post */}
          <div className="mt-3 px-4">
            {/* Post highlight */}
            <div className="-mx-4 border-b border-slate-100 bg-indigo-50/60 px-4 lg:mx-0 lg:mb-2 lg:rounded-2xl lg:border-0">
              <ForumRow p={filteredPosts.find(p => p.pinned) || filteredPosts[0]} />
            </div>
            <div className="divide-y divide-slate-100">
              {filteredPosts.filter(p => !p.pinned && p.id !== (filteredPosts.find(p => p.pinned) || filteredPosts[0])?.id).map((p) => (
                <ForumRow key={p.id} p={p} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
