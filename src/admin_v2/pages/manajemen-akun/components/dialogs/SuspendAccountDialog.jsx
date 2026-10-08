import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../../../../components/ui/button.jsx";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../../components/ui/dialog.jsx";
import { Input } from "../../../../components/ui/input.jsx";
import { Label } from "../../../../components/ui/label.jsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../components/ui/select.jsx";
import { Textarea } from "../../../../components/ui/textarea.jsx";
import { cn } from "../../../../lib/utils.js";
import {
  SUSPEND_REASONS_CACHE,
  fetchSuspendReasons,
  suspendReasonsKeys,
  suspendUser,
} from "../../../../lib/api/index.js";

const HOUR = 3600e3;
const DAY = 24 * HOUR;

// Preset durations (ms from now). `forever` has no end date.
const PRESETS = [
  { key: "6h", label: "6 jam", ms: 6 * HOUR },
  { key: "12h", label: "12 jam", ms: 12 * HOUR },
  { key: "24h", label: "24 jam", ms: 24 * HOUR },
  { key: "3d", label: "3 hari", ms: 3 * DAY },
  { key: "1w", label: "1 minggu", ms: 7 * DAY },
  { key: "2w", label: "2 minggu", ms: 14 * DAY },
  { key: "1mo", label: "1 bulan", ms: 30 * DAY },
  { key: "3mo", label: "3 bulan", ms: 90 * DAY },
  { key: "6mo", label: "6 bulan", ms: 180 * DAY },
  { key: "1y", label: "1 tahun", ms: 365 * DAY },
  { key: "forever", label: "selamanya", ms: null },
];

const FOREVER = "forever";

const ID_MONTHS_FULL = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];
const ID_MONTH_ABBR = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];
const DAY_LABELS = ["Sn", "Sl", "Rb", "Km", "Jm", "Sb", "Mg"];

const pad = (n) => String(n).padStart(2, "0");
// suspendedUntil payload: local "YYYY-MM-DD HH:mm:ss".
const toPayloadDateTime = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
  `${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
// "Berakhir: 9 Okt 2026, 19:27".
const toPreviewDateTime = (d) =>
  `${d.getDate()} ${ID_MONTH_ABBR[d.getMonth()]} ${d.getFullYear()}, ` +
  `${pad(d.getHours())}:${pad(d.getMinutes())}`;

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

function buildGrid(y, m) {
  const first = new Date(y, m, 1);
  const offset = (first.getDay() + 6) % 7; // Monday-first
  const days = new Date(y, m + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(new Date(y, m, d));
  while (cells.length % 7) cells.push(null);
  return cells;
}

// Single-month picker: starts on today, month arrows only, no past days.
function MiniCalendar({ value, onChange }) {
  const [view, setView] = useState(() => value ?? startOfToday());
  const y = view.getFullYear();
  const m = view.getMonth();
  const today = startOfToday();
  const sameDay = (a, b) =>
    a && b && a.toDateString() === b.toDateString();

  return (
    <div className="rounded-md border p-3">
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          aria-label="Bulan sebelumnya"
          onClick={() => setView(new Date(y, m - 1, 1))}
          className="rounded p-1 text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="text-sm font-semibold">
          {ID_MONTHS_FULL[m]} {y}
        </span>
        <button
          type="button"
          aria-label="Bulan berikutnya"
          onClick={() => setView(new Date(y, m + 1, 1))}
          className="rounded p-1 text-muted-foreground hover:text-foreground"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div role="grid" aria-label="Pilih tanggal" className="grid grid-cols-7 gap-1">
        {DAY_LABELS.map((d) => (
          <span
            key={d}
            className="py-1 text-center text-xs font-medium text-muted-foreground"
          >
            {d}
          </span>
        ))}
        {buildGrid(y, m).map((d, i) =>
          d ? (
            <button
              key={d.toISOString()}
              type="button"
              disabled={d < today}
              onClick={() => onChange(d)}
              className={cn(
                "rounded-md py-1.5 text-sm transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                "disabled:pointer-events-none disabled:opacity-30",
                sameDay(d, value) && "bg-primary font-semibold text-primary-foreground hover:bg-primary",
                sameDay(d, today) && !sameDay(d, value) && "border border-primary",
              )}
            >
              {d.getDate()}
            </button>
          ) : (
            <span key={`empty-${i}`} />
          ),
        )}
      </div>
    </div>
  );
}

function OptionSelect({ label, value, onValueChange, placeholder, options }) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger aria-label={label}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// Suspend flow: POST /admin/users/:userId/suspend.
// Duration via preset or manual date+time; single reason; optional email note.
export function SuspendAccountDialog({ user, onClose, onSuspended }) {
  const [mode, setMode] = useState("preset");
  const [preset, setPreset] = useState("");
  const [date, setDate] = useState(startOfToday);
  const [time, setTime] = useState("23:59");
  const [reason, setReason] = useState("");
  const [remarks, setRemarks] = useState("");
  const open = !!user;

  const {
    data: reasons = [],
    isLoading: reasonsLoading,
    isError: reasonsError,
    refetch: refetchReasons,
  } = useQuery({
    queryKey: suspendReasonsKeys.all,
    queryFn: fetchSuspendReasons,
    ...SUSPEND_REASONS_CACHE,
  });

  const computeUntil = () => {
    if (mode === "preset") {
      const p = PRESETS.find((x) => x.key === preset);
      if (!p) return null;
      return p.ms == null ? FOREVER : new Date(Date.now() + p.ms);
    }
    if (!date) return null;
    const [h, mi] = String(time).split(":").map(Number);
    const d = new Date(date);
    d.setHours(h || 0, mi || 0, 0, 0);
    return d;
  };
  const until = computeUntil();
  const valid = until !== null && !!reason;

  const suspend = useMutation({
    mutationFn: () =>
      suspendUser({
        userId: user.id,
        suspendedUntil: until === FOREVER ? null : toPayloadDateTime(until),
        reason: [reason],
        remarks,
      }),
    onSuccess: () => onSuspended?.(user),
  });

  // Fresh form every time the dialog closes.
  const handleClose = () => {
    setMode("preset");
    setPreset("");
    setDate(startOfToday());
    setTime("23:59");
    setReason("");
    setRemarks("");
    suspend.reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="flex max-h-[90vh] flex-col max-w-xl">
        <DialogHeader className="shrink-0">
          <DialogTitle>Tangguhkan Akun</DialogTitle>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
          <div className="flex items-start gap-3 rounded-md border border-orange-300 bg-orange-100 p-3">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-orange-500" />
            <p className="text-xs leading-relaxed text-orange-700">
              Untuk menjaga keamanan komunitas, pengguna yang ditangguhkan tidak
              dapat mengakses akunnya sampai waktu yang ditentukan.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Tangguhkan pengguna hingga</Label>
            <div>
              <div className="inline-flex rounded-full border bg-muted p-1">
                {[
                  ["preset", "Preset"],
                  ["manual", "Manual"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={mode === value}
                    onClick={() => setMode(value)}
                    className={cn(
                      "rounded-full px-5 py-1.5 text-sm font-medium transition-colors",
                      mode === value
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {mode === "preset" ? (
              <OptionSelect
                label="Pilih durasi"
                value={preset}
                onValueChange={setPreset}
                placeholder="Pilih durasi"
                options={PRESETS.map((p) => ({ value: p.key, label: p.label }))}
              />
            ) : (
              <div className="space-y-3">
                <MiniCalendar value={date} onChange={setDate} />
                <div className="space-y-2">
                  <Label htmlFor="suspend-time">Jam aktif kembali</Label>
                  <Input
                    id="suspend-time"
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                  />
                </div>
              </div>
            )}

            {until && (
              <p className="text-xs text-muted-foreground">
                Berakhir:{" "}
                <span className="font-semibold text-foreground">
                  {until === FOREVER ? "selamanya" : toPreviewDateTime(until)}
                </span>
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Alasan penangguhan pengguna</Label>
            {reasonsLoading ? (
              <p className="py-2 text-sm text-muted-foreground">Memuat alasan…</p>
            ) : reasonsError ? (
              <div className="flex items-center gap-2 py-2 text-sm text-red-600">
                <span>Gagal memuat alasan.</span>
                <button
                  type="button"
                  onClick={() => refetchReasons()}
                  className="font-semibold underline hover:opacity-80"
                >
                  Coba lagi
                </button>
              </div>
            ) : (
              <OptionSelect
                label="Alasan penangguhan pengguna"
                value={reason}
                onValueChange={setReason}
                placeholder="Pilih alasan"
                options={reasons.map((r) => ({ value: r.code, label: r.title }))}
              />
            )}
          </div>

          <div className="space-y-2">
            <Label>Pesan email (opsional)</Label>
            <Textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Tulis pesan tambahan untuk pengguna (opsional)"
              rows={3}
            />
          </div>

          {suspend.isError && (
            <p className="text-sm text-red-600">
              Gagal menangguhkan: {suspend.error?.message || "Unknown error"}
            </p>
          )}
        </div>

        <DialogFooter className="shrink-0">
          <Button variant="outline" onClick={handleClose} disabled={suspend.isPending}>
            Batalkan
          </Button>
          <Button
            variant="destructive"
            onClick={() => suspend.mutate()}
            disabled={!valid || suspend.isPending}
          >
            {suspend.isPending ? "Menangguhkan…" : "Tangguhkan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
