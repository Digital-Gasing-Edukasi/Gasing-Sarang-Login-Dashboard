import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("../lib/api/exports.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    requestExport: vi.fn(),
    fetchExportJob: vi.fn(async () => ({ status: "PENDING", progress: 0 })),
  };
});

import { requestExport } from "../lib/api/exports.js";
import { useDownloads } from "../stores/useDownloads.js";
import { DownloadsDialog } from "../components/downloads/DownloadsDialog.jsx";
import { DownloadsTrigger } from "../components/downloads/DownloadsTrigger.jsx";
import { ExportButton } from "../components/downloads/ExportButton.jsx";

const store = () => useDownloads.getState();

function seed() {
  store().reset();
  useDownloads.setState({
    jobs: {
      t_active: {
        trackId: "t_active",
        scope: "waiting",
        label: "Verifikasi Akun",
        status: "ACTIVE",
        progress: 40,
        currentAction: "Saving file",
        fileName: null,
        downloadUrl: null,
        error: null,
        createdAt: 1,
      },
      t_done: {
        trackId: "t_done",
        scope: "pending_voucher",
        label: "Pending Voucher Setup",
        status: "COMPLETED",
        progress: 30,
        currentAction: "Saving file",
        fileName: "pending_voucher-2026-10-05.xlsx",
        downloadUrl: "https://x/y.xlsx",
        error: null,
        createdAt: 2,
      },
      t_failed: {
        trackId: "t_failed",
        scope: "waiting",
        label: "Verifikasi Akun",
        status: "FAILED",
        progress: 10,
        currentAction: null,
        fileName: null,
        downloadUrl: null,
        error: "Boom",
        createdAt: 3,
      },
    },
    order: ["t_active", "t_done", "t_failed"],
    isDialogOpen: true,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  store().reset();
});

afterEach(() => {
  store().reset();
});

describe("DownloadsDialog", () => {
  it("lists jobs with progress, links, and errors", () => {
    seed();
    render(<DownloadsDialog />);

    expect(screen.getByText("Riwayat Unduhan")).toBeInTheDocument();
    expect(screen.getByText("pending_voucher-2026-10-05.xlsx")).toBeInTheDocument();
    // Active rows show their action; completed rows hide the stale one.
    expect(screen.getAllByText("Saving file")).toHaveLength(1);
    expect(screen.getByText("Boom")).toBeInTheDocument();

    // Completed rows drop the bar; active + failed keep theirs.
    const bars = screen.getAllByRole("progressbar");
    expect(bars).toHaveLength(2);
    expect(bars[0]).toHaveAttribute("aria-valuenow", "40");
    expect(bars[1]).toHaveAttribute("aria-valuenow", "10");

    const link = screen.getByRole("link", { name: "Unduh" });
    expect(link).toHaveAttribute("href", "https://x/y.xlsx");
    expect(link.className).toMatch(/rounded-full/);
    expect(link.className).toMatch(/border-blue-500/);
  });

  it("delete removes the record after confirm", async () => {
    const user = userEvent.setup();
    seed();
    render(<DownloadsDialog />);

    await user.click(screen.getByRole("button", { name: "Hapus" }));
    expect(screen.getByText("Yakin hapus?")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Ya, hapus" }));
    expect(store().jobs["t_done"]).toBeUndefined();
    expect(
      screen.queryByText("pending_voucher-2026-10-05.xlsx"),
    ).not.toBeInTheDocument();
  });

  it("delete can be cancelled", async () => {
    const user = userEvent.setup();
    seed();
    render(<DownloadsDialog />);

    await user.click(screen.getByRole("button", { name: "Hapus" }));
    await user.click(screen.getByRole("button", { name: "Batal" }));
    expect(store().jobs["t_done"]).toBeTruthy();
  });

  it("empty state with no jobs", () => {
    useDownloads.setState({ isDialogOpen: true });
    render(<DownloadsDialog />);

    expect(screen.getByText("Belum ada unduhan.")).toBeInTheDocument();
  });
});

describe("DownloadsTrigger", () => {
  it("bounces while downloading and opens the dialog", async () => {
    const user = userEvent.setup();
    seed();
    useDownloads.setState({ isDialogOpen: false });
    const { container } = render(<DownloadsTrigger />);

    expect(container.querySelector("svg.animate-bounce")).not.toBeNull();

    await user.click(screen.getByRole("button", { name: "Riwayat unduhan" }));
    expect(store().isDialogOpen).toBe(true);
  });

  it("idle icon when nothing is active", () => {
    const { container } = render(<DownloadsTrigger />);

    expect(container.querySelector("svg.animate-bounce")).toBeNull();
  });

  it("blue dot for unseen finished downloads, cleared on open", async () => {
    const user = userEvent.setup();
    useDownloads.setState({ hasNew: true });
    render(<DownloadsTrigger />);

    expect(
      screen.getByLabelText("Ada unduhan baru yang selesai"),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Riwayat unduhan" }));
    expect(
      screen.queryByLabelText("Ada unduhan baru yang selesai"),
    ).not.toBeInTheDocument();
  });
});

describe("ExportButton", () => {
  it("starts a scoped export on click", async () => {
    const user = userEvent.setup();
    requestExport.mockResolvedValue("t-new");
    render(<ExportButton scope="pending_voucher" />);

    await user.click(screen.getByRole("button", { name: "Export" }));

    expect(requestExport).toHaveBeenCalledWith("pending_voucher");
    expect(store().jobs["t-new"].scope).toBe("pending_voucher");
  });
});

describe("DownloadsDialog delete-all", () => {
  it("clears history after confirm", async () => {
    const user = userEvent.setup();
    seed();
    render(<DownloadsDialog />);

    await user.click(screen.getByRole("button", { name: "Hapus semua" }));
    expect(screen.getByText("Yakin hapus semua?")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Ya, hapus semua" }));
    expect(screen.getByText("Belum ada unduhan.")).toBeInTheDocument();
    expect(store().order).toEqual([]);
  });

  it("delete-all can be cancelled", async () => {
    const user = userEvent.setup();
    seed();
    render(<DownloadsDialog />);

    await user.click(screen.getByRole("button", { name: "Hapus semua" }));
    await user.click(screen.getByRole("button", { name: "Batal" }));
    expect(store().order).toHaveLength(3);
  });
});
