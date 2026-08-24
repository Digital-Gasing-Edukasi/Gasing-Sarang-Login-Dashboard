import { describe, it, expect, vi, beforeEach } from "vitest";

// Regresi: queueApi.waitJob melempar Error dengan pesan yang SUDAH diterjemahkan
// (translateApiError(job.error)), bukan job.error mentah dari backend.

function mockFetchSequence(bodies) {
  let i = 0;
  return vi.fn().mockImplementation(() => {
    const body = bodies[Math.min(i++, bodies.length - 1)];
    const res = {
      ok: true,
      status: 200,
      headers: { get: () => null },
      json: () => Promise.resolve(body),
    };
    res.clone = () => res; // dedupeFetch memanggil res.clone() sebelum dibaca
    return Promise.resolve(res);
  });
}

describe("queueApi.waitJob — error message ditranslate", () => {
  let queueApi;

  beforeEach(async () => {
    vi.resetModules();
    localStorage.clear();
    sessionStorage.clear();
    ({ queueApi } = await import("../api.js"));
  });

  it("job FAILED dengan error mentah backend → throw Error berisi teks Indonesia (bukan mentah)", async () => {
    global.fetch = mockFetchSequence([
      { status: "FAILED", error: "email already exists" },
    ]);

    await expect(queueApi.waitJob("track-1", { interval: 1 })).rejects.toThrow(
      "Email sudah terdaftar. Gunakan email lain atau masuk."
    );
  });

  it("job FAILED tanpa error message → fallback generik translateApiError, bukan crash", async () => {
    global.fetch = mockFetchSequence([{ status: "FAILED" }]);

    await expect(queueApi.waitJob("track-2", { interval: 1 })).rejects.toThrow(
      "Proses gagal di server."
    );
  });
});
