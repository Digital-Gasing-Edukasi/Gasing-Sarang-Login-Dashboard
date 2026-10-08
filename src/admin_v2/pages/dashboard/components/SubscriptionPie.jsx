import { useQuery } from "@tanstack/react-query";
import { Cell, Pie, PieChart, Tooltip } from "recharts";
import {
  VERIFIED_STATUS,
  fetchUsersCount,
  usersKeys,
} from "../../../lib/api/index.js";

function useSubscriptionTotal(subscription) {
  return useQuery({
    queryKey: [
      ...usersKeys.page(VERIFIED_STATUS.APPROVED, 1, {
        limit: 1,
        subscription,
      }),
      "count",
    ],
    queryFn: () =>
      fetchUsersCount(VERIFIED_STATUS.APPROVED, { subscription }),
    staleTime: 60_000,
  });
}

export function SubscriptionPie() {
  const active = useSubscriptionTotal("active");
  const inactive = useSubscriptionTotal("not_subscribed");

  const data = [
    { name: "Aktif", value: active.data ?? 0, color: "#16A34A" },
    { name: "Belum Langganan", value: inactive.data ?? 0, color: "#F97316" },
  ];
  const loading = active.isLoading || inactive.isLoading;
  const error = active.isError || inactive.isError;

  return (
    <div className="rounded-xl border bg-background p-5 shadow-sm">
      <p className="text-sm font-semibold text-foreground">Langganan</p>
      {loading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Memuat…</p>
      ) : error ? (
        <p className="py-10 text-center text-sm text-red-600">
          Gagal memuat data langganan.
        </p>
      ) : (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <PieChart width={260} height={200}>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={false}
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value, name) => [value, name]} />
          </PieChart>
          <div className="flex-1 space-y-1">
            {data.map((entry) => (
              <div key={entry.name} className="flex items-center gap-2 text-sm">
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-muted-foreground">{entry.name}</span>
                <span className="ml-auto font-semibold tabular-nums text-foreground">
                  {entry.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
