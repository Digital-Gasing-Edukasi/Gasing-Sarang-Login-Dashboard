import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "../../../components/ui/button.jsx";
import { OverflowText } from "../../../components/OverflowText.jsx";
import { formatShortDate, formatTrainingPeriod } from "../../../lib/format.js";
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
    render: (u) => text(u.birthdate?.formatted),
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
    header: "Bulan & Tahun",
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

const voucherColumns = [
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
    key: "voucher",
    header: "Kode Voucher",
    render: (u) =>
      u.lastVoucher?.code ? (
        <span className="inline-flex items-center whitespace-nowrap rounded-full border border-blue-300 bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-500">
          {u.lastVoucher.code}
        </span>
      ) : (
        text(null)
      ),
  },
  {
    key: "role",
    header: "Role",
    render: (u) => (
      <RoleBadge groupId={u.discourseGroupId} label={u.discourseGroup?.groupName} />
    ),
  },
  {
    key: "training-history",
    header: "Riwayat Pelatihan",
    render: (u, actions) => (
      <>
        <span className="mr-2 font-semibold">{u.numTrainings}</span>
        <a
          onClick={() => actions?.onShowHistory?.(u)}
          className="cursor-pointer whitespace-nowrap text-sm font-medium text-blue-600 hover:underline"
        >
          Lihat Detail
        </a>
      </>
    ),
  },
  {
    key: "birthdate",
    header: "Tgl. Lahir",
    render: (u) => text(u.birthdate?.formatted),
  },
  { key: "region", header: "Lokasi", wrap: true, render: (u) => text(u.region?.regionName) },
  {
    key: "session-name",
    header: "Nama",
    sub: "Alumni Pelatihan",
    wrap: true,
    render: (u) => text(u.firstTrainingSession?.name),
  },
  {
    key: "training-region",
    header: "Daerah",
    sub: "Alumni Pelatihan",
    wrap: true,
    render: (u) => text(u.firstTrainingRegion?.regionName),
  },
  {
    key: "session-start",
    header: "Tanggal Mulai",
    sub: "Alumni Pelatihan",
    render: (u) => text(formatShortDate(u.firstTrainingSession?.startDate?.utc?.formatted)),
  },
  { key: "school", header: "Asal Sekolah", wrap: true, render: (u) => text(u.schoolName) },
  {
    key: "action",
    header: "Action",
    render: (u, actions) => (
      <Button
        size="sm"
        type="button"
        onClick={() => actions?.onConfirmVoucher?.(u)}
      >
        Konfirmasi
      </Button>
    ),
  },
];

export function getVerifikasiColumns(actions) {
  const bind = (cols) =>
    cols.map((col) => ({ ...col, render: (row) => col.render(row, actions) }));
  return { pending: bind(pendingColumns), voucher: bind(voucherColumns) };
}
