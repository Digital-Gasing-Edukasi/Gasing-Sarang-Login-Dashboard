import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import bgDesktop from "@/assets/dark-mode/Background-Desktop.png";
import { Logo } from "@/components/shared/Logo";
import { ProfileMenu } from "@/components/shared/ProfileMenu";
import { subscriptionApi } from "@/lib/api";
import { usePendingPaymentCheck } from "@/hooks/usePendingPaymentCheck";
import { formatRp } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronLeft, Loader2 } from "lucide-react";
import XenditPaymentForm from "@/components/payment/XenditPaymentForm";

const channels = {
  card: ["CARDS", "Kartu Kredit / Debit"],
  bri: ["BRI_DIRECT_DEBIT", "BRI Direct Debit"],
  ovo: ["OVO", "OVO"],
  dana: ["DANA", "DANA"],
  gopay: ["GOPAY", "GoPay"],
  shopeepay: ["SHOPEEPAY", "ShopeePay"],
  qris: ["QRIS", "QRIS"],
};

function channelCodeFor(item) {
  if (!item) return "";
  return (
    item.channelCode ||
    item.code ||
    channels[item.id]?.[0] ||
    String(item.id || "").toUpperCase()
  );
}

function channelLabelFor(item) {
  if (!item) return "";
  return item.name || channels[item.id]?.[1] || item.channelName || item.id;
}

const WALLET_CHANNELS = new Set(["ovo", "dana", "gopay", "shopeepay"]);
const isWalletChannel = (item) =>
  WALLET_CHANNELS.has(String(item?.id || item?.code || item?.channelCode || "").toLowerCase());


export default function XenditPaymentPage({
  user,
  packageId,
  onSignOut,
  onBack,
  onPaymentSuccess,
  onCheckoutManual,
  paymentId = null,
  resumeMethod = "",
}) {
  const navigate = useNavigate();
  const pendingCheck = usePendingPaymentCheck();
  const [pkg, setPkg] = useState(null);
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState("");
  const [session, setSession] = useState(null);
  const [orderId, setOrderId] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);
  const [guardLoading, setGuardLoading] = useState(true);
  useEffect(() => {
    if (!pendingCheck.loading) {
      setGuardLoading(false);
      if (pendingCheck.isPending && !paymentId) {
        navigate("/login/subscription/history", { replace: true });
      }
    }
  }, [navigate, paymentId, pendingCheck.isPending, pendingCheck.loading]);
  useEffect(() => {
    Promise.all([
      subscriptionApi.getPlans(),
      subscriptionApi.getXenditChannels(),
    ])
      .then(([plans, list]) => {
        console.log("subscriptionApi", {
          plans,
          list,
        });

        const found = (Array.isArray(plans) ? plans : plans.data || []).find(
          (p) => String(p.id) === String(packageId),
        );
        if (!found) throw new Error("Paket tidak ditemukan atau tidak aktif.");
        setPkg(found);
        const enabled = (Array.isArray(list) ? list : list.data || []).filter(
          (x) => x.enabled !== false,
        );
        setItems(enabled);
        const resumed = String(resumeMethod || "").toLowerCase();
        const resumeItem = resumed
          ? enabled.find(
              (item) =>
                String(item.id || "").toLowerCase() === resumed ||
                String(item.code || item.channelCode || "").toLowerCase() ===
                  resumed,
            )
          : null;
        setSelected(resumeItem?.id || enabled[0]?.id || "");
      })
      .catch((e) => setError(e.message));
  }, [packageId]);
  useEffect(() => {
    if (!paymentId) return;
    setBusy(true);
    subscriptionApi
      .resumeXenditOrder(paymentId)
      .then((resumed) => {
        setOrderId(paymentId);
        setSession(resumed.session || resumed.data?.session);
      })
      .catch((e) => setError(e.message))
      .finally(() => setBusy(false));
  }, [paymentId]);
  const pay = async () => {
    if (!selected || busy) return;
    setBusy(true);
    setError("");
    try {
      const result = await subscriptionApi.checkoutXenditComponents({
        packageId,
        channel: selected,
      });
      const id = result.order?.id || result.data?.order?.id || result.orderId;
      if (!id) throw new Error("Order pembayaran tidak lengkap.");
      const resumed = await subscriptionApi.resumeXenditOrder(id);
      setOrderId(id);
      setSession(resumed.session || resumed.data?.session);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const cancelPending = async () => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await subscriptionApi.cancelPending();
      navigate("/login/subscription/history", { replace: true });
    } catch (e) {
      setError(e.message || "Gagal membatalkan pembayaran.");
    } finally {
      setBusy(false);
    }
  };
  const walletItems = items.filter(isWalletChannel);
  const regularItems = items.filter((item) => !isWalletChannel(item));
  const renderChannel = (item) => (
    <button
      key={item.id}
      disabled={busy}
      onClick={() => setSelected(item.id)}
      className={cn(
        "text-left rounded-2xl border p-5",
        selected === item.id
          ? "border-[#8b7bff] bg-[#382274]"
          : "border-white/15 bg-white/5",
      )}
    >
      <strong>{channelLabelFor(item)}</strong>
      <span className="block text-sm text-white/55 mt-1">
        {item.enabled === false ? item.reason : "Bayar aman melalui Xendit"}
      </span>
    </button>
  );
  const packageSummary = (
    <>
      <h2 className="text-xl font-semibold">{pkg?.name}</h2>
      <div className="flex justify-between mt-8">
        <strong>Total Bayar</strong>
        <strong>Rp{formatRp(pkg?.price)}</strong>
      </div>
      {(paymentId || orderId) && (
        <button
          type="button"
          disabled={busy}
          onClick={cancelPending}
          className="mt-6 w-full rounded-full border border-[#ff5c72] py-2 text-[#ff7b8b] font-semibold disabled:opacity-50"
        >
          {busy ? "Memproses…" : "Batalkan Pembayaran"}
        </button>
      )}
    </>
  );
  const done = useCallback(async () => {
    if (!orderId) return;
    setBusy(true);
    setError("");
    let lastStatus = "pending";
    try {
      // Xendit completes the client session before the webhook necessarily
      // reaches our API. Give the backend time to settle the order instead of
      // treating the first pending response as a payment failure.
      for (let attempt = 0; attempt < 30; attempt += 1) {
        const response = await subscriptionApi.getXenditOrder(orderId);
        const order = response?.data || response;
        lastStatus = String(order?.status || "pending").toLowerCase();
        if (["paid", "completed", "success"].includes(lastStatus)) {
          onPaymentSuccess?.(pkg?.name);
          return;
        }
        if (
          ["failed", "expired", "canceled", "cancelled"].includes(lastStatus)
        ) {
          setError(
            "Pembayaran tidak berhasil. Silakan pilih metode pembayaran lain.",
          );
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 4000));
      }
      setError(
        `Pembayaran belum terkonfirmasi (${lastStatus}). Silakan cek status lagi.`,
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }, [onPaymentSuccess, orderId, pkg?.name]);
  const manual = () =>
    onCheckoutManual?.(
      {
        id: pkg.id,
        name: pkg.name,
        priceMonthly: pkg.price,
        priceTotal: null,
        billingCycle: "monthly",
      },
      null,
    );
  if (guardLoading || (pendingCheck.isPending && !paymentId)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0D0B2E] text-white">
        <Loader2 className="animate-spin" aria-label="Memuat pembayaran" />
      </div>
    );
  }
  return (
    <div
      className="min-h-screen relative overflow-hidden text-white"
      style={{
        backgroundImage: `url(${bgDesktop})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="relative z-10 max-w-6xl mx-auto px-5 py-6">
        <div className="flex justify-between items-center mb-10">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-white/70"
          >
            <ChevronLeft size={18} /> Kembali
          </button>
          <Logo />
          <ProfileMenu user={user} onSignOut={onSignOut} />
        </div>
        <h1 className="text-3xl font-bold">Pilih Metode Pembayaran</h1>
        {error && (
          <p role="alert" className="mt-5 text-[#ff9eaa]">
            {error}
          </p>
        )}
        {!pkg ? (
          <Loader2 className="animate-spin mt-8" />
        ) : session ? (
          <div className="mt-8 grid lg:grid-cols-[1.35fr_.85fr] gap-10 items-start">
            <div className="rounded-3xl border border-white/15 bg-white/10 p-6">
              <h2 className="text-xl font-semibold mb-5">
                Bayar dengan {channels[selected]?.[1] || selected}
              </h2>
              <XenditPaymentForm
                session={session}
                channelCode={channelCodeFor(
                  items.find((item) => item.id === selected) || {
                    id: selected,
                  },
                )}
                onDone={done}
              />
            </div>
            <aside className="rounded-3xl border border-white/15 bg-white/15 p-6">
              {packageSummary}
            </aside>
          </div>
        ) : (
          <div className="mt-8 grid lg:grid-cols-[1.35fr_.85fr] gap-10 items-start">
            <div className="grid gap-3">
              {regularItems.map(renderChannel)}
              {walletItems.length > 0 && (
                <div className="rounded-2xl border border-white/15 bg-white/5 overflow-hidden">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setWalletOpen((open) => !open)}
                    className="w-full flex items-center justify-between text-left p-5"
                  >
                    <span>
                      <strong>E-Wallet</strong>
                      <span className="block text-sm text-white/55 mt-1">OVO, DANA, GoPay, dan ShopeePay</span>
                    </span>
                    <ChevronDown size={20} className={cn("transition-transform", walletOpen && "rotate-180")} />
                  </button>
                  {walletOpen && <div className="grid gap-3 px-3 pb-3">{walletItems.map(renderChannel)}</div>}
                </div>
              )}
              <button
                onClick={manual}
                className="text-left rounded-2xl border border-white/15 p-5 bg-white/5"
              >
                <strong>Transfer Manual</strong>
                <span className="block text-sm text-white/55 mt-1">
                  Transfer ke rekening Sarang Gasing dan unggah bukti pembayaran
                </span>
              </button>
            </div>
            <aside className="rounded-3xl border border-white/15 bg-white/15 p-6">
              {packageSummary}
              <button
                className="bg-white text-black rounded-full py-2 w-full font-semibold mt-4"
                disabled={busy || !selected}
                onClick={pay}
              >
                {busy ? "Membuat pembayaran…" : "Lanjutkan Pembayaran"}
              </button>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
