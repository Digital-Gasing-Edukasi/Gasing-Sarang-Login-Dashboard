import { useEffect, useMemo, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Plus, Search } from "lucide-react";
import {
  createTrainingSession,
  fetchTrainingSessions,
  pushTrainingHistoryImport,
  trainingSessionsKeys,
  uploadTrainingHistoryImport,
  waitQueueJob,
} from "../../lib/api/index.js";
import { useDebouncedValue } from "../../hooks/useDebouncedValue.js";
import { Button } from "../../components/ui/button.jsx";
import { Input } from "../../components/ui/input.jsx";
import { toast } from "../../components/ui/use-toast.js";
import { DataTable, Pagination } from "../../components/index.js";
import {
  AddPelatihanDialog,
  getRiwayatPelatihanColumns,
} from "./components/index.js";

const DEFAULT_LIMIT = 20;

function useTrainingSessionsList(page, limit, keyword) {
  return useQuery({
    queryKey: trainingSessionsKeys.page(page, { limit, keyword }),
    queryFn: () => fetchTrainingSessions({ page, limit, keyword }),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}

export default function RiwayatPelatihanPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [keyword, setKeyword] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const debouncedKeyword = useDebouncedValue(keyword, 500);

  useEffect(() => {
    setPage(1);
  }, [debouncedKeyword]);

  const { data, isLoading, isError, error, refetch } = useTrainingSessionsList(
    page,
    limit,
    debouncedKeyword,
  );

  const addMutation = useMutation({
    mutationFn: async ({ name, regionId, startDate, endDate, pesertaFile }) => {
      const res = await createTrainingSession({
        name,
        regionId,
        startDate,
        endDate,
      });

      const sessionId = res?.id || res?.data?.id;

      let pesertaWarn = "";
      if (pesertaFile && sessionId) {
        try {
          const up = await uploadTrainingHistoryImport(pesertaFile, sessionId);
          const upTrackId = up?.trackId ?? up?.data?.trackId;
          const importId = up?.importId ?? up?.data?.importId;

          if (upTrackId) {
            await waitQueueJob(upTrackId);
          }

          if (importId) {
            const pushRes = await pushTrainingHistoryImport(importId);
            const pushTrackId = pushRes?.trackId ?? pushRes?.data?.trackId;
            if (pushTrackId) {
              await waitQueueJob(pushTrackId);
            }
          }
        } catch (impErr) {
          pesertaWarn = ` (import peserta gagal: ${impErr.message || "error"})`;
        }
      }

      return { name, pesertaWarn };
    },
    onSuccess: ({ name, pesertaWarn }) => {
      setPage(1);
      queryClient.invalidateQueries({ queryKey: trainingSessionsKeys.all });
      refetch();
      toast({
        title: "Pelatihan berhasil ditambahkan",
        description: `Pelatihan ${name} berhasil ditambahkan.${pesertaWarn}`,
      });
      setIsAddOpen(false);
    },
    onError: (err) => {
      toast({
        title: "Gagal menambahkan pelatihan",
        description: err.message || "Terjadi kesalahan saat menambahkan pelatihan.",
        variant: "destructive",
      });
    },
  });

  const handleLimit = (next) => {
    setLimit(next);
    setPage(1);
  };

  const columns = useMemo(
    () =>
      getRiwayatPelatihanColumns({
        onEdit: () => {},
        onDownload: () => {},
      }),
    [],
  );

  const rows = data?.data ?? [];
  const meta = data?.meta ?? null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button type="button" onClick={() => setIsAddOpen(true)}>
          <Plus size={16} />
          <span>Tambah Pelatihan Baru</span>
        </Button>

        <div className="flex w-full items-center gap-2 sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Cari pelatihan…"
              aria-label="Cari pelatihan"
              className="pl-9"
            />
          </div>
          <Button type="button" onClick={() => {}}>
            <Download size={16} />
            <span>Export</span>
          </Button>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Total <b className="text-foreground">{meta?.total ?? 0}</b> Pelatihan
      </p>

      <DataTable
        columns={columns}
        rows={rows}
        keyOf={(s) => s.id}
        loading={isLoading}
        error={isError ? error?.message || "Gagal memuat riwayat pelatihan" : null}
        onRetry={refetch}
        emptyText={
          debouncedKeyword
            ? `Tidak ada hasil untuk "${debouncedKeyword}".`
            : "Belum ada riwayat pelatihan"
        }
      />

      {!isLoading && !isError && (
        <Pagination
          meta={meta}
          onPage={setPage}
          limit={limit}
          onLimitChange={handleLimit}
        />
      )}

      <AddPelatihanDialog
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSave={(payload) => addMutation.mutate(payload)}
        isPending={addMutation.isPending}
      />
    </div>
  );
}
