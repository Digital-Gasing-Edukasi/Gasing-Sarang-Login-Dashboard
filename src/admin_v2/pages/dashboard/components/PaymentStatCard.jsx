import { useQuery } from "@tanstack/react-query";
import { Hourglass } from "lucide-react";
import { cn } from "../../../lib/utils.js";
import {
  fetchManualPayments,
  manualPaymentKeys,
} from "../../../lib/api/index.js";

// Big-number card for payments awaiting verification (meta.total).
export function PaymentStatCard() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: [
      ...manualPaymentKeys.page("receipt_uploaded", 1, { limit: 1 }),
      "count",
    ],
    queryFn: () =>
      fetchManualPayments({ state: "receipt_uploaded", page: 1, limit: 1 }),
    staleTime: 60_000,
    select: (res) => res?.meta?.total ?? 0,
  });

  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-xl p-5 text-white shadow-sm",
        "bg-gradient-to-br from-orange-500 to-orange-600",
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <p className="mt-1 text-sm text-white/85">Pembayaran menunggu verifikasi</p>
        <span className="self-start rounded-lg bg-white/20 p-2.5">
          <Hourglass size={22} />
        </span>
      </div>
      <div>
        {isLoading ? (
          <p className="text-3xl font-bold text-white/70">…</p>
        ) : isError ? (
          <button
            type="button"
            onClick={() => refetch()}
            className="self-start text-sm font-medium text-white underline hover:no-underline"
          >
            Gagal memuat, coba lagi
          </button>
        ) : (
          <p className="text-3xl font-bold tabular-nums">{data ?? 0}</p>
        )}
      </div>
    </div>
  );
}
