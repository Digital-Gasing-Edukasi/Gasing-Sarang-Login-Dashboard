import { useEffect, useMemo, useState } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react";
import {
  VERIFIED_STATUS,
  fetchPendingVouchers,
  pendingVouchersKeys,
  usersKeys,
} from "../../lib/api/index.js";
import { useDebouncedValue } from "../../hooks/useDebouncedValue.js";
import { Input } from "../../components/ui/input.jsx";
import { toast } from "../../components/ui/use-toast.js";
import { DataTable } from "../../components/index.js";
import { Pagination } from "../../components/index.js";
import { VoucherConfirmDialog, getPendingVoucherColumns } from "./components/index.js";

const DEFAULT_LIMIT = 20;

function useVoucherList(page, limit, keyword) {
  return useQuery({
    queryKey: pendingVouchersKeys.page(page, { limit, keyword }),
    queryFn: () => fetchPendingVouchers({ page, limit, keyword }),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}

export default function PendingVoucherPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [keyword, setKeyword] = useState("");
  const [confirmVoucher, setConfirmVoucher] = useState(null);
  const debouncedKeyword = useDebouncedValue(keyword, 500);

  // New search term → back to first page.
  useEffect(() => {
    setPage(1);
  }, [debouncedKeyword]);

  const { data, isLoading, isError, error, refetch } = useVoucherList(
    page,
    limit,
    debouncedKeyword,
  );

  const handleLimit = (next) => {
    setLimit(next);
    setPage(1);
  };

  const handleConfirmed = (voucher) => {
    setConfirmVoucher(null);
    setPage(1);
    toast({
      title: "Voucher dikonfirmasi",
      description: voucher?.code
        ? `Voucher ${voucher.code} telah dikonfirmasi.`
        : "Voucher telah dikonfirmasi.",
    });
    queryClient.invalidateQueries({ queryKey: pendingVouchersKeys.all });
    queryClient.invalidateQueries({
      queryKey: usersKeys.byStatus(VERIFIED_STATUS.APPROVED),
    });
  };

  const columns = useMemo(
    () =>
      getPendingVoucherColumns({
        onConfirmVoucher: setConfirmVoucher,
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
            placeholder="Cari nama, email, kode…"
            aria-label="Cari voucher"
            className="pl-9"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        keyOf={(v) => v.id}
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

      <VoucherConfirmDialog
        voucher={confirmVoucher}
        onClose={() => setConfirmVoucher(null)}
        onConfirmed={handleConfirmed}
      />
    </div>
  );
}
