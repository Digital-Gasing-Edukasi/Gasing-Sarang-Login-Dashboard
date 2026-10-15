import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import userEvent from "@testing-library/user-event";
import verifFixture from "../../../dev/responses/verif.json";
import sessionsFixture from "../../../dev/responses/training-sessions.json";
import {
  formatShortDate,
  formatTrainingPeriod,
} from "../lib/format.js";

// Radix Select calls DOM APIs jsdom doesn't implement.
if (!window.HTMLElement.prototype.hasPointerCapture) {
  window.HTMLElement.prototype.hasPointerCapture = () => false;
  window.HTMLElement.prototype.setPointerCapture = () => {};
  window.HTMLElement.prototype.releasePointerCapture = () => {};
}
if (!window.HTMLElement.prototype.scrollIntoView) {
  window.HTMLElement.prototype.scrollIntoView = () => {};
}

vi.mock("../lib/api/users.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    fetchUsers: vi.fn(),
    verifyUser: vi.fn(async () => ({})),
  };
});

vi.mock("../lib/api/training-sessions.js", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, fetchTrainingSessions: vi.fn() };
});

vi.mock("../lib/api/regions.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    fetchProvinces: vi.fn(),
    fetchRegencies: vi.fn(),
    fetchRegion: vi.fn(),
  };
});

vi.mock("../lib/clipboard.js", () => ({ copyText: vi.fn(async () => true) }));

vi.mock("../lib/api/exports.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    requestExport: vi.fn(async () => "t-export"),
    fetchExportJob: vi.fn(async () => ({ status: "COMPLETED", progress: 100 })),
  };
});

// Radix modal Dialog traps focus in a way jsdom can't settle when a second
// floating layer (Select) opens inside it — infinite focus ping-pong. Render
// dialog chrome inline so flow tests exercise OUR wiring, not Radix traps.
vi.mock("../components/ui/dialog.jsx", async () => {
  const React = await import("react");
  const Passthrough = ({ children }) =>
    React.createElement(React.Fragment, null, children);
  return {
    Dialog: ({ open, children }) =>
      open ? React.createElement(React.Fragment, null, children) : null,
    DialogTrigger: Passthrough,
    DialogClose: Passthrough,
    DialogPortal: Passthrough,
    DialogOverlay: Passthrough,
    DialogContent: ({ children }) =>
      React.createElement("div", { role: "dialog" }, children),
    DialogHeader: Passthrough,
    DialogFooter: Passthrough,
    DialogTitle: ({ children }) => React.createElement("h2", null, children),
    DialogDescription: Passthrough,
  };
});

import { fetchUsers, verifyUser } from "../lib/api/users.js";
import { fetchTrainingSessions } from "../lib/api/training-sessions.js";
import {
  fetchProvinces,
  fetchRegencies,
  fetchRegion,
} from "../lib/api/regions.js";
import { requestExport } from "../lib/api/exports.js";
import { useDownloads } from "../stores/useDownloads.js";
import VerifikasiAkunPage from "../pages/verifikasi-akun/VerifikasiAkunPage.jsx";

// Everything derives from fixtures — never hardcode names/ids.
const waitingPool = verifFixture.data
  .slice(0, 2)
  .map((u) => ({ ...u, verifiedStatus: 0 }));
const U0 = waitingPool[0];

// Province of the user's first training region (from the regency detail).
const PROVINCE = { id: "prov-1", name: "User Province" };
const U1 = waitingPool[1];
const GUNUNG = sessionsFixture.data.find((s) => s.name === "Gunung Sindur");

let client;

function renderPage() {
  client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <VerifikasiAkunPage />
    </QueryClientProvider>,
  );
}

function mockLists() {
  fetchUsers.mockImplementation(
    ({ page = 1, limit = 20, keyword = "" }) => {
      const kw = keyword.trim().toLowerCase();
      const data = kw
        ? waitingPool.filter((u) =>
            [u.name, u.username, u.email].some((f) =>
              (f || "").toLowerCase().includes(kw),
            ),
          )
        : waitingPool;
      return Promise.resolve({
        data,
        meta: {
          current_page: page,
          last_page: 1,
          per_page: limit,
          from: data.length ? 1 : 0,
          to: data.length,
          total: kw ? data.length : 2,
        },
      });
    },
  );
  fetchTrainingSessions.mockImplementation(async () => ({
    data: sessionsFixture.data,
    meta: sessionsFixture.meta,
  }));
  fetchProvinces.mockImplementation(async () => [
    { id: PROVINCE.id, name: PROVINCE.name, level: "PROVINCE", parentId: null },
  ]);
  fetchRegencies.mockImplementation(async () => [
    {
      id: U0.firstTrainingRegionId,
      name: U0.firstTrainingRegion.regionName,
      level: "REGENCY",
      parentId: PROVINCE.id,
    },
    { id: "r-other", name: "Other Regency", level: "REGENCY", parentId: PROVINCE.id },
  ]);
  fetchRegion.mockImplementation(async (id) => ({
    id,
    name: U0.firstTrainingRegion.regionName,
    level: "REGENCY",
    parentId: PROVINCE.id,
  }));
}

beforeEach(() => {
  vi.clearAllMocks();
  useDownloads.getState().reset();
  mockLists();
});

afterEach(() => {
  useDownloads.getState().reset();
});

const waitingCalls = () =>
  fetchUsers.mock.calls.filter((c) => c[0].status === "waiting");

describe("VerifikasiAkunPage", () => {
  it("pending tab: totals, user cells, status pill, actions", async () => {
    renderPage();

    expect(await screen.findByText(U0.name)).toBeInTheDocument();
    expect(screen.getByText(`@${U0.username}`)).toBeInTheDocument();
    expect(screen.getByText(U0.email)).toBeInTheDocument();
    expect(screen.getAllByText("Pending").length).toBeGreaterThan(0);
    expect(
      screen.getByText(formatTrainingPeriod(U0.firstTrainingYear, U0.firstTrainingMonth)),
    ).toBeInTheDocument();
    expect(screen.getByText("Menampilkan 1–2 dari 2 data")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: `Setujui ${U0.name}` }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: `Tolak ${U0.name}` }),
    ).toBeInTheDocument();
  });

  it("approve flow: dialog, role, session search, submit, list refetch", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText(U0.name);

    await user.click(screen.getByRole("button", { name: `Setujui ${U0.name}` }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Setujui Akun Ini?")).toBeInTheDocument();
    expect(
      within(dialog).getByText(U0.firstTrainingRegion.regionName),
    ).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Setujui" })).toBeDisabled();

    await user.click(within(dialog).getByRole("combobox", { name: "Role" }));
    await user.click(await screen.findByRole("option", { name: "Guru" }));

    await user.click(
      within(dialog).getByRole("combobox", { name: "Pilih pelatihan…" }),
    );
    await user.type(screen.getByPlaceholderText("Ketik nama pelatihan…"), "gunung");
    await waitFor(() => {
      expect(
        screen.queryByRole("option", { name: "Test Pelatihan" }),
      ).not.toBeInTheDocument();
    });
    await user.click(await screen.findByRole("option", { name: "Gunung Sindur" }));
    expect(
      fetchTrainingSessions.mock.calls.some(
        (c) => c[0].regionId === U0.firstTrainingRegionId,
      ),
    ).toBe(true);

    const submit = within(dialog).getByRole("button", { name: "Setujui" });
    expect(submit).not.toBeDisabled();

    const waitingBefore = waitingCalls().length;
    await user.click(submit);

    expect(verifyUser).toHaveBeenCalledWith({
      userId: U0.id,
      status: "approved",
      discourseGroupId: 49,
      firstTrainingSessionId: GUNUNG.id,
    });

    // Success: modal closes, stays on the pending list, list refetches.
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    await waitFor(() => {
      expect(waitingCalls().length).toBeGreaterThan(waitingBefore);
    });
    expect(screen.getByText(U0.name)).toBeInTheDocument();
  });

  it("reject normal flow: reason builder, fields payload, pending invalidated only", async () => {
    const user = userEvent.setup();
    renderPage();
    const invalidate = vi.spyOn(client, "invalidateQueries");
    await screen.findByText(U0.name);

    await user.click(screen.getByRole("button", { name: `Tolak ${U0.name}` }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Tolak Akun Ini?")).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Tolak" })).toBeDisabled();

    await user.click(within(dialog).getByRole("checkbox", { name: "Tanggal Lahir" }));
    await user.click(within(dialog).getByRole("checkbox", { name: "Nama Sekolah" }));

    const waitingBefore = waitingCalls().length;
    await user.click(within(dialog).getByRole("button", { name: "Tolak" }));

    expect(verifyUser).toHaveBeenCalledWith({
      userId: U0.id,
      status: "revise",
      rejectedReason: "Tanggal lahir dan nama sekolah tidak sesuai dengan KTP",
      fieldsToRevise: ["tanggalLahir", "namaSekolah"],
    });

    await waitFor(() => {
      expect(waitingCalls().length).toBeGreaterThan(waitingBefore);
    });
    // The account lands on the manajemen-akun Ditolak tab.
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: ["admin_v2", "users", "rejected,revise"],
    });
  });

  it("reject lainnya flow: exclusive, textarea, session id payload", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText(U0.name);

    await user.click(screen.getByRole("button", { name: `Tolak ${U0.name}` }));
    const dialog = await screen.findByRole("dialog");

    await user.click(within(dialog).getByRole("checkbox", { name: "Lainnya" }));
    expect(
      within(dialog).getByPlaceholderText("Tulis alasan penolakan…"),
    ).toBeInTheDocument();
    // Lainnya clears the rest; picking another clears Lainnya.
    await user.click(within(dialog).getByRole("checkbox", { name: "Tanggal Lahir" }));
    expect(
      within(dialog).queryByPlaceholderText("Tulis alasan penolakan…"),
    ).not.toBeInTheDocument();
    await user.click(within(dialog).getByRole("checkbox", { name: "Lainnya" }));
    expect(
      within(dialog).getByRole("checkbox", { name: "Tanggal Lahir" }),
    ).not.toBeChecked();
    // Reason required.
    expect(within(dialog).getByRole("button", { name: "Tolak" })).toBeDisabled();

    await user.type(
      within(dialog).getByPlaceholderText("Tulis alasan penolakan…"),
      "Data tidak valid",
    );
    await user.click(within(dialog).getByRole("button", { name: "Tolak" }));

    expect(verifyUser).toHaveBeenCalledWith({
      userId: U0.id,
      status: "rejected",
      rejectedReason: "Data tidak valid",
    });
  });

  it("search filters by keyword after debounce (no button)", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText(U0.name);

    // U1-only token: matches name/username/email of the second user only.
    const token = U1.username;
    await user.type(screen.getByRole("textbox", { name: "Cari pengguna" }), token);

    await waitFor(() => {
      expect(
        fetchUsers.mock.calls.some((c) => c[0].keyword === token),
      ).toBe(true);
    });
    expect(screen.getByText(U1.email)).toBeInTheDocument();
    expect(screen.queryByText(U0.name)).not.toBeInTheDocument();
  });

  it("limit selector refetches with the chosen page size", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText(U0.name);

    await user.click(screen.getByRole("combobox", { name: "Jumlah per halaman" }));
    await user.click(await screen.findByRole("option", { name: "50" }));

    await waitFor(() => {
      expect(waitingCalls().at(-1)[0].limit).toBe(50);
    });
  });

  it("export button starts the waiting-scope export", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText(U0.name);

    await user.click(screen.getByRole("button", { name: "Export" }));
    expect(requestExport).toHaveBeenCalledWith("waiting");
  });

  it("alumni region preselects province+regency and refetches sessions on change", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText(U0.name);

    await user.click(screen.getByRole("button", { name: `Setujui ${U0.name}` }));
    const dialog = await screen.findByRole("dialog");

    // Province seeded from the regency detail's parentId.
    await waitFor(() => {
      expect(
        within(dialog).getByRole("combobox", { name: PROVINCE.name }),
      ).toBeInTheDocument();
    });
    expect(
      fetchRegencies.mock.calls.some((c) => c[0] === PROVINCE.id),
    ).toBe(true);

    // Regency preselected from the user's first training region.
    expect(
      within(dialog).getByRole("combobox", {
        name: U0.firstTrainingRegion.regionName,
      }),
    ).toBeInTheDocument();
    expect(
      fetchTrainingSessions.mock.calls.some(
        (c) => c[0].regionId === U0.firstTrainingRegionId,
      ),
    ).toBe(true);

    // Changing regency refetches sessions scoped to the new regency.
    await user.click(
      within(dialog).getByRole("combobox", {
        name: U0.firstTrainingRegion.regionName,
      }),
    );
    await user.click(await screen.findByRole("option", { name: "Other Regency" }));
    await waitFor(() => {
      expect(
        fetchTrainingSessions.mock.calls.some((c) => c[0].regionId === "r-other"),
      ).toBe(true);
    });

    // Switching province clears the regency → session picker disabled, no fetch.
    const sessionsBefore = fetchTrainingSessions.mock.calls.length;
    await user.click(within(dialog).getByRole("combobox", { name: PROVINCE.name }));
    await user.click(await screen.findByRole("option", { name: PROVINCE.name }));
    expect(
      within(dialog).getByRole("combobox", { name: "Pilih daerah dulu…" }),
    ).toBeDisabled();
    expect(fetchTrainingSessions.mock.calls.length).toBe(sessionsBefore);
  });
});
