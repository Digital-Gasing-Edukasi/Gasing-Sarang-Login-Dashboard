import { apiGet } from "./client.js";

// GET /training-sessions?page&limit&keyword&regionId
// Paginated `{ data, meta }` normally, but a bare array when regionId is
// present. Always normalized to `{ data, meta }` (meta null when absent).
export async function fetchTrainingSessions({ page = 1, limit = 20, keyword = "", regionId } = {}) {
  const res = await apiGet("/training-sessions", {
    page,
    limit,
    keyword: keyword || undefined,
    regionId: regionId || undefined,
  });
  if (Array.isArray(res)) return { data: res, meta: null };
  return { data: res?.data ?? [], meta: res?.meta ?? null };
}

export const trainingSessionsKeys = {
  all: ["admin_v2", "training-sessions"],
  page: (page, { limit = 20, keyword = "", regionId } = {}) => [
    "admin_v2",
    "training-sessions",
    { page, limit, ...(keyword ? { keyword } : {}), ...(regionId ? { regionId } : {}) },
  ],
};
