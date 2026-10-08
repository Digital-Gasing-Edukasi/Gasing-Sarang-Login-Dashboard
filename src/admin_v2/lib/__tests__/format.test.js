import { describe, it, expect } from "vitest";
import {
  formatBirthdate,
  formatCountdown,
  formatDateTime,
  formatSessionDate,
  formatShortDate,
  formatTrainingPeriod,
  formatUpdatedAt,
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

describe("formatBirthdate", () => {
  it("ISO date → D-Mon-YY", () => {
    expect(formatBirthdate({ date: "1998-01-01", formatted: "01 January 1998" })).toBe(
      "1-Jan-98",
    );
    expect(formatBirthdate({ date: "1990-05-15", formatted: "15 May 1990" })).toBe(
      "15-Mei-90",
    );
  });

  it("falls back to the display string, then fallback", () => {
    expect(formatBirthdate({ formatted: "18 November 2025" })).toBe("18-Nov-25");
    expect(formatBirthdate("18 November 2025")).toBe("18-Nov-25");
    expect(formatBirthdate(null)).toBe("—");
    expect(formatBirthdate("nope")).toBe("nope");
  });
});

describe("formatSessionDate", () => {
  it("strips the time and leading zero", () => {
    expect(formatSessionDate("18 November 2025 00:00:00")).toBe("18 Nov 2025");
    expect(formatSessionDate("02 April 2026 00:00:00")).toBe("2 Apr 2026");
    expect(formatSessionDate(null)).toBe("—");
  });
});

describe("formatUpdatedAt", () => {
  it("keeps HH:MM after a comma", () => {
    expect(formatUpdatedAt("23 September 2026 15:06:00")).toBe("23 Sep 2026, 15:06");
    expect(formatUpdatedAt("01 October 2026 19:00:00")).toBe("1 Okt 2026, 19:00");
    expect(formatUpdatedAt(null)).toBe("—");
  });

  it("time only when still today (UTC)", () => {
    const now = new Date(Date.UTC(2026, 8, 23, 20, 0));
    expect(formatUpdatedAt("23 September 2026 15:06:00", now)).toBe("15:06");
    expect(formatUpdatedAt("23 September 2025 15:06:00", now)).toBe(
      "23 Sep 2025, 15:06",
    );
    expect(formatUpdatedAt("22 September 2026 15:06:00", now)).toBe(
      "22 Sep 2026, 15:06",
    );
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
