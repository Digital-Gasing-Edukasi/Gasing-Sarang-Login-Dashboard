import { useQuery } from "@tanstack/react-query";
import {
  fetchVerificationStatusCount,
  verificationUsersKeys,
} from "../../../lib/api/index.js";
import { getVerifiedStatusMeta } from "../../../lib/verificationStatus.js";
import { cn } from "../../../lib/utils.js";

// Full-colored headline card per backend filter bucket: icon chip + big
// meta.total on a tinted gradient. `status` (numeric) resolves the label
// from verificationStatus.js; pass `title` for buckets without a 1:1
// display status (e.g. "rejected" covers both Ditolak states).
export function StatusCard({ filter, status = null, title = null, Icon, cardClass }) {
  const meta = status == null ? null : getVerifiedStatusMeta(status);
  const label = title ?? meta?.label ?? filter;
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: [...verificationUsersKeys.page(filter, 1, { limit: 1 }), "count"],
    queryFn: () => fetchVerificationStatusCount(filter),
    staleTime: 60_000,
  });

  return (
    <div className={cn("flex flex-col gap-4 rounded-xl p-5 text-white shadow-sm", cardClass)}>
      <div className="flex items-center justify-between gap-4">
        <p className="mt-1 text-sm text-white/85">{label}</p>
        <span className="self-start rounded-lg bg-white/20 p-2.5">
          <Icon size={22} />
        </span>
      </div>
      <div>
        {isLoading ? (
          <p className="text-3xl font-bold text-white/70">…</p>
        ) : isError ? (
          <button
            type="button"
            onClick={() => refetch()}
            className="self-start text-sm font-medium text-white underline hover:no-underline"
          >
            Gagal memuat, coba lagi
          </button>
        ) : (
          <p className="text-3xl font-bold tabular-nums">{data ?? 0}</p>
        )}
      </div>
    </div>
  );
}
