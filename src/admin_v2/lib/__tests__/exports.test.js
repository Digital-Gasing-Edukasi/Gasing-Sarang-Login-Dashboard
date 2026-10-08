import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../api/client.js", () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
}));

import { apiGet, apiPost } from "../api/client.js";
import {
  EXPORT_CATEGORIES,
  EXPORT_ENDPOINTS,
  exportCategoryOf,
  exportCategoryTitle,
  fetchExportJob,
  requestExport,
} from "../api/exports.js";

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

  it("POSTs to the payment-tab endpoints", async () => {
    apiPost.mockResolvedValue({ trackId: "t-4" });

    await expect(requestExport("belum_langganan")).resolves.toBe("t-4");
    expect(apiPost).toHaveBeenCalledWith("/admin/users/export/belum-langganan");

    await expect(requestExport("menunggu_verifikasi")).resolves.toBe("t-4");
    expect(apiPost).toHaveBeenCalledWith(
      "/admin/users/export/menunggu-verifikasi",
    );

    await expect(requestExport("pembayaran_ditolak")).resolves.toBe("t-4");
    expect(apiPost).toHaveBeenCalledWith("/admin/users/export/pembayaran-ditolak");
  });
});

describe("fetchExportJob", () => {
  it("GETs the job by trackId", async () => {
    apiGet.mockResolvedValue({ status: "ACTIVE" });

    await fetchExportJob("t-9");
    expect(apiGet).toHaveBeenCalledWith("/queue/jobs/t-9");
  });
});

describe("export categories", () => {
  it("maps scopes to their menu, unknown to lainnya", () => {
    expect(exportCategoryOf("waiting")).toBe("verifikasi-akun");
    expect(exportCategoryOf("pending_voucher")).toBe("verifikasi-akun");
    expect(exportCategoryOf("belum_langganan")).toBe("verifikasi-pembayaran");
    expect(exportCategoryOf("menunggu_verifikasi")).toBe("verifikasi-pembayaran");
    expect(exportCategoryOf("pembayaran_ditolak")).toBe("verifikasi-pembayaran");
    expect(exportCategoryOf("whatever")).toBe("lainnya");
  });

  it("titles resolve per category", () => {
    expect(exportCategoryTitle("verifikasi-akun")).toBe("Verifikasi Akun");
    expect(exportCategoryTitle("verifikasi-pembayaran")).toBe("Verifikasi Pembayaran");
    expect(exportCategoryTitle("lainnya")).toBe("Lainnya");
    expect(exportCategoryTitle("whatever")).toBe("Lainnya");
  });

  it("every endpoint scope belongs to a real category", () => {
    for (const scope of Object.keys(EXPORT_ENDPOINTS)) {
      expect(
        EXPORT_CATEGORIES.some((c) => c.scopes.includes(scope)),
      ).toBe(true);
    }
  });
});
