// src/lib/api/discourse.js — grup Discourse + alur SSO login.
import { request } from "./client.js";

// ─── DISCOURSE & SSO ──────────────────────────────────────────────────────────
export const discourseApi = {
  getGroups: () => request("/discourse/groups"),

  // Initiates SSO login flow — redirects browser to Discourse
  ssoLogin: (returnPath) =>
    request(
      `/discourse/sso-login${returnPath ? `?return_path=${encodeURIComponent(returnPath)}` : ""}`
    ).then(data => {
      const url = data.redirectUrl || data.redirect_url || data.url || data.ssoUrl
      if (url) {
        window.location.href = url
      } else {
        throw new Error("Redirect URL tidak ditemukan di respons server")
      }
    }),

  // SSO gateway: verifies sso+sig params from Discourse callback
  gateway: (sso, sig) =>
    request("/discourse/gateway", { method: "POST", body: { sso, sig } }),
};
