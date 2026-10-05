import { Download } from "lucide-react";
import { Button } from "../ui/button.jsx";
import { useDownloads } from "../../stores/useDownloads.js";

// Starts a scoped export (one trackId → background polling → history).
export function ExportButton({ scope, className }) {
  const starting = useDownloads((s) => s.starting);
  const startExport = useDownloads((s) => s.startExport);

  return (
    <Button
      type="button"
      onClick={() => startExport(scope)}
      disabled={starting}
      className={className}
    >
      <Download size={16} />
      <span>Export</span>
    </Button>
  );
}
