import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import userEvent from "@testing-library/user-event";
import unsubFixture from "../../../dev/responses/not-subscribed.json";
import paymentFixture from "../../../dev/responses/payment-manual-receiptuploaded.json";
import historyFixture from "../../../dev/responses/training-user.json";
import { formatDateTime, formatShortDate } from "../lib/format.js";
import { ROLE_META_BY_ID } from "../lib/roles.js";

vi.mock("../lib/api/users.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    fetchUsers: vi.fn(),
    requestAccountDeletion: vi.fn(async () => ({})),
  };
});

vi.mock("../lib/api/payments.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    fetchManualPayments: vi.fn(),
    rejectManualPayment: vi.fn(async () => ({})),
    approveManualPayment: vi.fn(async () => ({})),
  };
});

vi.mock("../lib/api/training-histories.js", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, fetchTrainingHistory: vi.fn() };
});

vi.mock("../lib/api/exports.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    requestExport: vi.fn(),
    fetchExportJob: vi.fn(async () => ({ status: "PENDING", progress: 0 })),
  };
});

// Same inline-dialog mock as the verifikasi-akun suite (jsdom + Radix traps).
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

import { fetchUsers, requestAccountDeletion } from "../lib/api/users.js";
import {
  approveManualPayment,
  fetchManualPayments,
  rejectManualPayment,
} from "../lib/api/payments.js";
import { fetchTrainingHistory } from "../lib/api/training-histories.js";
import { requestExport } from "../lib/api/exports.js";
import { useDownloads } from "../stores/useDownloads.js";
import VerifikasiPembayaranPage from "../pages/verifikasi-pembayaran/VerifikasiPembayaranPage.jsx";

const U0 = unsubFixture.data[0];
const P0 = paymentFixture.data[0];

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <VerifikasiPembayaranPage />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  useDownloads.getState().reset();
  fetchUsers.mockImplementation(({ keyword = "" } = {}) => {
    const kw = keyword.trim().toLowerCase();
    const data = kw
      ? unsubFixture.data.filter((u) =>
          [u.name, u.username, u.email].some((f) =>
            (f || "").toLowerCase().includes(kw),
          ),
        )
      : unsubFixture.data;
    return Promise.resolve({
      data,
      meta: { ...unsubFixture.meta, to: data.length, total: kw ? data.length : unsubFixture.meta.total },
    });
  });
  fetchManualPayments.mockImplementation(async () => ({
    data: paymentFixture.data,
    meta: paymentFixture.meta,
  }));
  fetchTrainingHistory.mockImplementation(async () => ({
    data: historyFixture.data,
    meta: historyFixture.meta,
  }));
});

afterEach(() => {
  useDownloads.getState().reset();
});

describe("VerifikasiPembayaranPage", () => {
  it("belum tab: user columns, member pill, voucher, role, last updated", async () => {
    renderPage();

    expect(
      await within(screen.getByRole("button", { name: /Belum Langganan/ })).findByText(
        "26",
      ),
    ).toBeInTheDocument();
    expect(await screen.findByText(U0.name)).toBeInTheDocument();
    expect(screen.getByText(U0.email)).toBeInTheDocument();
    expect(screen.getAllByText("Belum Langganan").length).toBeGreaterThan(0);
    expect(screen.getByText(U0.lastVoucher.code)).toBeInTheDocument();
    expect(
      screen.getAllByText(ROLE_META_BY_ID[U0.discourseGroupId].fullName).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText(formatShortDate(U0.updatedAt.utc.formatted)).length,
    ).toBeGreaterThan(0);
    // Last Updated is the frozen last column.
    const lastTh = screen.getByText("Last Updated").closest("th");
    expect(lastTh.className).toMatch(/sticky/);
    expect(lastTh.className).toMatch(/right-0/);
    // Unsubscribed fetch carries the subscription filter.
    expect(fetchUsers).toHaveBeenCalledWith(
      expect.objectContaining({ subscription: "not_subscribed" }),
    );
  });

  it("belum tab: Lihat Detail opens the shared history dialog", async () => {
    renderPage();
    await screen.findByText(U0.name);

    fireEvent.click(screen.getAllByText("Lihat Detail")[0]);
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(U0.name)).toBeInTheDocument();
    expect(within(dialog).getByText(U0.email)).toBeInTheDocument();
    expect(fetchTrainingHistory).toHaveBeenCalledWith(
      expect.objectContaining({ userId: U0.id }),
    );
    expect(
      await within(dialog).findByText(historyFixture.data[0].name),
    ).toBeInTheDocument();
  });

  it("verifikasi tab: payment columns, translated package, deadline, confirm", async () => {
    renderPage();
    await screen.findByText(U0.name);

    fireEvent.click(screen.getByRole("button", { name: /Menunggu Verifikasi/ }));

    expect(await screen.findByText(`@${P0.user.username}`)).toBeInTheDocument();
    expect(screen.getAllByText(P0.user.email)).toHaveLength(2);
    expect(
      screen.getAllByText("Pending Verifikasi Pembayaran").length,
    ).toBeGreaterThan(0);
    expect(screen.getByText("Tahunan")).toBeInTheDocument();
    expect(
      screen.getByText(formatShortDate(P0.periodeEnd.utc.formatted)),
    ).toBeInTheDocument();
    // Fixture deadline is in the future → live HH:MM:SS countdown.
    expect(await screen.findByText(/\d{2}:\d{2}:\d{2}/)).toBeInTheDocument();
    expect(fetchManualPayments).toHaveBeenCalledWith(
      expect.objectContaining({ state: "receipt_uploaded" }),
    );
    expect(
      screen.getAllByRole("button", { name: "Konfirmasi" }).length,
    ).toBeGreaterThan(0);
    expect(screen.getByText(P0.transferDate.formatted)).toBeInTheDocument();
  });

  it("ditolak tab: action menu with approve + delete entries", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText(U0.name);

    fireEvent.click(screen.getByRole("button", { name: /Pembayaran Ditolak/ }));
    await screen.findByText(`@${P0.user.username}`);
    expect(fetchManualPayments).toHaveBeenCalledWith(
      expect.objectContaining({ state: "rejected" }),
    );

    await user.click(screen.getAllByRole("button", { name: /Aksi pembayaran/ })[0]);
    expect(await screen.findByText("Setujui Pembayaran")).toBeInTheDocument();
    expect(screen.getByText("Hapus Akun")).toBeInTheDocument();
  });

  it("payment confirm dialog: details, rupiah, receipt, dummy actions", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText(U0.name);

    fireEvent.click(screen.getByRole("button", { name: /Menunggu Verifikasi/ }));
    await screen.findByText(`@${P0.user.username}`);

    await user.click(screen.getAllByRole("button", { name: "Konfirmasi" })[0]);
    const dialog = await screen.findByRole("dialog");
    expect(
      within(dialog).getByRole("heading", { name: "Konfirmasi Pembayaran" }),
    ).toBeInTheDocument();
    expect(within(dialog).getByText(`Akun: ${P0.user.email}`)).toBeInTheDocument();
    expect(within(dialog).getByText(P0.senderName)).toBeInTheDocument();
    expect(within(dialog).getByText(P0.senderBankName)).toBeInTheDocument();
    expect(
      within(dialog).getByText(P0.transferDate.formatted),
    ).toBeInTheDocument();
    expect(within(dialog).getByText("Tahunan")).toBeInTheDocument();
    expect(within(dialog).getByText("Rp 396.000")).toBeInTheDocument();

    const receipt = within(dialog).getByAltText("Bukti transfer");
    expect(receipt).toHaveAttribute("src", P0.receiptUrl);
    const download = within(dialog).getByRole("link", { name: "Unduh Bukti" });
    expect(download).toHaveAttribute("href", P0.receiptUrl);

    // Dummies: clickable, dialog stays open.
    await user.click(within(dialog).getByRole("button", { name: "Tolak Pembayaran" }));
    await user.click(
      within(dialog).getByRole("button", { name: "Konfirmasi Pembayaran" }),
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("payment reject submit: reason payload, close, both lists invalidated", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText(U0.name);

    fireEvent.click(screen.getByRole("button", { name: /Menunggu Verifikasi/ }));
    await screen.findByText(`@${P0.user.username}`);

    await user.click(screen.getAllByRole("button", { name: "Konfirmasi" })[0]);
    await user.click(
      within(await screen.findByRole("dialog")).getByRole("button", {
        name: "Tolak Pembayaran",
      }),
    );

    const dialog = await screen.findByRole("dialog");
    await user.click(
      within(dialog).getByRole("radio", { name: "Dana tidak diterima" }),
    );
    await user.type(
      within(dialog).getByPlaceholderText("Catatan tambahan untuk alasan ini..."),
      "uang tidak masuk",
    );

    const verifikasiBefore = fetchManualPayments.mock.calls.filter(
      (c) => c[0].state === "receipt_uploaded",
    ).length;
    const ditolakBefore = fetchManualPayments.mock.calls.filter(
      (c) => c[0].state === "rejected",
    ).length;
    await user.click(
      within(dialog).getByRole("button", { name: "Tolak Pembayaran" }),
    );

    expect(rejectManualPayment).toHaveBeenCalledWith({
      paymentId: P0.id,
      reason: "fund_not_retrieved",
      notes: "uang tidak masuk",
    });

    await waitFor(() => {
      expect(
        fetchManualPayments.mock.calls.filter((c) => c[0].state === "receipt_uploaded")
          .length,
      ).toBeGreaterThan(verifikasiBefore);
      expect(
        fetchManualPayments.mock.calls.filter((c) => c[0].state === "rejected").length,
      ).toBeGreaterThan(ditolakBefore);
    });
  });

  it("payment approve submit: no payload, close, belum + verifikasi invalidated", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText(U0.name);

    fireEvent.click(screen.getByRole("button", { name: /Menunggu Verifikasi/ }));
    await screen.findByText(`@${P0.user.username}`);

    await user.click(screen.getAllByRole("button", { name: "Konfirmasi" })[0]);
    const dialog = await screen.findByRole("dialog");

    const belumBefore = fetchUsers.mock.calls.length;
    const verifikasiBefore = fetchManualPayments.mock.calls.filter(
      (c) => c[0].state === "receipt_uploaded",
    ).length;
    const ditolakBefore = fetchManualPayments.mock.calls.filter(
      (c) => c[0].state === "rejected",
    ).length;

    await user.click(
      within(dialog).getByRole("button", { name: "Konfirmasi Pembayaran" }),
    );

    expect(approveManualPayment).toHaveBeenCalledWith({ paymentId: P0.id });

    await waitFor(() => {
      expect(fetchUsers.mock.calls.length).toBeGreaterThan(belumBefore);
      expect(
        fetchManualPayments.mock.calls.filter((c) => c[0].state === "receipt_uploaded")
          .length,
      ).toBeGreaterThan(verifikasiBefore);
    });
    expect(
      fetchManualPayments.mock.calls.filter((c) => c[0].state === "rejected").length,
    ).toBe(ditolakBefore);
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("delete account flow: menu, confirm, all three lists invalidated", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText(U0.name);

    fireEvent.click(screen.getByRole("button", { name: /Pembayaran Ditolak/ }));
    await screen.findByText(`@${P0.user.username}`);

    await user.click(screen.getAllByRole("button", { name: /Aksi pembayaran/ })[0]);
    await user.click(await screen.findByText("Hapus Akun"));

    // NOTE: Radix PopoverContent itself carries role="dialog" and stays
    // mounted behind the modal — scope via the heading.
    const heading = await screen.findByRole("heading", {
      name: "Yakin Hapus Akun Ini?",
    });
    const dialog = heading.closest('[role="dialog"]');
    expect(dialog).not.toBeNull();
    expect(
      within(dialog).getByText(`Akun ${P0.user.email} akan dihapus. Kamu masih dapat memulihkannya sebelum 30 hari.`),
    ).toBeInTheDocument();

    const belumBefore = fetchUsers.mock.calls.length;
    const verifikasiBefore = fetchManualPayments.mock.calls.filter(
      (c) => c[0].state === "receipt_uploaded",
    ).length;
    const ditolakBefore = fetchManualPayments.mock.calls.filter(
      (c) => c[0].state === "rejected",
    ).length;

    await user.click(within(dialog).getByRole("button", { name: "Hapus Akun" }));

    expect(requestAccountDeletion).toHaveBeenCalledWith({ userId: P0.user.id });

    await waitFor(() => {
      expect(fetchUsers.mock.calls.length).toBeGreaterThan(belumBefore);
      expect(
        fetchManualPayments.mock.calls.filter((c) => c[0].state === "receipt_uploaded")
          .length,
      ).toBeGreaterThan(verifikasiBefore);
      expect(
        fetchManualPayments.mock.calls.filter((c) => c[0].state === "rejected").length,
      ).toBeGreaterThan(ditolakBefore);
    });
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("export per tab hits the scoped endpoint", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText(U0.name);
    requestExport.mockResolvedValue("t-x");

    await user.click(screen.getByRole("button", { name: "Export" }));
    expect(requestExport).toHaveBeenCalledWith("belum_langganan");

    fireEvent.click(screen.getByRole("button", { name: /Menunggu Verifikasi/ }));
    await screen.findByText(`@${P0.user.username}`);
    await user.click(screen.getByRole("button", { name: "Export" }));
    expect(requestExport).toHaveBeenCalledWith("menunggu_verifikasi");

    fireEvent.click(screen.getByRole("button", { name: /Pembayaran Ditolak/ }));
    await screen.findByText(`@${P0.user.username}`);
    await user.click(screen.getByRole("button", { name: "Export" }));
    expect(requestExport).toHaveBeenCalledWith("pembayaran_ditolak");
  });
});
