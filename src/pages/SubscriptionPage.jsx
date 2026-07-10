// src/pages/SubscriptionPage.jsx
import { useState, useEffect } from "react";
import { LogOut, Loader2, AlertCircle, Users, Video, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { subscriptionApi } from "@/lib/api";

import waveLeft from "@/assets/subscription/wave_blue_left.png";
import waveRight from "@/assets/subscription/wave_blue_right.png";
import iconBook from "@/assets/subscription/icon_book.png";
import iconLightbulb from "@/assets/subscription/icon_lightbulb.png";
import iconPlane from "@/assets/subscription/icon_plane.png";
import iconThumbsup from "@/assets/subscription/icon_thumbsup.png";
import iconStarsBlue from "@/assets/subscription/icon_stars_blue.png";
import iconStarsYellow from "@/assets/subscription/icon_stars_yellow.png";
import stripeGreenOne from "@/assets/subscription/icon_stripe_green_one.png";
import stripeGreenTwo from "@/assets/subscription/icon_stripe_green_two.png";
// Ambil angka positif pertama dari beberapa kemungkinan field (nama field
// diskon backend belum final — coba beberapa alias umum).
function pickNumber(...vals) {
  for (const v of vals) {
    const n = Number(v);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
}

// Transform API package response → UI plan format
function transformPlan(pkg) {
  const isAnnual =
    pkg.durationUnit === "year" ||
    (pkg.durationUnit === "month" && pkg.duration >= 12);
  const months =
    pkg.durationUnit === "year" ? pkg.duration * 12 : pkg.duration || 1;

  // Field diskon/harga-coret bila backend menyediakannya (fallback: dihitung
  // di withComparison dengan membandingkan paket tahunan vs bulanan).
  const explicitDiscount = pickNumber(
    pkg.discountPercentage, pkg.discountPercent, pkg.discount, pkg.savePercentage
  );
  const explicitOriginal = pickNumber(
    pkg.originalPrice, pkg.normalPrice, pkg.strikePrice, pkg.priceBeforeDiscount
  );

  if (isAnnual) {
    return {
      id: pkg.id,
      name: pkg.name,
      billingCycle: "annual",
      priceMonthly: Math.round(pkg.price / months),
      priceTotal: pkg.price,
      originalPrice: explicitOriginal,
      discount: explicitDiscount,
      label: explicitDiscount ? `Kamu Hemat ${explicitDiscount}%` : null,
      recommended: true,
      planLabel: pkg.name,
    };
  }
  return {
    id: pkg.id,
    name: pkg.name,
    billingCycle: "monthly",
    priceMonthly: pkg.price,
    priceTotal: null,
    originalPrice: explicitOriginal,
    discount: explicitDiscount,
    label: null,
    recommended: false,
    planLabel: pkg.name,
  };
}

// Lengkapi harga-coret & label "Kamu Hemat X%" paket tahunan dengan
// membandingkan harga per-bulan efektifnya terhadap paket bulanan. Hanya
// mengisi bila backend belum menyediakan angka diskon eksplisit.
function withComparison(plans) {
  const monthly = plans.find((p) => p.billingCycle === "monthly");
  if (!monthly) return plans;

  return plans.map((p) => {
    if (p.billingCycle !== "annual") return p;

    const originalPrice = p.originalPrice ?? monthly.priceMonthly;
    let discount = p.discount;
    if (!discount && originalPrice > p.priceMonthly) {
      discount = Math.round((1 - p.priceMonthly / originalPrice) * 100);
    }
    return {
      ...p,
      originalPrice,
      discount: discount || null,
      label: discount ? `Kamu Hemat ${discount}%` : p.label,
    };
  });
}

// ─── DATA DUMMY (fallback jika API tidak tersedia) ────────────────────────────
const DUMMY_PLANS = [
  {
    id: "dummy-annual",
    name: "Tahunan",
    billingCycle: "annual",
    priceMonthly: 33000,
    priceTotal: 396000,
    originalPrice: 39900,
    discount: 20,
    label: "Kamu Hemat 20%",
    recommended: true,
    planLabel: "Tahunan",
  },
  {
    id: "dummy-monthly",
    name: "Bulanan",
    billingCycle: "monthly",
    priceMonthly: 39900,
    priceTotal: null,
    originalPrice: null,
    discount: null,
    label: null,
    recommended: false,
    planLabel: "Bulanan",
  },
];

const BENEFITS = [
  {
    icon: Users,
    text: "Ikut diskusi dan belajar materi matematika dan AI bersama guru-guru dari seluruh Indonesia!",
  },
  {
    icon: Video,
    text: "Hadiri webinar interaktif dan bahas topik-topik edukasi terkini bersama guru-guru terbaik Indonesia.",
  },
  {
    icon: BookOpen,
    text: "Akses berbagai konten eksklusif untuk membantu pengajaran matematika yang asyik dan menyenangkan.",
  },
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
    <div className="w-9 h-9 rounded-full bg-[#fce4e4] text-red-500 flex items-center justify-center text-sm font-semibold">
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
        "relative rounded-[24px] border-2 p-8 cursor-pointer transition-all duration-300 bg-white",
        selected
          ? "border-blue-600 shadow-[0_0_40px_rgba(59,130,246,0.15)]"
          : "border-gray-200 hover:border-gray-300"
      )}
    >
      {/* Badge hemat mengambang di atas kartu */}
      {plan.label && (
        <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#4b7bff] to-[#48b2ff] text-white text-[13px] font-semibold px-4 py-1.5 rounded-full whitespace-nowrap shadow-sm">
          {plan.label}
        </span>
      )}

      <div className="flex items-center justify-between">
        <div>
          {/* Nama paket */}
          <div className="mb-3">
            <p className="text-gray-500 text-[15px] font-semibold">
              {plan.name}
            </p>
          </div>

          {/* Harga */}
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-[32px] font-bold text-gray-900 leading-none">
              Rp{formatRp(plan.priceMonthly)}
            </span>
            <span className="text-sm font-medium text-gray-900">/bln</span>
            {plan.originalPrice && (
              <span className="text-sm font-medium text-red-400 line-through ml-1">
                Rp{formatRp(plan.originalPrice)}
              </span>
            )}
          </div>

          {/* Tagihan tahunan */}
          <div className="min-h-[20px]">
            {plan.priceTotal && (
              <p className="text-xs font-medium text-gray-400">
                Tagihan per-tahun Rp{formatRp(plan.priceTotal)}
              </p>
            )}
          </div>
        </div>

        {/* Checkbox */}
        <div
          className={cn(
            "w-7 h-7 rounded-md flex items-center justify-center border-[2px] transition-all shrink-0 ml-4",
            selected
              ? "bg-blue-600 border-blue-600"
              : "border-gray-200 bg-white"
          )}
        >
          {selected && (
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MOBILE PLAN CARD (tema gelap, sesuai reference mobile) ───────────────────
function MobilePlanCard({ plan, selected, onSelect }) {
  return (
    <div
      onClick={() => onSelect(plan.id)}
      className={cn(
        "relative rounded-[22px] border p-5 cursor-pointer transition-all duration-300",
        selected
          ? "border-[#8b7bff] bg-white/[0.06] shadow-[0_0_30px_rgba(124,58,237,0.25)]"
          : "border-white/10 bg-white/[0.03]"
      )}
    >
      {plan.label && (
        <span className="absolute -top-3 right-4 bg-gradient-to-r from-[#4b7bff] to-[#48b2ff] text-white text-[11px] font-semibold px-3 py-1 rounded-full whitespace-nowrap shadow-sm">
          {plan.label}
        </span>
      )}
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-white/60 text-[13px] font-semibold mb-1.5">{plan.name}</p>
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-[26px] font-bold text-white leading-none">
              Rp{formatRp(plan.priceMonthly)}
            </span>
            <span className="text-[13px] font-medium text-white/70">/bln</span>
            {plan.originalPrice && (
              <span className="text-[13px] font-medium text-red-300/80 line-through">
                Rp{formatRp(plan.originalPrice)}
              </span>
            )}
          </div>
          {plan.priceTotal && (
            <p className="text-[11px] font-medium text-white/40 mt-1.5">
              Tagihan per-tahun Rp{formatRp(plan.priceTotal)}
            </p>
          )}
        </div>
        <div
          className={cn(
            "w-6 h-6 rounded-md flex items-center justify-center border-2 transition-all shrink-0 ml-3",
            selected ? "bg-[#6366f1] border-[#6366f1]" : "border-white/25 bg-transparent"
          )}
        >
          {selected && (
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── BACKGROUND DECORATIONS ──────────────────────────────────────────────────
function Decorations() {
  return (
    <>
      {/* Background putih */}
      <div className="absolute inset-0 bg-white pointer-events-none -z-20" />
      
      {/* Left and Right Waves */}
      <img src={waveLeft} className="absolute bottom-0 left-0 w-full sm:w-[45%] lg:w-[40%] object-contain object-bottom pointer-events-none -z-10" alt="" />
      <img src={waveRight} className="absolute bottom-0 right-0 w-full sm:w-[45%] lg:w-[40%] object-contain object-bottom pointer-events-none -z-10" alt="" />

      {/* Floating Elements */}
      <img src={iconBook} className="absolute w-[clamp(60px,7vw,140px)] bottom-[clamp(20px,8vh,100px)] left-[clamp(16px,4.6vw,80px)] object-contain pointer-events-none z-0" alt="" />
      <img src={iconPlane} className="absolute w-[clamp(90px,9.9vw,202px)] bottom-[clamp(10px,2vh,40px)] left-1/2 -translate-x-1/2 object-contain pointer-events-none -z-10" alt="" />
      <img src={iconLightbulb} className="absolute w-[clamp(60px,7.3vw,140px)] top-[clamp(60px,20vh,200px)] left-[clamp(16px,3.5vw,80px)] object-contain pointer-events-none z-0" alt="" />
      <img src={iconStarsBlue} className="absolute w-[clamp(45px,5.3vw,100px)] top-[clamp(40px,10vh,120px)] left-[45%] object-contain pointer-events-none -z-10" alt="" />
      <img src={iconStarsYellow} className="absolute w-[clamp(152px,19.6vw,374px)] bottom-[clamp(60px,16vh,180px)] right-[clamp(30px,7vw,120px)] object-contain pointer-events-none z-10" alt="" />
    </>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function SubscriptionPage({ user, onSignOut, onPaymentSuccess, onPaymentPending, onCheckoutManual }) {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    subscriptionApi.getPlans()
      .then((data) => {
        const pkgs = Array.isArray(data) ? data : (data.data || []);
        const mapped = withComparison(
          pkgs.filter((p) => p.isActive !== false).map(transformPlan)
        );

        // Jika API berhasil tapi tidak mengembalikan data, gunakan dummy
        const finalPlans = mapped.length > 0 ? mapped : DUMMY_PLANS;
        setPlans(finalPlans);
        const recommended = finalPlans.find((p) => p.recommended) || finalPlans[0];
        if (recommended) setSelectedPlan(recommended.id);
      })
      .catch(() => {
        // Jika API tidak bisa diakses (backend tidak jalan), gunakan data dummy
        setPlans(DUMMY_PLANS);
        const recommended = DUMMY_PLANS.find((p) => p.recommended) || DUMMY_PLANS[0];
        if (recommended) setSelectedPlan(recommended.id);
      })
      .finally(() => setLoadingPlans(false));
  }, []);

  const handleCheckout = async () => {
    if (!selectedPlan) return;
    setError("");
    setLoading(true);
    try {
      // ── Transfer manual (Midtrans belum siap) ──────────────────────────────
      // Buat payment pending manual_transfer, lalu arahkan ke halaman Transfer
      // Bank untuk unggah bukti. Verifikasi dilakukan admin di dashboard.
      const plan = plans.find((p) => p.id === selectedPlan) || null;
      const res = await subscriptionApi.checkoutManual(selectedPlan);
      const payment = res?.data || res || null;
      onCheckoutManual?.(plan, payment);
    } catch (e) {
      setError(e.message || "Gagal memproses pembayaran, coba lagi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden font-sans z-0">
      {/* ═══════════════ MOBILE (tema gelap, sesuai reference) ═══════════════ */}
      <div
        className="lg:hidden relative min-h-screen flex flex-col text-white"
        style={{
          background:
            'radial-gradient(ellipse at 50% 0%, #4c1d95 0%, #2e1065 40%, #1a0b3d 75%, #120833 100%)',
        }}
      >
        <div className="flex items-center justify-between px-5 pt-7 pb-2 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/90" />
            <span className="font-semibold text-[15px]">Logo</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-white/70">Profile</span>
            <Avatar name={user?.name || user?.profile?.namaLengkap || 'HK'} />
          </div>
        </div>

        <div className="flex-1 px-6 pt-4 pb-6 overflow-y-auto">
          <h1 className="text-[27px] font-bold leading-tight mb-6">
            Ada apa di Sarang Gasing?
          </h1>
          <ul className="space-y-4 mb-8">
            {BENEFITS.map((b, i) => {
              const Icon = b.icon;
              return (
                <li key={i} className="flex items-start gap-3">
                  <Icon className="w-5 h-5 text-[#22d3ee] shrink-0 mt-0.5" strokeWidth={2} />
                  <p className="text-white/75 text-[13.5px] leading-relaxed">{b.text}</p>
                </li>
              );
            })}
          </ul>

          <div className="space-y-5">
            {loadingPlans ? (
              <div className="flex justify-center py-10 text-white/40">
                <Loader2 size={26} className="animate-spin" />
              </div>
            ) : (
              plans.map((plan) => (
                <MobilePlanCard
                  key={plan.id}
                  plan={plan}
                  selected={selectedPlan === plan.id}
                  onSelect={setSelectedPlan}
                />
              ))
            )}
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-300 mt-5">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 px-6 pb-7 pt-3 bg-gradient-to-t from-[#120833] via-[#120833]/95 to-transparent shrink-0">
          <button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full py-4 rounded-2xl font-bold text-[15px] bg-white text-[#1a0b3d] hover:bg-white/90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
          >
            {loading ? (
              <><Loader2 size={18} className="animate-spin" /> Memproses...</>
            ) : (
              'Mulai Berlangganan'
            )}
          </button>
        </div>
      </div>

      {/* ═══════════════════════════ DESKTOP ═══════════════════════════ */}
      <div className="hidden lg:block">
      <Decorations />

      {/* ── NAVBAR ── */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">G</span>
          </div>
          <span className="font-bold text-gray-900 text-lg tracking-tight">Gasing Circle</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={onSignOut}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gray-50 border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <LogOut size={16} />
            Log Out
          </button>
          <Avatar name={user?.name || user?.profile?.namaLengkap || "HK"} />
        </div>
      </nav>

      {/* ── CONTENT ── */}
      <div className="relative z-10 max-w-[1100px] mx-auto px-6 pt-16 pb-32 grid lg:grid-cols-2 gap-20 items-center">
        {/* Kiri — copywriting */}
        <div className="animate-fade-in-up pr-4">
          <h1 className="text-[44px] lg:text-[52px] font-medium text-[#111827] leading-[1.1] mb-10 tracking-tight">
            Bertumbuh
            <br />
            Bersama Dengan
            <br />
            <span className="font-bold relative inline-block mt-1">
              Gasing Circle
              {/* Green underline image */}
              <img src={stripeGreenOne} className="absolute w-[110%] h-auto -bottom-1 -left-2 object-contain" alt="" />
            </span>
          </h1>
          <ul className="space-y-6">
            {BENEFITS.map((b, i) => {
              const Icon = b.icon;
              return (
                <li key={i} className="flex items-start gap-4">
                  <Icon className="w-6 h-6 text-[#22c55e] shrink-0 mt-0.5" strokeWidth={2} />
                  <p className="text-gray-600 text-[15px] leading-relaxed font-medium">{b.text}</p>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Kanan — plan cards */}
        <div className="animate-fade-in-up delay-200 space-y-6 relative">
          
          <img src={iconThumbsup} className="absolute top-0 right-0 translate-x-[70%] -translate-y-[50%] w-[clamp(70px,8.8vw,160px)] object-contain pointer-events-none z-20" alt="" />

          <div className="space-y-5">
            {loadingPlans ? (
              <div className="flex items-center justify-center py-12 text-gray-400">
                <Loader2 size={28} className="animate-spin" />
              </div>
            ) : plans.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">
                Paket langganan tidak tersedia saat ini.
              </div>
            ) : (
              plans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  selected={selectedPlan === plan.id}
                  onSelect={setSelectedPlan}
                />
              ))
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* CTA Button */}
          <div className="pt-2">
            <button
              onClick={handleCheckout}
              disabled={loading}
              className={cn(
                "w-full py-4 rounded-[16px] font-bold text-white text-base transition-all duration-200",
                "bg-[#7a9cfb] hover:bg-[#688ff8] active:scale-[0.98]",
                "disabled:opacity-60 disabled:cursor-not-allowed",
                "flex items-center justify-center gap-2 shadow-sm"
              )}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Memproses...
                </>
              ) : (
                "Mulai Berlangganan"
              )}
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

