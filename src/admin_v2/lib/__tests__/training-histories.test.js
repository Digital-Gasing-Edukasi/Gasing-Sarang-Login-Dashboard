import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../api/client.js", () => ({ apiGet: vi.fn() }));

import { apiGet } from "../api/client.js";
import { fetchTrainingHistory } from "../api/training-histories.js";

beforeEach(() => vi.clearAllMocks());

describe("fetchTrainingHistory", () => {
  it("hits the user-scoped endpoint with page + limit", async () => {
    apiGet.mockResolvedValue({ data: [], meta: {} });

    await fetchTrainingHistory({ userId: "u-1", page: 2, limit: 50 });

    expect(apiGet).toHaveBeenCalledWith("/admin/users/training-history/u-1", {
      page: 2,
      limit: 50,
    });
  });

  it("defaults to page 1, limit 100", async () => {
    apiGet.mockResolvedValue({ data: [], meta: {} });

    await fetchTrainingHistory({ userId: "u-1" });

    expect(apiGet).toHaveBeenCalledWith("/admin/users/training-history/u-1", {
      page: 1,
      limit: 100,
    });
  });
});
