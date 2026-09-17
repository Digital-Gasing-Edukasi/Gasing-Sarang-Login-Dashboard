// src/lib/api/queue.js — polling proses async backend.
import { translateApiError } from "../errorMessages";
import { request } from "./client.js";

// ─── QUEUE JOBS (polling proses async) ──────────────────────────────────────────
// getJob → { status: "COMPLETED"|..., progress, currentAction, error, result }
export const queueApi = {
  getJob: (id) => request(`/queue/jobs/${id}`),

  // Poll sampai COMPLETED / FAILED (default maks ~60 detik). Balik job final.
  waitJob: async (trackId, { interval = 1000, tries = 60 } = {}) => {
    for (let i = 0; i < tries; i++) {
      const res = await queueApi.getJob(trackId);
      const job = res?.data || res;
      if (job.status === "COMPLETED") return job;
      if (job.status === "FAILED") throw new Error(job.error ? translateApiError(job.error) : "Proses gagal di server.");
      await new Promise((r) => setTimeout(r, interval));
    }
    throw new Error("Timeout menunggu proses server.");
  },
};
