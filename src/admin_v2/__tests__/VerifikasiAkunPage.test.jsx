import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Radix Select calls DOM APIs jsdom doesn't implement.
if (!window.HTMLElement.prototype.hasPointerCapture) {
  window.HTMLElement.prototype.hasPointerCapture = () => false;
  window.HTMLElement.prototype.setPointerCapture = () => {};
  window.HTMLElement.prototype.releasePointerCapture = () => {};
}
if (!window.HTMLElement.prototype.scrollIntoView) {
  window.HTMLElement.prototype.scrollIntoView = () => {};
}
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import verifFixture from "../../../dev/responses/verif.json";
import sessionsFixture from "../../../dev/responses/training-sessions.json";

vi.mock("../lib/api/users.js", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, fetchVerificationUsers: vi.fn() };
});

vi.mock("../lib/api/training-sessions.js", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, fetchTrainingSessions: vi.fn() };
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

import { fetchVerificationUsers, verificationUsersKeys } from "../lib/api/users.js";
import { fetchTrainingSessions } from "../lib/api/training-sessions.js";
import VerifikasiAkunPage from "../pages/verifikasi-akun/VerifikasiAkunPage.jsx";

const waitingPayload = {
  data: verifFixture.data.slice(0, 2).map((u) => ({ ...u, verifiedStatus: 0 })),
  meta: { current_page: 1, last_page: 1, per_page: 20, from: 1, to: 2, total: 2 },
};
const voucherPayload = {
  data: verifFixture.data,
  meta: { ...verifFixture.meta, total: 4 },
};

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

beforeEach(() => {
  vi.clearAllMocks();
  fetchTrainingSessions.mockImplementation(async () => ({
    data: sessionsFixture.data,
    meta: sessionsFixture.meta,
  }));
  fetchVerificationUsers.mockImplementation(({ status, page = 1, limit = 20, keyword = "" }) => {
    const pool = status === "waiting" ? waitingPayload.data : voucherPayload.data;
    const kw = keyword.trim().toLowerCase();
    const data = kw
      ? pool.filter((u) =>
          [u.name, u.username, u.email].some((f) =>
            (f || "").toLowerCase().includes(kw),
          ),
        )
      : pool;
    const fullTotal = status === "waiting" ? 2 : 4;
    return Promise.resolve({
      data,
      meta: {
        current_page: page,
        last_page: 1,
        per_page: limit,
        from: data.length ? 1 : 0,
        to: data.length,
        total: kw ? data.length : fullTotal,
      },
    });
  });
});

describe("VerifikasiAkunPage", () => {
  it("pending tab: totals on tabs, user cells, status pill, training period", async () => {
    renderPage();

    // Totals beside tab buttons.
    expect(await screen.findByText("2")).toBeInTheDocument();
    expect(await screen.findByText("4")).toBeInTheDocument();

    // Nama + @username, email, formatted training period (month 3 → Maret).
    expect(await screen.findByText("Ade Raharja")).toBeInTheDocument();
    expect(screen.getByText("@aderaharja")).toBeInTheDocument();
    expect(screen.getByText("ibnuhariw10@gmail.com")).toBeInTheDocument();
    expect(screen.getAllByText("Pending").length).toBeGreaterThan(0);
    expect(screen.getByText("Maret 2025")).toBeInTheDocument();
    expect(screen.getByText("Menampilkan 1–2 dari 2 data")).toBeInTheDocument();
  });

  it("first and last columns are frozen", async () => {
    renderPage();
    await screen.findByText("Ade Raharja");

    const first = screen.getByText("Nama Pengguna").closest("th");
    expect(first.className).toMatch(/sticky/);
    expect(first.className).toMatch(/left-0/);

    const last = screen.getByText("Setuju?").closest("th");
    expect(last.className).toMatch(/sticky/);
    expect(last.className).toMatch(/right-0/);

    // Columns between 140px and 280px: can't collapse, can't stretch.
    expect(first.className).toMatch(/min-w-/);
    expect(first.className).toMatch(/max-w-/);
    const bodyCell = screen.getByText("Ade Raharja").closest("td");
    expect(bodyCell.className).toMatch(/max-w-/);
    expect(screen.getByText("Ade Raharja").className).not.toMatch(/whitespace-nowrap/);

    // Short structured fields stay single-line…
    const birthCell = screen.getByText("01 Jan 2000").closest("td");
    expect(birthCell.className).toMatch(/whitespace-nowrap/);
    // …while long free-text cells wrap, capped at 2 lines with ellipsis.
    expect(bodyCell.className).toMatch(/break-words/);
    expect(bodyCell.className).toMatch(/line-clamp-2/);
  });

  it("voucher tab: voucher code, role badge, session columns, confirm action", async () => {
    renderPage();
    await screen.findByText("Ade Raharja");

    fireEvent.click(screen.getByRole("button", { name: /Pending Voucher Setup/ }));

    expect(await screen.findByText("Kode Voucher")).toBeInTheDocument();
    expect(screen.getByText("GASIN0QY4")).toBeInTheDocument();
    // Role badges resolved by discourseGroupId (incl. id 75 with null group object).
    expect(screen.getByText("Guru")).toBeInTheDocument();
    expect(screen.getAllByText("Trainer Aula").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Lihat Detail").length).toBeGreaterThan(0);
    // Session columns under "Alumni Pelatihan".
    expect(screen.getAllByText("Aceh Barat 1A").length).toBeGreaterThan(0);
    expect(screen.getAllByText("06 Apr 2026").length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "Konfirmasi" }).length).toBeGreaterThan(0);
  });

  it("lists refetch when another page invalidates via the shared key factory", async () => {
    renderPage();
    await screen.findByText("Ade Raharja");
    const callsBefore = fetchVerificationUsers.mock.calls.length;

    // Simulate an approve action on some other page.
    await client.invalidateQueries({
      queryKey: verificationUsersKeys.byStatus("waiting"),
    });

    await waitFor(() =>
      expect(fetchVerificationUsers.mock.calls.length).toBeGreaterThan(callsBefore),
    );
  });

  it("search filters by keyword after debounce (no button)", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Ade Raharja");

    await user.type(screen.getByRole("textbox", { name: "Cari pengguna" }), "asdasd");

    // Debounced → refetch with keyword → only the matching user remains.
    await waitFor(() => {
      expect(
        fetchVerificationUsers.mock.calls.some((c) => c[0].keyword === "asdasd"),
      ).toBe(true);
    });
    expect(screen.getByText("big@mossad.com")).toBeInTheDocument();
    expect(screen.queryByText("Ade Raharja")).not.toBeInTheDocument();
    const keyworded = fetchVerificationUsers.mock.calls.filter(
      (c) => c[0].keyword === "asdasd",
    );
    expect(keyworded.at(-1)[0].status).toBe("waiting");
  });

  it("limit selector refetches with the chosen page size", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Ade Raharja");

    await user.click(screen.getByRole("combobox", { name: "Jumlah per halaman" }));
    await user.click(await screen.findByRole("option", { name: "50" }));

    await waitFor(() => {
      const calls = fetchVerificationUsers.mock.calls.filter(
        (c) => c[0].status === "waiting",
      );
      expect(calls.at(-1)[0].limit).toBe(50);
    });
  });

  it("approve flow: dialog, role pick, session search, submit logs payload", async () => {
    const user = userEvent.setup();
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    try {
      renderPage();
      await screen.findByText("Ade Raharja");

      await user.click(screen.getByRole("button", { name: "Setujui Ade Raharja" }));
      expect(await screen.findByText("Setujui Akun Ini?")).toBeInTheDocument();
      expect(screen.getAllByText("Ade Raharja").length).toBeGreaterThan(1);

      // Submit locked until role + session are chosen.
      expect(screen.getByRole("button", { name: "Setujui" })).toBeDisabled();

      // Role with icon + color.
      await user.click(screen.getByRole("combobox", { name: "Role" }));
      await user.click(await screen.findByRole("option", { name: "Guru" }));

      // Server-searchable session dropdown.
      await user.click(
        screen.getByRole("combobox", { name: "Pilih pelatihan…" }),
      );
      await user.type(screen.getByPlaceholderText("Ketik nama pelatihan…"), "gunung");
      await waitFor(() => {
        expect(
          screen.queryByRole("option", { name: "Test Pelatihan" }),
        ).not.toBeInTheDocument();
      });
      await user.click(await screen.findByRole("option", { name: "Gunung Sindur" }));
      await waitFor(() => {
        expect(
          fetchTrainingSessions.mock.calls.some((c) => c[0].keyword === "gunung"),
        ).toBe(true);
      });

      const submit = screen.getByRole("button", { name: "Setujui" });
      expect(submit).not.toBeDisabled();
      await user.click(submit);

      expect(logSpy).toHaveBeenCalledWith(
        "Approve akun:",
        expect.objectContaining({
          roleId: "49",
          roleName: "Guru",
          trainingSessionId: "01a0eb10-c694-71fa-a281-21e3fe01f087",
        }),
      );
    } finally {
      logSpy.mockRestore();
    }
  });

  it("reject flow: dialog opens and logs for now (stub)", async () => {
    const user = userEvent.setup();
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    try {
      renderPage();
      await screen.findByText("Ade Raharja");

      await user.click(screen.getByRole("button", { name: "Tolak Ade Raharja" }));
      expect(await screen.findByText("Tolak Akun Ini?")).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Tolak" }));
      expect(logSpy).toHaveBeenCalledWith(
        "Reject akun:",
        expect.objectContaining({ name: "Ade Raharja" }),
      );
    } finally {
      logSpy.mockRestore();
    }
  });
});
