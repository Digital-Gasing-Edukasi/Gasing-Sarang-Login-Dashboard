// src/lib/api/profile.js — profil user saat ini.
import { request } from "./client.js";

// ─── PROFILE ──────────────────────────────────────────────────────────────────
export const profileApi = {
  getMe: () => request("/profile/me"),

  update: (data) => request("/profile", { method: "PATCH", body: data }),

  changePassword: (currentPassword, newPassword) =>
    request("/profile/password", {
      method: "PATCH",
      body: { currentPassword, newPassword },
    }),

  updatePicture: (fileId) =>
    request("/profile/picture", { method: "PATCH", body: { fileId } }),

  // Konfirmasi ubah email dari link email: {baseurl}/confirm-email-change?token=…
  // noAuth — auth cuma lewat `token` di body (link bisa dibuka di browser tanpa
  // sesi login), konsisten dgn jalur link-email lain (authApi.getRevise/resetPassword).
  confirmEmailChange: (token) =>
    request("/profile/confirm-email", { method: "POST", body: { token }, noAuth: true }),
};
