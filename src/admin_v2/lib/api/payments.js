import { apiGet } from "./client.js";

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
