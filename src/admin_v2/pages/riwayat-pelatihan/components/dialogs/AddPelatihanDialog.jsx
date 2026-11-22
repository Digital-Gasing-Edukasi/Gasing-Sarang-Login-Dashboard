import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Calendar as CalendarIcon, FileSpreadsheet, Upload } from "lucide-react";
import { Button } from "../../../../components/ui/button.jsx";
import { Calendar } from "../../../../components/ui/calendar.jsx";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../../../components/ui/popover.jsx";
import { RegionSelect } from "../../../verifikasi-akun/components/RegionSelect.jsx";
import { cn } from "../../../../lib/utils.js";

// Template CSV peserta (kolom `nama`, `email`) — dibuat di klien, tanpa endpoint.
function downloadTemplate() {
  const csv =
    '\uFEFFnama,email\n"contoh nama",contoh1@email.com\n"contoh nama",contoh2@email.com\n';
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "template-peserta-guru.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function parseDate(dateVal) {
  if (!dateVal) return undefined;
  if (dateVal instanceof Date) return dateVal;
  // If object from backend: startDate.local.iso or startDate.utc.raw or unix
  if (typeof dateVal === "object") {
    const str =
      dateVal.local?.iso ||
      dateVal.local?.raw ||
      dateVal.utc?.iso ||
      dateVal.utc?.raw;
    if (str) return new Date(str.replace(" ", "T"));
    if (dateVal.unix) return new Date(dateVal.unix * 1000);
  }
  if (typeof dateVal === "string") {
    return new Date(dateVal.replace(" ", "T"));
  }
  return undefined;
}

export function AddPelatihanDialog({
  open,
  session,
  onClose,
  onSave,
  isPending = false,
}) {
  const isEdit = !!session;
  const [name, setName] = useState("");
  const [regionId, setRegionId] = useState("");
  const [dateRange, setDateRange] = useState({ from: undefined, to: undefined });
  const [pesertaFile, setPesertaFile] = useState(null);
  const [dateOpen, setDateOpen] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (open) {
      if (session) {
        setName(session.name || "");
        setRegionId(session.regionId || session.region?.id || "");
        setDateRange({
          from: parseDate(session.startDate),
          to: parseDate(session.endDate),
        });
      } else {
        setName("");
        setRegionId("");
        setDateRange({ from: undefined, to: undefined });
      }
      setPesertaFile(null);
      setDateOpen(false);
      setError("");
    }
  }, [open, session]);

  const resetForm = () => {
    setName("");
    setRegionId("");
    setDateRange({ from: undefined, to: undefined });
    setDateOpen(false);
    setPesertaFile(null);
    setError("");
  };

  const handleClose = () => {
    if (isPending) return;
    resetForm();
    onClose?.();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPesertaFile(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setPesertaFile(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Nama pelatihan wajib diisi.");
      return;
    }
    if (!regionId) {
      setError("Daerah pelatihan wajib dipilih.");
      return;
    }
    if (!dateRange?.from || !dateRange?.to) {
      setError("Tanggal mulai & berakhir wajib dipilih.");
      return;
    }

    const startDate = format(dateRange.from, "yyyy-MM-dd");
    const endDate = format(dateRange.to, "yyyy-MM-dd");

    onSave?.(
      {
        name: name.trim(),
        regionId,
        startDate,
        endDate,
        pesertaFile,
      },
      {
        onSuccess: () => {
          resetForm();
          onClose?.();
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Perbarui Riwayat Pelatihan" : "Tambah Pelatihan"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nama-pelatihan">Nama Pelatihan</Label>
            <Input
              id="nama-pelatihan"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Masukkan nama pelatihan"
            />
          </div>

          <div className="space-y-2">
            <Label>Daerah</Label>
            <RegionSelect
              value={regionId}
              initialLabel={session?.region?.name}
              onValueChange={setRegionId}
            />
          </div>

          <div className="space-y-2">
            <Label>Tanggal Mulai &amp; Berakhir</Label>
            <Popover open={dateOpen} onOpenChange={setDateOpen} modal={false}>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant="outline"
                  type="button"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateRange?.from && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "dd MMM yyyy", { locale: idLocale })} -{" "}
                        {format(dateRange.to, "dd MMM yyyy", { locale: idLocale })}
                      </>
                    ) : (
                      format(dateRange.from, "dd MMM yyyy", { locale: idLocale })
                    )
                  ) : (
                    <span>Pilih rentang tanggal</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                usePortal={false}
                className="w-auto p-0"
                align="start"
              >
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={(range) => {
                    setDateRange(range);
                    if (range?.from && range?.to) {
                      setDateOpen(false);
                    }
                  }}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Daftar Peserta Guru</Label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/30 p-6 text-center transition-colors hover:border-blue-400 hover:bg-blue-50/50"
            >
              {pesertaFile ? (
                <>
                  <FileSpreadsheet className="h-8 w-8 text-blue-600" />
                  <span className="text-sm font-medium text-foreground">
                    {pesertaFile.name}
                  </span>
                </>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Tarik file .CSV ke sini atau{" "}
                    <b className="font-semibold text-blue-600">klik</b> untuk memilih file
                  </span>
                </>
              )}
            </button>
            <div className="text-center">
              <button
                type="button"
                onClick={downloadTemplate}
                className="text-sm font-medium text-blue-600 hover:underline"
              >
                Download Template Peserta Guru
              </button>
            </div>
          </div>

          {error && <p className="text-xs font-medium text-destructive">{error}</p>}

          <DialogFooter className="pt-2">
            <Button type="submit" disabled={isPending}>
              {isPending
                ? isEdit
                  ? "Menyimpan…"
                  : "Menambahkan…"
                : isEdit
                  ? "Simpan Perubahan"
                  : "Tambah Pelatihan Baru"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
