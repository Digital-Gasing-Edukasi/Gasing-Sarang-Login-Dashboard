import { Download, Pencil } from "lucide-react";
import { Button } from "../../../components/ui/button.jsx";
import { OverflowText } from "../../../components/OverflowText.jsx";
import { formatShortDate } from "../../../lib/format.js";

const text = (value) => (
  <OverflowText value={value} className="text-sm text-foreground" />
);

export function getRiwayatPelatihanColumns({ onEdit, onDownload, onViewParticipants } = {}) {
  return [
    {
      key: "name",
      header: "Nama Pelatihan",
      wrap: true,
      render: (s) => (
        <span className="text-sm font-semibold text-foreground">
          {s.name || "—"}
        </span>
      ),
    },
    {
      key: "region",
      header: "Daerah Pelatihan",
      wrap: true,
      render: (s) => text(s.region?.name),
    },
    {
      key: "startDate",
      header: "Tgl. Mulai",
      render: (s) => text(formatShortDate(s.startDate?.local?.formatted)),
    },
    {
      key: "participants",
      header: "Peserta",
      render: (s) => (
        <button
          type="button"
          onClick={() => onViewParticipants?.(s)}
          className="whitespace-nowrap text-sm font-medium text-blue-600 hover:underline"
        >
          {s.participantCount?.registered} / {s.participantCount?.total} peserta terdaftar
        </button>
      ),
    },
    {
      key: "updatedAt",
      header: "Last Updated",
      render: (s) => text(formatShortDate(s.updatedAt?.local?.formatted)),
    },
    {
      key: "actions",
      header: "Action",
      className: "text-center",
      render: (s) => (
        <div className="flex items-center justify-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            type="button"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => onEdit?.(s)}
            title="Edit"
          >
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Edit</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            type="button"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => onDownload?.(s)}
            title="Download"
          >
            <Download className="h-4 w-4" />
            <span className="sr-only">Download</span>
          </Button>
        </div>
      ),
    },
  ];
}
