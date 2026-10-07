import { apiGet, apiPost } from "./client.js";

// GET /admin/payments/manual-transfer/list?filter=<state>&page&limit
// state: "receipt_uploaded" | "rejected"
// → { data: [{ ...payment, user: { name, username, email } }], meta }
export function fetchManualPayments({ state, page = 1, limit = 20 }) {
  return apiGet("/admin/payments/manual-transfer/list", {
    filter: state,
    page,
    limit,
  });
}

export const manualPaymentKeys = {
  all: ["admin_v2", "manual-payments"],
  byState: (state) => ["admin_v2", "manual-payments", state],
  page: (state, page, { limit = 20 } = {}) => [
    "admin_v2",
    "manual-payments",
    state,
    { page, limit },
  ],
};

// POST /admin/payments/manual-transfer/:paymentId/reject
// Body: { reason: <reason-key>, notes: <text> }
export function rejectManualPayment({ paymentId, reason, notes }) {
  return apiPost(`/admin/payments/manual-transfer/${paymentId}/reject`, {
    reason,
    notes,
  });
}

// POST /admin/payments/manual-transfer/:paymentId/approve
// Notes are hardcoded until the form collects them.
export function approveManualPayment({ paymentId }) {
  return apiPost(`/admin/payments/manual-transfer/${paymentId}/approve`, {
    notes: "Optional approval notes",
  });
}
