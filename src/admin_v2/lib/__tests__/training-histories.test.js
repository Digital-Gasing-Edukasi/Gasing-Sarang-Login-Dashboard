import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../api/client.js", () => ({
  apiGet: vi.fn(),
  apiPatch: vi.fn(),
  apiDelete: vi.fn(),
}));

import { apiDelete, apiGet, apiPatch } from "../api/client.js";
import {
  deleteTrainingHistoryImportRow,
  fetchTrainingHistory,
  updateTrainingHistoryImportRow,
} from "../api/training-histories.js";

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

describe("training history import rows", () => {
  it("PATCHes an imported row's email", async () => {
    apiPatch.mockResolvedValue({ success: true });

    await updateTrainingHistoryImportRow("session-1", "row-2", {
      email: "corrected@email.com",
    });

    expect(apiPatch).toHaveBeenCalledWith(
      "/admin/training-histories/imports/session-1/rows/row-2",
      { email: "corrected@email.com" },
    );
  });

  it("DELETEs an imported row", async () => {
    apiDelete.mockResolvedValue({ success: true });

    await deleteTrainingHistoryImportRow("session-1", "row-2");

    expect(apiDelete).toHaveBeenCalledWith(
      "/admin/training-histories/imports/session-1/rows/row-2",
    );
  });
});
