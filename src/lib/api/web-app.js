// src/lib/api/web-app.js — handover sesi ke web app Gasing eksternal.
import { withBase } from "../format";
import { tryRefreshToken } from "./client.js";
import { tokenStorage } from "./tokens.js";

// ─── EXTERNAL WEB APP (non-Discourse) ──────────────────────────────────────────
// Hands the current session over to the Gasing web app by forwarding the tokens
// on the callback URL. Contract: `token` = access token, `refresh` = refresh token.
const WEB_APP_CALLBACK_URL =
  import.meta.env.VITE_WEB_APP_CALLBACK_URL ||
  "https://sarang-gasing-komunitas.vercel.app/api/auth/callback";

export const webAppApi = {
  async redirectWithTokens() {
    // Access token bisa sudah basi (mis. lama di halaman bayar / balik dari
    // Midtrans). Refresh DULU sebelum handoff, biar web app terima token valid
    // dan tidak langsung menendang user balik ke login.
    if (tokenStorage.getRefresh()) {
      try { await tryRefreshToken(); } catch { /* pakai token lama seadanya */ }
    }

    const access  = tokenStorage.getAccess();
    const refresh = tokenStorage.getRefresh();

    // Token tidak lengkap → jangan kirim param kosong ke web app (pasti ditolak
    // lalu bounce ke login). Langsung arahkan ke login lokal.
    if (!access || !refresh) {
      console.warn("[webAppApi] redirectWithTokens: token tidak lengkap, balik ke login", { access: !!access, refresh: !!refresh });
      window.location.href = withBase("/login");
      return;
    }

    const params = new URLSearchParams();
    params.append("token", access);
    params.append("refresh", refresh);
    window.location.href = `${WEB_APP_CALLBACK_URL}?${params.toString()}`;
  },
};
