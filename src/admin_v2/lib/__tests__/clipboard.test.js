import { describe, it, expect, vi, afterEach } from "vitest";
import { copyText } from "../clipboard.js";

afterEach(() => {
  vi.restoreAllMocks();
  delete document.execCommand;
});

describe("copyText", () => {
  it("uses navigator.clipboard when available", async () => {
    const writeText = vi.fn(async () => {});
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });

    await expect(copyText("GASIN0QY4")).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith("GASIN0QY4");
  });

  it("falls back to execCommand without clipboard API", async () => {
    Object.defineProperty(navigator, "clipboard", {
      value: undefined,
      configurable: true,
    });
    document.execCommand = vi.fn(() => true);

    await expect(copyText("GASIN0QY4")).resolves.toBe(true);
    expect(document.execCommand).toHaveBeenCalledWith("copy");
  });

  it("false when every path fails", async () => {
    Object.defineProperty(navigator, "clipboard", {
      value: undefined,
      configurable: true,
    });
    document.execCommand = vi.fn(() => {
      throw new Error("denied");
    });

    await expect(copyText("GASIN0QY4")).resolves.toBe(false);
  });
});
