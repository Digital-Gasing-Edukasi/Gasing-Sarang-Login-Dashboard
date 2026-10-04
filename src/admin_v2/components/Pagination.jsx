import { ChevronLeft, ChevronRight, List } from "lucide-react";
import { cn } from "../lib/utils.js";
import { Button } from "./ui/button.jsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select.jsx";

// Compact page list: 1 … current-1 current current+1 … last
function pageItems(current, last) {
  if (last <= 7) {
    return Array.from({ length: last }, (_, i) => i + 1);
  }
  const set = new Set([1, last, current - 1, current, current + 1]);
  const pages = [...set].filter((p) => p >= 1 && p <= last).sort((a, b) => a - b);
  const items = [];
  let prev = 0;
  for (const p of pages) {
    if (p - prev > 1) items.push("…");
    items.push(p);
    prev = p;
  }
  return items;
}

export const PAGE_LIMIT_OPTIONS = [20, 50, 100];

export function Pagination({ meta, onPage, limit = 20, onLimitChange }) {
  if (!meta) return null;
  const current = meta.current_page ?? 1;
  const last = meta.last_page ?? 1;
  const total = meta.total ?? 0;

  return (
    <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <p className="text-sm text-muted-foreground">
          Menampilkan {meta.from ?? 0}–{meta.to ?? 0} dari {total} data
        </p>
        {onLimitChange && (
          <>
            <span className="h-4 w-px bg-border" aria-hidden="true" />
            <Select
              value={String(limit)}
              onValueChange={(v) => onLimitChange(Number(v))}
            >
              <SelectTrigger
                className="h-8 w-auto gap-1.5 px-2.5 text-xs"
                aria-label="Jumlah per halaman"
              >
                <List size={14} className="text-muted-foreground" />
                <span className="text-muted-foreground">Rows:</span>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_LIMIT_OPTIONS.map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        )}
      </div>
      <div className="flex items-center gap-1">
          <Button
          size="sm"
          variant="outline"
          disabled={current <= 1}
          onClick={() => onPage(current - 1)}
          aria-label="Halaman sebelumnya"
        >
          <ChevronLeft size={16} />
        </Button>
        {pageItems(current, last).map((item, i) =>
          item === "…" ? (
            <span key={`gap-${i}`} className="px-1 text-sm text-muted-foreground">
              …
            </span>
          ) : (
            <Button
              key={item}
              size="sm"
              variant={item === current ? "default" : "ghost"}
              onClick={() => onPage(item)}
              className={cn(item === current && "pointer-events-none")}
            >
              {item}
            </Button>
          ),
        )}
        <Button
          size="sm"
          variant="outline"
          disabled={current >= last}
          onClick={() => onPage(current + 1)}
          aria-label="Halaman berikutnya"
          >
            <ChevronRight size={16} />
          </Button>
        </div>
    </div>
  );
}
