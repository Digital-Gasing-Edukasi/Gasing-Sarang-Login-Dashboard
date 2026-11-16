import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("../lib/api/users.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    fetchUsersCount: vi.fn(),
    fetchUsers: vi.fn(),
  };
});

vi.mock("../lib/api/payments.js", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, fetchManualPayments: vi.fn() };
});

vi.mock("../lib/api/vouchers.js", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, fetchPendingVouchers: vi.fn() };
});

import {
  fetchUsersCount,
  fetchUsers,
} from "../lib/api/users.js";
import { fetchManualPayments } from "../lib/api/payments.js";
import { fetchPendingVouchers } from "../lib/api/vouchers.js";
import DashboardPage from "../pages/dashboard/DashboardPage.jsx";

const TOTALS = { waiting: 12, approved: 34, rejected: 6 };
const VOUCHER_TOTAL = 7;

const SUBSCRIPTION_TOTALS = { active: 50, not_subscribed: 18 };

beforeEach(() => {
  vi.clearAllMocks();
  fetchUsersCount.mockImplementation(async (filter, opts = {}) => {
    if (filter === "approved" && opts.subscription) {
      return SUBSCRIPTION_TOTALS[opts.subscription] ?? 0;
    }
    return TOTALS[filter] ?? 0;
  });
  fetchUsers.mockImplementation(async ({ subscription } = {}) => ({
    data: [],
    meta: { total: SUBSCRIPTION_TOTALS[subscription] ?? 0 },
  }));
  fetchManualPayments.mockResolvedValue({ data: [], meta: { total: 7 } });
  fetchPendingVouchers.mockResolvedValue({ data: [], meta: { total: VOUCHER_TOTAL } });
});

describe("DashboardPage", () => {
  it("renders one card per backend bucket with its meta.total", async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const { container } = render(
      <QueryClientProvider client={client}>
        <DashboardPage />
      </QueryClientProvider>,
    );
    expect(container.querySelectorAll("svg").length).toBeGreaterThanOrEqual(5);

    for (const [label, total] of [
      ["Pending", 12],
      ["Pending Voucher Setup", 7],
      ["Disetujui", 34],
      ["Ditolak", 6],
    ]) {
      expect(await screen.findByText(label)).toBeInTheDocument();
      // Await the count itself: labels render before async totals arrive.
      // ("7" also sits on the pending-payment card.)
      expect((await screen.findAllByText(String(total))).length).toBeGreaterThan(0);
    }

    // 3 status cards (waiting, approved, rejected) + 2 subscription slices.
    // pending_voucher now goes through fetchPendingVouchers, not fetchUsersCount.
    expect(fetchUsersCount).toHaveBeenCalledTimes(5);
    const asked = fetchUsersCount.mock.calls.map((c) => c[0]).sort();
    expect(asked).toEqual([
      "approved",
      "approved",
      "approved",
      "rejected",
      "waiting",
    ]);
    const slices = fetchUsersCount.mock.calls
      .map((c) => c[1]?.subscription)
      .sort();
    expect(slices).toEqual(["active", "not_subscribed", undefined, undefined, undefined]);

    // pending_voucher card uses fetchPendingVouchers.
    expect(fetchPendingVouchers).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, limit: 1 }),
    );
  });

  it("renders Users and Subscription sections with pie + pending card", async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const { container } = render(
      <QueryClientProvider client={client}>
        <DashboardPage />
      </QueryClientProvider>,
    );

    expect(screen.getByRole("heading", { name: "Users" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Subscription" })).toBeInTheDocument();

    // Pie slices + legend with live counts.
    expect(await screen.findByText("Langganan")).toBeInTheDocument();
    expect(await screen.findByText("Aktif")).toBeInTheDocument();
    expect(screen.getByText("50")).toBeInTheDocument();
    expect(screen.getByText("18")).toBeInTheDocument();
    expect(container.querySelector(".recharts-wrapper")).not.toBeNull();

    // Pending-verification payment card ("7" also sits on the voucher card).
    expect(
      await screen.findByText("Pembayaran menunggu verifikasi"),
    ).toBeInTheDocument();
    expect(screen.getAllByText("7").length).toBe(2);
    expect(fetchManualPayments).toHaveBeenCalledWith(
      expect.objectContaining({ state: "receipt_uploaded", page: 1, limit: 1 }),
    );
  });
});
