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
import { Pagination } from "../../components/index.js";
import { DeleteAccountDialog } from "../../components/index.js";
import { TrainingHistoryDialog } from "../../components/index.js";
import { getManajemenColumns } from "./components/index.js";
import { ChangeRoleDialog } from "./components/index.js";
import { PermanentDeleteDialog } from "./components/index.js";
import { SuspendAccountDialog } from "./components/index.js";

const DEFAULT_LIMIT = 20;

const APPROVED_SUBSCRIPTIONS = ["active", "expired"];

const TABS = [
  {
    key: "disetujui",
    title: "Disetujui",
    status: VERIFIED_STATUS.APPROVED,
    subscription: APPROVED_SUBSCRIPTIONS,
  },
  {
    key: "ditolak",
    title: "Ditolak",
    status: VERIFIED_STATUS.REJECTED,
  },
  {
    key: "ditangguhkan",
    title: "Ditangguhkan",
    status: undefined,
    suspended: 1,
  },
  {
    key: "dihapus",
    title: "Baru Dihapus",
    status: undefined,
    confirmed: null,
    suspended: null,
    deletionPending: 1,
    onlyDeletion: true,
    // meta.total counts unfiltered rows — the real number is unknowable.
    showCount: false,
  },
];

// One object drives the list query, the count badge, and the request params.
function listParams(tab, { page, limit, keyword }) {
  return {
    status: tab.status,
    page,
    limit,
    keyword,
    subscription: tab.subscription,
    deletionPending: tab.deletionPending,
    suspended: tab.suspended,
    confirmed: tab.confirmed,
  };
}

function keyParams(tab, { limit, keyword }) {
  return {
    limit,
    keyword,
    subscription: tab.subscription,
    deletionPending: tab.deletionPending,
    suspended: tab.suspended,
    confirmed: tab.confirmed,
  };
}

function TabCountBadge({ tab }) {
  return (
    <CountBadge
      queryKey={usersKeys.page(tab.status, 1, keyParams(tab, { limit: DEFAULT_LIMIT, keyword: "" }))}
      queryFn={() =>
        fetchUsers(listParams(tab, { page: 1, limit: DEFAULT_LIMIT, keyword: "" }))
      }
    />
  );
}

export default function ManajemenAkunPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState(TABS[0].key);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [keyword, setKeyword] = useState("");
  const [historyUser, setHistoryUser] = useState(null);
  const [deleteUser, setDeleteUser] = useState(null);
  const [deletePermanentUser, setDeletePermanentUser] = useState(null);
  const [changeRoleUser, setChangeRoleUser] = useState(null);
  const [suspendUser, setSuspendUser] = useState(null);
  const debouncedKeyword = useDebouncedValue(keyword, 500);
  const current = TABS.find((t) => t.key === tab) ?? TABS[0];

  // New search term → back to first page.
  useEffect(() => {
    setPage(1);
  }, [debouncedKeyword]);

  const params = listParams(current, { page, limit, keyword: debouncedKeyword });
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: usersKeys.page(current.status, page, keyParams(current, { limit, keyword: debouncedKeyword })),
    queryFn: () => fetchUsers(params),
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

  const handleAccountDeleted = (deletedUser) => {
    setDeleteUser(null);
    setPage(1);
    toast({
      title: "Akun dihapus",
      description: deletedUser?.email
        ? `Akun ${deletedUser.email} telah dihapus.`
        : "Akun telah dihapus.",
    });
    queryClient.invalidateQueries({ queryKey: usersKeys.all });
  };

  const handlePermanentDeleted = (deletedUser) => {
    setDeletePermanentUser(null);
    setPage(1);
    toast({
      title: "Akun dihapus permanen",
      description: deletedUser?.email
        ? `Akun ${deletedUser.email} telah dihapus permanen.`
        : "Akun telah dihapus permanen.",
    });
    queryClient.invalidateQueries({ queryKey: usersKeys.all });
  };

  const handleRoleSaved = (savedUser) => {
    setChangeRoleUser(null);
    toast({
      title: "Role diubah",
      description: savedUser?.name
        ? `Role ${savedUser.name} telah diperbarui.`
        : "Role telah diperbarui.",
    });
    queryClient.invalidateQueries({ queryKey: usersKeys.all });
  };

  const handleSuspended = (suspendedAccount) => {
    setSuspendUser(null);
    setPage(1);
    toast({
      title: "Akun ditangguhkan",
      description: suspendedAccount?.name
        ? `Akun ${suspendedAccount.name} telah ditangguhkan.`
        : "Akun telah ditangguhkan.",
    });
    queryClient.invalidateQueries({ queryKey: usersKeys.all });
  };

  const columns = useMemo(
    () =>
      getManajemenColumns({
        onShowHistory: setHistoryUser,
        onChangeRole: setChangeRoleUser,
        onSuspendAccount: setSuspendUser,
        onRestoreAccount: () => {},
        onReverify: () => {},
        onDeleteAccount: setDeleteUser,
        onDeletePermanent: setDeletePermanentUser,
      }),
    [],
  );

  const fetched = data?.data ?? [];
  // The deletion endpoint also returns accounts with no deletion request.
  const rows = current.onlyDeletion ? fetched.filter((u) => u.deletion) : fetched;
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
                {t.showCount !== false && <TabCountBadge tab={t} />}
              </button>
            );
          })}
        </div>

        {/* Every user-API table is searchable — empty keyword is omitted. */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Cari nama, email…"
            aria-label="Cari pengguna"
            className="pl-9"
          />
        </div>
      </div>

      <DataTable
        columns={columns[current.key]}
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
      <DeleteAccountDialog
        user={deleteUser}
        onClose={() => setDeleteUser(null)}
        onDeleted={handleAccountDeleted}
      />
      <PermanentDeleteDialog
        user={deletePermanentUser}
        onClose={() => setDeletePermanentUser(null)}
        onDeleted={handlePermanentDeleted}
      />
      <ChangeRoleDialog
        user={changeRoleUser}
        onClose={() => setChangeRoleUser(null)}
        onSaved={handleRoleSaved}
      />
      <SuspendAccountDialog
        user={suspendUser}
        onClose={() => setSuspendUser(null)}
        onSuspended={handleSuspended}
      />
    </div>
  );
}
