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
      raw: "2026-10-01T07:00:00.000+07:00",
      formatted: "01 October 2026 07:00:00",
    },
  },
  endDate: {
    local: {
      raw: "2026-11-30T07:00:00.000+07:00",
      formatted: "30 November 2026 07:00:00",
    },
  },
  updatedAt: {
    local: {
      formatted: "17 November 2026 14:57:16",
    },
  },
  regionId: "reg-1",
  region: {
    id: "reg-1",
    name: "Kabupaten Garut",
  },
};

const mockParticipant = {
  id: "p-1",
  name: "Ade Raharja",
  email: "ade@gmail.com",
  status: "active",
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

  it("opens edit dialog with populated data and submits PATCH", async () => {
    vi.spyOn(api, "fetchTrainingSessions").mockResolvedValue({
      data: [mockSession],
      meta: { page: 1, limit: 20, total: 100, last_page: 5 },
    });
    vi.spyOn(api, "fetchProvinces").mockResolvedValue([
      { id: "prov-1", name: "Jawa Barat" },
    ]);
    vi.spyOn(api, "fetchRegion").mockResolvedValue({
      id: "reg-1",
      parentId: "prov-1",
      name: "Kabupaten Garut",
    });
    const updateSpy = vi
      .spyOn(api, "updateTrainingSession")
      .mockResolvedValue({ id: mockSession.id });

    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={client}>
        <RiwayatPelatihanPage />
      </QueryClientProvider>,
    );

    const user = userEvent.setup();
    const editBtn = await screen.findByRole("button", { name: /^edit$/i });
    await user.click(editBtn);

    expect(
      await screen.findByRole("heading", { name: "Perbarui Riwayat Pelatihan" }),
    ).toBeInTheDocument();
    const input = screen.getByPlaceholderText("Masukkan nama pelatihan");
    expect(input).toHaveValue("Pelatihan Garut");

    const submitBtn = screen.getByRole("button", { name: "Simpan Perubahan" });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith(mockSession.id, {
        name: "Pelatihan Garut",
        regionId: "reg-1",
        startDate: "2026-10-01",
        endDate: "2026-11-30",
      });
    });
  });

  it("opens delete confirmation modal when 'Hapus Riwayat' is clicked and deletes on typing DELETE", async () => {
    vi.spyOn(api, "fetchTrainingSessions").mockResolvedValue({
      data: [mockSession],
      meta: { page: 1, limit: 20, total: 100, last_page: 5 },
    });
    vi.spyOn(api, "fetchProvinces").mockResolvedValue([
      { id: "prov-1", name: "Jawa Barat" },
    ]);
    vi.spyOn(api, "fetchRegion").mockResolvedValue({
      id: "reg-1",
      parentId: "prov-1",
      name: "Kabupaten Garut",
    });
    const deleteSpy = vi
      .spyOn(api, "deleteTrainingSession")
      .mockResolvedValue({ success: true });

    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={client}>
        <RiwayatPelatihanPage />
      </QueryClientProvider>,
    );

    const user = userEvent.setup();
    const editBtn = await screen.findByRole("button", { name: /^edit$/i });
    await user.click(editBtn);

    const hapusRiwayatBtn = await screen.findByRole("button", {
      name: "Hapus Riwayat",
    });
    await user.click(hapusRiwayatBtn);

    expect(
      await screen.findByRole("heading", {
        name: "Yakin Hapus Riwayat Pelatihan?",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Kamu akan menghapus Pelatihan Garut/i),
    ).toBeInTheDocument();

    const deleteInput = screen.getByPlaceholderText("DELETE");
    const confirmHapusBtn = screen.getByRole("button", { name: "Hapus" });
    expect(confirmHapusBtn).toBeDisabled();

    await user.type(deleteInput, "delete");
    expect(confirmHapusBtn).toBeDisabled();

    await user.clear(deleteInput);
    await user.type(deleteInput, "DELETE");
    expect(confirmHapusBtn).not.toBeDisabled();

    await user.click(confirmHapusBtn);
    await waitFor(() => {
      expect(deleteSpy).toHaveBeenCalledWith(mockSession.id);
    });
  });

  it("opens SessionParticipantsDialog when 'Lihat peserta' is clicked", async () => {
    vi.spyOn(api, "fetchTrainingSessions").mockResolvedValue({
      data: [mockSession],
      meta: { page: 1, limit: 20, total: 100, last_page: 5 },
    });
    const fetchParticipantsSpy = vi
      .spyOn(api, "fetchSessionParticipants")
      .mockResolvedValue({
        data: [mockParticipant],
        meta: { page: 1, limit: 20, total: 1, last_page: 1 },
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
    const lihatBtn = await screen.findByRole("button", { name: /peserta terdaftar/i });
    await user.click(lihatBtn);

    expect(await screen.findByRole("heading", { name: "Daftar Peserta Guru" })).toBeInTheDocument();
    expect(screen.getByText("1 Peserta")).toBeInTheDocument();
    expect(screen.getByText(/Pelatihan Garut · Kabupaten Garut · 17 Nov 2026/)).toBeInTheDocument();
    expect(await screen.findByText("Ade Raharja")).toBeInTheDocument();
    expect(screen.getByText("ade@gmail.com")).toBeInTheDocument();
    expect(screen.getByText("Aktif")).toBeInTheDocument();

    expect(fetchParticipantsSpy).toHaveBeenCalledWith(mockSession.id, {
      page: 1,
      limit: 20,
    });
  });
});
