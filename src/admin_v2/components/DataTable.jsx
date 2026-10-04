import { cn } from "../lib/utils.js";
import { Button } from "./ui/button.jsx";

// Generic table. First + last columns are frozen (sticky) on horizontal
// scroll — these tables are wide with little room. Sticky cells carry their
// own opaque background + an edge divider so scrolled content slides under.
// Opt out per table with stickyFirst / stickyLast.
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
}) {
  const lastIdx = columns.length - 1;

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
        "sticky left-0 z-10 bg-background after:absolute after:inset-y-0 after:right-0 after:w-px after:bg-border after:content-['']",
      stickyLast &&
        idx === lastIdx &&
        "sticky right-0 z-10 bg-background before:absolute before:inset-y-0 before:left-0 before:w-px before:bg-border before:content-['']",
    );

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b bg-muted">
            {columns.map((col, idx) => (
              <th
                key={col.key}
                className={cn(
                  "min-w-[180px] max-w-[280px] px-4 py-3 align-bottom font-semibold text-foreground",
                  col.className,
                  headSticky(idx),
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
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10 text-center text-muted-foreground">
                {emptyText ?? "Tidak ada data."}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={keyOf(row)} className="border-b last:border-0 hover:bg-muted/30">
                {columns.map((col, idx) => (
                  <td
                  key={col.key}
                  className={cn(
                    "min-w-[180px] max-w-[280px] px-4 py-3 align-top",
                    col.wrap
                      ? "break-words [&_p]:line-clamp-2 [&_span]:line-clamp-2"
                      : "whitespace-nowrap",
                    bodySticky(idx),
                  )}
                >
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
