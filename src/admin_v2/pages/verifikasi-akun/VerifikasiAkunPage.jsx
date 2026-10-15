import { useEffect, useMemo, useState } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react";
import {
  REJECTED_STATUSES,
  VERIFIED_STATUS,
  fetchUsers,
  usersKeys,
} from "../../lib/api/index.js";
import { useDebouncedValue } from "../../hooks/useDebouncedValue.js";
import { Input } from "../../components/ui/input.jsx";
import { toast } from "../../components/ui/use-toast.js";
import { DataTable } from "../../components/index.js";
import { ExportButton } from "../../components/downloads/index.js";
import { Pagination } from "../../components/index.js";
import {
  ApproveDialog,
  RejectDialog,
  TrainingHistoryDialog,
  getVerifikasiColumns,
} from "./components/index.js";

const DEFAULT_LIMIT = 20;
const STATUS = VERIFIED_STATUS.WAITING;

function useUserList(page, limit, keyword) {
  return useQuery({
    queryKey: usersKeys.page(STATUS, page, { limit, keyword }),
    queryFn: () => fetchUsers({ status: STATUS, page, limit, keyword }),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}

export default function VerifikasiAkunPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [keyword, setKeyword] = useState("");
  const [approveUser, setApproveUser] = useState(null);
  const [rejectUser, setRejectUser] = useState(null);
  const [historyUser, setHistoryUser] = useState(null);
  const debouncedKeyword = useDebouncedValue(keyword, 500);

  // New search term → back to first page.
  useEffect(() => {
    setPage(1);
  }, [debouncedKeyword]);

  const { data, isLoading, isError, error, refetch } = useUserList(
    page,
    limit,
    debouncedKeyword,
  );

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

  const rows = data?.data ?? [];
  const meta = data?.meta ?? null;

  return (
    <div className="space-y-4">
      <div className="flex w-full justify-end gap-2 sm:w-auto sm:justify-end">
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
        <ExportButton scope={STATUS} />
      </div>

      <DataTable
        columns={columns}
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
