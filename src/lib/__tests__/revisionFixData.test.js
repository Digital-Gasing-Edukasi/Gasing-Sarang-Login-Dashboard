import { describe, it, expect } from "vitest";
import { buildRevisionFixData } from "../revisionFixData";

const FIELDS = [
  {
    field: "tanggalLahir",
    title: "Tanggal Lahir Tidak Sesuai",
    description: "Pastikan tanggal lahir yang kamu daftarkan sesuai data diri kamu.",
  },
];

const PROFILE = {
  id: "u-1",
  name: "Testing Akun Baru",
  username: "testingdulu",
  email: "getex22067@aganseo.com",
  birthdate: "2000-01-15",
  schoolName: "SMA 1",
  regionId: "r-2",
};

describe("buildRevisionFixData", () => {
  it("memetakan fields → invalid + notes berisi description", () => {
    const out = buildRevisionFixData(PROFILE, FIELDS);
    expect(out.invalid).toEqual(["tanggalLahir"]);
    expect(out.notes).toEqual({
      tanggalLahir: "Pastikan tanggal lahir yang kamu daftarkan sesuai data diri kamu.",
    });
  });

  it("membawa identity + nilai prefill + uid dari id profil", () => {
    const out = buildRevisionFixData(PROFILE, FIELDS);
    expect(out.uid).toBe("u-1");
    expect(out.name).toBe("Testing Akun Baru");
    expect(out.email).toBe("getex22067@aganseo.com");
    expect(out.birthdate).toBe("2000-01-15");
    expect(out.schoolName).toBe("SMA 1");
    expect(out.regionId).toBe("r-2");
  });

  it("unwrap profil { user } / { data } + fallback title bila description kosong", () => {
    const out = buildRevisionFixData(
      { user: { ...PROFILE, id: undefined, uid: "u-9" } },
      [{ field: "lokasi", title: "Lokasi Salah", description: "" }]
    );
    expect(out.uid).toBe("u-9");
    expect(out.notes).toEqual({ lokasi: "Lokasi Salah" });
  });

  it("fields kosong / profil kosong → invalid kosong, string kosong (tidak throw)", () => {
    const out = buildRevisionFixData(null, null);
    expect(out.invalid).toEqual([]);
    expect(out.notes).toEqual({});
    expect(out.name).toBe("");
    expect(out.uid).toBeNull();
  });

  it("profil asli: field datar firstTrainingYear/Month diutamakan, sesi null", () => {
    // Bentuk /profile/me asli: flat fields terisi, firstTrainingSession null.
    const out = buildRevisionFixData(
      {
        id: "01a0c9d8",
        firstTrainingYear: 2026,
        firstTrainingMonth: 3,
        firstTrainingRegionId: "019e6cb1-f181",
        firstTrainingSession: null,
        firstTrainingSessionId: null,
      },
      FIELDS
    );
    expect(out.firstTrainingYear).toBe(2026);
    expect(out.firstTrainingMonth).toBe(3);
    expect(out.firstTrainingRegionId).toBe("019e6cb1-f181");
    expect(out.lastTrainingSessionId).toBe("");
  });

  it("kosakata backend ala normalizeRevise: region objek, birthdate objek, firstTrainingSession", () => {
    // startDate.unix 1785137752 → 27 Juli 2026 (month 1-based = 7).
    const out = buildRevisionFixData(
      {
        id: "u-2",
        region: { id: "r-5", parentId: "p-1" },
        birthdate: { date: "1999-05-20" },
        firstTrainingSession: { id: "s-9", startDate: { unix: 1785137752 } },
      },
      FIELDS
    );
    expect(out.regionId).toBe("r-5");
    expect(out.provinceId).toBe("p-1");
    expect(out.birthdate).toBe("1999-05-20");
    expect(out.firstTrainingYear).toBe(2026);
    expect(out.firstTrainingMonth).toBe(7);
    expect(out.lastTrainingSessionId).toBe("s-9");
  });
});
