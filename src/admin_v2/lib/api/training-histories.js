import { apiDelete, apiGet, apiPatch, apiPost, apiPostMultipart } from "./client.js";

// GET /admin/users/training-history/:userId?page&limit
// → { data: [{ name, region, startDate, endDate }], meta: { current_page, last_page, ... } }
export function fetchTrainingHistory({ userId, page = 1, limit = 100 }) {
  return apiGet(`/admin/users/training-history/${userId}`, { page, limit });
}

// Upload CSV file (field `file`) + `trainingSessionId` → { importId, trackId }
export function uploadTrainingHistoryImport(file, trainingSessionId) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("trainingSessionId", trainingSessionId);
  return apiPostMultipart("/admin/training-histories/imports", fd);
}

// Commit import ke tabel training_histories → { trackId }
export function pushTrainingHistoryImport(importId) {
  return apiPost(`/admin/training-histories/imports/${importId}/push`);
}

// Poll async queue job sampai COMPLETED atau FAILED
export async function waitQueueJob(trackId, { interval = 1000, tries = 60 } = {}) {
  for (let i = 0; i < tries; i++) {
    const res = await apiGet(`/queue/jobs/${trackId}`);
    const job = res?.data || res;
    if (job?.status === "COMPLETED") return job;
    if (job?.status === "FAILED") {
      throw new Error(job.error || "Proses gagal di server.");
    }
    await new Promise((r) => setTimeout(r, interval));
  }
  throw new Error("Timeout menunggu proses server.");
}

// GET /admin/training-histories/sessions/:sessionId/participants?page&limit&sort[by]=createdAt&sort[order]=desc
export function fetchSessionParticipants(sessionId, { page = 1, limit = 20, sortBy = "createdAt", sortOrder = "desc" } = {}) {
  return apiGet(`/admin/training-histories/sessions/${sessionId}/participants`, {
    page,
    limit,
    "sort[by]": sortBy,
    "sort[order]": sortOrder,
  });
}

export function updateTrainingHistoryImportRow(sessionId, rowId, data) {
  console.log({
    sessionId,
    rowId,
    data
  });
  
  return apiPatch(
    `/admin/training-histories/imports/${encodeURIComponent(sessionId)}/rows/${encodeURIComponent(rowId)}`,
    data,
  );
}

export function deleteTrainingHistoryImportRow(sessionId, rowId) {
  return apiDelete(
    `/admin/training-histories/imports/${encodeURIComponent(sessionId)}/rows/${encodeURIComponent(rowId)}`,
  );
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
  participants: (sessionId, { page = 1, limit = 20 } = {}) => [
    "admin_v2",
    "training-history",
    "participants",
    sessionId,
    { page, limit },
  ],
  participantPages: (sessionId) => [
    "admin_v2",
    "training-history",
    "participants",
    sessionId,
  ],
};
