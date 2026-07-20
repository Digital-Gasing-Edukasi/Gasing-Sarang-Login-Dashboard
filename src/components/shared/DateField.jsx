import { useState, useRef, useEffect, useCallback } from "react";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const ITEM_H = 40; // tinggi 1 baris roda (px)
const VISIBLE = 7; // jumlah baris yang terlihat (harus ganjil biar ada baris tengah)
const PAD = ((VISIBLE - 1) / 2) * ITEM_H;

const pad2 = (n) => String(n).padStart(2, "0");
const toISO = (y, m, d) => `${y}-${pad2(m + 1)}-${pad2(d)}`;
const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();

// Batas atas: kemarin. Hari ini & tanggal di masa depan tidak boleh dipilih.
const maxDate = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - 1);
  return d;
};

const MIN_YEAR = 1900;

const parseISO = (v) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(v || ""));
  if (!m) return null;
  return { y: +m[1], m: +m[2] - 1, d: +m[3] };
};

export const formatDateID = (v) => {
  const p = parseISO(v);
  return p ? `${pad2(p.d)}/${pad2(p.m + 1)}/${p.y}` : "";
};

const range = (from, to) => {
  const out = [];
  for (let i = from; i <= to; i++) out.push(i);
  return out;
};

/** Satu kolom roda: scroll-snap, baris tengah = nilai terpilih. */
function WheelColumn({ items, value, onChange, label }) {
  const ref = useRef(null);
  const settle = useRef(null);
  const index = items.findIndex((it) => it.value === value);

  // Samakan posisi scroll dengan nilai terpilih (termasuk saat daftar berubah).
  useEffect(() => {
    const el = ref.current;
    if (!el || index < 0) return;
    const top = index * ITEM_H;
    if (Math.abs(el.scrollTop - top) > 1) el.scrollTop = top;
  }, [index, items.length]);

  useEffect(() => () => clearTimeout(settle.current), []);

  // Baca nilai baru setelah scroll berhenti (scroll-snap yang menentukan posisinya).
  const handleScroll = () => {
    clearTimeout(settle.current);
    settle.current = setTimeout(() => {
      const el = ref.current;
      if (!el) return;
      const i = Math.min(
        items.length - 1,
        Math.max(0, Math.round(el.scrollTop / ITEM_H))
      );
      if (items[i] && items[i].value !== value) onChange(items[i].value);
    }, 90);
  };

  return (
    <div
      ref={ref}
      role="listbox"
      aria-label={label}
      onScroll={handleScroll}
      className="no-scrollbar relative z-10 flex-1 snap-y snap-mandatory overflow-y-auto overscroll-contain"
      style={{ height: VISIBLE * ITEM_H, paddingBlock: PAD }}
    >
      {items.map((it, i) => {
        const dist = index < 0 ? 3 : Math.abs(i - index);
        return (
          <button
            key={it.value}
            type="button"
            role="option"
            aria-selected={dist === 0}
            onClick={() => onChange(it.value)}
            className={cn(
              "flex w-full snap-center items-center justify-center rounded-full text-sm transition-colors",
              dist === 0
                ? "font-semibold text-foreground"
                : dist === 1
                  ? "text-muted-foreground"
                  : dist === 2
                    ? "text-muted-foreground/60"
                    : "text-muted-foreground/35"
            )}
            style={{ height: ITEM_H }}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Field tanggal dengan roda pilih (tanggal / bulan / tahun) custom — sama di
 * desktop & mobile, jadi tidak bergantung tampilan picker bawaan browser.
 * Nilai `value` tetap format ISO `yyyy-mm-dd`.
 */
export function DateField({ value, onChange, className, id }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const max = maxDate();

  const parsed = parseISO(value);
  // Default saat belum ada nilai: 17 tahun lalu (umur yang masuk akal untuk lahir).
  const draft = parsed ?? { y: max.getFullYear() - 17, m: 0, d: 1 };

  const emit = useCallback(
    (y, m, d) => {
      // Jaga tanggal tetap valid & tidak melewati batas atas.
      const maxY = max.getFullYear();
      const yy = Math.min(Math.max(y, MIN_YEAR), maxY);
      const mm = yy === maxY ? Math.min(m, max.getMonth()) : m;
      const lastDay =
        yy === maxY && mm === max.getMonth()
          ? max.getDate()
          : daysInMonth(yy, mm);
      const dd = Math.min(d, lastDay);
      onChange?.({ target: { value: toISO(yy, mm, dd) } });
    },
    [onChange, max]
  );

  // Tutup saat klik di luar / tekan Esc.
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggle = () => {
    if (!open && !parsed) emit(draft.y, draft.m, draft.d); // isi nilai awal
    setOpen((v) => !v);
  };

  // Opsi dibatasi supaya tanggal > batas atas tidak pernah muncul di roda.
  const maxY = max.getFullYear();
  const yearItems = range(MIN_YEAR, maxY)
    .reverse()
    .map((y) => ({ value: y, label: String(y) }));
  const lastMonth = draft.y === maxY ? max.getMonth() : 11;
  const monthItems = MONTHS.slice(0, lastMonth + 1).map((label, m) => ({
    value: m,
    label,
  }));
  const lastDay =
    draft.y === maxY && draft.m === max.getMonth()
      ? max.getDate()
      : daysInMonth(draft.y, draft.m);
  const dayItems = range(1, lastDay).map((d) => ({ value: d, label: String(d) }));

  return (
    <div ref={wrapRef} className="relative">
      <button
        id={id}
        type="button"
        onClick={toggle}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={cn(
          "flex h-11 w-full items-center gap-2.5 rounded-full border border-input bg-background px-4 text-sm",
          "transition-all duration-200 hover:border-gray-300",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          open && "border-primary ring-2 ring-ring",
          className
        )}
      >
        <Calendar size={16} className="shrink-0 text-muted-foreground" />
        <span className={value ? "text-foreground" : "text-muted-foreground"}>
          {value ? formatDateID(value) : "dd/mm/yyyy"}
        </span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Pilih tanggal lahir"
          className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-2xl border border-input bg-background p-2 shadow-xl animate-in fade-in slide-in-from-top-1"
        >
          <div className="relative flex">
            {/* Penanda baris tengah: satu pill per kolom */}
            <div
              className="pointer-events-none absolute inset-x-0 z-0 flex"
              style={{ top: PAD, height: ITEM_H }}
            >
              <div className="mx-1 flex-1 rounded-full bg-primary/10" />
              <div className="mx-1 flex-1 rounded-full bg-primary/10" />
              <div className="mx-1 flex-1 rounded-full bg-primary/10" />
            </div>
            <WheelColumn
              label="Tanggal"
              items={dayItems}
              value={Math.min(draft.d, lastDay)}
              onChange={(d) => emit(draft.y, draft.m, d)}
            />
            <WheelColumn
              label="Bulan"
              items={monthItems}
              value={Math.min(draft.m, lastMonth)}
              onChange={(m) => emit(draft.y, m, draft.d)}
            />
            <WheelColumn
              label="Tahun"
              items={yearItems}
              value={draft.y}
              onChange={(y) => emit(y, draft.m, draft.d)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
