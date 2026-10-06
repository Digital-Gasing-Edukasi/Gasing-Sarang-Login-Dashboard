import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import paymentFixture from "../../../dev/responses/payment-manual-receiptuploaded.json";

vi.mock("../lib/api/payments.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    approveManualPayment: vi.fn(),
  };
});

// Same inline-dialog mock as the page suite, plus a close affordance the
// real Radix chrome provides (X / overlay / Escape → onOpenChange).
vi.mock("../components/ui/dialog.jsx", async () => {
  const React = await import("react");
  const Passthrough = ({ children }) =>
    React.createElement(React.Fragment, null, children);
  return {
    Dialog: ({ open, onOpenChange, children }) =>
      open ? (
        React.createElement(
          React.Fragment,
          null,
          React.createElement(
            "button",
            { "aria-label": "Mock close", onClick: () => onOpenChange?.(false) },
            "x",
          ),
          children,
        )
      ) : null,
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

import { approveManualPayment } from "../lib/api/payments.js";
import { PaymentConfirmDialog } from "../pages/verifikasi-pembayaran/components/dialogs/PaymentConfirmDialog.jsx";

const P0 = paymentFixture.data[0];
const P1 = { ...P0, id: "other-id", user: { ...P0.user, email: "other@x.com" } };

function Harness() {
  const [payment, setPayment] = useState(P0);
  return (
    <>
      <button onClick={() => setPayment(P1)}>open other</button>
      <PaymentConfirmDialog payment={payment} onClose={() => setPayment(null)} />
    </>
  );
}

function renderHarness() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <Harness />
    </QueryClientProvider>,
  );
}

beforeEach(() => vi.clearAllMocks());

describe("PaymentConfirmDialog error reset", () => {
  it("closing with an error clears it for the next payment", async () => {
    const user = userEvent.setup();
    approveManualPayment.mockRejectedValueOnce(new Error("Server down"));
    renderHarness();

    await user.click(screen.getByRole("button", { name: "Konfirmasi Pembayaran" }));
    expect(await screen.findByText(/Gagal mengonfirmasi/)).toBeInTheDocument();

    // Close (X / overlay / Escape in production) and open another payment.
    await user.click(screen.getByRole("button", { name: "Mock close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "open other" }));

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.queryByText(/Gagal mengonfirmasi/)).not.toBeInTheDocument();
  });
});
