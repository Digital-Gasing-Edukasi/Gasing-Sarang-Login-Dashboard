import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import userEvent from "@testing-library/user-event";
import vouchersFixture from "../../../dev/responses/admin-vouchers.json";
import { formatShortDate, formatUpdatedAt } from "../lib/format.js";

vi.mock("../lib/api/vouchers.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    fetchPendingVouchers: vi.fn(),
    confirmVoucher: vi.fn(async () => ({})),
  };
});

vi.mock("../lib/clipboard.js", () => ({ copyText: vi.fn(async () => true) }));

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

import { fetchPendingVouchers, confirmVoucher } from "../lib/api/vouchers.js";
import { copyText } from "../lib/clipboard.js";
import PendingVoucherPage from "../pages/pending-voucher/PendingVoucherPage.jsx";

// Everything derives from fixtures — never hardcode names/ids.
const V0 = vouchersFixture.data[0];

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const view = render(
    <QueryClientProvider client={client}>
      <PendingVoucherPage />
    </QueryClientProvider>,
  );
  return { client, ...view };
}

beforeEach(() => {
  vi.clearAllMocks();
  fetchPendingVouchers.mockImplementation(async () => ({
    data: vouchersFixture.data,
    meta: vouchersFixture.meta,
  }));
});

describe("PendingVoucherPage", () => {
  it("lists vouchers: user first, email second, voucher columns, confirm opens dialog", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText(V0.user.name);

    // Pending-only filter, no other scope.
    expect(
      fetchPendingVouchers.mock.calls.some(
        (c) => c[0].status === "pending" || c[0].status === undefined,
      ),
    ).toBe(true);

    expect(screen.getByText(`@${V0.user.username}`)).toBeInTheDocument();
    expect(screen.getByText(V0.user.email)).toBeInTheDocument();
    expect(screen.getByText(V0.code)).toBeInTheDocument();
    expect(screen.getByText(V0.label)).toBeInTheDocument();
    expect(screen.getByText(V0.type)).toBeInTheDocument();
    expect(screen.getByText(V0.status)).toBeInTheDocument();
    expect(
      screen.getByText(formatShortDate(V0.createdAt.local.formatted)),
    ).toBeInTheDocument();
    expect(
      screen.getByText(formatUpdatedAt(V0.updatedAt.local.formatted)),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        `Menampilkan ${vouchersFixture.meta.from}–${vouchersFixture.meta.to} dari ${vouchersFixture.meta.total} data`,
      ),
    ).toBeInTheDocument();

    // Konfirmasi opens the copy-gated dialog.
    await user.click(screen.getByRole("button", { name: "Konfirmasi" }));
    const heading = await screen.findByRole("heading", { name: "Konfirmasi voucher ini?" });
    const dialog = heading.closest('[role="dialog"]');
    expect(dialog).not.toBeNull();
    expect(within(dialog).getByText(V0.code)).toBeInTheDocument();
  });

  it("copy gate, confirm payload, both lists invalidated", async () => {
    const user = userEvent.setup();
    const { client } = renderPage();
    const invalidate = vi.spyOn(client, "invalidateQueries");
    await screen.findByText(V0.user.name);

    await user.click(screen.getByRole("button", { name: "Konfirmasi" }));
    const heading = await screen.findByRole("heading", { name: "Konfirmasi voucher ini?" });
    const dialog = heading.closest('[role="dialog"]');
    expect(within(dialog).getByRole("button", { name: "Konfirmasi" })).toBeDisabled();

    await user.click(within(dialog).getByRole("button", { name: "Salin" }));
    await waitFor(() => {
      expect(copyText).toHaveBeenCalledWith(V0.code);
    });
    expect(
      within(dialog).getByRole("button", { name: "Konfirmasi" }),
    ).not.toBeDisabled();

    const callsBefore = fetchPendingVouchers.mock.calls.length;
    await user.click(within(dialog).getByRole("button", { name: "Konfirmasi" }));

    expect(confirmVoucher).toHaveBeenCalledWith({ voucherId: V0.id });
    await waitFor(() => {
      expect(fetchPendingVouchers.mock.calls.length).toBeGreaterThan(callsBefore);
    });
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: ["admin_v2", "pending-vouchers"],
    });
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: ["admin_v2", "users", "approved"],
    });
    await waitFor(() => {
      expect(
        screen.queryByRole("heading", { name: "Konfirmasi voucher ini?" }),
      ).not.toBeInTheDocument();
    });
  });

  it("search filters by keyword after debounce", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText(V0.user.name);

    await user.type(screen.getByRole("textbox", { name: "Cari voucher" }), V0.code);

    await waitFor(() => {
      expect(
        fetchPendingVouchers.mock.calls.some((c) => c[0].keyword === V0.code),
      ).toBe(true);
    });
  });
});
