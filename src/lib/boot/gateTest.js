// ── DEV: uji modal gate tanpa backend ────────────────────────────────
// ?gatetest=suspended | pending | expired → paksa tampil LoginStatusModal.
// ?gatetest=payment_receipt | payment_amount | payment_account → modal
//   "Pembayaran Ditolak" (varian ikut sufiks setelah "payment_").
// ?gatetest=payment_review → modal "Pembayaran Sedang Kami Tinjau".
export function buildGateTestMeta(gatetest) {
  if (!gatetest) return null;
  if (gatetest === "suspended") {
    return {
      type: "suspended",
      until: "2026-08-14 13:05:00",
      reason: "Terlalu agresif dan mengandung SARA",
    };
  }
  if (gatetest === "rejected") {
    return {
      type: "rejected",
      reasons: [
        "Tanggal lahir tidak sesuai",
        "Riwayat pelatihan tidak ditemukan",
        "Nama sekolah tidak sesuai",
      ],
    };
  }
  if (gatetest.startsWith("payment") && gatetest !== "payment_review") {
    return {
      type: "payment_rejected",
      variant: gatetest.split("_")[1] || "receipt",
      amount: 1500000,
    };
  }
  return { type: gatetest };
}
