import { describe, it, expect } from "vitest";
import {
  formatCountdown,
  formatDateTime,
  formatShortDate,
  formatTrainingPeriod,
} from "../format.js";

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

describe("formatCountdown", () => {
  it("renders HH:MM:SS", () => {
    expect(formatCountdown(3661000)).toBe("01:01:01");
    expect(formatCountdown(59000)).toBe("00:00:59");
    expect(formatCountdown(90061000)).toBe("25:01:01");
  });

  it("never goes below zero", () => {
    expect(formatCountdown(0)).toBe("00:00:00");
    expect(formatCountdown(-5000)).toBe("00:00:00");
  });
});
