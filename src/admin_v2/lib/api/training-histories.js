import { apiGet } from "./client.js";

// GET /admin/users/training-history/:userId?page&limit
// → { data: [{ name, region, startDate, endDate }], meta: { current_page, last_page, ... } }
export function fetchTrainingHistory({ userId, page = 1, limit = 100 }) {
  return apiGet(`/admin/users/training-history/${userId}`, { page, limit });
}

export const trainingHistoryKeys = {
  all: ["admin_v2", "training-history"],
  byUser: (userId) => ["admin_v2", "training-history", userId],
  page: (userId, page, { limit = 100 } = {}) => [
    "admin_v2",
    "training-history",
    userId,
    { page, limit },
  ],
};
