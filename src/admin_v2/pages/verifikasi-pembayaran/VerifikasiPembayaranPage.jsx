import { useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { cn } from "../../lib/utils.js";
import {
  VERIFIED_STATUS,
  fetchManualPayments,
  fetchVerificationUsers,
  manualPaymentKeys,
  verificationUsersKeys,
} from "../../lib/api/index.js";
import { CountBadge, DataTable } from "../../components/index.js";
import { Pagination } from "../../components/index.js";
import { TrainingHistoryDialog } from "../../components/index.js";
import { getPembayaranColumns } from "./components/index.js";

const DEFAULT_LIMIT = 20;

const TABS = [
  { key: "belum", title: "Belum Langganan" },
  { key: "verifikasi", title: "Menunggu Verifikasi" },
  { key: "ditolak", title: "Pembayaran Ditolak" },
];

function TabCountBadge({ tabKey }) {
  if (tabKey === "belum") {
    return (
      <CountBadge
        queryKey={verificationUsersKeys.page(VERIFIED_STATUS.APPROVED, 1, {
          limit: DEFAULT_LIMIT,
          subscription: "not_subscribed",
        })}
        queryFn={() =>
          fetchVerificationUsers({
            status: VERIFIED_STATUS.APPROVED,
            page: 1,
            limit: DEFAULT_LIMIT,
            subscription: "not_subscribed",
          })
        }
      />
    );
  }
  const state = tabKey === "verifikasi" ? "receipt_uploaded" : "rejected";
  return (
    <CountBadge
      queryKey={manualPaymentKeys.page(state, 1, { limit: DEFAULT_LIMIT })}
      queryFn={() => fetchManualPayments({ state, page: 1, limit: DEFAULT_LIMIT })}
    />
  );
}

function useUnsubscribed(page, limit, enabled) {
  return useQuery({
    enabled,
    queryKey: verificationUsersKeys.page(VERIFIED_STATUS.APPROVED, page, {
      limit,
      subscription: "not_subscribed",
    }),
    queryFn: () =>
      fetchVerificationUsers({
        status: VERIFIED_STATUS.APPROVED,
        page,
        limit,
        subscription: "not_subscribed",
      }),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}

function useManualList(state, page, limit, enabled) {
  return useQuery({
    enabled,
    queryKey: manualPaymentKeys.page(state, page, { limit }),
    queryFn: () => fetchManualPayments({ state, page, limit }),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}

export default function VerifikasiPembayaranPage() {
  const [tab, setTab] = useState(TABS[0].key);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [historyUser, setHistoryUser] = useState(null);

  const belum = useUnsubscribed(page, limit, tab === "belum");
  const verifikasi = useManualList(
    "receipt_uploaded",
    page,
    limit,
    tab === "verifikasi",
  );
  const ditolak = useManualList(
    "rejected",
    page,
    limit,
    tab === "ditolak",
  );

  const current =
    tab === "belum" ? belum : tab === "verifikasi" ? verifikasi : ditolak;
  const { data, isLoading, isError, error, refetch } = current;

  const handleTab = (key) => {
    setTab(key);
    setPage(1);
  };

  const handleLimit = (next) => {
    setLimit(next);
    setPage(1);
  };

  const columns = useMemo(
    () =>
      getPembayaranColumns({
        onShowHistory: setHistoryUser,
        // Approve/delete payment flows come later — no-ops for now.
        onApprovePayment: () => {},
        onDeleteAccount: () => {},
      }),
    [],
  );

  const rows = data?.data ?? [];
  const meta = data?.meta ?? null;
  const keyOf = (row) =>
    row.id ?? `${row.user?.id ?? row.userId ?? ""}-${row.orderId ?? ""}`;

  return (
    <div className="space-y-4">
      <div className="flex gap-1 border-b">
        {TABS.map((t) => {
          const isActive = t.key === tab;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => handleTab(t.key)}
              className={cn(
                "flex items-center border-b-2 px-4 py-2 text-sm transition-colors",
                isActive
                  ? "border-primary font-semibold text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {t.title}
              <TabCountBadge tabKey={t.key} />
            </button>
          );
        })}
      </div>

      <DataTable
        columns={columns[tab]}
        rows={rows}
        keyOf={keyOf}
        loading={isLoading}
        error={isError ? error : null}
        onRetry={() => refetch()}
        emptyText="Tidak ada data pada tab ini."
      />

      {!isLoading && !isError && (
        <Pagination
          meta={meta}
          onPage={(p) => setPage(p)}
          limit={limit}
          onLimitChange={handleLimit}
        />
      )}

      <TrainingHistoryDialog
        user={historyUser}
        onClose={() => setHistoryUser(null)}
      />
    </div>
  );
}
