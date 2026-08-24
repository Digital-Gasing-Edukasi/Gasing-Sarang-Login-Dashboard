import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

afterEach(() => {
  cleanup();
});

// `define` di vite.config.js tidak jalan otomatis di semua path test —
// sediakan fallback biar komponen yang baca konstanta build tidak meledak.
globalThis.__BUILD_DATE__ = globalThis.__BUILD_DATE__ ?? "2026-01-01 00:00";
globalThis.__APP_MODE__ = globalThis.__APP_MODE__ ?? "test";

if (!window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  });
}

if (!window.ResizeObserver) {
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
