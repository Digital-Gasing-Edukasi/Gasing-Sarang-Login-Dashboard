import { DownloadCloud } from "lucide-react";
import { cn } from "../../lib/utils.js";
import { Button } from "../ui/button.jsx";
import { useDownloads } from "../../stores/useDownloads.js";

// Header-end trigger → opens the downloads dialog. Bounces while a job is
// active; blue dot marks unseen finished downloads.
export function DownloadsTrigger() {
  const jobs = useDownloads((s) => s.jobs);
  const order = useDownloads((s) => s.order);
  const hasNew = useDownloads((s) => s.hasNew);
  const setDialogOpen = useDownloads((s) => s.setDialogOpen);

  const hasActive = order.some(
    (id) => jobs[id] && (jobs[id].status === "PENDING" || jobs[id].status === "ACTIVE"),
  );

  return (
    <Button
      variant="ghost"
      size="icon"
      type="button"
      aria-label="Riwayat unduhan"
      onClick={() => setDialogOpen(true)}
      className="relative border"
    >
      <DownloadCloud size={18} className={cn(hasActive && "animate-bounce")} />
      {hasNew && (
        <span
          aria-label="Ada unduhan baru yang selesai"
          className="absolute -top-2 -right-2 h-5 w-5 rounded-full border-2 border-background bg-blue-500"
        />
      )}
    </Button>
  );
}
