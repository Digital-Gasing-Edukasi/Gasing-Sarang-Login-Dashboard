import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../api/client.js", () => ({ apiGet: vi.fn(), apiPatch: vi.fn() }));

import { apiGet, apiPatch } from "../api/client.js";
import { confirmVoucher, fetchPendingVouchers, pendingVouchersKeys } from "../api/vouchers.js";

beforeEach(() => vi.clearAllMocks());

describe("fetchPendingVouchers", () => {
  it("sends pending status + paging + sort params", async () => {
    apiGet.mockResolvedValue({ data: [], meta: {} });

    await fetchPendingVouchers({ page: 2, limit: 50 });

    expect(apiGet).toHaveBeenCalledWith(
      "/admin/vouchers",
      expect.objectContaining({
        page: 2,
        limit: 50,
        "filter[status]": "pending",
        "sort[by]": "createdAt",
        "sort[order]": "desc",
      }),
    );
  });

  it("passes keyword through, undefined when blank (client omits it)", async () => {
    apiGet.mockResolvedValue({ data: [], meta: {} });

    await fetchPendingVouchers({ keyword: "GASI" });
    expect(apiGet).toHaveBeenLastCalledWith(
      "/admin/vouchers",
      expect.objectContaining({ "filter[keyword]": "GASI" }),
    );

    await fetchPendingVouchers({ keyword: "" });
    expect(apiGet).toHaveBeenLastCalledWith(
      "/admin/vouchers",
      expect.objectContaining({ "filter[keyword]": undefined }),
    );
  });
});

describe("pendingVouchersKeys", () => {
  it("builds stable list keys", () => {
    expect(pendingVouchersKeys.page(1, { limit: 20 })).toEqual([
      "admin_v2",
      "pending-vouchers",
      { page: 1, limit: 20 },
    ]);
  });
});

describe("confirmVoucher", () => {
  it("PATCHes the ready endpoint with no payload", async () => {
    apiPatch.mockResolvedValue({});

    await confirmVoucher({ voucherId: "v-1" });

    expect(apiPatch).toHaveBeenCalledWith("/admin/vouchers/v-1/ready");
  });
});
