import { apiGet, apiPatch } from "./client.js";

// GET /admin/vouchers?page&limit&filter[status]&filter[keyword]&sort[by]=createdAt&sort[order]=desc
// → { data: [...], meta: { current_page, last_page, per_page, total, from, to } }
export function fetchPendingVouchers({ page = 1, limit = 20, keyword = "", status = "pending" } = {}) {
  return apiGet("/admin/vouchers", {
    page,
    limit,
    "filter[status]": status,
    "filter[keyword]": keyword || undefined,
    "sort[by]": "createdAt",
    "sort[order]": "desc",
  });
}

export const pendingVouchersKeys = {
  all: ["admin_v2", "pending-vouchers"],
  page: (page, { limit = 20, keyword = "", status = "pending" } = {}) => [
    "admin_v2",
    "pending-vouchers",
    {
      page,
      limit,
      ...(keyword ? { keyword } : {}),
      ...(status !== "pending" ? { status } : {}),
    },
  ],
};

// PATCH /admin/vouchers/:voucherId/ready (no payload) — confirm the voucher.
export function confirmVoucher({ voucherId }) {
  return apiPatch(`/admin/vouchers/${voucherId}/ready`);
}
