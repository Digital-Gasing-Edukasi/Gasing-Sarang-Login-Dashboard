import { apiGet } from "./client.js";

export const VERIFIED_STATUS = {
  WAITING: "waiting",
  PENDING_VOUCHER: "pending_voucher",
};

// GET /admin/users?page&limit&filter[verifiedStatus]&filter[keyword]&sort[by]=createdAt&sort[order]=desc
// → { data: [...], meta: { current_page, last_page, per_page, total, from, to } }
export function fetchVerificationUsers({ status, page = 1, limit = 20, keyword = "" }) {
  return apiGet("/admin/users", {
    page,
    limit,
    "filter[verifiedStatus]": status,
    "filter[keyword]": keyword || undefined,
    "sort[by]": "createdAt",
    "sort[order]": "desc",
  });
}

// Query key factory — the single reference for reads AND invalidations.
// Hierarchy (prefix-matchable):
//   ["admin_v2", "verification-users"]              → everything on this page
//   [..., status]                                   → one tab (all its pages)
//   [..., status, page]                             → one exact list
// Invalidate from anywhere, e.g. after approving a user:
//   queryClient.invalidateQueries({ queryKey: verificationUsersKeys.all })
export const verificationUsersKeys = {
  all: ["admin_v2", "verification-users"],
  byStatus: (status) => ["admin_v2", "verification-users", status],
  page: (status, page, { limit = 20, keyword = "" } = {}) => [
    "admin_v2",
    "verification-users",
    status,
    { page, limit, ...(keyword ? { keyword } : {}) },
  ],
};
