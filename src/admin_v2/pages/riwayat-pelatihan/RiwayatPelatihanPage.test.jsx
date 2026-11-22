import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi, beforeEach } from "vitest";
import RiwayatPelatihanPage from "./RiwayatPelatihanPage.jsx";
import * as api from "../../lib/api/index.js";

const mockSession = {
  id: "01a1683d-15ec-7610-a895-5ac12133fa6f",
  name: "Pelatihan Garut",
  startDate: {
    local: {
      formatted: "01 October 2026 07:00:00",
    },
  },
  updatedAt: {
    local: {
      formatted: "17 November 2026 14:57:16",
    },
  },
  region: {
    name: "Kabupaten Garut",
  },
};

describe("RiwayatPelatihanPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("opens AddPelatihanDialog and displays form fields", async () => {
    vi.spyOn(api, "fetchTrainingSessions").mockResolvedValue({
      data: [mockSession],
      meta: { page: 1, limit: 20, total: 100, last_page: 5 },
    });
    vi.spyOn(api, "fetchProvinces").mockResolvedValue([
      { id: "prov-1", name: "Jawa Barat" },
    ]);

    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={client}>
        <RiwayatPelatihanPage />
      </QueryClientProvider>,
    );

    const user = userEvent.setup();
    const openBtn = screen.getByRole("button", { name: /tambah pelatihan baru/i });
    await user.click(openBtn);

    expect(screen.getByRole("heading", { name: "Tambah Pelatihan" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Masukkan nama pelatihan")).toBeInTheDocument();
    expect(screen.getByText("Daerah")).toBeInTheDocument();
    expect(screen.getByText("Tanggal Mulai & Berakhir")).toBeInTheDocument();
    expect(screen.getByText("Daftar Peserta Guru")).toBeInTheDocument();
    expect(screen.getByText("Download Template Peserta Guru")).toBeInTheDocument();
    expect(
      screen.getByText(/Tarik file \.CSV ke sini atau/i),
    ).toBeInTheDocument();
  });

  it("submits training session creation and triggers upload flow if csv file provided", async () => {
    vi.spyOn(api, "fetchTrainingSessions").mockResolvedValue({
      data: [mockSession],
      meta: { page: 1, limit: 20, total: 100, last_page: 5 },
    });
    vi.spyOn(api, "fetchProvinces").mockResolvedValue([
      { id: "prov-1", name: "Jawa Barat" },
    ]);

    const createSpy = vi.spyOn(api, "createTrainingSession").mockResolvedValue({
      id: "session-123",
      name: "Pelatihan Baru",
    });
    const uploadSpy = vi.spyOn(api, "uploadTrainingHistoryImport").mockResolvedValue({
      importId: "import-1",
      trackId: "track-up-1",
    });
    const waitJobSpy = vi.spyOn(api, "waitQueueJob").mockResolvedValue({
      status: "COMPLETED",
    });
    const pushSpy = vi.spyOn(api, "pushTrainingHistoryImport").mockResolvedValue({
      trackId: "track-push-1",
    });

    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={client}>
        <RiwayatPelatihanPage />
      </QueryClientProvider>,
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /tambah pelatihan baru/i }));

    // Fill name
    await user.type(screen.getByPlaceholderText("Masukkan nama pelatihan"), "Pelatihan Bandung");

    // Submit without dates/region triggers validation error
    await user.click(screen.getByRole("button", { name: "Tambah Pelatihan Baru" }));
    expect(await screen.findByText(/daerah pelatihan wajib dipilih/i)).toBeInTheDocument();
  });
});
