import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../api/client.js", () => ({ apiGet: vi.fn() }));

import { apiGet } from "../api/client.js";
import { fetchTrainingSessions } from "../api/training-sessions.js";
import byRegionFixture from "../../../../dev/responses/training-sessions-byregion.json";

beforeEach(() => vi.clearAllMocks());

describe("fetchTrainingSessions", () => {
  it("sends paging, keyword, and regionId", async () => {
    apiGet.mockResolvedValue({ data: [], meta: {} });

    await fetchTrainingSessions({ page: 1, limit: 100, keyword: "gunung", regionId: "r-1" });

    expect(apiGet).toHaveBeenCalledWith("/training-sessions", {
      page: 1,
      limit: 100,
      keyword: "gunung",
      regionId: "r-1",
    });
  });

  it("omits blank keyword and regionId", async () => {
    apiGet.mockResolvedValue({ data: [], meta: {} });

    await fetchTrainingSessions({ page: 1, limit: 20, keyword: "" });

    expect(apiGet).toHaveBeenCalledWith("/training-sessions", {
      page: 1,
      limit: 20,
      keyword: undefined,
      regionId: undefined,
    });
  });
});

describe("fetchTrainingSessions shapes", () => {
  it("passes through paginated { data, meta }", async () => {
    apiGet.mockResolvedValue({ data: [{ id: "1" }], meta: { total: 1 } });

    await expect(
      fetchTrainingSessions({ regionId: undefined }),
    ).resolves.toEqual({ data: [{ id: "1" }], meta: { total: 1 } });
  });

  it("normalizes the bare array returned with regionId", async () => {
    apiGet.mockResolvedValue(byRegionFixture);

    const res = await fetchTrainingSessions({ regionId: "r-1" });

    expect(Array.isArray(res.data)).toBe(true);
    expect(res.data).toHaveLength(byRegionFixture.length);
    expect(res.meta).toBeNull();
    expect(apiGet).toHaveBeenCalledWith(
      "/training-sessions",
      expect.objectContaining({ regionId: "r-1" }),
    );
  });
});
