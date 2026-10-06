import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { DeadlineCell } from "../pages/verifikasi-pembayaran/components/DeadlineCell.jsx";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("DeadlineCell", () => {
  it("counts down while in the future, flips to the red date at zero", async () => {
    const createdAtUnix = Math.floor(Date.now() / 1000) - 24 * 3600 + 61;
    render(<DeadlineCell createdAtUnix={createdAtUnix} />);

    // ~61s left (sync first render, no waiting under fake timers).
    expect(screen.getByText(/00:0\d:\d{2}/)).toBeInTheDocument();

    // Past the deadline → red date, timer stopped.
    await vi.advanceTimersByTimeAsync(62 * 1000);
    const dateEl = screen.getByText(/\d{2} \w{3} \d{4} \d{2}:\d{2}/);
    expect(dateEl.className).toMatch(/text-red-600/);
  });

  it("already-passed deadline renders the red date with no timer", () => {
    render(<DeadlineCell createdAtUnix={Math.floor(Date.now() / 1000) - 25 * 3600} />);

    const dateEl = screen.getByText(/\d{2} \w{3} \d{4} \d{2}:\d{2}/);
    expect(dateEl.className).toMatch(/text-red-600/);
    expect(screen.queryByText(/\d{2}:\d{2}:\d{2}/)).not.toBeInTheDocument();
  });

  it("missing timestamp renders the fallback", () => {
    render(<DeadlineCell createdAtUnix={null} />);

    expect(screen.getByText("—")).toBeInTheDocument();
  });
});
