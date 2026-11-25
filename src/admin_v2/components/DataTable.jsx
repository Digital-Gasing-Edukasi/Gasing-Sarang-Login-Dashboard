import { cn } from "../lib/utils.js";
import { Button } from "./ui/button.jsx";

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

function timestampFrom(value) {
  if (typeof value === "number") {
    return value < 1e12 ? value * 1000 : value;
  }
  if (typeof value === "string") {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return numeric < 1e12 ? numeric * 1000 : numeric;
    return Date.parse(value);
  }
  if (value && typeof value === "object") {
    return timestampFrom(
      value.unix ?? value.local?.raw ?? value.utc?.raw ?? value.raw,
    );
  }
  return Number.NaN;
}

function isRecentlyUpdated(row) {
  const updatedAt = timestampFrom(row.updated_at ?? row.updatedAt);
  const age = Date.now() - updatedAt;
  return Number.isFinite(updatedAt) && age >= 0 && age < THREE_DAYS_MS;
}

// Generic table. First + last columns are frozen (sticky) on horizontal
// scroll — these tables are wide with little room. Sticky cells carry their
// own opaque background + an edge divider so scrolled content slides under.
// Opt out per table with stickyFirst / stickyLast.
// With no rows the body is omitted entirely and the empty message renders
// below the table, so it stays readable without horizontal scrolling.
export function DataTable({
  columns,
  rows,
  keyOf,
  loading,
  error,
  onRetry,
  emptyText,
  stickyFirst = true,
  stickyLast = true,
  stickyHeader = false,
  scrollable = false,
  fixedWidth = true,
}) {
  const lastIdx = columns.length - 1;
  const isEmpty = !loading && !error && rows.length === 0;

  const headSticky = (idx) =>
    cn(
      stickyFirst &&
        idx === 0 &&
        "sticky left-0 z-20 bg-muted after:absolute after:inset-y-0 after:right-0 after:w-px after:bg-border after:content-['']",
      stickyLast &&
        idx === lastIdx &&
        "sticky right-0 z-20 bg-muted before:absolute before:inset-y-0 before:left-0 before:w-px before:bg-border before:content-['']",
    );

  const bodySticky = (idx) =>
    cn(
      stickyFirst &&
        idx === 0 &&
        "sticky left-0 z-10 bg-background group-hover:bg-muted after:absolute after:inset-y-0 after:right-0 after:w-px after:bg-border after:content-['']",
      stickyLast &&
        idx === lastIdx &&
        "sticky right-0 z-10 bg-background group-hover:bg-muted before:absolute before:inset-y-0 before:left-0 before:w-px before:bg-border before:content-['']",
    );

  return (
    <>
      <div
        className={cn(
          "overflow-x-auto rounded-md border",
          scrollable && "min-h-0 flex-1 overflow-auto",
        )}
      >
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b bg-muted">
              {columns.map((col, idx) => (
                <th
                  key={col.key}
                  className={cn(
                    fixedWidth && "min-w-[180px] max-w-[280px]",
                    "px-4 py-3 align-bottom font-semibold text-foreground",
                    col.className,
                    headSticky(idx),
                    stickyHeader && "sticky top-0 z-30 bg-muted",
                  )}
                >
                  {col.sub && (
                    <span className="mb-0.5 block text-[11px] font-normal text-muted-foreground">
                      {col.sub}
                    </span>
                  )}
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          {!isEmpty && (
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-10 text-center text-muted-foreground">
                    Memuat...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-10 text-center">
                    <p className="mb-3 text-sm text-red-600">
                      Gagal memuat data: {error.message || "Unknown error"}
                    </p>
                    {onRetry && (
                      <Button size="sm" variant="outline" onClick={onRetry}>
                        Coba lagi
                      </Button>
                    )}
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={keyOf(row)} className="group border-b last:border-0 hover:bg-muted">
                    {columns.map((col, idx) => (
                      <td
                        key={col.key}
                        className={cn(
                          fixedWidth && "min-w-[180px] max-w-[280px]",
                          "px-4 py-3 align-top",
                          col.wrap
                            ? "break-words [&_p]:line-clamp-2 [&_span]:line-clamp-2"
                            : "whitespace-nowrap",
                          col.className,
                          bodySticky(idx),
                        )}
                      >
                        {idx === 0 && isRecentlyUpdated(row) ? (
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">{col.render(row)}</div>
                            <span className="inline-flex shrink-0 items-center rounded-full bg-blue-600 px-2.5 py-0.5 text-xs font-semibold text-white">
                              new
                            </span>
                          </div>
                        ) : (
                          col.render(row)
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          )}
        </table>
      </div>
      {isEmpty && (
        <p className="py-6 text-center text-sm text-muted-foreground">
          {emptyText ?? "Tidak ada data."}
        </p>
      )}
    </>
  );
}
