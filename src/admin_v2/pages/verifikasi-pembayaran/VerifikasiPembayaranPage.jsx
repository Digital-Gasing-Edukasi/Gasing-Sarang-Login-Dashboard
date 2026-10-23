import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { ExportButton } from "../../components/downloads/index.js";
import { CountBadge, DataTable, DeleteAccountDialog, Pagination, TrainingHistoryDialog } from "../../components/index.js";
import { toast } from "../../components/ui/use-toast.js";
import { useDebouncedValue } from "../../hooks/useDebouncedValue.js";
import {
  VERIFIED_STATUS,
  fetchManualPayments,
  fetchUsers,
  manualPaymentKeys,
  pendingVouchersKeys,
  usersKeys,
} from "../../lib/api/index.js";
import { cn } from "../../lib/utils.js";
import {
  PaymentConfirmDialog,
  PaymentRejectDialog,
  getPembayaranColumns,
} from "./components/index.js";

const DEFAULT_LIMIT = 20;

const TABS = [
  { key: "verifikasi", title: "Menunggu Verifikasi", exportScope: "menunggu_verifikasi" },
  { key: "ditolak", title: "Pembayaran Ditolak", exportScope: "pembayaran_ditolak" },
];

function TabCountBadge({ tabKey }) {
  const state = tabKey === "verifikasi" ? "receipt_uploaded" : "rejected";
  return (
    <CountBadge
      queryKey={manualPaymentKeys.page(state, 1, { limit: DEFAULT_LIMIT })}
      queryFn={() => fetchManualPayments({ state, page: 1, limit: DEFAULT_LIMIT })}
    />
  );
}

function useUnsubscribed(page, limit, keyword, enabled) {
  return useQuery({
    enabled,
    queryKey: usersKeys.page(VERIFIED_STATUS.APPROVED, page, {
      limit,
      subscription: "not_subscribed",
      keyword,
    }),
    queryFn: () =>
      fetchUsers({
        status: VERIFIED_STATUS.APPROVED,
        page,
        limit,
        subscription: "not_subscribed",
        keyword,
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
  const [keyword, setKeyword] = useState("");
  const debouncedKeyword = useDebouncedValue(keyword, 500);
  const [payment, setPayment] = useState(null);
  const [rejectPayment, setRejectPayment] = useState(null);
  const [deletePayment, setDeletePayment] = useState(null);
  const queryClient = useQueryClient();

  // New search term → back to first page.
  useEffect(() => {
    setPage(1);
  }, [debouncedKeyword]);

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
    tab === "verifikasi" ? verifikasi : ditolak;
  const { data, isLoading, isError, error, refetch } = current;

  const handleTab = (key) => {
    setTab(key);
    setPage(1);
  };

  const handleLimit = (next) => {
    setLimit(next);
    setPage(1);
  };

  const handlePaymentApproved = (approvedPayment) => {
    setPayment(null);
    setPage(1);
    toast({
      title: "Pembayaran disetujui",
      description: approvedPayment?.user?.email
        ? `Pembayaran ${approvedPayment.user.email} telah disetujui.`
        : "Pembayaran telah disetujui.",
    });
    queryClient.invalidateQueries({
      queryKey: usersKeys.byStatus(VERIFIED_STATUS.APPROVED),
    });
    queryClient.invalidateQueries({
      queryKey: manualPaymentKeys.byState("receipt_uploaded"),
    });
    // An approved payment mints vouchers — refresh the pending list too.
    queryClient.invalidateQueries({
      queryKey: pendingVouchersKeys.all,
    });
  };

  const handleAccountDeleted = (deletedUser) => {
    setDeletePayment(null);
    setPage(1);
    toast({
      title: "Akun dihapus",
      description: deletedUser?.email
        ? `Akun ${deletedUser.email} telah dihapus.`
        : "Akun telah dihapus.",
    });
    queryClient.invalidateQueries({
      queryKey: usersKeys.byStatus(VERIFIED_STATUS.APPROVED),
    });
    queryClient.invalidateQueries({
      queryKey: manualPaymentKeys.byState("receipt_uploaded"),
    });
    queryClient.invalidateQueries({
      queryKey: manualPaymentKeys.byState("rejected"),
    });
  };

  const handlePaymentRejected = (rejectedPayment) => {
    setRejectPayment(null);
    setPage(1);
    toast({
      title: "Pembayaran ditolak",
      description: rejectedPayment?.user?.email
        ? `Pembayaran ${rejectedPayment.user.email} telah ditolak.`
        : "Pembayaran telah ditolak.",
    });
    queryClient.invalidateQueries({
      queryKey: manualPaymentKeys.byState("receipt_uploaded"),
    });
    queryClient.invalidateQueries({
      queryKey: manualPaymentKeys.byState("rejected"),
    });
  };

  const columns = useMemo(
    () =>
      getPembayaranColumns({
        onShowHistory: setHistoryUser,
        onConfirmPayment: setPayment,
        // Approve/delete payment flows come later — no-ops for now.
        onApprovePayment: () => { },
        onDeleteAccount: setDeletePayment,
      }),
    [],
  );

  const rows = data?.data ?? [];
  const meta = data?.meta ?? null;
  const keyOf = (row) =>
    row.id ?? `${row.user?.id ?? row.userId ?? ""}-${row.orderId ?? ""}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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

        <div className="flex w-full gap-2 sm:w-auto">
          <ExportButton scope={TABS.find((t) => t.key === tab)?.exportScope} />
        </div>
      </div>

      <DataTable
        columns={columns[tab]}
        rows={rows}
        keyOf={keyOf}
        loading={isLoading}
        error={isError ? error : null}
        onRetry={() => refetch()}
        emptyText={"Tidak ada data pada tab ini."}
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
      <PaymentConfirmDialog
        payment={payment}
        onApproved={handlePaymentApproved}
        onClose={() => setPayment(null)}
        onReject={(p) => {
          setPayment(null);
          setRejectPayment(p);
        }}
      />
      <PaymentRejectDialog
        payment={rejectPayment}
        onClose={() => setRejectPayment(null)}
        onRejected={handlePaymentRejected}
      />
      <DeleteAccountDialog
        user={deletePayment?.user}
        onClose={() => setDeletePayment(null)}
        onDeleted={handleAccountDeleted}
      />
    </div>
  );
}
