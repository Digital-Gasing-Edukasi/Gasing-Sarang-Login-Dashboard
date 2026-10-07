import { useQuery } from "@tanstack/react-query";

// Live meta.total badge for tab buttons. Shares cache with the matching
// list query when keys coincide.
export function CountBadge({ queryKey, queryFn }) {
  const { data } = useQuery({
    queryKey,
    queryFn,
    staleTime: 30_000,
    select: (res) => res?.meta?.total ?? 0,
  });
  return (
    <span className="ml-2 inline-flex min-w-6 items-center justify-center rounded-full bg-muted px-1.5 py-0.5 text-xs font-semibold text-muted-foreground">
      {data ?? "…"}
    </span>
  );
}
