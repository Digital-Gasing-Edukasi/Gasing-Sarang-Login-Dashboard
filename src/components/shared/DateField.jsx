import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
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

// Batas atas default (dipakai Tanggal Lahir): kemarin. Hari ini & tanggal di
// masa depan tidak boleh dipilih.
const yesterday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - 1);
  return d;
};

// Batas atas alternatif: hari ini (dipakai mis. Tanggal Transfer).
const today = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

export const DATE_MAX = { yesterday, today };

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
export function DateField({
  value,
  onChange,
  className,
  id,
  // Batas atas tanggal terpilih. Default: kemarin (Tanggal Lahir).
  maxDate = yesterday,
  // Nilai draft awal saat belum ada value.
  defaultDraft,
  dialogLabel = "Pilih tanggal lahir",
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  // Sheet mobile di-portal keluar wrapRef, jadi ikut dihitung "dalam" agar
  // sentuhan pada roda tidak dianggap klik-luar (yang akan menutup sheet).
  const sheetRef = useRef(null);
  const max = typeof maxDate === "function" ? maxDate() : maxDate;

  const parsed = parseISO(value);
  // Default saat belum ada nilai: 26 tahun lalu (umur yang masuk akal untuk lahir).
  const draft =
    parsed ??
    defaultDraft ?? { y: max.getFullYear() - 26, m: 0, d: 1 };

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
      if (
        !wrapRef.current?.contains(e.target) &&
        !sheetRef.current?.contains(e.target)
      )
        setOpen(false);
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
  // RULE: Tahun urut naik — tahun paling lama (1900) di atas, tahun terbaru
  // (maxY) di bawah. Konsisten dengan Tanggal & Bulan (nilai kecil di atas,
  // besar di bawah). Sengaja TANPA .reverse().
  const yearItems = range(MIN_YEAR, maxY).map((y) => ({
    value: y,
    label: String(y),
  }));
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

  // Roda pilih (dipakai bersama popover desktop & bottom-sheet mobile).
  const pickerBody = (
    <div className="relative flex w-full">
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
  );

  return (
    <div ref={wrapRef} className="relative">
      <button
        id={id}
        type="button"
        onClick={toggle}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={cn(
          "flex h-11 w-full items-center gap-2 rounded-full border border-input bg-white/5 px-5 text-sm",
          "transition-all duration-200 hover:border-gray-300",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          open && "border-primary ring-2 ring-ring",
          className
        )}
      >
        <Calendar size={16} className="shrink-0 text-[#030B1F]" />
        <span className={cn(value ? "text-current" : "opacity-40")}>
          {value ? formatDateID(value) : "Pilih Tanggal"}
        </span>
      </button>

      {open && (
        <>
          {/* Desktop: popover di bawah field */}
          <div
            role="dialog"
            aria-label={dialogLabel}
            className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 hidden overflow-hidden rounded-2xl border border-input bg-background p-2 shadow-xl animate-in fade-in slide-in-from-top-1 lg:block"
          >
            {pickerBody}
          </div>

          {/* Mobile: bottom-sheet tinggi 428 (desain Figma iPhone base).
              Di-portal ke <body> supaya `fixed` tetap relatif ke viewport —
              tanpa ini, ancestor ber-transform (animasi/kartu auth) menjebak
              elemen fixed sehingga posisi sheet melenceng. */}
          {createPortal(
            <div className="fixed inset-0 z-[100] lg:hidden">
              <div
                className="absolute inset-0 bg-[#030B1F]/30 backdrop-blur animate-in fade-in-0"
                onClick={() => setOpen(false)}
              />
              <div ref={sheetRef} className="absolute inset-x-0 bottom-0 flex h-[428px] max-h-[85vh] flex-col rounded-t-3xl bg-background px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_rgba(0,0,0,0.18)] animate-in slide-in-from-bottom duration-200">
                <div className="mx-auto mt-3 h-1.5 w-10 shrink-0 rounded-full bg-gray-300" />
                <h3 className="shrink-0 px-2 pt-3 pb-4 text-center text-[17px] font-bold text-gray-900">
                  {dialogLabel}
                </h3>
                <div className="flex flex-1 items-center justify-center">
                  {pickerBody}
                </div>
              </div>
            </div>,
            document.body
          )}
        </>
      )}
    </div>
  );
}
