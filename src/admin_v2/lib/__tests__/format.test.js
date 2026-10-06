import { describe, it, expect } from "vitest";
import { formatDateTime, formatShortDate, formatTrainingPeriod } from "../format.js";

describe("formatDateTime", () => {
  it("renders Indonesian datetime", () => {
    // 2026-10-02 13:54 local components — timezone-independent assertion
    // on parts derived from the same Date.
    const d = new Date(2026, 9, 2, 13, 54);
    const out = formatDateTime(d);
    expect(out).toMatch(/^02 Okt 2026 13:54$/);
  });

  it("invalid date → fallback", () => {
    expect(formatDateTime(new Date("nope"))).toBe("—");
  });
});

describe("formatShortDate", () => {
  it("abbreviates the month", () => {
    expect(formatShortDate("06 April 2026 00:00:00")).toBe("06 Apr 2026");
  });
});

describe("formatTrainingPeriod", () => {
  it("month number → full name + year", () => {
    expect(formatTrainingPeriod(2024, 10)).toBe("Oktober 2024");
    expect(formatTrainingPeriod(2024, 13)).toBe("—");
  });
});
