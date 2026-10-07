import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../api/client.js", () => ({ apiGet: vi.fn() }));

import { apiGet } from "../api/client.js";
import {
  REGION_CACHE,
  fetchProvinces,
  fetchRegencies,
  fetchRegion,
} from "../api/regions.js";

beforeEach(() => vi.clearAllMocks());

describe("fetchProvinces", () => {
  it("calls /regions without params and returns the bare array", async () => {
    apiGet.mockResolvedValue([{ id: "p-1", name: "Aceh", level: "PROVINCE" }]);

    await expect(fetchProvinces()).resolves.toEqual([
      { id: "p-1", name: "Aceh", level: "PROVINCE" },
    ]);
    expect(apiGet).toHaveBeenCalledWith("/regions");
  });

  it("unwraps a paginated shape defensively", async () => {
    apiGet.mockResolvedValue({ data: [{ id: "p-2" }] });

    await expect(fetchProvinces()).resolves.toEqual([{ id: "p-2" }]);
  });
});

describe("fetchRegencies", () => {
  it("scopes the query by parentId", async () => {
    apiGet.mockResolvedValue([{ id: "r-1", name: "Kabupaten Agam", level: "REGENCY" }]);

    await fetchRegencies("p-1");

    expect(apiGet).toHaveBeenCalledWith("/regions", {
      type: "REGENCY",
      parentId: "p-1",
    });
  });
});

describe("fetchRegion", () => {
  it("unwraps detail (source of parentId)", async () => {
    apiGet.mockResolvedValue({
      id: "r-1",
      name: "Kabupaten Badung",
      level: "REGENCY",
      parentId: "p-1",
    });

    await expect(fetchRegion("r-1")).resolves.toEqual({
      id: "r-1",
      name: "Kabupaten Badung",
      level: "REGENCY",
      parentId: "p-1",
    });
    expect(apiGet).toHaveBeenCalledWith("/regions/r-1");
  });
});

describe("REGION_CACHE", () => {
  it("never revalidates (static geography)", () => {
    expect(REGION_CACHE.staleTime).toBe(Infinity);
    expect(REGION_CACHE.gcTime).toBe(Infinity);
  });
});
