import { apiGet, apiPatch } from "./client.js";

// Backend-validated filter buckets: "waiting"|"pending_voucher"|"approved"|"rejected"|"all".
// (Numeric verifiedStatus on user objects is display-only — see verificationStatus.js.)
export const VERIFIED_STATUS = {
  WAITING: "waiting",
  PENDING_VOUCHER: "pending_voucher",
  APPROVED: "approved",
  REJECTED: "rejected",
};

// GET /admin/users?page&limit&filter[verifiedStatus]&filter[keyword]&sort[by]=createdAt&sort[order]=desc
// → { data: [...], meta: { current_page, last_page, per_page, total, from, to } }
export function fetchVerificationUsers({ status, page = 1, limit = 20, keyword = "", subscription } = {}) {
  return apiGet("/admin/users", {
    page,
    limit,
    "filter[verifiedStatus]": status,
    "filter[confirmed]": "yes",
    "filter[subscriptionStatus]": subscription || undefined,
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
  page: (status, page, { limit = 20, keyword = "", subscription } = {}) => [
    "admin_v2",
    "verification-users",
    status,
    {
      page,
      limit,
      ...(keyword ? { keyword } : {}),
      ...(subscription ? { subscription } : {}),
    },
  ],
};

// Status headline number: fetch a single row, read meta.total.
// `filter` is a VERIFIED_STATUS bucket string (backend rejects numerics).
export async function fetchVerificationStatusCount(filter) {
  const res = await fetchVerificationUsers({ status: filter, page: 1, limit: 1 });
  return res?.meta?.total ?? 0;
}

// PATCH /admin/users/:userId/verify — approve, revise, or reject an account.
// Body varies per action (see rejectPayload.js); passed through as-is.
export function verifyUser({ userId, ...payload }) {
  // console.log({ userId, payload });
  // return;
  return apiPatch(`/admin/users/${userId}/verify`, payload);
}
