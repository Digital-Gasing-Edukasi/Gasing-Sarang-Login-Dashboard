// Peta route aplikasi — sumber kebenaran tunggal untuk URL.
//
// Halaman-halaman masih memakai API lama `onNavigate("<page-key>")`. Di App.jsx
// prop itu di-shim ke `navigate(pathForPage(key))`, jadi page key di bawah tetap
// dipakai sebagai alias internal dan file page tidak perlu diubah.
//
// Catatan deploy: app di-build dengan `base: '/'` (lihat vite.config.js) sehingga
// semua path di sini adalah path absolut dari root domain.

export const PAGE_PATHS = {
  login: "/login",
  "forgot-password": "/login/forgot-password",
  "check-email": "/login/check-email",
  "reset-password": "/login/reset-password",
  subscription: "/login/subscription",
  "transfer-bank": "/login/subscription/transfer",
  "auth-choice": "/login/choice",
  "sso-callback": "/login/sso-callback",

  signup: "/register",
  "signup-otp": "/register/otp",
  "signup-review": "/register/review",
  "fix-data": "/register/revise",
  terms: "/register/id/TOS",
  privacy: "/register/id/privacy",
  "revise-error": "/register/revise/invalid",

  "admin-dashboard": "/dashboard-admin",

  "payment-success": "/payment/success",
  "payment-finish": "/payment/finish",
  "payment-unfinish": "/payment/unfinish",
  "payment-error": "/payment/error",

  "midtrans-test": "/midtrans-test",

  komunitas: "/komunitas/forum",
};

// page key → path. Key tak dikenal jatuh ke /login (fail-safe, sama seperti
// fallback `authPages[page] ?? authPages["login"]` versi state machine lama).
export function pathForPage(key) {
  return PAGE_PATHS[key] ?? PAGE_PATHS.login;
}

// Path yang tidak perlu cek sesi saat boot: halaman statis / landing yang bisa
// dibuka publik (tab baru, redirect Midtrans, link email).
const PUBLIC_PREFIXES = [
  "/register/id/",
  "/payment/",
  "/midtrans-test",
  "/register/revise/invalid",
  "/komunitas",
];

export function isPublicStaticPath(pathname) {
  const p = pathname.toLowerCase();
  return PUBLIC_PREFIXES.some((prefix) => p.startsWith(prefix.toLowerCase()));
}

// Path auth-entry: jangan auto-restore sesi di sini. User yang sedang mendaftar
// atau me-reset password tidak boleh tiba-tiba dilempar ke dashboard hanya karena
// masih ada token lama di storage.
const NO_RESTORE_PREFIXES = [
  "/register",
  "/login/reset-password",
  "/login/forgot-password",
  "/login/check-email",
];

export function skipSessionRestore(pathname) {
  const p = pathname.toLowerCase();
  return NO_RESTORE_PREFIXES.some((prefix) => p.startsWith(prefix));
}
