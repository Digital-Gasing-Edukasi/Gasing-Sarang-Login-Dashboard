import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { usePendingPaymentCheck } from "../usePendingPaymentCheck";
import { subscriptionApi } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  subscriptionApi: {
    getLatestPayment: vi.fn(),
  },
}));

describe("usePendingPaymentCheck", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns isPending=false when no payment or empty data", async () => {
    subscriptionApi.getLatestPayment.mockResolvedValueOnce({});
    const { result } = renderHook(() => usePendingPaymentCheck());

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.isPending).toBe(false);
    expect(result.current.pendingPayment).toBeNull();
  });

  it("returns isPending=true and extracts plan when payment is pending with receipt", async () => {
    subscriptionApi.getLatestPayment.mockResolvedValueOnce({
      id: "pay-123",
      status: "pending",
      amount: 396000,
      orderId: "ORD-001",
      receiptFileId: "receipt-file-99",
      package: {
        id: "pkg-1",
        name: "Yearly",
        price: 396000,
        duration: 1,
        durationUnit: "year",
      },
    });

    const { result } = renderHook(() => usePendingPaymentCheck());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.isPending).toBe(true);
    expect(result.current.receiptFileId).toBe("receipt-file-99");
    expect(result.current.plan).toEqual({
      id: "pkg-1",
      name: "Yearly",
      billingCycle: "annual",
      months: 12,
      priceTotal: 396000,
      priceMonthly: 33000,
    });
  });

  it("handles receipt_uploaded status", async () => {
    subscriptionApi.getLatestPayment.mockResolvedValueOnce({
      data: [
        {
          id: "pay-456",
          status: "receipt_uploaded",
          amount: 100000,
          package: {
            id: "pkg-2",
            name: "Monthly",
            price: 100000,
            duration: 1,
            durationUnit: "month",
          },
        },
      ],
    });

    const { result } = renderHook(() => usePendingPaymentCheck());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.isPending).toBe(true);
    expect(result.current.plan?.billingCycle).toBe("monthly");
    expect(result.current.plan?.months).toBe(1);
  });

  it("returns isPending=false when payment status is paid or rejected", async () => {
    subscriptionApi.getLatestPayment.mockResolvedValueOnce({
      id: "pay-789",
      status: "paid",
    });

    const { result } = renderHook(() => usePendingPaymentCheck());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.isPending).toBe(false);
    expect(result.current.pendingPayment).toBeNull();
  });

  it("handles API failure gracefully", async () => {
    subscriptionApi.getLatestPayment.mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => usePendingPaymentCheck());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.isPending).toBe(false);
    expect(result.current.pendingPayment).toBeNull();
  });
});
