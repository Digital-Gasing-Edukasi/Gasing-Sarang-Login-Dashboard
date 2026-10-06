import { describe, it, expect, vi, beforeEach } from "vitest";
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
  return { ...actual, fetchVerificationUsers: vi.fn() };
});

vi.mock("../lib/api/payments.js", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, fetchManualPayments: vi.fn() };
});

vi.mock("../lib/api/training-histories.js", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, fetchTrainingHistory: vi.fn() };
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

import { fetchVerificationUsers } from "../lib/api/users.js";
import { fetchManualPayments } from "../lib/api/payments.js";
import { fetchTrainingHistory } from "../lib/api/training-histories.js";
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
  fetchVerificationUsers.mockImplementation(async () => ({
    data: unsubFixture.data,
    meta: unsubFixture.meta,
  }));
  fetchManualPayments.mockImplementation(async () => ({
    data: paymentFixture.data,
    meta: paymentFixture.meta,
  }));
  fetchTrainingHistory.mockImplementation(async () => ({
    data: historyFixture.data,
    meta: historyFixture.meta,
  }));
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
    expect(fetchVerificationUsers).toHaveBeenCalledWith(
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
    const countdownEl = await screen.findByText(/\d{2}:\d{2}:\d{2}/);
    expect(countdownEl.className).not.toMatch(/text-red-600/);
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
});
