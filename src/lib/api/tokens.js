// src/lib/api/tokens.js — penyimpanan access/refresh token (localStorage vs
// sessionStorage untuk "ingat saya") + pembersihan cache API saat logout.
import { clearApiCache } from "./client.js";

// ─── Token helpers ────────────────────────────────────────────────────────────
export const tokenStorage = {
  getAccess:  () => localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken"),
  getRefresh: () => localStorage.getItem("refreshToken") || sessionStorage.getItem("refreshToken"),
  // true bila token disimpan persistent (localStorage) — dipakai refresh & handoff
  // supaya token baru ditulis ke storage yang sama, tidak bikin salinan basi.
  isPersistent: () => !!localStorage.getItem("accessToken"),
  setTokens:  (a, r, persistent = false) => {
    const storage = persistent ? localStorage : sessionStorage;
    const other   = persistent ? sessionStorage : localStorage;
    storage.setItem("accessToken", a);
    if (r) storage.setItem("refreshToken", r);
    // getAccess baca localStorage DULU. Kalau nulis ke sessionStorage tapi masih
    // ada salinan lama di localStorage → yang kebaca token basi. Buang salinan
    // di storage satunya biar cuma ada satu sumber kebenaran.
    other.removeItem("accessToken");
    other.removeItem("refreshToken");
  },
  // Pindahkan token sesi → localStorage supaya selamat dari round-trip redirect
  // pembayaran (mis. Midtrans lempar keluar origin lalu balik di tab/halaman baru,
  // sessionStorage bisa hilang). Dipanggil saat MASUK alur bayar.
  promoteToPersistent: () => {
    const a = tokenStorage.getAccess();
    const r = tokenStorage.getRefresh();
    if (a) tokenStorage.setTokens(a, r, true);
  },
  clear: () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("refreshToken");
    // Buang cache GET in-memory (getCache + inflightGets) yang di-key by URL saja
    // tanpa identitas user. Kalau tidak, data akun lama (mis. /profile/me) nyangkut
    // ke sesi berikutnya setelah sign out. Semua jalur logout memanggil clear() ini.
    clearApiCache();
  },
};
