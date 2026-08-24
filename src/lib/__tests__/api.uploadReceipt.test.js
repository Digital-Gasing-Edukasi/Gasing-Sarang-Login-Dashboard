import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Unit test langsung ke request layer (fetch) — bukan mock @/lib/api — supaya
// betul-betul verifikasi body JSON yang dikirim subscriptionApi.uploadReceipt.
// Fix: uploadReceipt(paymentId, fileId, extra = {}) → body { fileId, ...extra }.

function mockFetchOnce(jsonBody = {}) {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    headers: { get: () => null },
    json: () => Promise.resolve(jsonBody),
  });
}

describe("subscriptionApi.uploadReceipt — request body (bank origin fields)", () => {
  let subscriptionApi;

  beforeEach(async () => {
    vi.resetModules();
    localStorage.clear();
    sessionStorage.clear();
    ({ subscriptionApi } = await import("../api.js"));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("mengirim fileId + senderName/senderBank/transferDate saat extra diisi", async () => {
    global.fetch = mockFetchOnce({ id: "payment-1" });

    await subscriptionApi.uploadReceipt("payment-1", "file-99", {
      senderName: "Budi Santoso",
      senderBank: "BCA",
      transferDate: "2026-08-19",
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toContain("/subscription/payments/payment-1/upload-receipt");
    expect(options.method).toBe("POST");
    const body = JSON.parse(options.body);
    expect(body).toEqual({
      fileId: "file-99",
      senderName: "Budi Santoso",
      senderBank: "BCA",
      transferDate: "2026-08-19",
    });
  });

  it("back-compat: dipanggil tanpa extra (2 arg lama) → body cuma { fileId }, tanpa key tambahan / undefined", async () => {
    global.fetch = mockFetchOnce({ id: "payment-2" });

    await subscriptionApi.uploadReceipt("payment-2", "file-1");

    const [, options] = global.fetch.mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body).toEqual({ fileId: "file-1" });
    expect(Object.keys(body)).toEqual(["fileId"]);
    expect(body.senderName).toBeUndefined();
    expect(body.senderBank).toBeUndefined();
    expect(body.transferDate).toBeUndefined();
  });
});
