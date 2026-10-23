import { useEffect, useMemo, useState } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { cn } from "../../lib/utils.js";
import {
  REJECTED_STATUSES,
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
  getUnconfirmedColumns,
  getVerifikasiColumns,
} from "./components/index.js";

const DEFAULT_LIMIT = 20;
const STATUS = VERIFIED_STATUS.WAITING;

// `confirmed` defaults to the backend default ("yes"). The email tab scopes
// ONLY on filter[confirmed]=no — no verifiedStatus, deletion, or suspension
// filters.
const TABS = [
  {
    key: "menunggu",
    title: "Menunggu Verifikasi",
    status: STATUS,
    confirmed: "yes",
    exportScope: STATUS,
  },
  {
    key: "email",
    title: "Menunggu Konfirmasi Email",
    status: undefined,
    confirmed: "no",
    omitStatusDefaults: true,
  },
];

function listParams(tab, { page, limit, keyword }) {
  return {
    status: tab.status,
    confirmed: tab.confirmed,
    page,
    limit,
    keyword,
    ...(tab.omitStatusDefaults ? { deletionPending: null, suspended: null } : {}),
  };
}

function keyParams(tab, { limit, keyword }) {
  return {
    limit,
    keyword,
    confirmed: tab.confirmed,
  };
}

function TabCountBadge({ tab }) {
  return (
    <CountBadge
      queryKey={usersKeys.page(
        tab.status,
        1,
        keyParams(tab, { limit: DEFAULT_LIMIT, keyword: "" }),
      )}
      queryFn={() =>
        fetchUsers(
          listParams(tab, { page: 1, limit: DEFAULT_LIMIT, keyword: "" }),
        )
      }
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
  const [historyUser, setHistoryUser] = useState(null);
  const debouncedKeyword = useDebouncedValue(keyword, 500);
  const current = TABS.find((t) => t.key === tab) ?? TABS[0];

  // New search term → back to first page.
  useEffect(() => {
    setPage(1);
  }, [debouncedKeyword]);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: usersKeys.page(
      current.status,
      page,
      keyParams(current, { limit, keyword: debouncedKeyword }),
    ),
    queryFn: () =>
      fetchUsers(listParams(current, { page, limit, keyword: debouncedKeyword })),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });

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
    // The account lands on the manajemen-akun Ditolak tab.
    queryClient.invalidateQueries({
      queryKey: usersKeys.byStatus(REJECTED_STATUSES),
    });
  };

  const handleApproved = (approvedUser) => {
    setApproveUser(null);
    setPage(1);
    toast({
      title: "Akun disetujui",
      description: approvedUser?.name
        ? `${approvedUser.name} telah disetujui.`
        : "Akun telah disetujui.",
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
        onShowHistory: setHistoryUser,
      }),
    [],
  );
  const unconfirmedColumns = useMemo(() => getUnconfirmedColumns(), []);

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
                <TabCountBadge tab={t} />
              </button>
            );
          })}
        </div>

        {/* Every user-API table is searchable — empty keyword is omitted. */}
        <div className="flex w-full gap-2 sm:w-auto">
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
          {current.exportScope && <ExportButton scope={current.exportScope} />}
        </div>
      </div>

      <DataTable
        columns={current.key === "email" ? unconfirmedColumns : columns}
        rows={rows}
        keyOf={(u) => u.id}
        loading={isLoading}
        error={isError ? error : null}
        onRetry={() => refetch()}
        emptyText={
          debouncedKeyword
            ? `Tidak ada hasil untuk "${debouncedKeyword}".`
            : "Tidak ada data."
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

      <ApproveDialog
        user={approveUser}
        onClose={() => setApproveUser(null)}
        onApproved={handleApproved}
      />
      <TrainingHistoryDialog
        user={historyUser}
        onClose={() => setHistoryUser(null)}
      />
      <RejectDialog
        user={rejectUser}
        onClose={() => setRejectUser(null)}
        onRejected={handleRejected}
      />
    </div>
  );
}
