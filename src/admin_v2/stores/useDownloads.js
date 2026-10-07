import * as React from "react";
import { create } from "zustand";
import {
  EXPORT_LABELS,
  fetchExportJob,
  requestExport,
} from "../lib/api/index.js";
import { toast } from "../components/ui/use-toast.js";
import { ToastAction } from "../components/ui/toast.jsx";

export const DOWNLOAD_POLL_MS = 5000;
export const DOWNLOAD_STORAGE_KEY = "adminV2.exportJobs.v1";
const MAX_JOBS = 20;
const MAX_CONSECUTIVE_ERRORS = 12;

const TERMINAL_STATUSES = new Set(["COMPLETED", "FAILED"]);

// Module scope (never persisted): one poller per job + error streaks.
const timers = new Map();
const errorStreaks = new Map();
let hydrated = false;

// COMPLETED always reads as 100%, whatever the backend sent.
export function getJobProgress(job) {
  if (!job) return 0;
  if (job.status === "COMPLETED") return 100;
  const p = Number(job.progress);
  return Number.isFinite(p) ? Math.min(100, Math.max(0, p)) : 0;
}

function persist(jobs, order, hasNew) {
  try {
    localStorage.setItem(
      DOWNLOAD_STORAGE_KEY,
      JSON.stringify({ jobs, order, hasNew }),
    );
  } catch {
    // Storage full/blocked — polling continues in memory.
  }
}

function loadPersisted() {
  try {
    const raw = localStorage.getItem(DOWNLOAD_STORAGE_KEY);
    if (!raw) return { jobs: {}, order: [] };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.jobs !== "object" || !Array.isArray(parsed.order)) {
      return { jobs: {}, order: [], hasNew: false };
    }
    return {
      jobs: parsed.jobs,
      order: parsed.order.slice(0, MAX_JOBS),
      hasNew: parsed.hasNew === true,
    };
  } catch {
    return { jobs: {}, order: [], hasNew: false };
  }
}

function stopPolling(trackId) {
  const timer = timers.get(trackId);
  if (timer !== undefined) {
    clearInterval(timer);
    timers.delete(trackId);
  }
  errorStreaks.delete(trackId);
}

async function pollOnce(trackId) {
  const state = useDownloads.getState();
  const job = state.jobs[trackId];
  if (!job || TERMINAL_STATUSES.has(job.status)) {
    stopPolling(trackId);
    return;
  }

  let res;
  try {
    res = await fetchExportJob(trackId);
  } catch (e) {
    const streak = (errorStreaks.get(trackId) ?? 0) + 1;
    errorStreaks.set(trackId, streak);
    if (streak >= MAX_CONSECUTIVE_ERRORS) {
      stopPolling(trackId);
      state._upsert({
        ...job,
        status: "FAILED",
        error: e?.message || "Gagal memantau progres.",
      });
    }
    return;
  }
  errorStreaks.set(trackId, 0);

  const raw = res?.data ?? res;
  const status = raw?.status ?? job.status;
  state._upsert({
    ...job,
    status,
    progress: raw?.progress ?? job.progress,
    currentAction: raw?.currentAction ?? null,
    error: raw?.error ?? null,
    fileName: raw?.result?.fileName ?? job.fileName,
    downloadUrl: raw?.result?.downloadUrl ?? job.downloadUrl,
  });

  if (status === "COMPLETED") {
    stopPolling(trackId);
    const state = useDownloads.getState();
    const done = state.jobs[trackId];
    toast({
      title: "Export selesai",
      description: done?.fileName || done?.label || trackId,
      action: React.createElement(
        ToastAction,
        {
          altText: "Buka riwayat unduhan",
          onClick: () => useDownloads.getState().setDialogOpen(true),
          className: "h-auto border-0 bg-transparent p-0 text-xs underline hover:bg-transparent",
        },
        "Buka",
      ),
    });
    if (!state.isDialogOpen) state._setHasNew(true);
  } else if (status === "FAILED") {
    stopPolling(trackId);
  }
}

function ensurePolling(trackId) {
  if (timers.has(trackId)) return;
  pollOnce(trackId);
  timers.set(trackId, setInterval(() => pollOnce(trackId), DOWNLOAD_POLL_MS));
}

export const useDownloads = create((set, get) => ({
  jobs: {},
  order: [],
  isDialogOpen: false,
  starting: false,
  hasNew: false,

  startExport: async (filter) => {
    if (get().starting) return null;
    set({ starting: true });
    try {
      const trackId = await requestExport(filter);
      if (!trackId) throw new Error("Backend tidak mengembalikan trackId.");
      const job = {
        trackId,
        scope: filter,
        label: EXPORT_LABELS[filter] ?? filter,
        status: "PENDING",
        progress: 0,
        currentAction: null,
        fileName: null,
        downloadUrl: null,
        error: null,
        createdAt: Date.now(),
      };
      const jobs = { ...get().jobs, [trackId]: job };
      const order = [trackId, ...get().order.filter((id) => id !== trackId)].slice(
        0,
        MAX_JOBS,
      );
      for (const id of Object.keys(jobs)) {
        if (!order.includes(id)) {
          delete jobs[id];
          stopPolling(id);
        }
      }
      set({ jobs, order });
      persist(jobs, order, get().hasNew);
      ensurePolling(trackId);
      toast({
        title: "Export dimulai",
        description: `${job.label} — progres dapat dipantau di Riwayat Unduhan.`,
      });
      return trackId;
    } catch (e) {
      toast({
        title: "Gagal memulai export",
        description: e?.message || "Unknown error",
        variant: "destructive",
      });
      return null;
    } finally {
      set({ starting: false });
    }
  },

  _upsert: (job) => {
    const jobs = { ...get().jobs, [job.trackId]: job };
    const order = get().order.includes(job.trackId)
      ? get().order
      : [job.trackId, ...get().order].slice(0, MAX_JOBS);
    set({ jobs, order });
    persist(jobs, order, get().hasNew);
  },

  _setHasNew: (hasNew) => {
    set({ hasNew });
    persist(get().jobs, get().order, hasNew);
  },

  removeJob: (trackId) => {
    stopPolling(trackId);
    const jobs = { ...get().jobs };
    delete jobs[trackId];
    const order = get().order.filter((id) => id !== trackId);
    set({ jobs, order });
    persist(jobs, order, get().hasNew);
  },

  clearJobs: () => {
    for (const id of [...timers.keys()]) stopPolling(id);
    set({ jobs: {}, order: [], hasNew: false });
    persist({}, [], false);
  },

  setDialogOpen: (open) => {
    // Opening the history marks finished downloads as seen.
    set({ isDialogOpen: open, hasNew: open ? false : get().hasNew });
    persist(get().jobs, get().order, open ? false : get().hasNew);
  },

  // Called once at app boot: restores history + resumes unfinished jobs.
  hydrate: () => {
    if (hydrated) return;
    hydrated = true;
    const { jobs, order, hasNew } = loadPersisted();
    set({ jobs, order, hasNew });
    for (const id of order) {
      const job = jobs[id];
      if (job && !TERMINAL_STATUSES.has(job.status)) ensurePolling(id);
    }
  },

  // Test isolation only.
  reset: () => {
    for (const id of [...timers.keys()]) stopPolling(id);
    hydrated = false;
    set({ jobs: {}, order: [], isDialogOpen: false, starting: false, hasNew: false });
    try {
      localStorage.removeItem(DOWNLOAD_STORAGE_KEY);
    } catch {
      // ignore
    }
  },
}));
