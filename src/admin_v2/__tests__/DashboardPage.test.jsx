import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("../lib/api/users.js", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, fetchVerificationStatusCount: vi.fn() };
});

import { fetchVerificationStatusCount } from "../lib/api/users.js";
import DashboardPage from "../pages/dashboard/DashboardPage.jsx";

const TOTALS = { waiting: 12, pending_voucher: 7, approved: 34, rejected: 6 };

beforeEach(() => {
  vi.clearAllMocks();
  fetchVerificationStatusCount.mockImplementation(async (status) => TOTALS[status] ?? 0);
});

describe("DashboardPage", () => {
  it("renders one card per status with its meta.total (fetched with limit=1)", async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const { container } = render(
      <QueryClientProvider client={client}>
        <DashboardPage />
      </QueryClientProvider>,
    );
    expect(container.querySelectorAll("svg").length).toBe(4);

    for (const [label, total] of [
      ["Pending pengguna", 12],
      ["Pending Voucher Setup pengguna", 7],
      ["Disetujui pengguna", 34],
      ["Ditolak pengguna", 6],
    ]) {
      expect(await screen.findByText(label)).toBeInTheDocument();
      expect(await screen.findByText(String(total))).toBeInTheDocument();
    }

    expect(fetchVerificationStatusCount).toHaveBeenCalledTimes(4);
    const asked = fetchVerificationStatusCount.mock.calls.map((c) => c[0]).sort();
    expect(asked).toEqual(["approved", "pending_voucher", "rejected", "waiting"]);
  });
});
