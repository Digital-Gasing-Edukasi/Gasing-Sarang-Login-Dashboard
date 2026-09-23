import { describe, it, expect } from "vitest";
import { evaluatePaymentGate } from "../loginGate";

// Code rejectionReason BE (session-status payment_rejected, tanpa status
// payment) → varian modal yang benar. Lihat contoh payload dari user.

describe("evaluatePaymentGate — session rejectionReason codes", () => {
  it("unsuficient_transfer [sic BE] → amount, tagihan dari adminNotes", () => {
    const out = evaluatePaymentGate({
      paymentId: "01a0cbd2",
      invoiceNumber: "0021SGINVGA-IX2026",
      rejectionReason: "unsuficient_transfer",
      adminNotes: "50000",
    });
    expect(out.type).toBe("payment_rejected");
    expect(out.variant).toBe("amount");
    expect(out.amount).toBe(50000);
    expect(out.paymentRef).toEqual({ id: "01a0cbd2", orderId: "0021SGINVGA-IX2026" });
  });

  it("insufficient_transfer (ejaan benar) → amount juga", () => {
    const out = evaluatePaymentGate({
      rejectionReason: "insufficient_transfer",
      adminNotes: "100000",
    });
    expect(out.variant).toBe("amount");
    expect(out.amount).toBe(100000);
  });

  it("fund_not_retrieved → account", () => {
    const out = evaluatePaymentGate({
      paymentId: "01a0cbde",
      rejectionReason: "fund_not_retrieved",
      adminNotes: "ga ada",
    });
    expect(out.variant).toBe("account");
    expect(out.amount).toBeNull(); // adminNotes non-angka tak bocor ke tagihan
  });

  it("payment_receipt_unclear → receipt", () => {
    const out = evaluatePaymentGate({
      paymentId: "01a0b30d",
      rejectionReason: "payment_receipt_unclear",
      adminNotes: "gaje",
    });
    expect(out.variant).toBe("receipt");
    expect(out.paymentRef).toEqual({ id: "01a0b30d", orderId: null });
  });

  it("tanpa status + tanpa code dikenal → null (bukan payment ditolak)", () => {
    expect(evaluatePaymentGate({ status: "paid" })).toBeNull();
    expect(evaluatePaymentGate({})).toBeNull();
    expect(evaluatePaymentGate(null)).toBeNull();
  });

  it("code lama (latest-payment flow) tetap jalan", () => {
    expect(
      evaluatePaymentGate({ status: "rejected", notes: "nominal tidak sesuai", amount: 396000 }).variant
    ).toBe("amount");
    expect(
      evaluatePaymentGate({ status: "failed", reason: "rekening tujuan salah" }).variant
    ).toBe("account");
  });
});
