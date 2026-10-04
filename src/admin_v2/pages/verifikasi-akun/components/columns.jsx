import { Button } from "../../../components/ui/button.jsx";
import { OverflowText } from "../../../components/OverflowText.jsx";
import { formatShortDate, formatTrainingPeriod } from "../../../lib/format.js";
import { RoleBadge } from "./RoleBadge.jsx";
import { StatusPill } from "./StatusPill.jsx";
import { UserCell } from "./UserCell.jsx";

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
  { key: "approve", header: "Setuju?", render: () => null },
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
    // Detail dialog comes later — anchor only for now.
    render: () => (
      <a className="cursor-pointer whitespace-nowrap text-sm font-medium text-blue-600 hover:underline">
        Lihat Detail
      </a>
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
    // Confirm flow comes later — no-op for now.
    render: () => (
      <Button size="sm" type="button" onClick={() => {}}>
        Konfirmasi
      </Button>
    ),
  },
];

export const VERIFIKASI_COLUMNS = {
  pending: pendingColumns,
  voucher: voucherColumns,
};
