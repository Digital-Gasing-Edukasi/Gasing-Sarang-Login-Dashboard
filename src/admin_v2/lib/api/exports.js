import { apiGet, apiPost } from "./client.js";

// Export endpoints per user list. Keyed by the VERIFIED_STATUS filter strings
// the tables already use.
export const EXPORT_ENDPOINTS = {
  waiting: "/admin/users/export/verifikasi-akun",
  pending_voucher: "/admin/users/export/pending-voucher",
};

export const EXPORT_LABELS = {
  waiting: "Verifikasi Akun",
  pending_voucher: "Pending Voucher Setup",
};

// POST <scope endpoint> (no payload) → { trackId }
export async function requestExport(filter) {
  const endpoint = EXPORT_ENDPOINTS[filter];
  if (!endpoint) throw new Error(`Unknown export scope: ${filter}`);
  const res = await apiPost(endpoint);
  return res?.trackId ?? res?.data?.trackId;
}

// GET /queue/jobs/:trackId → { id, status, progress, currentAction, error, result }
export function fetchExportJob(trackId) {
  return apiGet(`/queue/jobs/${trackId}`);
}

export const exportJobKeys = {
  all: ["admin_v2", "export-jobs"],
  byId: (trackId) => ["admin_v2", "export-jobs", trackId],
};
