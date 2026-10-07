import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../api/client.js", () => ({ apiGet: vi.fn(), apiPost: vi.fn(), apiPatch: vi.fn() }));

import { apiGet, apiPost } from "../api/client.js";
import {
  approveManualPayment,
  fetchManualPayments,
  rejectManualPayment,
} from "../api/payments.js";

beforeEach(() => vi.clearAllMocks());

describe("fetchManualPayments", () => {
  it("lists by state filter with paging", async () => {
    apiGet.mockResolvedValue({ data: [], meta: {} });

    await fetchManualPayments({ state: "receipt_uploaded", page: 2, limit: 50 });

    expect(apiGet).toHaveBeenCalledWith("/admin/payments/manual-transfer/list", {
      filter: "receipt_uploaded",
      page: 2,
      limit: 50,
    });
  });

  it("defaults to page 1, limit 20", async () => {
    apiGet.mockResolvedValue({ data: [], meta: {} });

    await fetchManualPayments({ state: "rejected" });

    expect(apiGet).toHaveBeenCalledWith("/admin/payments/manual-transfer/list", {
      filter: "rejected",
      page: 1,
      limit: 20,
    });
  });
});

describe("rejectManualPayment", () => {
  it("POSTs reason + notes to the payment", async () => {
    apiPost.mockResolvedValue({});

    await rejectManualPayment({ paymentId: "p-1", reason: "fund_not_retrieved", notes: "x" });

    expect(apiPost).toHaveBeenCalledWith("/admin/payments/manual-transfer/p-1/reject", {
      reason: "fund_not_retrieved",
      notes: "x",
    });
  });
});

describe("approveManualPayment", () => {
  it("POSTs to the approve endpoint with hardcoded notes", async () => {
    apiPost.mockResolvedValue({});

    await approveManualPayment({ paymentId: "p-1" });

    expect(apiPost).toHaveBeenCalledWith("/admin/payments/manual-transfer/p-1/approve", {
      notes: "Optional approval notes",
    });
  });
});
