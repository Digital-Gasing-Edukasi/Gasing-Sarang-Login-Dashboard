import { describe, it, expect } from "vitest";
import {
  interpretXenditStatus,
  normalizeXenditCheckout,
  normalizeXenditConflict,
} from "../xendit";
import paidFixture from "../../../dev/responses/xendit-paid.json";
import pendingFixture from "../../../dev/responses/xendit-pending.json";
import declinedFixture from "../../../dev/responses/xendit-pending-declined.json";
import expiredFixture from "../../../dev/responses/xendit-expired.json";
import notFoundFixture from "../../../dev/responses/xendit-not-found.json";

// Klasifikasi memakai fixture respons BE asli (dev/responses/xendit-*.json).

describe("interpretXenditStatus (fixture BE)", () => {
  it("paid → sukses", () => {
    expect(interpretXenditStatus(paidFixture).outcome).toBe("paid");
  });

  it("pending tanpa failureReason → lanjut polling", () => {
    const { outcome, payment } = interpretXenditStatus(pendingFixture);
    expect(outcome).toBe("pending");
    expect(payment.failureReason).toBeNull();
  });

  it("pending + failureReason → declined (tampilkan redirect lagi)", () => {
    const { outcome, payment } = interpretXenditStatus(declinedFixture);
    expect(outcome).toBe("declined");
    expect(payment.failureReason).toMatch(/ditolak/i);
  });

  it("expired → stop + retry", () => {
    expect(interpretXenditStatus(expiredFixture).outcome).toBe("expired");
  });

  it("not-found (404 body, tanpa status payment) → pending (poll yang tangkap 404-nya)", () => {
    // Body 404 tak punya status payment — request() melempar err.status 404
    // SEBELUM interpret dipanggil; interpret sendiri fail-safe ke pending.
    expect(interpretXenditStatus(notFoundFixture).outcome).toBe("pending");
  });

  it("bentuk terbungkus { data } tetap terbaca", () => {
    expect(interpretXenditStatus({ data: paidFixture }).outcome).toBe("paid");
  });
});

describe("normalizeXenditCheckout", () => {
  it("201 lengkap → paymentId + redirectUrl", () => {
    const out = normalizeXenditCheckout({
      paymentId: "pay-1",
      orderId: "SUB-X",
      invoiceNumber: "INV-X",
      redirectUrl: "https://dev.xen.to/AbCdEf12",
      amount: 29900,
    });
    expect(out).toMatchObject({ paymentId: "pay-1", redirectUrl: "https://dev.xen.to/AbCdEf12" });
  });

  it("tak lengkap → null (jangan redirect buta)", () => {
    expect(normalizeXenditCheckout({ paymentId: "pay-1" })).toBeNull();
    expect(normalizeXenditCheckout(null)).toBeNull();
  });
});

describe("normalizeXenditConflict", () => {
  it("409 → pendingPayment lama", () => {
    const out = normalizeXenditConflict({
      message: "masih ada pending",
      pendingPayment: {
        paymentId: "pay-9",
        redirectUrl: "https://link-web-staging.xendit.co/confirm",
      },
    });
    expect(out).toMatchObject({ paymentId: "pay-9", redirectUrl: expect.stringContaining("xendit.co") });
  });

  it("tanpa pendingPayment → null", () => {
    expect(normalizeXenditConflict({ message: "x" })).toBeNull();
  });
});
