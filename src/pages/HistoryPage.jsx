import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import bgDesktop from "@/assets/dark-mode/Background-Desktop.png";
import { Logo } from "@/components/shared/Logo";
import { ProfileMenu } from "@/components/shared/ProfileMenu";
import { subscriptionApi } from "@/lib/api";
import { formatRp } from "@/lib/format";
import { ChevronLeft, Loader2 } from "lucide-react";

const labels = {
  pending: "Menunggu Pembayaran",
  paid: "Berhasil",
  failed: "Gagal",
  expired: "Kedaluwarsa",
  receipt_uploaded: "Menunggu Verifikasi",
  waiting_verification: "Menunggu Verifikasi",
};

function statusLabel(item) {
  const status = String(item?.status || "").toLowerCase();
  const isManual = !item?.pgMethod && String(item?.paymentMethod || "").toLowerCase() !== "xendit";
  if (status === "pending" && isManual) return "Menunggu Konfirmasi Admin";
  return labels[status] || item?.status || "-";
}

export default function HistoryPage({ user, onSignOut, onBack, onCheckoutManual }) {
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState(null);
  const navigate = useNavigate();
  useEffect(() => {
    let live = true;
    setResult(null);
    subscriptionApi
      .paymentHistory(page, 20)
      .then((data) => live && setResult(data))
      .catch((e) => live && setError(e.message))
      .finally(() => live && setResult((current) => current || { items: [] }));
    return () => {
      live = false;
    };
  }, [page]);
  const items = result?.items || result?.data || [];
  const openPayment = (item) => {
    const status = String(item.status || "").toLowerCase();
    if (["pending", "waiting", "receipt_uploaded", "waiting_verification", "uploaded"].includes(status)) {
      if (String(item.paymentMethod || "").toLowerCase() === "xendit" || item.pgMethod) {
        navigate(`/login/subscription/payment/${item.packageId}?paymentId=${encodeURIComponent(item.id)}&method=${encodeURIComponent(item.pgMethod || item.paymentMethod || "")}`);
      } else {
        onCheckoutManual?.(
          {
            id: item.packageId || item.package?.id,
            name: item.package?.name || item.packageName || "Paket Langganan",
            billingCycle: item.package?.durationUnit === "year" ? "annual" : "monthly",
            months: item.package?.duration || 1,
            priceTotal: item.package?.price || item.amount || 0,
            priceMonthly: item.package?.durationUnit === "year"
              ? Math.round((item.package?.price || item.amount || 0) / 12)
              : item.package?.price || item.amount || 0,
          },
          item,
        );
      }
      return;
    }
    if (["paid", "success", "completed"].includes(status)) setReceipt(item);
  };
  return (
    <div
      className="min-h-screen text-white relative overflow-hidden"
      style={{
        backgroundImage: `url(${bgDesktop})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="relative z-10 max-w-5xl mx-auto px-5 py-6">
        <div className="flex items-center justify-between mb-12">
          <Logo />
          <ProfileMenu user={user} onSignOut={onSignOut} />
        </div>
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-white/70 mb-6"
        >
          <ChevronLeft size={18} /> Kembali ke Home
        </button>
        <p className="text-sm tracking-[.2em] text-white/55">
          SEMUA TERCATAT DI SINI
        </p>
        <h1 className="text-3xl font-bold mt-2">Riwayat Pembayaran</h1>
        <p className="text-white/60 mt-2">
          Termasuk pembayaran melalui semua metode.
        </p>
        {error && (
          <p role="alert" className="text-[#ff9eaa] mt-6">
            {error}
          </p>
        )}
        {!result && !error && <Loader2 className="animate-spin mt-8" />}
        {result && (
          <div className="mt-8 grid gap-3">
            {items.map((item) => (
              <button
                type="button"
                key={item.id || item.paymentId || item.orderId}
                onClick={() => openPayment(item)}
                className="rounded-2xl border border-white/15 bg-white/10 p-5 flex flex-wrap items-center gap-4 justify-between"
              >
                <div>
                  <strong>
                    {item.package?.name ||
                      item.packageName ||
                      "Paket Langganan"}
                  </strong>
                  <p className="text-sm text-white/50 mt-1">
                    {item.invoiceNumber || item.orderId || item.id}
                  </p>
                </div>
                <span className="text-sm text-white/70">
                  {statusLabel(item)}
                </span>
                <strong>
                  Rp{formatRp(item.amount || item.package?.price || 0)}
                </strong>
              </button>
            ))}
            {items.length === 0 && (
              <div className="rounded-2xl border border-white/15 bg-white/10 p-6">
                Belum ada transaksi.
              </div>
            )}
          </div>
        )}
        {receipt && (
          <div className="mt-8 rounded-3xl border border-white/15 bg-white/10 p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-white/55">Bukti Pembayaran</p>
                <h2 className="text-xl font-semibold mt-1">Pembayaran Berhasil</h2>
              </div>
              <button type="button" onClick={() => setReceipt(null)} className="text-white/60">Tutup</button>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 mt-6 text-sm">
              <div><p className="text-white/50">Paket</p><strong>{receipt.package?.name || "Paket Langganan"}</strong></div>
              <div><p className="text-white/50">Total Pembayaran</p><strong>Rp{formatRp(receipt.amount)}</strong></div>
              <div><p className="text-white/50">Nomor Invoice</p><strong>{receipt.invoiceNumber || receipt.orderId || receipt.id}</strong></div>
              <div><p className="text-white/50">Tanggal Pembayaran</p><strong>{receipt.paidAt?.local?.formatted || receipt.paidAt?.utc?.formatted || receipt.paidAt || "-"}</strong></div>
            </div>
          </div>
        )}
        <div className="flex items-center justify-center gap-6 mt-8">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="text-white/70 disabled:opacity-40"
          >
            ← Sebelumnya
          </button>
          <span>Halaman {page}</span>
          <button
            disabled={!result || items.length < 20}
            onClick={() => setPage(page + 1)}
            className="text-white/70 disabled:opacity-40"
          >
            Berikutnya →
          </button>
        </div>
      </div>
    </div>
  );
}
