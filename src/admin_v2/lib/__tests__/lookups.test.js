import { describe, it, expect } from "vitest";
import { ROLE_META_BY_ID, getRoleMeta } from "../roles.js";
import { getVerifiedStatusMeta, UNKNOWN_STATUS_META } from "../verificationStatus.js";

describe("getRoleMeta (by discourse group id)", () => {
  it("resolves all four roles with icon + color", () => {
    expect(getRoleMeta(49).fullName).toBe("Guru");
    expect(getRoleMeta(75).fullName).toBe("Trainer Aula");
    expect(getRoleMeta(48).fullName).toBe("Trainer Kelas");
    expect(getRoleMeta(46).fullName).toBe("Trainer Utama");
    for (const meta of Object.values(ROLE_META_BY_ID)) {
      expect(meta.Icon).toBeTruthy();
      expect(meta.color).toMatch(/^#[0-9A-F]{6}$/i);
    }
  });

  it("unknown / missing id → null", () => {
    expect(getRoleMeta(999)).toBeNull();
    expect(getRoleMeta(null)).toBeNull();
    expect(getRoleMeta(undefined)).toBeNull();
  });
});

describe("getVerifiedStatusMeta", () => {
  it("labels every known status", () => {
    expect(getVerifiedStatusMeta(0).label).toBe("Pending");
    expect(getVerifiedStatusMeta(1).label).toBe("Disetujui");
    expect(getVerifiedStatusMeta(2).label).toBe("Ditolak - Registrasi Ulang");
    expect(getVerifiedStatusMeta(3).label).toBe("Pending Voucher Setup");
    expect(getVerifiedStatusMeta(-1).label).toBe("Ditolak - Permanen");
  });

  it("unknown status → gray fallback", () => {
    expect(getVerifiedStatusMeta(42)).toBe(UNKNOWN_STATUS_META);
  });
});
