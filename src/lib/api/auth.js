// src/lib/api/auth.js — endpoint autentikasi + alur Revise.
import { request } from "./client.js";

// ─── AUTH ─────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data) =>
    request("/auth/register", { method: "POST", body: data, noAuth: true }),

  confirmEmail: (token, otp) =>
    request("/auth/confirm-email", { method: "POST", body: { token, otp }, noAuth: true }),

  // Kirim ulang OTP pakai token dari response register/resend TERAKHIR. Server
  // mencabut token lama & balik { token, email } baru — pemanggil WAJIB simpan
  // token baru ini untuk confirmEmail/resend berikutnya. Token yang sudah dicabut
  // ditolak; token kedaluwarsa tetap diterima. noAuth: jalur pre-auth.
  resendOtp: (token) =>
    request("/auth/resend-otp", { method: "POST", body: { token }, noAuth: true }),

  login: (email, password) =>
    request("/auth/login", { method: "POST", body: { email, password }, noAuth: true }),

  logout: () => request("/auth/logout", { method: "POST" }),

  logoutAll: () => request("/auth/logout-all", { method: "POST" }),

  refresh: (refreshToken) =>
    request("/auth/refresh", {
      method: "POST",
      body: { refreshToken },
      headers: {},
    }),

  forgotPassword: (email) =>
    request("/auth/forgot-password", { method: "POST", body: { email }, noAuth: true }),

  resetPassword: (token, email, newPassword) =>
    request("/auth/reset-password", {
      method: "POST",
      body: { token, email, newPassword },
      noAuth: true,
    }),

  // ── Alur Revise (akun diminta perbaiki data via token JWT dari email) ─────────
  // Auth lewat `token` di body (bukan access token) — user datang dari link email.
  //
  // getRevise: ambil profil + alasan + daftar field yang harus diperbaiki.
  getRevise: (token) =>
    request("/auth/revise", { method: "POST", body: { token }, headers: {}, noAuth: true }),
  // submitRevise: kirim data yang sudah diperbaiki. Token one-time (di-revoke server).
  submitRevise: (data) =>
    request("/auth/revise/submit", { method: "POST", body: data, headers: {}, noAuth: true }),

  // @deprecated — diganti getRevise/submitRevise (alur token-based backend).
  // Lihat ADR-0003. Dihapus setelah FixDataPage migrasi ke token.
  submitCorrection: (data) =>
    request("/auth/correct-data", { method: "POST", body: data }),
};
