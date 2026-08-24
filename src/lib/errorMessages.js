// Terjemah pesan error mentah backend (Inggris/teknis) → Indonesia buat user.
// Dipakai di titik-titik yang sebelumnya nampilin e.message / job.error apa adanya
// (sign-up flow: SignUpPage, SignUpOtpPage, queueApi.waitJob).
//
// Cocokin via substring, case-insensitive, urutan berarti (paling spesifik duluan).
// Ga ketemu pola → fallback pesan generik, JANGAN pernah tampilin teks mentah backend.

const PATTERNS = [
  [/email cannot be changed for existing registration/i, "Email tidak bisa diubah untuk pendaftaran yang sudah ada."],
  [/username.*(already exists|already registered|already taken|taken)/i, "Username sudah digunakan. Coba username lain."],
  [/email.*(already exists|already registered|already taken|taken)/i, "Email sudah terdaftar. Gunakan email lain atau masuk."],
  [/(already exists|already registered|already taken)/i, "Data sudah terdaftar sebelumnya."],
  [/too many requests|rate limit/i, "Terlalu banyak permintaan. Tunggu sebentar lalu coba lagi."],
  [/not found/i, "Data tidak ditemukan."],
  [/expired/i, "Sesi atau kode sudah kedaluwarsa. Silakan coba lagi."],
  [/invalid/i, "Data yang dimasukkan tidak valid."],
  [/required/i, "Ada data wajib yang belum diisi."],
  [/network/i, "Koneksi bermasalah. Periksa jaringan Anda dan coba lagi."],
  [/timeout/i, "Waktu permintaan habis. Silakan coba lagi."],
];

const FALLBACK = "Terjadi kesalahan. Silakan coba lagi.";

export function translateApiError(message) {
  if (!message || typeof message !== "string") return FALLBACK;
  for (const [pattern, id] of PATTERNS) {
    if (pattern.test(message)) return id;
  }
  return FALLBACK;
}
