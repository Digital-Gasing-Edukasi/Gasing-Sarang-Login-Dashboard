import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../api/client.js", () => ({ apiGet: vi.fn() }));

import { apiGet } from "../api/client.js";
import { fetchManualPayments } from "../api/payments.js";

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
