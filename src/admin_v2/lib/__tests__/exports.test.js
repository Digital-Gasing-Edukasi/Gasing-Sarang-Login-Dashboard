import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../api/client.js", () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
}));

import { apiGet, apiPost } from "../api/client.js";
import { fetchExportJob, requestExport } from "../api/exports.js";

beforeEach(() => vi.clearAllMocks());

describe("requestExport", () => {
  it("POSTs to the scope endpoint and returns the trackId", async () => {
    apiPost.mockResolvedValue({ trackId: "t-1" });

    await expect(requestExport("waiting")).resolves.toBe("t-1");
    expect(apiPost).toHaveBeenCalledWith("/admin/users/export/verifikasi-akun");

    apiPost.mockResolvedValue({ trackId: "t-2" });
    await expect(requestExport("pending_voucher")).resolves.toBe("t-2");
    expect(apiPost).toHaveBeenCalledWith("/admin/users/export/pending-voucher");
  });

  it("unwraps data.trackId and rejects unknown scopes", async () => {
    apiPost.mockResolvedValue({ data: { trackId: "t-3" } });
    await expect(requestExport("waiting")).resolves.toBe("t-3");

    await expect(requestExport("nope")).rejects.toThrow(/Unknown export scope/);
    expect(apiPost).not.toHaveBeenCalledWith("/admin/users/export/nope");
  });
});

describe("fetchExportJob", () => {
  it("GETs the job by trackId", async () => {
    apiGet.mockResolvedValue({ status: "ACTIVE" });

    await fetchExportJob("t-9");
    expect(apiGet).toHaveBeenCalledWith("/queue/jobs/t-9");
  });
});
