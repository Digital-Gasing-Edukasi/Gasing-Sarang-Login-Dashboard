// src/pages/SubscriptionPage.jsx
import React, { useState, useEffect } from "react";
import { CheckCircle2, LogOut, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { subscriptionApi, tokenStorage } from "@/lib/api";

// ─── DATA DUMMY ───────────────────────────────────────────────────────────────
// Nanti diganti dengan data dari API /subscriptions/plans
const DUMMY_PLANS = [
  {
    id: "annual",
    name: "Tahunan",
    billingCycle: "annual",
    priceMonthly: 33000, // harga per bulan yang ditampilkan
    priceTotal: 400000, // total tagihan per tahun
    originalPrice: 39900, // harga coret (harga bulanan tanpa diskon)
    discount: 20, // persen hemat
    label: "Kamu Hemat 20%",
    recommended: true,
    planLabel: "Annual Visionary",
  },
  {
    id: "monthly",
    name: "Bulanan",
    billingCycle: "monthly",
    priceMonthly: 39900,
    priceTotal: null,
    originalPrice: null,
    discount: null,
    label: null,
    recommended: false,
    planLabel: "Monthly Visionary",
  },
];

const BENEFITS = [
  "Bergabung dan nikmati semua diskusi, materi, serta kolaborasi eksklusif di dalam komunitas.",
  "Belajar langsung dari sesi webinar rutin yang membahas topik-topik penting dan terbaru.",
  "Akses berbagai bonus konten materi spesial yang hanya tersedia untuk member.",
];

// Format harga ke Rupiah
function formatRp(n) {
  return new Intl.NumberFormat("id-ID").format(n);
}

// ─── AVATAR ──────────────────────────────────────────────────────────────────
function Avatar({ name = "" }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-semibold">
      {initials || "U"}
    </div>
  );
}

// ─── PLAN CARD ────────────────────────────────────────────────────────────────
function PlanCard({ plan, selected, onSelect }) {
  return (
    <div
      onClick={() => onSelect(plan.id)}
      className={cn(
        "relative rounded-2xl border-2 p-5 cursor-pointer transition-all duration-200 bg-white",
        selected
          ? "border-blue-500 shadow-md shadow-blue-100"
          : "border-gray-200 hover:border-gray-300",
      )}
    >
      {/* Badge hemat */}
      {plan.label && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="bg-cyan-400 text-white text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">
            {plan.label}
          </span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          {/* Nama paket */}
          <p
            className={cn(
              "text-base font-semibold mb-1",
              selected ? "text-blue-600" : "text-gray-700",
            )}
          >
            {plan.name}
          </p>

          {/* Harga */}
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">
              Rp{formatRp(plan.priceMonthly)}
            </span>
            <span className="text-sm text-gray-500">/bln</span>
            {plan.originalPrice && (
              <span className="text-sm text-red-400 line-through">
                Rp{formatRp(plan.originalPrice)}
              </span>
            )}
          </div>

          {/* Tagihan tahunan */}
          {plan.priceTotal && (
            <p className="text-xs text-gray-400 mt-1">
              Tagihan per-tahun Rp{formatRp(plan.priceTotal)}
            </p>
          )}
        </div>

        {/* Checkbox */}
        <div
          className={cn(
            "w-6 h-6 rounded flex items-center justify-center border-2 transition-all shrink-0",
            selected
              ? "bg-blue-600 border-blue-600"
              : "border-gray-300 bg-white",
          )}
        >
          {selected && (
            <svg
              className="w-3.5 h-3.5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function SubscriptionPage({ user, onSignOut }) {
  const [selectedPlan, setSelectedPlan] = useState("annual"); // default tahunan
  const [plans, setPlans] = useState(DUMMY_PLANS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Uncomment ini kalau backend sudah siap untuk fetch plans
  // useEffect(() => {
  //   subscriptionApi.getPlans()
  //     .then(data => setPlans(data))
  //     .catch(() => {}) // fallback ke dummy jika gagal
  // }, [])

  const handleCheckout = async () => {
    // ⚠️ BYPASS SEMENTARA — hapus block ini kalau endpoint sudah siap
    const params = new URLSearchParams({
      payment: "success",
      plan: encodeURIComponent(activePlan?.planLabel || activePlan?.name || ""),
    });
    window.location.href = `${window.location.pathname}?${params.toString()}`;
    return;
    // ⚠️ END BYPASS

    setError("");
    setLoading(true);
    try {
      // POST /subscriptions/checkout
      // ⚠️ Ganti planId sesuai field yang diharapkan backend
      const data = await subscriptionApi.checkout(selectedPlan);

      // Backend return redirectUrl → arahkan ke Midtrans
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        throw new Error("URL pembayaran tidak ditemukan");
      }
    } catch (e) {
      setError(e.message || "Gagal memproses pembayaran, coba lagi");
    } finally {
      setLoading(false);
    }
  };

  const activePlan = plans.find((p) => p.id === selectedPlan);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-100 relative overflow-hidden">
      {/* Decorative dashed lines background */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-30"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="dashed"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="#93c5fd"
              strokeWidth="0.5"
              strokeDasharray="4 4"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dashed)" />
      </svg>

      {/* Curved bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-t-[60px]" />

      {/* ── NAVBAR ── */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-4 bg-white/80 backdrop-blur border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">G</span>
          </div>
          <span className="font-semibold text-gray-900">Gasing Circle</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onSignOut}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <LogOut size={15} />
            Sign Out
          </button>
          <Avatar name={user?.name || user?.profile?.namaLengkap || ""} />
        </div>
      </nav>

      {/* ── CONTENT ── */}
      <div className="relative z-10 max-w-6xl mx-auto px-8 pt-16 pb-32 grid lg:grid-cols-2 gap-16 items-center">
        {/* Kiri — copywriting */}
        <div className="animate-fade-in-up">
          <span className="inline-block border border-blue-300 text-blue-600 text-xs font-medium px-3 py-1 rounded-full mb-6 bg-white/60">
            Satu Akses, Semua Benefit
          </span>
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-8">
            Berkembang Lebih
            <br />
            Cepat Bersama
            <br />
            Gasing Circle
          </h1>
          <ul className="space-y-4">
            {BENEFITS.map((b, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shrink-0 mt-0.5">
                  <svg
                    className="w-3.5 h-3.5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">{b}</p>
              </li>
            ))}
          </ul>
        </div>

        {/* Kanan — plan cards */}
        <div className="animate-fade-in-up delay-200 space-y-4">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              selected={selectedPlan === plan.id}
              onSelect={setSelectedPlan}
            />
          ))}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3.5 py-3 text-sm text-red-700">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* CTA Button */}
          <button
            onClick={handleCheckout}
            disabled={loading}
            className={cn(
              "w-full py-3.5 rounded-xl font-semibold text-white text-sm transition-all duration-200",
              "bg-blue-600 hover:bg-blue-700 active:scale-[0.98]",
              "disabled:opacity-60 disabled:cursor-not-allowed",
              "flex items-center justify-center gap-2",
            )}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Memproses...
              </>
            ) : (
              `Berlangganan ${activePlan?.name || ""} — Rp${formatRp(activePlan?.priceMonthly || 0)}/bln`
            )}
          </button>

          <p className="text-xs text-center text-gray-400">
            Pembayaran aman diproses oleh Midtrans
          </p>
        </div>
      </div>

      {/* Floating avatars dekoratif */}
      <div className="absolute top-32 right-16 w-12 h-12 rounded-full bg-gradient-to-br from-pink-300 to-rose-400 opacity-80 hidden lg:block" />
      <div className="absolute top-64 left-8 w-10 h-10 rounded-full bg-gradient-to-br from-amber-300 to-orange-400 opacity-80 hidden lg:block" />
      <div className="absolute bottom-40 right-8 w-11 h-11 rounded-full bg-gradient-to-br from-green-300 to-teal-400 opacity-80 hidden lg:block" />
    </div>
  );
}
