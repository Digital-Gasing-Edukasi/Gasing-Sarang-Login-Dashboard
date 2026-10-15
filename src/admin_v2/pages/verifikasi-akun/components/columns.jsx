import { CheckCircle2, XCircle } from "lucide-react";
import { OverflowText } from "../../../components/OverflowText.jsx";
import {
  formatBirthdate,
  formatSessionDate,
  formatShortDate,
  formatTrainingPeriod,
} from "../../../lib/format.js";
import { RoleBadge } from "../../../components/RoleBadge.jsx";
import { StatusPill } from "../../../components/StatusPill.jsx";
import { UserCell } from "../../../components/UserCell.jsx";

const text = (value) => (
  <OverflowText value={value} className="text-sm text-foreground" />
);

const pendingColumns = [
  {
    key: "user",
    header: "Nama Pengguna",
    wrap: true,
    render: (u) => <UserCell name={u.name} username={u.username} />,
  },
  { key: "email", header: "Email", wrap: true, render: (u) => text(u.email) },
  {
    key: "status",
    header: "Status",
    render: (u) => <StatusPill value={u.verifiedStatus} />,
  },
  {
    key: "birthdate",
    header: "Tgl. Lahir",
    render: (u) => text(formatBirthdate(u.birthdate)),
  },
  { key: "region", header: "Lokasi", wrap: true, render: (u) => text(u.region?.regionName) },
  {
    key: "training-region",
    header: "Daerah",
    sub: "Alumni Pelatihan",
    wrap: true,
    render: (u) => text(u.firstTrainingRegion?.regionName),
  },
  {
    key: "training-period",
    header: "Tanggal Mulai",
    sub: "Alumni Pelatihan",
    render: (u) => text(formatTrainingPeriod(u.firstTrainingYear, u.firstTrainingMonth)),
  },
  { key: "school", header: "Asal Sekolah", wrap: true, render: (u) => text(u.schoolName) },
  {
    key: "approve",
    header: "Setuju?",
    render: (u, actions) => (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => actions?.onApprove?.(u)}
          aria-label={`Setujui ${u.name}`}
          title="Setujui"
          className="text-green-600 hover:bg-green-50 hover:text-green-700 rounded-full"
        >
          <CheckCircle2 size={24} />
        </button>
        <button
          type="button"
          onClick={() => actions?.onReject?.(u)}
          aria-label={`Tolak ${u.name}`}
          title="Tolak"
          className="text-red-600 hover:bg-red-50 hover:text-red-700 rounded-full"
        >
          <XCircle size={24} />
        </button>
      </div>
    ),
  },
];

export function getVerifikasiColumns(actions) {
  const bind = (cols) =>
    cols.map((col) => ({ ...col, render: (row) => col.render(row, actions) }));
  return bind(pendingColumns);
}
