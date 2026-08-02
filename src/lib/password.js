// src/lib/password.js
// Aturan & validasi password — SATU sumber kebenaran (dipakai SignUp & ResetPassword).
// Sengaja terpisah dari lib/format.js: format.js = format tampilan (Rupiah/tanggal/CSV),
// file ini = aturan/validasi input. Jangan campur domain.

// Daftar aturan + status terpenuhinya untuk password `pw`.
// Dipakai untuk checklist "Password kamu harus memiliki:".
export function getPasswordRules(pw) {
  const p = pw || ''
  return [
    { label: 'Minimal 10 karakter', ok: p.length >= 10 },
    { label: 'Minimal 1 huruf kapital', ok: /[A-Z]/.test(p) },
    { label: 'Minimal 1 angka', ok: /\d/.test(p) },
    { label: 'Minimal 1 karakter spesial', ok: /[^A-Za-z0-9]/.test(p) },
  ]
}

// True kalau SEMUA aturan terpenuhi.
export function isPasswordValid(pw) {
  return getPasswordRules(pw).every((r) => r.ok)
}
