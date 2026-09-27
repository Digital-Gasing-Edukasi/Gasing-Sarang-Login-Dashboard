// Backup sesi OTP registrasi (token + email + cooldown awal) — in-memory
// useState hilang saat reload (sering di mobile RAM kecil), jadi di-backup ke
// sessionStorage: selamat dari reload, ikut hilang saat tab ditutup.
// Sekali pakai: dihapus saat terverifikasi (clearOtpToken).

export const OTP_SESSION_KEY = "otp-session";

export function readOtpSession() {
  try {
    const raw = JSON.parse(sessionStorage.getItem(OTP_SESSION_KEY) || "{}");
    const cooldown = Number(raw.cooldownSecs);
    return {
      token: raw.token || "",
      email: raw.email || "",
      cooldownSecs: Number.isFinite(cooldown) && cooldown > 0 ? Math.floor(cooldown) : null,
      // Asal aliran: 'register' (default) | 'login' (verifikasi dari login).
      // Menentukan layar sukses OTP (review vs dialog verifikasi admin).
      origin: raw.origin === "login" ? "login" : "register",
    };
  } catch {
    return { token: "", email: "", cooldownSecs: null, origin: "register" };
  }
}

export function writeOtpSession(token, email, cooldownSecs = null, origin = null) {
  try {
    sessionStorage.setItem(
      OTP_SESSION_KEY,
      JSON.stringify({ token, email, cooldownSecs, origin })
    );
  } catch {
    /* storage nonaktif/penuh — halaman tetap jalan dari state */
  }
}

export function clearOtpSession() {
  try {
    sessionStorage.removeItem(OTP_SESSION_KEY);
  } catch {
    /* noop */
  }
}
