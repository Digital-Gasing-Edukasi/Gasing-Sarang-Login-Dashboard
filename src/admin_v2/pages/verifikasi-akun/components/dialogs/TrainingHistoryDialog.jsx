import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../../../components/ui/dialog.jsx";
import { DataTable } from "../../../../components/DataTable.jsx";
import { Pagination } from "../../../../components/Pagination.jsx";
import { OverflowText } from "../../../../components/OverflowText.jsx";
import { formatShortDate } from "../../../../lib/format.js";
import {
  fetchTrainingHistory,
  trainingHistoryKeys,
} from "../../../../lib/api/index.js";

const HISTORY_LIMIT = 100;

const HISTORY_COLUMNS = [
  {
    key: "session",
    header: "Nama Pelatihan",
    wrap: true,
    render: (s) => (
      <OverflowText value={s.name} className="text-sm text-foreground" />
    ),
  },
  {
    key: "region",
    header: "Daerah Pelatihan",
    wrap: true,
    render: (s) => (
      <OverflowText
        value={s.region?.full_name || s.region?.name}
        className="text-sm text-foreground"
      />
    ),
  },
  {
    key: "start",
    header: "Tgl. Mulai",
    render: (s) => (
      <span className="whitespace-nowrap text-sm text-foreground">
        {formatShortDate(s.startDate?.utc?.formatted)}
      </span>
    ),
  },
];

export function TrainingHistoryDialog({ user, onClose }) {
  const open = !!user;
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [user?.id]);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: trainingHistoryKeys.page(user?.id, page, { limit: HISTORY_LIMIT }),
    queryFn: () =>
      fetchTrainingHistory({ userId: user.id, page, limit: HISTORY_LIMIT }),
    enabled: open && !!user?.id,
    staleTime: 30_000,
  });

  const rows = data?.data ?? [];
  const meta = data?.meta ?? null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-[768px]">
        <DialogHeader>
          <DialogTitle>Riwayat Pelatihan</DialogTitle>
        </DialogHeader>

        <div>
          <p className="text-sm font-medium text-foreground">{user?.name}</p>
          {user?.email && (
            <p className="text-sm text-muted-foreground">{user.email}</p>
          )}
        </div>

        <DataTable
          columns={HISTORY_COLUMNS}
          rows={rows}
          keyOf={(s) => `${s.name}-${s.startDate?.unix ?? ""}`}
          loading={isLoading}
          error={isError ? error : null}
          onRetry={() => refetch()}
          emptyText="Belum ada riwayat pelatihan."
        />

        {!isLoading && !isError && meta && meta.last_page > 1 && (
          <Pagination meta={meta} onPage={(p) => setPage(p)} />
        )}
      </DialogContent>
    </Dialog>
  );
}
