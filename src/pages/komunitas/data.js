// Data statis dummy untuk halaman Komunitas guest (ADR-0004).
// Semua konten hardcoded — tidak ada call backend. Ganti di sini kalau
// nanti mau disambung ke API beneran.
import {
  thumbVideoKonten,
  thumbRubik,
  thumbFunMath,
  materiBilangan,
  materiPenjumlahan,
  materiPerkalian,
  materiPengurangan,
  materiPembagian,
} from "./assets";

export const GUEST_NAME = "Tamu Gasing";

// ── /komunitas/konten-ekslusif ────────────────────────────────────────────
export const kontenEksklusif = [
  {
    id: 1,
    title: "Cara mengajar Penjumlahan & Pengurangan kepada anak berkebutuhan khusus",
    badge: "Materi Spesial",
    img: thumbVideoKonten,
    video: true,
  },
  {
    id: 2,
    title: "Perkalian dua angka & dua angka",
    badge: "Trik Gasing",
    img: null,
    thumb: "#e8dcc8",
    video: false,
  },
];

// ── /komunitas/virtual-meet-up ────────────────────────────────────────────
export const meetupUpcoming = [
  {
    id: 1,
    speakers: "John Huawei, Billeyeber, Ibnu Sina, dkk",
    title: "Pengenalan Schwarzschild Radius",
    date: "21 Maret 2026",
    time: "17:00 - 18:00 WIB",
    attendees: "99+",
  },
  {
    id: 2,
    speakers: "Siti Aisyah, dkk",
    title: "Strategi Mengajar Perkalian Cepat",
    date: "28 Maret 2026",
    time: "19:00 - 20:00 WIB",
    attendees: "42",
  },
];

export const meetupPast = [
  {
    id: 101,
    title: "Pengenalan Schwarzschild Radius untuk kehidupan sehari-hari",
    speakers: "John Huawei, dkk",
    date: "14 Maret 2026",
    tag: "Rekaman",
  },
  {
    id: 102,
    title: "Bilangan bulat & operasinya",
    speakers: "Ibnu Sina, dkk",
    date: "7 Maret 2026",
    tag: "Rekaman",
  },
];

// ── /komunitas/materi-gasing ──────────────────────────────────────────────
export const materiTabs = ["Semua", "BakalKuBagi", "BuPeDe"];

export const materiList = [
  {
    id: 1,
    title: "Mengenal Penjumlahan",
    url: "https://canva.link/4dikcsrirbwdyn6",
    element: materiPenjumlahan,
    likes: "99+",
    comments: "99+",
    reads: "33 hari",
    duration: "1-2 jam",
  },
  {
    id: 2,
    title: "Mengenal Pengurangan",
    url: "https://canva.link/lmo2iec9fsacoc7",
    element: materiPengurangan,
    likes: "70+",
    comments: "40+",
    reads: "18 hari",
    duration: "1-2 jam",
  },
  {
    id: 3,
    title: "Mengenal Pembagian",
    url: "https://canva.link/my2k5kij3u5asan",
    element: materiPembagian,
    likes: "65+",
    comments: "30+",
    reads: "15 hari",
    duration: "1-2 jam",
  },
  {
    id: 4,
    title: "Mengenal Perkalian",
    url: "https://canva.link/elf6da3dznw09iw",
    element: materiPerkalian,
    likes: "88+",
    comments: "56+",
    reads: "20 hari",
    duration: "1-2 jam",
  },
  {
    id: 5,
    title: "BaKalKuBagi",
    url: "https://canva.link/bx8mlatytxxscbc",
    element: materiBilangan,
    likes: "45+",
    comments: "10+",
    reads: "5 hari",
    duration: "1-2 jam",
  },
  {
    id: 6,
    title: "Trivia",
    url: "https://math-flashcards-ten.vercel.app/",
    element: thumbFunMath,
    likes: "120+",
    comments: "85+",
    reads: "10 hari",
    duration: "30 menit",
  },
];

// ── /komunitas/komunitas ──────────────────────────────────────────────────
export const trendingTopics = [
  {
    id: 1,
    author: "HK",
    authorColor: "#e5484d",
    pinned: true,
    title: "Trik anti-pusing hitung banyak angka sekaligus: Ada yang punya...",
    excerpt:
      "Lorem ipsum is simply dummy text of the printing and typesetting industry. Lorem ipsum...",
    image: thumbRubik,
    likes: 128,
    comments: 24,
  },
  {
    id: 2,
    author: "AB",
    authorColor: "#8b5cf6",
    pinned: false,
    title: "Apakah ada tips untuk menghitung pengurangan banyak angka?",
    excerpt:
      "Lorem ipsum is simply dummy text of the printing and typesetting industry. Lorem ipsum...",
    image: null,
    likes: 96,
    comments: 18,
  },
  {
    id: 3,
    author: "RS",
    authorColor: "#0ea5e9",
    pinned: false,
    title: "Metode Gasing untuk perkalian susun ke bawah",
    excerpt:
      "Lorem ipsum is simply dummy text of the printing and typesetting industry.",
    image: null,
    likes: 74,
    comments: 12,
  },
];

export const komunitasTabs = [
  { key: "forum", label: "Forum" },
  { key: "challenge", label: "Challenge" },
  { key: "members", label: "All Members" },
];

// Topik "Terbaru" (kolom kiri bawah Komunitas / Home). Reuse gaya trendingTopics.
export const terbaruTopics = [
  {
    id: 201,
    author: "UJ",
    authorColor: "#f97316",
    verified: true,
    title: "Gimana cara cepat menjumlahkan deretan angka yang panjang? Bagi triknya dong!",
    excerpt:
      "Lorem ipsum is simply dummy text of the printing and typesetting industry. Lorem ipsum...",
    likes: 128,
    comments: 24,
  },
  {
    id: 202,
    author: "DR",
    authorColor: "#0ea5e9",
    verified: false,
    title: "Diskusi Berhitung: Strategi dan jalan pintas paling efektif untuk penjumlahan beruntun.",
    excerpt:
      "Lorem ipsum is simply dummy text of the printing and typesetting industry.",
    likes: 96,
    comments: 18,
  },
];

// Challenges Bulan Ini (kolom kanan Komunitas).
export const challenges = [
  {
    id: 1,
    author: "KJ",
    authorColor: "#16a34a",
    title: "Apakah ada tips untuk menghitung Penjumlahan banyak angka?",
    excerpt:
      "Di thread ini, mari diskusikan berbagai trik praktis—mulai dari teknik pengelompokan hingga jalan pintas mental—agar proses perhitungan...",
    tag: "Logika",
    likes: "255",
    comments: 8,
    reads: "512",
  },
  {
    id: 2,
    author: "AB",
    authorColor: "#8b5cf6",
    title: "Apakah ada tips untuk menghitung Penjumlahan banyak angka?",
    excerpt:
      "Lorem ipsum is simply dummy text of the printing and typesetting industry. Lorem ipsum has been the industry's standard dummy text.",
    tag: "Trik",
    likes: "128",
    comments: 3,
    reads: "204",
  },
];

// Panduan Komunitas (accordion statis kolom kanan Komunitas).
export const panduanKomunitas = [
  "Bagaimana cara memulai diskusi di Forum?",
  "Aturan main komunitas Sarang Gasing",
  "Cara ikut Challenges bulanan",
];

// Gasing Academy News — dipakai GANewsScreen (list + reading pane) & Home.
export const gaNews = [
  {
    id: 1,
    category: "Politik",
    title: "Do U.S. Presidents Have the Power to Declare War?",
    excerpt: "On paper, declaring war is reserved for Congress.",
    date: "3 Maret 2026",
    time: "14 jam lalu",
    likes: "1.2k",
    comments: 0,
    image: "https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&q=80&w=800",
  },
  {
    id: 2,
    category: "Pelatihan",
    title: "Metode Gasing Dorong Inovasi Baru dan Mutu Pendidikan di Buleleng",
    excerpt: "Ratusan guru SMP di Buleleng dilatih oleh trainer GASING untuk menerapkan metode ini.",
    date: "28 Februari 2026",
    time: "2 hari lalu",
    likes: "134",
    comments: 2,
    image: "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=800",
  },
  {
    id: 3,
    category: "Berita",
    title: "Key Moments From Kristi Noem's Congressional Testimony",
    excerpt: "GOP Sen. Thom Tillis demands Noem's resignation; others press her on spending.",
    date: "27 Februari 2026",
    time: "3 hari lalu",
    likes: "500",
    comments: 10,
    image: "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&q=80&w=800",
  },
  {
    id: 4,
    category: "Ekonomi",
    title: "In a Day of Wild Market Moves, Oil Is a New Haven",
    excerpt: "It's hard to overstate just how unusual trading was on Tuesday.",
    date: "25 Februari 2026",
    time: "5 hari lalu",
    likes: "312",
    comments: 4,
    image: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&q=80&w=800",
  },
  {
    id: 5,
    category: "Olahraga",
    title: "Alysa Liu Suddenly Became America's Sweetheart. It Came With a Cost.",
    excerpt: "The gold-medal-winning figure skater reached the pinnacle of her sport.",
    date: "24 Februari 2026",
    time: "6 hari lalu",
    likes: "210",
    comments: 6,
    image: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&q=80&w=800",
  },
];

// Update Materi Gasing (kartu Home). Reuse materiList + tag.
export const materiUpdates = [
  { id: 1, title: "[Update] Materi Pembagian", author: "Ben", time: "3 menit yang lalu", tag: "Materi Gasing", likes: 8, comments: 5 },
  { id: 2, title: "Silabus Pelatihan (4 Hari)", author: "Ben", time: "3 menit yang lalu", tag: "Materi Trainer Utama", likes: 3, comments: 2 },
  { id: 3, title: "Konten Alur Tanggal Pengumpulan (Disarankan)", author: "Ben", time: "3 menit yang lalu", tag: "Diskusi", likes: 5, comments: 1 },
];

// ── /komunitas/materi-gasing — kolom kanan desktop ────────────────────────
// Musik Gasing (list lagu). trending = panah hijau kecil di ref.
export const musikGasing = [
  { id: 1, title: "Orang Jenius Suka Berhitung", likes: "30+", comments: "99+", plays: "999+", trending: true },
  { id: 2, title: "Anak Ayam", likes: "30+", comments: "99+", plays: "999+", trending: true },
  { id: 3, title: "Coba Soal Gasing", likes: "30+", comments: "99+", plays: "999+", trending: true },
];

// Permainan (list game).
export const permainanList = [
  { id: 1, title: "Mencongak Gasing", desc: "Lorem ipsum dolor sit amet, consectetur", likes: "30+", comments: "99+", plays: "999+", trending: true },
  { id: 2, title: "Permainan Kartu", desc: "Lorem ipsum dolor sit amet, consectetur", likes: "30+", comments: "99+", plays: "999+", trending: true },
  { id: 3, title: "Matherpillar", desc: "Lorem ipsum dolor sit amet, consectetur", likes: "30+", comments: "99+", plays: "999+", trending: true },
];

// ── /komunitas/konten-ekslusif — section "Bulan Sebelumnya" (blur) ────────
export const kontenSebelumnya = [
  { id: 1, title: "Cara mengajar Penjumlahan & Pengurangan kepada anak berkebutuhan khusus", badge: "Materi Spesial", month: "Mei 2025", thumb: "#dfe7ec" },
  { id: 2, title: "Perkalian dua angka & dua angka", badge: "Worksheet", month: "September 2025", thumb: "#cfe6d8" },
  { id: 3, title: "Perkalian dua angka & dua angka", badge: "Worksheet", month: "Mei 2025", thumb: "#e5e2dc" },
];
