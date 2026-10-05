import { apiGet } from "./client.js";

// GET /training-sessions?page&limit&keyword
// → { data: [{ id, name, ... }], meta: { current_page, last_page, per_page, total, ... } }
export function fetchTrainingSessions({ page = 1, limit = 20, keyword = "" }) {
  return apiGet("/training-sessions", {
    page,
    limit,
    keyword: keyword || undefined,
  });
}

export const trainingSessionsKeys = {
  all: ["admin_v2", "training-sessions"],
  page: (page, { limit = 20, keyword = "" } = {}) => [
    "admin_v2",
    "training-sessions",
    { page, limit, ...(keyword ? { keyword } : {}) },
  ],
};
