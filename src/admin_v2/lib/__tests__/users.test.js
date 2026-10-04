import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../api/client.js", () => ({ apiGet: vi.fn() }));

import { apiGet } from "../api/client.js";
import { fetchVerificationStatusCount, fetchVerificationUsers } from "../api/users.js";

beforeEach(() => vi.clearAllMocks());

describe("fetchVerificationUsers", () => {
  it("sends status + paging + sort params", async () => {
    apiGet.mockResolvedValue({ data: [], meta: {} });

    await fetchVerificationUsers({ status: "waiting", page: 2, limit: 50 });

    expect(apiGet).toHaveBeenCalledWith(
      "/admin/users",
      expect.objectContaining({
        page: 2,
        limit: 50,
        "filter[verifiedStatus]": "waiting",
        "sort[by]": "createdAt",
        "sort[order]": "desc",
      }),
    );
  });

  it("passes keyword through, undefined when blank (client omits it)", async () => {
    apiGet.mockResolvedValue({ data: [], meta: {} });

    await fetchVerificationUsers({ status: "waiting", keyword: "john" });
    expect(apiGet).toHaveBeenLastCalledWith(
      "/admin/users",
      expect.objectContaining({ "filter[keyword]": "john" }),
    );

    await fetchVerificationUsers({ status: "waiting", keyword: "" });
    expect(apiGet).toHaveBeenLastCalledWith(
      "/admin/users",
      expect.objectContaining({ "filter[keyword]": undefined }),
    );
  });
});

describe("fetchVerificationStatusCount", () => {
  it("fetches a single row (limit=1) and returns meta.total", async () => {
    apiGet.mockResolvedValue({ data: [{ id: 1 }], meta: { total: 42 } });

    await expect(fetchVerificationStatusCount("rejected")).resolves.toBe(42);
    expect(apiGet).toHaveBeenCalledWith(
      "/admin/users",
      expect.objectContaining({
        page: 1,
        limit: 1,
        "filter[verifiedStatus]": "rejected",
      }),
    );
  });

  it("missing meta → 0", async () => {
    apiGet.mockResolvedValue({ data: [] });

    await expect(fetchVerificationStatusCount("waiting")).resolves.toBe(0);
  });
});
