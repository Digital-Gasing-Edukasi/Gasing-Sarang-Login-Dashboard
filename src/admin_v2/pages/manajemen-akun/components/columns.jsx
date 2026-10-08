import {
  MoreVertical,
  PauseCircle,
  RotateCcw,
  Trash2,
  Undo2,
  UserCog,
} from "lucide-react";
import { Button } from "../../../components/ui/button.jsx";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../../components/ui/popover.jsx";
import { OverflowText } from "../../../components/OverflowText.jsx";
import {
  formatBirthdate,
  formatSessionDate,
  formatShortDate,
  formatUpdatedAt,
} from "../../../lib/format.js";
import { RoleBadge } from "../../../components/RoleBadge.jsx";
import { StatusPill } from "../../../components/StatusPill.jsx";
import { UserCell } from "../../../components/UserCell.jsx";

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

const memberPill = (label, className) => (
  <span
    className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold ${className}`}
  >
    {label}
  </span>
);

const PACKAGE_NAMES = { Yearly: "Tahunan", Monthly: "Bulanan" };

const SUBSCRIPTION_META = {
  active: { label: "active", className: "border-green-300 bg-green-100 text-green-700" },
  expired: { label: "expired", className: "border-red-300 bg-red-100 text-red-700" },
};

const subscriptionPill = (status) => {
  const meta = SUBSCRIPTION_META[status];
  return meta ? memberPill(meta.label, meta.className) : text(status);
};

const historyCell = (u, actions) => (
  <>
    <span className="mr-2 font-semibold">{u.numTrainings}</span>
    <a
      onClick={() => actions?.onShowHistory?.(u)}
      className="cursor-pointer whitespace-nowrap text-sm font-medium text-blue-600 hover:underline"
    >
      Lihat Detail
    </a>
  </>
);

const alumniColumns = [
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
    render: (u) => text(formatSessionDate(u.firstTrainingSession?.startDate?.utc?.formatted)),
  },
];

const identityColumns = [
  {
    key: "user",
    header: "Nama Pengguna",
    wrap: true,
    render: (u) => <UserCell name={u.name} username={u.username} />,
  },
  { key: "email", header: "Email", wrap: true, render: (u) => text(u.email) },
];

const accountColumns = [
  {
    key: "birthdate",
    header: "Tgl. Lahir",
    render: (u) => text(formatBirthdate(u.birthdate)),
  },
  { key: "region", header: "Lokasi", wrap: true, render: (u) => text(u.region?.regionName) },
  ...alumniColumns,
  { key: "school", header: "Asal Sekolah", wrap: true, render: (u) => text(u.schoolName) },
  {
    key: "updated",
    header: "Last Updated",
    render: (u) => text(formatUpdatedAt(u.updatedAt?.utc?.formatted)),
  },
];

const subscriptionColumns = [
  {
    key: "subscription",
    header: "Langganan",
    render: (u) => subscriptionPill(u.subscription?.status),
  },
  {
    key: "package",
    header: "Jenis Paket",
    render: (u) =>
      text(PACKAGE_NAMES[u.subscription?.package?.name] ?? u.subscription?.package?.name),
  },
  {
    key: "period-end",
    header: "Tgl. Berakhir",
    render: (u) => text(formatShortDate(u.subscription?.endDate?.utc?.formatted)),
  },
  {
    key: "voucher",
    header: "Kode Voucher",
    render: (u) => voucherPill(u.lastVoucher?.code),
  },
  {
    key: "role",
    header: "Role",
    render: (u) => (
      <RoleBadge groupId={u.discourseGroupId} label={u.discourseGroup?.groupName} />
    ),
  },
];

const MENU_TONES = {
  default: "",
  amber: "text-amber-700",
  green: "text-green-700",
  red: "text-red-600",
};

// items: [{ key, label, Icon, tone, show = true, onSelect }]
function ActionMenu({ user, actions, items }) {
  const visible = items.filter((item) =>
    typeof item.show === "function" ? item.show(user) : item.show !== false,
  );
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          type="button"
          aria-label={`Aksi akun ${user.name}`}
        >
          <MoreVertical size={18} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-1" align="end">
        {visible.map(({ key, label, Icon, tone = "default", onSelect }) => (
          <button
            key={key}
            type="button"
            onClick={() => onSelect?.(user, actions)}
            className={`flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent ${MENU_TONES[tone]}`}
          >
            <Icon size={16} className="shrink-0" />
            {label}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

const actionColumn = (items) => ({
  key: "action",
  header: "Action",
  render: (u, actions) => <ActionMenu user={u} actions={actions} items={items} />,
});

const disetujuiColumns = [
  ...identityColumns,
  {
    key: "member-status",
    header: "Status Member",
    render: (u) => <StatusPill value={u.verifiedStatus} />,
  },
  ...subscriptionColumns,
  {
    key: "training-history",
    header: "Riwayat Pelatihan",
    render: historyCell,
  },
  ...accountColumns,
  actionColumn([
    { key: "change-role", label: "Ubah Role", Icon: UserCog, onSelect: (u, a) => a?.onChangeRole?.(u) },
    { key: "suspend", label: "Tangguhkan Akun", Icon: PauseCircle, tone: "amber", onSelect: (u, a) => a?.onSuspendAccount?.(u) },
    { key: "delete", label: "Hapus Akun", Icon: Trash2, tone: "red", onSelect: (u, a) => a?.onDeleteAccount?.(u) },
  ]),
];

const ditolakColumns = [
  ...identityColumns,
  {
    key: "member-status",
    header: "Status Member",
    render: (u) => <StatusPill value={u.verifiedStatus} />,
  },
  {
    key: "birthdate",
    header: "Tgl. Lahir",
    render: (u) => text(formatBirthdate(u.birthdate)),
  },
  { key: "region", header: "Lokasi", wrap: true, render: (u) => text(u.region?.regionName) },
  { key: "school", header: "Asal Sekolah", wrap: true, render: (u) => text(u.schoolName) },
  {
    key: "updated",
    header: "Last Updated",
    render: (u) => text(formatUpdatedAt(u.updatedAt?.utc?.formatted)),
  },
  actionColumn([
    {
      key: "reverify",
      label: "Verifikasi Ulang",
      Icon: RotateCcw,
      tone: "green",
      show: (u) => u.verifiedStatus === -1,
      onSelect: (u, a) => a?.onReverify?.(u),
    },
    { key: "delete", label: "Hapus Akun", Icon: Trash2, tone: "red", onSelect: (u, a) => a?.onDeleteAccount?.(u) },
  ]),
];

const ditangguhkanColumns = [
  ...identityColumns,
  {
    key: "member-status",
    header: "Status Member",
    render: () =>
      memberPill("Ditangguhkan", "border-orange-300 bg-orange-100 text-orange-700"),
  },
  ...subscriptionColumns,
  {
    key: "training-history",
    header: "Riwayat Pelatihan",
    render: historyCell,
  },
  ...accountColumns,
  actionColumn([
    { key: "restore", label: "Pulihkan Akun", Icon: Undo2, tone: "green", onSelect: (u, a) => a?.onRestoreAccount?.(u) },
    { key: "delete", label: "Hapus Akun", Icon: Trash2, tone: "red", onSelect: (u, a) => a?.onDeleteAccount?.(u) },
  ]),
];

const dihapusColumns = [
  ...identityColumns,
  {
    key: "member-status",
    header: "Status Member",
    render: () =>
      memberPill("Baru Dihapus", "border-red-300 bg-red-100 text-red-700"),
  },
  {
    key: "delete-at",
    header: "Akan Dihapus pada",
    render: (u) => text(formatShortDate(u.deletion?.will_be_deleted_at?.utc?.formatted)),
  },
  ...accountColumns,
  actionColumn([
    { key: "restore", label: "Pulihkan Akun", Icon: Undo2, tone: "green", onSelect: (u, a) => a?.onRestoreAccount?.(u) },
    { key: "delete", label: "Hapus Akun", Icon: Trash2, tone: "red", onSelect: (u, a) => a?.onDeleteAccount?.(u) },
  ]),
];

export function getManajemenColumns(actions) {
  const bind = (cols) =>
    cols.map((col) => ({ ...col, render: (row) => col.render(row, actions) }));
  return {
    disetujui: bind(disetujuiColumns),
    ditolak: bind(ditolakColumns),
    ditangguhkan: bind(ditangguhkanColumns),
    dihapus: bind(dihapusColumns),
  };
}
