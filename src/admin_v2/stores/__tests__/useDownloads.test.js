import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("../../lib/api/exports.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    requestExport: vi.fn(),
    fetchExportJob: vi.fn(),
  };
});

vi.mock("../../components/ui/use-toast.js", () => ({
  toast: vi.fn(),
  useToast: () => ({ toasts: [], toast: vi.fn(), dismiss: vi.fn() }),
}));

import { requestExport, fetchExportJob } from "../../lib/api/exports.js";
import { toast } from "../../components/ui/use-toast.js";
import {
  DOWNLOAD_POLL_MS,
  DOWNLOAD_STORAGE_KEY,
  getJobProgress,
  useDownloads,
} from "../useDownloads.js";

const store = () => useDownloads.getState();

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  store().reset();
  vi.useFakeTimers();
});

afterEach(() => {
  store().reset();
  vi.useRealTimers();
});

describe("useDownloads", () => {
  it("startExport inserts a PENDING job, persists it, and polls to completion", async () => {
    requestExport.mockResolvedValue("t-1");
    fetchExportJob.mockResolvedValue({
      status: "ACTIVE",
      progress: 40,
      currentAction: "Working",
    });

    const trackId = await store().startExport("waiting");
    expect(trackId).toBe("t-1");
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Export dimulai" }),
    );

    // Immediate first poll on start.
    await vi.advanceTimersByTimeAsync(0);
    expect(store().jobs["t-1"].status).toBe("ACTIVE");
    expect(store().jobs["t-1"].progress).toBe(40);

    // Persisted for reload resume.
    const saved = JSON.parse(localStorage.getItem(DOWNLOAD_STORAGE_KEY));
    expect(saved.order).toEqual(["t-1"]);
    expect(saved.jobs["t-1"].status).toBe("ACTIVE");

    fetchExportJob.mockResolvedValue({
      status: "COMPLETED",
      progress: 95,
      result: { fileName: "pending-2026.xlsx", downloadUrl: "https://x/y.xlsx" },
    });
    await vi.advanceTimersByTimeAsync(DOWNLOAD_POLL_MS);

    const done = store().jobs["t-1"];
    expect(done.status).toBe("COMPLETED");
    expect(done.fileName).toBe("pending-2026.xlsx");
    expect(store().isDialogOpen).toBe(false);
    expect(store().hasNew).toBe(true);

    const successToast = toast.mock.calls.find((c) =>
      String(c[0]?.title).includes("selesai"),
    );
    expect(successToast[0].action).toBeTruthy();
    // Buka opens the history; opening marks the news as seen.
    successToast[0].action.props.onClick();
    expect(store().isDialogOpen).toBe(true);
    expect(store().hasNew).toBe(false);

    // Poller stopped: no more fetches.
    const calls = fetchExportJob.mock.calls.length;
    await vi.advanceTimersByTimeAsync(DOWNLOAD_POLL_MS * 4);
    expect(fetchExportJob.mock.calls.length).toBe(calls);
  });

  it("FAILED jobs keep the error, stop polling, and stay quiet", async () => {
    requestExport.mockResolvedValue("t-2");
    fetchExportJob.mockResolvedValue({ status: "FAILED", error: "Boom" });

    await store().startExport("pending_voucher");
    await vi.advanceTimersByTimeAsync(0);

    expect(store().jobs["t-2"].status).toBe("FAILED");
    expect(store().jobs["t-2"].error).toBe("Boom");
    expect(store().isDialogOpen).toBe(false);
    expect(store().hasNew).toBe(false);
    expect(
      toast.mock.calls.some((c) => String(c[0]?.title).includes("selesai")),
    ).toBe(false);

    const calls = fetchExportJob.mock.calls.length;
    await vi.advanceTimersByTimeAsync(DOWNLOAD_POLL_MS * 2);
    expect(fetchExportJob.mock.calls.length).toBe(calls);
  });

  it("hydrate resumes unfinished jobs from storage", async () => {
    localStorage.setItem(
      DOWNLOAD_STORAGE_KEY,
      JSON.stringify({
        jobs: {
          t_old: {
            trackId: "t_old",
            scope: "waiting",
            label: "Verifikasi Akun",
            status: "ACTIVE",
            progress: 10,
            currentAction: null,
            fileName: null,
            downloadUrl: null,
            error: null,
            createdAt: 1,
          },
        },
        order: ["t_old"],
      }),
    );
    fetchExportJob.mockResolvedValue({ status: "ACTIVE", progress: 55 });

    store().hydrate();
    expect(store().jobs["t_old"].progress).toBe(10);

    await vi.advanceTimersByTimeAsync(0);
    expect(fetchExportJob).toHaveBeenCalledWith("t_old");
    expect(store().jobs["t_old"].progress).toBe(55);

    // Second hydrate is a no-op (no duplicate pollers).
    store().hydrate();
    await vi.advanceTimersByTimeAsync(DOWNLOAD_POLL_MS);
    expect(
      fetchExportJob.mock.calls.filter((c) => c[0] === "t_old").length,
    ).toBeLessThanOrEqual(2);
  });
});

describe("getJobProgress", () => {
  it("COMPLETED always reads 100", () => {
    expect(getJobProgress({ status: "COMPLETED", progress: 30 })).toBe(100);
    expect(getJobProgress({ status: "ACTIVE", progress: 40 })).toBe(40);
    expect(getJobProgress({ status: "PENDING" })).toBe(0);
    expect(getJobProgress(null)).toBe(0);
  });
});

describe("removeJob", () => {
  it("drops the record and stops its poller", async () => {
    const { requestExport: req, fetchExportJob: fetch } = await import(
      "../../lib/api/exports.js"
    );
    req.mockResolvedValue("t-del");
    fetch.mockResolvedValue({ status: "ACTIVE", progress: 10 });

    await store().startExport("waiting");
    await vi.advanceTimersByTimeAsync(0);
    expect(store().jobs["t-del"]).toBeTruthy();

    store().removeJob("t-del");
    expect(store().jobs["t-del"]).toBeUndefined();
    expect(store().order).not.toContain("t-del");
    expect(JSON.parse(localStorage.getItem("adminV2.exportJobs.v1")).order).not.toContain(
      "t-del",
    );

    const calls = fetch.mock.calls.length;
    await vi.advanceTimersByTimeAsync(5000 * 3);
    expect(fetch.mock.calls.length).toBe(calls);
  });
});

describe("clearJobs", () => {
  it("stops every poller and empties history", async () => {
    const { requestExport: req, fetchExportJob: fetch } = await import(
      "../../lib/api/exports.js"
    );
    req.mockResolvedValue("t-clear");
    fetch.mockResolvedValue({ status: "ACTIVE", progress: 10 });

    await store().startExport("waiting");
    await vi.advanceTimersByTimeAsync(0);
    expect(store().order.length).toBeGreaterThan(0);

    store().clearJobs();
    expect(store().jobs).toEqual({});
    expect(store().order).toEqual([]);
    expect(store().hasNew).toBe(false);
    expect(JSON.parse(localStorage.getItem("adminV2.exportJobs.v1")).order).toEqual(
      [],
    );

    const calls = fetch.mock.calls.length;
    await vi.advanceTimersByTimeAsync(5000 * 3);
    expect(fetch.mock.calls.length).toBe(calls);
  });
});
