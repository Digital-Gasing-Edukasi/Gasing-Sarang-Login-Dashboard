import { useEffect, useMemo, useState } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "../../lib/utils.js";
import {
  VERIFIED_STATUS,
  fetchManualPayments,
  fetchVerificationUsers,
  manualPaymentKeys,
  verificationUsersKeys,
} from "../../lib/api/index.js";
import { CountBadge, DataTable } from "../../components/index.js";
import { toast } from "../../components/ui/use-toast.js";
import { Search } from "lucide-react";
import { Input } from "../../components/ui/input.jsx";
import { useDebouncedValue } from "../../hooks/useDebouncedValue.js";
import { Pagination } from "../../components/index.js";
import { TrainingHistoryDialog } from "../../components/index.js";
import {
  DeleteAccountDialog,
  PaymentConfirmDialog,
  PaymentRejectDialog,
  getPembayaranColumns,
} from "./components/index.js";

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

function useUnsubscribed(page, limit, keyword, enabled) {
  return useQuery({
    enabled,
    queryKey: verificationUsersKeys.page(VERIFIED_STATUS.APPROVED, page, {
      limit,
      subscription: "not_subscribed",
      keyword,
    }),
    queryFn: () =>
      fetchVerificationUsers({
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

  const belum = useUnsubscribed(page, limit, debouncedKeyword, tab === "belum");
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
      queryKey: verificationUsersKeys.byStatus(VERIFIED_STATUS.APPROVED),
    });
    queryClient.invalidateQueries({
      queryKey: manualPaymentKeys.byState("receipt_uploaded"),
    });
  };

  const handleAccountDeleted = (deletedPayment) => {
    setDeletePayment(null);
    setPage(1);
    toast({
      title: "Akun dihapus",
      description: deletedPayment?.user?.email
        ? `Akun ${deletedPayment.user.email} telah dihapus.`
        : "Akun telah dihapus.",
    });
    queryClient.invalidateQueries({
      queryKey: verificationUsersKeys.byStatus(VERIFIED_STATUS.APPROVED),
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
        onApprovePayment: () => {},
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

        {tab === "belum" && (
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Cari nama, email, username…"
              aria-label="Cari pengguna"
              className="pl-9"
            />
          </div>
        )}
      </div>

      <DataTable
        columns={columns[tab]}
        rows={rows}
        keyOf={keyOf}
        loading={isLoading}
        error={isError ? error : null}
        onRetry={() => refetch()}
        emptyText={
          debouncedKeyword && tab === "belum"
            ? `Tidak ada hasil untuk "${debouncedKeyword}".`
            : "Tidak ada data pada tab ini."
        }
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
        payment={deletePayment}
        onClose={() => setDeletePayment(null)}
        onDeleted={handleAccountDeleted}
      />
    </div>
  );
}
