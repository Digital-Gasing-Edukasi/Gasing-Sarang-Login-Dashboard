import { useState } from "react";
import { Download, Trash2 } from "lucide-react";
import { cn } from "../../lib/utils.js";
import { Button } from "../ui/button.jsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog.jsx";
import {
  EXPORT_CATEGORIES,
  OTHER_EXPORT_CATEGORY,
  exportCategoryOf,
  exportCategoryTitle,
} from "../../lib/api/index.js";
import { getJobProgress, useDownloads } from "../../stores/useDownloads.js";

const JOB_STATUS_STYLE = {
  PENDING: "border-orange-300 bg-orange-100 text-orange-700",
  ACTIVE: "border-blue-300 bg-blue-100 text-blue-700",
  COMPLETED: "border-green-300 bg-green-100 text-green-700",
  FAILED: "border-red-300 bg-red-100 text-red-700",
};

function JobStatusPill({ status }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-semibold",
        JOB_STATUS_STYLE[status] ?? "border-gray-300 bg-gray-100 text-gray-600",
      )}
    >
      {status}
    </span>
  );
}

function JobRow({ job }) {
  const progress = getJobProgress(job);
  const removeJob = useDownloads((s) => s.removeJob);
  const [confirming, setConfirming] = useState(false);

  if (job.status === "COMPLETED") {
    return (
      <div className="rounded-md border p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">{job.label}</p>
            <p className="truncate text-xs text-muted-foreground">
              {job.fileName || job.trackId}
            </p>
          </div>
          {!confirming && (
            <div className="flex shrink-0 items-center gap-1">
              {job.downloadUrl && (
                <a
                  href={job.downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Unduh"
                  title="Unduh"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-blue-600 hover:bg-blue-50"
                >
                  <Download size={16} />
                </a>
              )}
              <button
                type="button"
                aria-label="Hapus"
                title="Hapus"
                onClick={() => setConfirming(true)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-red-600 hover:bg-red-50"
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}
        </div>

        {confirming && (
          <div className="mt-3 flex items-center justify-end gap-2">
            <span className="text-xs text-muted-foreground">Yakin hapus?</span>
            <Button
              size="sm"
              variant="destructive"
              type="button"
              onClick={() => removeJob(job.trackId)}
            >
              Ya, hapus
            </Button>
            <Button
              size="sm"
              variant="ghost"
              type="button"
              onClick={() => setConfirming(false)}
            >
              Batal
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-md border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{job.label}</p>
          <p className="truncate text-xs text-muted-foreground">
            {job.fileName || job.trackId}
          </p>
        </div>
        <JobStatusPill status={job.status} />
      </div>

      <div
        className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Progres ${job.fileName || job.label}`}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all",
            job.status === "FAILED" ? "bg-red-500" : "bg-primary",
          )}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="truncate text-xs text-muted-foreground">
          {job.status === "FAILED"
            ? job.error || "Gagal di server."
            : (job.currentAction ?? `${progress}%`)}
        </p>
      </div>
    </div>
  );
}

export function DownloadsDialog() {
  const isDialogOpen = useDownloads((s) => s.isDialogOpen);
  const setDialogOpen = useDownloads((s) => s.setDialogOpen);
  const jobs = useDownloads((s) => s.jobs);
  const order = useDownloads((s) => s.order);
  const clearJobs = useDownloads((s) => s.clearJobs);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [confirmingClear, setConfirmingClear] = useState(false);

  const counts = {};
  for (const id of order) {
    if (!jobs[id]) continue;
    const category = exportCategoryOf(jobs[id].scope);
    counts[category] = (counts[category] ?? 0) + 1;
  }
  const visibleCategories = [
    ...EXPORT_CATEGORIES.filter((c) => counts[c.key] > 0),
    ...(counts[OTHER_EXPORT_CATEGORY.key] > 0 ? [OTHER_EXPORT_CATEGORY] : []),
  ];
  const activeCategory = visibleCategories.some((c) => c.key === selectedCategory)
    ? selectedCategory
    : (visibleCategories[0]?.key ?? null);
  const activeTitle = activeCategory ? exportCategoryTitle(activeCategory) : "";
  const activeOrder = activeCategory
    ? order.filter((id) => jobs[id] && exportCategoryOf(jobs[id].scope) === activeCategory)
    : [];

  const handleCategory = (key) => {
    setSelectedCategory(key);
    setConfirmingClear(false);
  };

  return (
    <Dialog
      open={isDialogOpen}
      onOpenChange={(open) => {
        if (!open) setConfirmingClear(false);
        setDialogOpen(open);
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Riwayat Unduhan</DialogTitle>
        </DialogHeader>

        {order.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Belum ada unduhan.
          </p>
        ) : (
          <>
            <div className="flex gap-1 border-b">
              {visibleCategories.map((c) => {
                const isActive = c.key === activeCategory;
                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => handleCategory(c.key)}
                    className={cn(
                      "flex items-center border-b-2 px-4 py-2 text-sm transition-colors",
                      isActive
                        ? "border-primary font-semibold text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {c.title}{" "}
                    <span className="ml-2 inline-flex min-w-6 items-center justify-center rounded-full bg-muted px-1.5 py-0.5 text-xs font-semibold text-muted-foreground">
                      {counts[c.key]}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="max-h-[60vh] space-y-3 overflow-y-auto">
              {activeOrder.map((id) =>
                jobs[id] ? <JobRow key={id} job={jobs[id]} /> : null,
              )}
            </div>
          </>
        )}

        {activeOrder.length > 0 && (
          <div className="flex justify-end">
            {confirmingClear ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {`Yakin hapus semua unduhan ${activeTitle}?`}
                </span>
                <Button
                  size="sm"
                  variant="destructive"
                  type="button"
                  onClick={() => {
                    clearJobs(activeCategory);
                    setConfirmingClear(false);
                  }}
                >
                  Ya, hapus semua
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  type="button"
                  onClick={() => setConfirmingClear(false)}
                >
                  Batal
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="outline"
                type="button"
                onClick={() => setConfirmingClear(true)}
                className="rounded-full text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <Trash2 size={14} />
                <span>Hapus semua</span>
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
