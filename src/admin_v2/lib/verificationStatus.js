// User `verifiedStatus` → pill label + theme. Shared by every v2 page.
export const VERIFIED_STATUS_META = {
  0: { label: "Pending", className: "border-pink-300 bg-pink-100 text-pink-700" },
  1: { label: "Disetujui", className: "border-green-300 bg-green-100 text-green-700" },
  2: {
    label: "Ditolak - Registrasi Ulang",
    className: "border-red-300 bg-red-100 text-red-700",
  },
  3: {
    label: "Pending Voucher Setup",
    className: "border-orange-300 bg-orange-100 text-orange-700",
  },
  "-1": {
    label: "Ditolak - Permanen",
    className: "border-red-900 bg-red-900 text-red-50",
  },
};

export const UNKNOWN_STATUS_META = {
  label: "Unknown",
  className: "border-gray-300 bg-gray-100 text-gray-600",
};

export function getVerifiedStatusMeta(value) {
  return VERIFIED_STATUS_META[value] ?? UNKNOWN_STATUS_META;
}
