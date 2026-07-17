// Data statis dummy untuk halaman Komunitas guest (ADR-0004).
// Semua konten hardcoded — tidak ada call backend. Ganti di sini kalau
// nanti mau disambung ke API beneran.
import {
  thumbVideoKonten,
  thumbRubik,
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
    slug: "penjumlahan",
    element: materiPenjumlahan,
    likes: "99+",
    comments: "99+",
    reads: "33 hari",
    duration: "1-2 jam",
  },
  {
    id: 2,
    title: "Mengenal Pengurangan",
    slug: "pengurangan",
    element: materiPengurangan,
    likes: "70+",
    comments: "40+",
    reads: "18 hari",
    duration: "1-2 jam",
  },
  {
    id: 3,
    title: "Mengenal Pembagian",
    slug: "pembagian",
    element: materiPembagian,
    likes: "65+",
    comments: "30+",
    reads: "15 hari",
    duration: "1-2 jam",
  },
  {
    id: 4,
    title: "Mengenal Perkalian",
    slug: "perkalian",
    element: materiPerkalian,
    likes: "88+",
    comments: "56+",
    reads: "20 hari",
    duration: "1-2 jam",
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
