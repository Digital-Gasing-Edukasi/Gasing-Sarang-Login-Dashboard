// src/lib/roles.js
//
// Satu tempat untuk semua aturan "siapa boleh ke mana" berdasarkan data user
// (hasil `profileApi.getMe()` / login). Tujuannya: logika peran tidak lagi
// tersebar sebagai if-bercabang di App.jsx, sehingga mudah dibaca & diuji.
//
// Cara pakai (lihat App.jsx → handleLoginSuccess):
//   import { isSuperAdmin, isOperationalAdmin } from "@/lib/roles";
//   if (isOperationalAdmin(user)) setPage("admin-dashboard");

/**
 * Capability yang HARUS dimiliki SEMUANYA agar user dianggap "admin operasional"
 * (boleh membuka Dashboard Admin). Sumber kebenaran tunggal — kalau backend
 * menambah/menghapus hak akses dashboard, ubah daftar ini saja.
 */
export const ADMIN_CAPABILITIES = [
  "USER/DISCOURSE/CHANGE_GROUP",
  "PACKAGE/MGMT",
  "USER/VERIFY",
  "USER/LIST",
  "VOUCHER/MGMT",
  "USER/DISCOURSE/MANAGE_EXTRA_GROUPS",
];

/**
 * Cek satu capability di `user`. `capabilities` bisa array (["X"]) atau
 * object ({ "X": true }) — sama seperti hasAllAdminCapabilities.
 */
export function hasCapability(user, cap) {
  const caps = user?.capabilities;
  if (!caps) return false;
  return Array.isArray(caps) ? caps.includes(cap) : cap in caps;
}

/**
 * User dengan SSO dimatikan: jangan lewat Discourse SSO, langsung ke dashboard.
 */
export function isSsoDisabled(user) {
  return hasCapability(user, "USER/DISCOURSE/DISABLED-SSO");
}

/**
 * Apakah user adalah superadmin?
 * Backend kadang mengirim `superadmin`, kadang `superAdmin` — keduanya diterima.
 */
export function isSuperAdmin(user) {
  return user?.superadmin === true || user?.superAdmin === true;
}

/**
 * Cek apakah `user` punya SEMUA capability di `ADMIN_CAPABILITIES`.
 * `capabilities` bisa berupa array (["USER/LIST", ...]) atau object ({ "USER/LIST": true }).
 */
function hasAllAdminCapabilities(user) {
  const caps = user?.capabilities;
  if (!caps) return false;

  return Array.isArray(caps)
    ? ADMIN_CAPABILITIES.every((cap) => caps.includes(cap))
    : ADMIN_CAPABILITIES.every((cap) => cap in caps);
}

/**
 * "Admin operasional" = BUKAN superadmin, TAPI punya semua capability admin.
 * Hanya mereka yang diarahkan ke Dashboard Admin saat login.
 * (Superadmin diarahkan ke auth-choice, bukan dashboard — lihat App.jsx.)
 */
export function isOperationalAdmin(user) {
  return !isSuperAdmin(user) && isSsoDisabled(user);
}
