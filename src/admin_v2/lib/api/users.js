import { apiDelete, apiGet, apiPatch, apiPost } from "./client.js";

// Backend-validated filter buckets: "waiting"|"pending_voucher"|"approved"|"rejected"|"all".
// (Numeric verifiedStatus on user objects is display-only — see verificationStatus.js.)
export const VERIFIED_STATUS = {
  WAITING: "waiting",
  PENDING_VOUCHER: "pending_voucher",
  APPROVED: "approved",
  REJECTED: "rejected",
};

// `subscription` accepts a single status or an array (sent comma-joined).
// `status` is optional (omitted when undefined — e.g. suspended/deleted tabs).
// `confirmed`/`suspended` send their defaults ("yes"/0); pass null to omit
// the filter entirely (the client strips null params).
const normalizeSubscription = (subscription) =>
  Array.isArray(subscription) ? subscription.join(",") : subscription;

// GET /admin/users?page&limit&filter[verifiedStatus]&filter[keyword]&sort[by]=createdAt&sort[order]=desc
// → { data: [...], meta: { current_page, last_page, per_page, total, from, to } }
export function fetchUsers({ status, page = 1, limit = 20, keyword = "", subscription, deletionPending = 0, suspended = 0, confirmed = "yes" } = {}) {
  return apiGet("/admin/users", {
    page,
    limit,
    "filter[verifiedStatus]": status,
    "filter[confirmed]": confirmed,
    "filter[subscriptionStatus]": normalizeSubscription(subscription) || undefined,
    "filter[deletionPending]": deletionPending,
    "filter[suspended]": suspended,
    "filter[keyword]": keyword || undefined,
    "sort[by]": "createdAt",
    "sort[order]": "desc",
  });
}

// Query key factory — the single reference for reads AND invalidations.
// Hierarchy (prefix-matchable):
//   ["admin_v2", "users"]              → everything on this page
//   [..., status]                     → one tab (all its pages)
//   [..., status, page]               → one exact list
// Invalidate from anywhere, e.g. after approving a user:
//   queryClient.invalidateQueries({ queryKey: usersKeys.all })
export const usersKeys = {
  all: ["admin_v2", "users"],
  byStatus: (status) => ["admin_v2", "users", status],
  page: (status, page, { limit = 20, keyword = "", subscription, deletionPending = 0, suspended = 0, confirmed = "yes" } = {}) => [
    "admin_v2",
    "users",
    status,
    {
      page,
      limit,
      ...(keyword ? { keyword } : {}),
      ...(subscription ? { subscription: normalizeSubscription(subscription) } : {}),
      ...(deletionPending ? { deletionPending } : {}),
      ...(suspended !== 0 ? { suspended } : {}),
      ...(confirmed !== "yes" ? { confirmed } : {}),
    },
  ],
};

// Status headline number: fetch a single row, read meta.total.
// `filter` is a VERIFIED_STATUS bucket string (backend rejects numerics).
export async function fetchUsersCount(filter, opts = {}) {
  const res = await fetchUsers({
    status: filter,
    page: 1,
    limit: 1,
    ...opts,
  });
  return res?.meta?.total ?? 0;
}

// PATCH /admin/users/:userId/verify — approve, revise, or reject an account.
// Body varies per action (see rejectPayload.js); passed through as-is.
export function verifyUser({ userId, ...payload }) {
  // console.log({ userId, payload });
  // return;
  return apiPatch(`/admin/users/${userId}/verify`, payload);
}

// POST /admin/users/:userId/deletion-request (no payload) — soft delete,
// recoverable for 30 days.
export function requestAccountDeletion({ userId }) {
  return apiPost(`/admin/users/${userId}/deletion-request`);
}

// DELETE /admin/users/:userId — permanent, irreversible.
export function deleteUserPermanently({ userId }) {
  return apiDelete(`/admin/users/${userId}`);
}

// PATCH /admin/users/:userId/discourse-group — change the user's role.
export function updateDiscourseGroup({ userId, discourseGroupId }) {
  return apiPatch(`/admin/users/${userId}/discourse-group`, { discourseGroupId });
}

// Suspend reasons rarely change — keep for the whole session.
export const SUSPEND_REASONS_CACHE = { staleTime: Infinity, gcTime: Infinity };

// GET /admin/users/suspend-reasons → [{ code, title, desc }] (bare array).
export async function fetchSuspendReasons() {
  const res = await apiGet("/admin/users/suspend-reasons");
  return Array.isArray(res) ? res : (res?.data ?? res?.items ?? []);
}

export const suspendReasonsKeys = {
  all: ["admin_v2", "suspend-reasons"],
};

// POST /admin/users/:userId/suspend — reason is a single-element array (for now).
export function suspendUser({ userId, suspendedUntil, reason, remarks }) {
  return apiPost(`/admin/users/${userId}/suspend`, {
    suspendedUntil,
    reason,
    remarks,
  });
}
