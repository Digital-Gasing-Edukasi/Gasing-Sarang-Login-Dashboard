import { describe, it, expect } from "vitest";
import { isPaymentGraceActive, dateFieldMs } from "../loginGate";

// Bentuk waktu BE asli (objek { unix, utc, local }) — dulu di-new Date()
// langsung → NaN → grace selalu false.

const objDate = (unix) => ({
  unix,
  utc: {
    raw: new Date(unix * 1000).toISOString().replace("T", "T"),
    iso: "2026-09-22 17:52:28",
    formatted: "22 September 2026 17:52:28",
  },
  local: {
    raw: new Date(unix * 1000).toISOString(),
    iso: "2026-09-23 00:52:28",
    formatted: "23 September 2026 00:52:28",
  },
});

const nowUnix = () => Math.floor(Date.now() / 1000);

describe("dateFieldMs", () => {
  it("objek { unix } → epoch ms", () => {
    expect(dateFieldMs(objDate(1790099548))).toBe(1790099548000);
  });

  it("objek tanpa unix → fallback utc.raw", () => {
    expect(dateFieldMs({ utc: { raw: "2026-09-22T17:52:28.494Z" } })).toBe(
      new Date("2026-09-22T17:52:28.494Z").getTime()
    );
  });

  it("string 'YYYY-MM-DD HH:mm:ss' + ISO + epoch + Date tetap didukung", () => {
    expect(dateFieldMs("2026-09-22 17:52:28")).toBe(
      new Date("2026-09-22T17:52:28").getTime()
    );
    expect(dateFieldMs(1790099548)).toBe(1790099548000);
    expect(dateFieldMs(1790099548000)).toBe(1790099548000);
    const d = new Date();
    expect(dateFieldMs(d)).toBe(d.getTime());
  });

  it("null / objek kosong / string sampah → null (fail-safe)", () => {
    expect(dateFieldMs(null)).toBeNull();
    expect(dateFieldMs({})).toBeNull();
    expect(dateFieldMs("bukan-tanggal")).toBeNull();
  });
});

describe("isPaymentGraceActive (bentuk objek BE)", () => {
  it("pending + createdAt objek <24 jam → true", () => {
    expect(
      isPaymentGraceActive({
        status: "receipt_uploaded",
        createdAt: objDate(nowUnix() - 3600),
      })
    ).toBe(true);
  });

  it("pending + createdAt objek >24 jam → false", () => {
    expect(
      isPaymentGraceActive({
        status: "pending",
        createdAt: objDate(nowUnix() - 48 * 3600),
      })
    ).toBe(false);
  });

  it("status paid → false (bukan pending)", () => {
    expect(
      isPaymentGraceActive({
        status: "paid",
        createdAt: objDate(nowUnix() - 3600),
      })
    ).toBe(false);
  });

  it("tanpa timestamp → false", () => {
    expect(isPaymentGraceActive({ status: "pending" })).toBe(false);
  });
});
