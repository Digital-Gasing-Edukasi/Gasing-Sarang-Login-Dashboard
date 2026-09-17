// src/lib/api/vouchers.js — voucher sisi user (list/validate/redeem).
import { request, buildQuery } from "./client.js";

// ─── VOUCHERS ─────────────────────────────────────────────────────────────────
export const voucherApi = {
  list: (params = {}) => {
    const q = buildQuery({ page: 1, limit: 20, ...params });
    return request(`/vouchers${q ? "?" + q : ""}`);
  },

  validate: (code) =>
    request("/vouchers/validate", { method: "POST", body: { code } }),

  redeem: (code) =>
    request("/vouchers/redeem", { method: "POST", body: { code } }),
};
