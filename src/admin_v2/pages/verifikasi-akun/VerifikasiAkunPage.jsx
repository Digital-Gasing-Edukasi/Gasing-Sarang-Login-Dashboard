import { useEffect, useMemo, useState } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { cn } from "../../lib/utils.js";
import {
  VERIFIED_STATUS,
  fetchUsers,
  usersKeys,
} from "../../lib/api/index.js";
import { useDebouncedValue } from "../../hooks/useDebouncedValue.js";
import { Input } from "../../components/ui/input.jsx";
import { toast } from "../../components/ui/use-toast.js";
import { CountBadge, DataTable } from "../../components/index.js";
import { ExportButton } from "../../components/downloads/index.js";
import { Pagination } from "../../components/index.js";
import {
  ApproveDialog,
  RejectDialog,
  TrainingHistoryDialog,
  VoucherConfirmDialog,
  getVerifikasiColumns,
} from "./components/index.js";

const DEFAULT_LIMIT = 20;

const TABS = [
  { key: "pending", title: "Pending", status: VERIFIED_STATUS.WAITING },
  {
    key: "voucher",
    title: "Pending Voucher Setup",
    status: VERIFIED_STATUS.PENDING_VOUCHER,
  },
];

function useUserList(status, page, limit, keyword) {
  return useQuery({
    queryKey: usersKeys.page(status, page, { limit, keyword }),
    queryFn: () => fetchUsers({ status, page, limit, keyword }),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}

function TabCountBadge({ status }) {
  return (
    <CountBadge
      queryKey={usersKeys.page(status, 1, { limit: DEFAULT_LIMIT })}
      queryFn={() => fetchUsers({ status, page: 1, limit: DEFAULT_LIMIT })}
    />
  );
}

export default function VerifikasiAkunPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState(TABS[0].key);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [keyword, setKeyword] = useState("");
  const [approveUser, setApproveUser] = useState(null);
  const [rejectUser, setRejectUser] = useState(null);
  const [voucherUser, setVoucherUser] = useState(null);
  const [historyUser, setHistoryUser] = useState(null);
  const debouncedKeyword = useDebouncedValue(keyword, 500);
  const current = TABS.find((t) => t.key === tab) ?? TABS[0];

  // New search term → back to first page.
  useEffect(() => {
    setPage(1);
  }, [debouncedKeyword]);

  const { data, isLoading, isError, error, refetch } = useUserList(
    current.status,
    page,
    limit,
    debouncedKeyword,
  );

  const handleTab = (key) => {
    setTab(key);
    setPage(1);
  };

  const handleLimit = (next) => {
    setLimit(next);
    setPage(1);
  };

  const handleRejected = (rejectedUser, { permanent }) => {
    setRejectUser(null);
    setPage(1);
    toast({
      title: "Akun ditolak",
      description: rejectedUser?.name
        ? permanent
          ? `${rejectedUser.name} ditolak permanen.`
          : `${rejectedUser.name} diminta untuk revisi data.`
        : "Akun telah diproses.",
    });
    queryClient.invalidateQueries({
      queryKey: usersKeys.byStatus(VERIFIED_STATUS.WAITING),
    });
  };

  const handleVoucherConfirmed = (confirmedUser) => {
    setVoucherUser(null);
    setPage(1);
    toast({
      title: "Voucher dikonfirmasi",
      description: confirmedUser?.name
        ? `Voucher ${confirmedUser.name} telah dikonfirmasi.`
        : "Voucher telah dikonfirmasi.",
    });
    queryClient.invalidateQueries({
      queryKey: usersKeys.byStatus(VERIFIED_STATUS.PENDING_VOUCHER),
    });
  };

  const handleApproved = (approvedUser) => {
    setApproveUser(null);
    setTab("voucher");
    setPage(1);
    toast({
      title: "Akun disetujui",
      description: approvedUser?.name
        ? `${approvedUser.name} kini menunggu setup voucher.`
        : "Akun kini menunggu setup voucher.",
    });
    queryClient.invalidateQueries({
      queryKey: usersKeys.byStatus(VERIFIED_STATUS.WAITING),
    });
    queryClient.invalidateQueries({
      queryKey: usersKeys.byStatus(VERIFIED_STATUS.PENDING_VOUCHER),
    });
  };

  const columns = useMemo(
    () =>
      getVerifikasiColumns({
        onApprove: setApproveUser,
        onReject: setRejectUser,
        onConfirmVoucher: setVoucherUser,
        onShowHistory: setHistoryUser,
      }),
    [],
  );

  const rows = data?.data ?? [];
  const meta = data?.meta ?? null;

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
                <TabCountBadge status={t.status} />
              </button>
            );
          })}
        </div>

        <div className="flex w-full gap-2 sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Cari nama, email…"
              aria-label="Cari pengguna"
              className="pl-9"
            />
          </div>
          <ExportButton scope={current.status} />
        </div>
      </div>

      <DataTable
        columns={columns[tab]}
        rows={rows}
        keyOf={(u) => u.id}
        loading={isLoading}
        error={isError ? error : null}
        onRetry={() => refetch()}
        emptyText={
          debouncedKeyword
            ? `Tidak ada hasil untuk "${debouncedKeyword}".`
            : "Tidak ada data pada tab ini."
        }
      />

      <ApproveDialog
        user={approveUser}
        onClose={() => setApproveUser(null)}
        onApproved={handleApproved}
      />
      <TrainingHistoryDialog
        user={historyUser}
        onClose={() => setHistoryUser(null)}
      />
      <VoucherConfirmDialog
        user={voucherUser}
        onClose={() => setVoucherUser(null)}
        onConfirmed={handleVoucherConfirmed}
      />
      <RejectDialog
        user={rejectUser}
        onClose={() => setRejectUser(null)}
        onRejected={handleRejected}
      />

      {!isLoading && !isError && (
        <Pagination
          meta={meta}
          onPage={(p) => setPage(p)}
          limit={limit}
          onLimitChange={handleLimit}
        />
      )}
    </div>
  );
}
