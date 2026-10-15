import { Button } from "../../../components/ui/button.jsx";
import { OverflowText } from "../../../components/OverflowText.jsx";
import { formatShortDate, formatUpdatedAt } from "../../../lib/format.js";
import { UserCell } from "../../../components/UserCell.jsx";

const text = (value) => (
  <OverflowText value={value} className="text-sm text-foreground" />
);

const codePill = (code) =>
  code ? (
    <span className="inline-flex items-center whitespace-nowrap rounded-full border border-blue-300 bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-500">
      {code}
    </span>
  ) : (
    text(null)
  );

const statusPill = (status) =>
  status ? (
    <span className="inline-flex items-center whitespace-nowrap rounded-full border border-orange-300 bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-700">
      {status}
    </span>
  ) : (
    text(null)
  );

const pendingVoucherColumns = [
  {
    key: "user",
    header: "Pengguna",
    wrap: true,
    render: (v) => <UserCell name={v.user?.name} username={v.user?.username} />,
  },
  { key: "email", header: "Email", wrap: true, render: (v) => text(v.user?.email) },
  {
    key: "code",
    header: "Kode Voucher",
    render: (v) => codePill(v.code),
  },
  { key: "label", header: "Label", wrap: true, render: (v) => text(v.label) },
  { key: "type", header: "Tipe", render: (v) => text(v.type) },
  {
    key: "status",
    header: "Status",
    render: (v) => statusPill(v.status),
  },
  {
    key: "created",
    header: "Dibuat",
    render: (v) => text(formatShortDate(v.createdAt?.local?.formatted)),
  },
  {
    key: "updated",
    header: "Last Updated",
    render: (v) => text(formatUpdatedAt(v.updatedAt?.local?.formatted)),
  },
  {
    key: "action",
    header: "Action",
    render: (v, actions) => (
      <Button size="sm" type="button" onClick={() => actions?.onConfirmVoucher?.(v)}>
        Konfirmasi
      </Button>
    ),
  },
];

export function getPendingVoucherColumns(actions) {
  return pendingVoucherColumns.map((col) => ({
    ...col,
    render: (row) => col.render(row, actions),
  }));
}
