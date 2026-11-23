import { useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Pencil, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../../../components/ui/dialog.jsx";
import { Button } from "../../../../components/ui/button.jsx";
import { DataTable } from "../../../../components/DataTable.jsx";
import { Pagination } from "../../../../components/Pagination.jsx";
import { OverflowText } from "../../../../components/OverflowText.jsx";
import { formatShortDate } from "../../../../lib/format.js";
import {
  fetchSessionParticipants,
  trainingHistoryKeys,
} from "../../../../lib/api/index.js";

const DEFAULT_LIMIT = 20;

function SubscriptionBadge({ status }) {
  if (status === "active") {
    return (
      <span className="inline-flex items-center whitespace-nowrap rounded-full border border-green-300 bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
        Aktif
      </span>
    );
  }
  if (status === "nonactive") {
    return (
      <span className="inline-flex items-center whitespace-nowrap rounded-full border border-gray-300 bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700">
        Non-Aktif
      </span>
    );
  }
  // unreg / default
  return (
    <span className="inline-flex items-center whitespace-nowrap rounded-full border border-orange-300 bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-700">
      Belum Terdaftar
    </span>
  );
}

export function SessionParticipantsDialog({ session, onClose }) {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const open = !!session;

  const sessionId = session?.id;

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: trainingHistoryKeys.participants(sessionId, { page, limit }),
    queryFn: () => fetchSessionParticipants(sessionId, { page, limit }),
    enabled: open && !!sessionId,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });

  const columns = useMemo(
    () => [
      {
        key: "name",
        header: "Nama Peserta",
        wrap: true,
        render: (p) => (
          <OverflowText
            value={p.name || "—"}
            className="text-sm font-semibold text-foreground"
          />
        ),
      },
      {
        key: "email",
        header: "Email",
        wrap: true,
        render: (p) => (
          <OverflowText value={p.email} className="text-sm text-foreground" />
        ),
      },
      {
        key: "status",
        header: "Langganan",
        render: (p) => <SubscriptionBadge status={p.status} />,
      },
      {
        key: "action",
        header: "Action",
        className: "text-center",
        render: () => (
          <div className="flex items-center justify-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              type="button"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => {}}
              title="Edit"
            >
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Edit</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              type="button"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => {}}
              title="Hapus"
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Hapus</span>
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  const rows = data?.data ?? [];
  const meta = data?.meta ?? null;

  const handleClose = () => {
    setPage(1);
    onClose?.();
  };

  const handleLimit = (next) => {
    setLimit(next);
    setPage(1);
  };

  const subtitleDate = formatShortDate(session?.updatedAt?.local?.formatted);
  const regionName = session?.region?.name;
  const subtitle = [session?.name, regionName, subtitleDate]
    .filter(Boolean)
    .join(" · ");

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="grid-rows-[auto_minmax(0,1fr)] max-h-[calc(100vh-2rem)] max-w-[60%] overflow-hidden">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <DialogTitle className="text-lg font-bold text-foreground">
              Daftar Peserta Guru
            </DialogTitle>
            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
              {meta?.total ?? 0} Peserta
            </span>
          </div>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </DialogHeader>

        <div className="min-h-0 flex flex-col gap-3">
          <DataTable
            columns={columns}
            rows={rows}
            keyOf={(p) => p.id}
            loading={isLoading}
            error={isError ? error?.message || "Gagal memuat peserta" : null}
            onRetry={refetch}
            emptyText="Belum ada data peserta"
            fixedWidth={false}
            stickyFirst={false}
            stickyLast={false}
            stickyHeader
            scrollable
          />

          {!isLoading && !isError && (
            <Pagination
              meta={meta}
              onPage={setPage}
              limit={limit}
              onLimitChange={handleLimit}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
