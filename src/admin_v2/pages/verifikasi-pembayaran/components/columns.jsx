import { CheckCircle2, MoreVertical, Trash2 } from "lucide-react";
import { Button } from "../../../components/ui/button.jsx";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../../components/ui/popover.jsx";
import { OverflowText } from "../../../components/OverflowText.jsx";
import { DeadlineCell } from "./DeadlineCell.jsx";
import { RoleBadge } from "../../../components/RoleBadge.jsx";
import { UserCell } from "../../../components/UserCell.jsx";
import {
  formatBirthdate,
  formatSessionDate,
  formatShortDate,
  formatUpdatedAt,
} from "../../../lib/format.js";

const text = (value) => (
  <OverflowText value={value} className="text-sm text-foreground" />
);

const voucherPill = (code) =>
  code ? (
    <span className="inline-flex items-center whitespace-nowrap rounded-full border border-blue-300 bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-500">
      {code}
    </span>
  ) : (
    text(null)
  );

const memberPill = (label) => (
  <span className="inline-flex items-center whitespace-nowrap rounded-full border border-orange-300 bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-700">
    {label}
  </span>
);

const PACKAGE_NAMES = { Yearly: "Tahunan", Monthly: "Bulanan" };

const unsubscribedColumns = [
  {
    key: "user",
    header: "Nama Pengguna",
    wrap: true,
    render: (u) => <UserCell name={u.name} username={u.username} />,
  },
  { key: "email", header: "Email", wrap: true, render: (u) => text(u.email) },
  { key: "member", header: "Status Member", render: () => memberPill("Belum Langganan") },
  {
    key: "voucher",
    header: "Kode Voucher",
    render: (u) => voucherPill(u.lastVoucher?.code),
  },
  {
    key: "role",
    header: "Role",
    render: (u) => <RoleBadge groupId={u.discourseGroupId} label={u.discourseGroup?.groupName} />,
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
    render: (u) => text(formatBirthdate(u.birthdate)),
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
    render: (u) => text(formatSessionDate(u.firstTrainingSession?.startDate?.local?.formatted)),
  },
  { key: "school", header: "Asal Sekolah", wrap: true, render: (u) => text(u.schoolName) },
  {
    key: "updated",
    header: "Last Updated",
    render: (u) => text(formatUpdatedAt(u.updatedAt?.local?.formatted)),
  },
];

const paymentColumns = (withMenu) => [
  {
    key: "user",
    header: "Nama Pengguna",
    wrap: true,
    render: (p) => <UserCell name={p.user?.name} username={p.user?.username} />,
  },
  { key: "email", header: "Email", wrap: true, render: (p) => text(p.user?.email) },
  {
    key: "deadline",
    header: "Deadline",
    render: (p) => <DeadlineCell createdAtUnix={p.createdAt?.unix} />,
  },
  {
    key: "member",
    header: "Status Member",
    render: () => memberPill("Pending Verifikasi Pembayaran"),
  },
  {
    key: "package",
    header: "Jenis Paket",
    render: (p) => text(PACKAGE_NAMES[p.package?.name] ?? p.package?.name),
  },
  {
    key: "period-end",
    header: "Tgl. Berakhir",
    render: (p) => text(formatShortDate(p.periodeEnd?.local?.formatted)),
  },
  {
    key: "uploaded",
    header: "Tgl. Upload",
    render: (p) => text(p.transferDate?.formatted),
  },
  withMenu
    ? {
      key: "action",
      header: "Action",
      render: (p, actions) => (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              type="button"
              aria-label={`Aksi pembayaran ${p.orderId ?? p.id}`}
            >
              <MoreVertical size={18} />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-1" align="end">
            <button
              type="button"
              onClick={() => actions?.onApprovePayment?.(p)}
              className="w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm text-green-700 hover:bg-accent hidden"
            >
              <CheckCircle2 size={16} className="shrink-0" />
              Setujui Pembayaran
            </button>
            <button
              type="button"
              onClick={() => actions?.onDeleteAccount?.(p)}
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm text-red-600 hover:bg-accent"
            >
              <Trash2 size={16} className="shrink-0" />
              Hapus Akun
            </button>
          </PopoverContent>
        </Popover>
      ),
    }
    : {
      key: "action",
      header: "Action",
      render: (p, actions) => (
        <Button size="sm" type="button" onClick={() => actions?.onConfirmPayment?.(p)}>
          Konfirmasi
        </Button>
      ),
    },
];

export function getPembayaranColumns(actions) {
  const bind = (cols) =>
    cols.map((col) => ({ ...col, render: (row) => col.render(row, actions) }));
  return {
    belum: bind(unsubscribedColumns),
    verifikasi: bind(paymentColumns(false)),
    ditolak: bind(paymentColumns(true)),
  };
}

