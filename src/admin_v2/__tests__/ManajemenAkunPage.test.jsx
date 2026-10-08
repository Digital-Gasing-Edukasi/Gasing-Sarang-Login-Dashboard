import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import userEvent from "@testing-library/user-event";
import disetujuiFixture from "../../../dev/responses/disetujui.json";
import deletionFixture from "../../../dev/responses/user-deletion.json";
import {
  formatBirthdate,
  formatSessionDate,
  formatShortDate,
  formatUpdatedAt,
} from "../lib/format.js";
import { ROLE_META_BY_ID } from "../lib/roles.js";

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
    requestAccountDeletion: vi.fn(async () => ({})),
    deleteUserPermanently: vi.fn(async () => ({})),
    updateDiscourseGroup: vi.fn(async () => ({})),
  };
});

vi.mock("../lib/api/training-histories.js", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, fetchTrainingHistory: vi.fn() };
});

// Same inline-dialog mock as the other suites (jsdom + Radix traps).
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

import { fetchUsers, requestAccountDeletion, deleteUserPermanently, updateDiscourseGroup } from "../lib/api/users.js";
import { fetchTrainingHistory } from "../lib/api/training-histories.js";
import historyFixture from "../../../dev/responses/training-user.json";
import ManajemenAkunPage from "../pages/manajemen-akun/ManajemenAkunPage.jsx";

// Everything derives from fixtures — never hardcode names/ids.
const U0 = disetujuiFixture.data[0];
const U1 = disetujuiFixture.data[1];

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <ManajemenAkunPage />
    </QueryClientProvider>,
  );
}

function mockLists() {
  fetchUsers.mockImplementation(async (params = {}) => {
    if (params.deletionPending === 1) {
      return { data: deletionFixture.data, meta: deletionFixture.meta };
    }
    if (params.status === "rejected") {
      // Same user shape — rejected variants differ only in verifiedStatus.
      return {
        data: disetujuiFixture.data.map((u, i) => ({
          ...u,
          verifiedStatus: i === 0 ? 2 : -1,
        })),
        meta: disetujuiFixture.meta,
      };
    }
    return {
      data: disetujuiFixture.data,
      meta: disetujuiFixture.meta,
    };
  });
  fetchTrainingHistory.mockImplementation(async ({ page = 1 }) => ({
    data: page === 1 ? historyFixture.data : [historyFixture.data[0]],
    meta: {
      current_page: page,
      last_page: 2,
      per_page: 100,
      from: page === 1 ? 1 : 3,
      to: page === 1 ? 2 : 3,
      total: 3,
    },
  }));
}

beforeEach(() => {
  vi.clearAllMocks();
  mockLists();
});

describe("ManajemenAkunPage", () => {
  it("disetujui tab: approved + subscription filter, columns, pagination", async () => {
    renderPage();
    await screen.findByText(U0.name);

    // List scoped to approved accounts with active/expired subscriptions.
    expect(
      fetchUsers.mock.calls.some(
        (c) =>
          c[0].status === "approved" &&
          Array.isArray(c[0].subscription) &&
          c[0].subscription.join(",") === "active,expired",
      ),
    ).toBe(true);

    expect(screen.getByText(U1.name)).toBeInTheDocument();
    expect(screen.getByText(U0.email)).toBeInTheDocument();
    expect(screen.getAllByText("Disetujui").length).toBeGreaterThan(0);
    expect(screen.getAllByText("active").length).toBeGreaterThan(0);
    expect(screen.getByText("Tahunan")).toBeInTheDocument();
    expect(screen.getByText("Bulanan")).toBeInTheDocument();
    expect(
      screen.getAllByText(formatShortDate(U0.subscription.endDate.utc.formatted))
        .length,
    ).toBe(2);
    expect(screen.getByText(U0.lastVoucher.code)).toBeInTheDocument();
    expect(
      screen.getAllByText(ROLE_META_BY_ID[U0.discourseGroupId].fullName).length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText("Lihat Detail").length).toBeGreaterThan(0);
    expect(screen.getByText(formatBirthdate(U0.birthdate))).toBeInTheDocument();
    expect(screen.getAllByText(U0.region.regionName).length).toBeGreaterThan(0);
    expect(screen.getByText(U0.firstTrainingSession.name)).toBeInTheDocument();
    expect(
      screen.getByText(
        formatSessionDate(U0.firstTrainingSession.startDate.utc.formatted),
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(U0.schoolName)).toBeInTheDocument();
    expect(
      screen.getAllByText(formatUpdatedAt(U0.updatedAt.utc.formatted)).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByText(
        `Menampilkan ${disetujuiFixture.meta.from}–${disetujuiFixture.meta.to} dari ${disetujuiFixture.meta.total} data`,
      ),
    ).toBeInTheDocument();
  });

  it("action popover: remaining noop menu", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText(U0.name);

    await user.click(screen.getByRole("button", { name: `Aksi akun ${U0.name}` }));
    expect(await screen.findByText("Ubah Role")).toBeInTheDocument();
    expect(screen.getByText("Tangguhkan Akun")).toBeInTheDocument();

    // Noop — clicking opens nothing and throws nothing (menu stays open).
    await user.click(screen.getByText("Tangguhkan Akun"));
    // PopoverContent itself is role="dialog" — close it, then assert no modal.
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("Ubah Role preselects current role and saves on change", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText(U0.name);

    await user.click(screen.getByRole("button", { name: `Aksi akun ${U0.name}` }));
    await user.click(await screen.findByText("Ubah Role"));

    const heading = await screen.findByRole("heading", { name: "Ubah Role?" });
    const dialog = heading.closest('[role="dialog"]');
    expect(dialog).not.toBeNull();
    // Preselected with the current role; no change → Simpan disabled.
    expect(
      within(dialog).getByText(ROLE_META_BY_ID[U0.discourseGroupId].fullName),
    ).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Simpan" })).toBeDisabled();

    await user.click(within(dialog).getByRole("combobox", { name: "Role" }));
    await user.click(await screen.findByRole("option", { name: "Guru" }));
    expect(within(dialog).getByRole("button", { name: "Simpan" })).not.toBeDisabled();

    const callsBefore = fetchUsers.mock.calls.length;
    await user.click(within(dialog).getByRole("button", { name: "Simpan" }));

    expect(updateDiscourseGroup).toHaveBeenCalledWith({
      userId: U0.id,
      discourseGroupId: 49,
    });
    await waitFor(() => {
      expect(fetchUsers.mock.calls.length).toBeGreaterThan(callsBefore);
    });
    await waitFor(() => {
      expect(screen.queryByRole("heading", { name: "Ubah Role?" })).not.toBeInTheDocument();
    });
  });

  it("Hapus Akun opens the shared delete dialog and invalidates lists", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText(U0.name);

    await user.click(screen.getByRole("button", { name: `Aksi akun ${U0.name}` }));
    await user.click(await screen.findByText("Hapus Akun"));

    const heading = await screen.findByRole("heading", {
      name: "Yakin Hapus Akun Ini?",
    });
    const dialog = heading.closest('[role="dialog"]');
    expect(dialog).not.toBeNull();
    expect(
      within(dialog).getByText(
        `Akun ${U0.email} akan dihapus. Kamu masih dapat memulihkannya sebelum 30 hari.`,
      ),
    ).toBeInTheDocument();

    const callsBefore = fetchUsers.mock.calls.length;
    await user.click(within(dialog).getByRole("button", { name: "Hapus Akun" }));

    expect(requestAccountDeletion).toHaveBeenCalledWith({ userId: U0.id });
    await waitFor(() => {
      expect(fetchUsers.mock.calls.length).toBeGreaterThan(callsBefore);
    });
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("Lihat Detail opens the shared history dialog", async () => {
    renderPage();
    await screen.findByText(U0.name);

    fireEvent.click(screen.getAllByText("Lihat Detail")[0]);
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(U0.name)).toBeInTheDocument();
    expect(fetchTrainingHistory).toHaveBeenCalledWith(
      expect.objectContaining({ userId: U0.id }),
    );
  });

  it("ditolak tab: rejected filter, both pill variants, conditional reverify menu", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText(U0.name);

    await user.click(screen.getByRole("button", { name: /Ditolak/ }));
    await screen.findByText("Ditolak - Registrasi Ulang");

    expect(
      fetchUsers.mock.calls.some((c) => c[0].status === "rejected"),
    ).toBe(true);
    expect(screen.getByText("Ditolak - Permanen")).toBeInTheDocument();
    expect(
      screen.getByText("Ditolak - Registrasi Ulang").className,
    ).toMatch(/pink/);

    // Rejected rows carry no subscription, history, or alumni columns.
    expect(screen.queryByText("Jenis Paket")).not.toBeInTheDocument();
    expect(screen.queryByText("Riwayat Pelatihan")).not.toBeInTheDocument();
    expect(screen.queryByText("Alumni Pelatihan")).not.toBeInTheDocument();

    // Verifikasi Ulang only on the permanent (-1) row.
    const revisiRow = disetujuiFixture.data[0];
    const permanenRow = disetujuiFixture.data[1];
    await user.click(screen.getByRole("button", { name: `Aksi akun ${revisiRow.name}` }));
    expect(await screen.findByText("Hapus Akun")).toBeInTheDocument();
    expect(screen.queryByText("Verifikasi Ulang")).not.toBeInTheDocument();
    await user.keyboard("{Escape}");

    await user.click(screen.getByRole("button", { name: `Aksi akun ${permanenRow.name}` }));
    expect(await screen.findByText("Verifikasi Ulang")).toBeInTheDocument();
  });

  it("ditangguhkan tab: suspended filter, orange pill, restore menu", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText(U0.name);

    await user.click(screen.getByRole("button", { name: /Ditangguhkan/ }));
    await screen.findByText(U0.name);

    const call = fetchUsers.mock.calls.find((c) => c[0].suspended === 1);
    expect(call).toBeDefined();
    expect(call[0].status).toBeUndefined();

    const table = within(screen.getByRole("table"));
    const pills = table.getAllByText("Ditangguhkan");
    expect(pills.length).toBeGreaterThan(0);
    for (const pill of pills) expect(pill.className).toMatch(/orange/);
    expect(screen.getByText("Tahunan")).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: `Aksi akun ${U0.name}` })[0]);
    expect(await screen.findByText("Pulihkan Akun")).toBeInTheDocument();
    expect(screen.getByText("Hapus Akun")).toBeInTheDocument();
    expect(screen.queryByText("Ubah Role")).not.toBeInTheDocument();
  });

  it("dihapus tab: deletion filter, null rows dropped, red pill, delete date", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText(U0.name);

    await user.click(screen.getByRole("button", { name: /Baru Dihapus/ }));
    // Name differs from email here (first deletion row uses email as name).
    const D0 = deletionFixture.data.find((u) => u.deletion && u.name !== u.email);
    await screen.findByText(D0.name);

    const call = fetchUsers.mock.calls.find((c) => c[0].deletionPending === 1);
    expect(call).toBeDefined();
    expect(call[0].status).toBeUndefined();
    expect(call[0].confirmed).toBeNull();

    // Rows without a deletion request are filtered out client-side.
    const nullRows = deletionFixture.data.filter((u) => !u.deletion);
    expect(nullRows.length).toBeGreaterThan(0);
    for (const dropped of nullRows) {
      expect(screen.queryByText(dropped.name)).not.toBeInTheDocument();
    }

    const table = within(screen.getByRole("table"));
    const pills = table.getAllByText("Baru Dihapus");
    expect(pills.length).toBeGreaterThan(0);
    for (const pill of pills) expect(pill.className).toMatch(/red/);
    expect(
      table.getAllByText(
        formatShortDate(D0.deletion.will_be_deleted_at.utc.formatted),
      ).length,
    ).toBeGreaterThan(0);

    await user.click(screen.getAllByRole("button", { name: `Aksi akun ${D0.name}` })[0]);
    expect(await screen.findByText("Pulihkan Akun")).toBeInTheDocument();
    expect(screen.getByText("Hapus Akun Selamanya")).toBeInTheDocument();
    expect(screen.queryByText("Hapus Akun")).not.toBeInTheDocument();
  });

  it("Hapus Akun Selamanya deletes permanently via DELETE", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText(U0.name);

    await user.click(screen.getByRole("button", { name: /Baru Dihapus/ }));
    const D0 = deletionFixture.data.find((u) => u.deletion && u.name !== u.email);
    await screen.findByText(D0.name);

    await user.click(screen.getAllByRole("button", { name: `Aksi akun ${D0.name}` })[0]);
    await user.click(await screen.findByText("Hapus Akun Selamanya"));

    const heading = await screen.findByRole("heading", {
      name: "Hapus Akun Permanen?",
    });
    const dialog = heading.closest('[role="dialog"]');
    expect(dialog).not.toBeNull();
    expect(
      within(dialog).getByText(
        `Akun ${D0.email} akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.`,
      ),
    ).toBeInTheDocument();

    const callsBefore = fetchUsers.mock.calls.length;
    await user.click(within(dialog).getByRole("button", { name: "Hapus Permanen" }));

    expect(deleteUserPermanently).toHaveBeenCalledWith({ userId: D0.id });
    expect(requestAccountDeletion).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(fetchUsers.mock.calls.length).toBeGreaterThan(callsBefore);
    });
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("search shows on every user table; dihapus hides its count", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText(U0.name);

    for (const title of ["Disetujui", "Ditolak", "Ditangguhkan", "Baru Dihapus"]) {
      await user.click(screen.getByRole("button", { name: new RegExp(title) }));
      await waitFor(() => {
        expect(screen.getByLabelText("Cari pengguna")).toBeInTheDocument();
      });
    }

    // meta.total includes null-deletion rows — no trustworthy number.
    const dihapusTab = screen.getByRole("button", { name: "Baru Dihapus" });
    expect(within(dihapusTab).queryByText("7")).not.toBeInTheDocument();
    expect(dihapusTab.querySelector("span")).toBeNull();
  });

  it("expired subscription renders the red pill", async () => {
    fetchUsers.mockImplementation(async () => ({
      data: disetujuiFixture.data.map((u) => ({
        ...u,
        subscription: { ...u.subscription, status: "expired" },
      })),
      meta: disetujuiFixture.meta,
    }));
    renderPage();

    expect(await screen.findByText(U0.name)).toBeInTheDocument();
    const pills = await screen.findAllByText("expired");
    expect(pills.length).toBeGreaterThan(0);
    expect(pills[0].className).toMatch(/red/);
    await waitFor(() => {
      expect(screen.queryByText("active")).not.toBeInTheDocument();
    });
  });
});
