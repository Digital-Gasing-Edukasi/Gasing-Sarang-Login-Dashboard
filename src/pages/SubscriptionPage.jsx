// src/pages/SubscriptionPage.jsx
import { useState, useEffect } from "react";
import { Loader2, AlertCircle, Users, Video, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { subscriptionApi, tokenStorage } from "@/lib/api";
import { formatRp, localizePlanName } from "@/lib/format";

import bgDark from "@/assets/dark-mode/Background.png";
import bgDesktop from "@/assets/dark-mode/Background-Desktop.png";
import { Logo } from "@/components/shared/Logo";
import { ProfileMenu } from "@/components/shared/ProfileMenu";
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
  // Deteksi paket tahunan tahan-banting: sebagian backend mengirim durationUnit
  // yang tak konsisten (mis. "years"/"annual") atau tak mengirimnya sama sekali,
  // sehingga andalan pada durationUnit saja bikin paket tahunan salah dianggap
  // bulanan. Karena itu deteksi juga dari NAMA paket (Yearly/Annual/Tahunan).
  const unit = String(pkg.durationUnit || "").toLowerCase();
  const rawName = String(pkg.name || "").toLowerCase();
  const isAnnual =
    /year|annual/.test(unit) ||
    /year|annual|tahun/.test(rawName) ||
    (/month/.test(unit) && (pkg.duration || 0) >= 12);
  let months = isAnnual
    ? /year/.test(unit)
      ? (pkg.duration || 1) * 12
      : /month/.test(unit)
      ? pkg.duration || 12
      : 12
    : 1;
  // Paket tahunan minimal 12 bulan. Sebagian backend mengirim duration/unit
  // tak konsisten (mis. duration=1) sehingga harga per-bulan meleset jauh
  // (Rp396.000/bln, bukan Rp33.000/bln) dan diskon gagal dihitung.
  if (isAnnual && months < 12) months = 12;

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
      name: localizePlanName(pkg.name),
      billingCycle: "annual",
      priceMonthly: Math.round(pkg.price / months),
      priceTotal: pkg.price,
      originalPrice: explicitOriginal,
      discount: explicitDiscount,
      label: explicitDiscount ? `Kamu Hemat ${explicitDiscount}%` : null,
      recommended: true,
      planLabel: localizePlanName(pkg.name),
    };
  }
  return {
    id: pkg.id,
    name: localizePlanName(pkg.name),
    billingCycle: "monthly",
    priceMonthly: pkg.price,
    priceTotal: null,
    originalPrice: explicitOriginal,
    discount: explicitDiscount,
    label: null,
    recommended: false,
    planLabel: localizePlanName(pkg.name),
  };
}

// Urutkan agar paket tahunan (annual) selalu tampil paling atas, diikuti
// paket lain sesuai urutan aslinya.
function sortAnnualFirst(plans) {
  return [...plans].sort((a, b) => {
    const rank = (p) => (p.billingCycle === "annual" ? 0 : 1);
    return rank(a) - rank(b);
  });
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
      // Bulatkan ke atas: hemat 17,3% ditampilkan "18%" sesuai desain.
      discount = Math.ceil((1 - p.priceMonthly / originalPrice) * 100);
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
    text: (
      <>
        Gabung dengan <span className="text-[#1DF5FF] font-semibold">komunitas guru</span> seluruh Indonesia dan diskusi materi <span className="text-[#1DF5FF] font-semibold">matematika</span> dan AI.
      </>
    ),
  },
  {
    icon: Video,
    text: (
      <>
        Hadiri <span className="text-[#1DF5FF] font-semibold">webinar interaktif</span> dan bahas topik edukasi terkini bersama guru-guru terbaik Indonesia.
      </>
    ),
  },
  {
    icon: BookOpen,
    text: (
      <>
        Akses berbagai <span className="text-[#1DF5FF] font-semibold">konten eksklusif</span> untuk mengajar <span className="text-[#1DF5FF] font-semibold">matematika</span> dengan <span className="text-[#1DF5FF] font-semibold">asyik dan menyenangkan</span>.
      </>
    ),
  },
];

// ─── PLAN CARD (desktop, tema gelap) ─────────────────────────────────────────
function PlanCard({ plan, selected, onSelect }) {
  const featured = plan.billingCycle === "annual";
  return (
    <div
      onClick={() => onSelect(plan.id)}
      className={cn(
        "relative rounded-[24px] border py-6 px-8 cursor-pointer transition-all duration-300",
        featured
          ? "border-[#8b7bff]/70 bg-gradient-to-b from-[#382274] to-[#180840]"
          : selected
          ? "border-[#8b7bff]/70 bg-gradient-to-b from-[#382274] to-[#180840]"
          : "border-[#D1D3DA]/30 bg-gradient-to-b from-[#382274] to-[#180840] hover:border-white/30"
      )}
    >
      {/* Gradient glow wrapper behind content */}
      {selected && (
        <div className="absolute -inset-0.5 rounded-[24px] bg-gradient-to-r from-[#B639FF] via-[#5933FF] to-[#B639FF] opacity-60 blur-xl -z-10 pointer-events-none" />
      )}
      {/* Badge hemat mengambang di atas kartu */}
      {plan.label && (
        <span className="absolute -top-[14px] right-[32.5px] bg-gradient-to-r from-[#3A67FF] to-[#00F6FF] text-white text-[13px] font-medium px-2 py-1 rounded-[8px] whitespace-nowrap shadow-sm">
          {plan.label}
        </span>
      )}

      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-white/55 text-[15px] font-semibold mb-2.5">
            {plan.name}
          </p>

          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-[34px] font-bold text-white leading-none">
              Rp{formatRp(plan.priceMonthly)}
            </span>
            <span className="text-sm font-medium text-white/70">/bln</span>
            {plan.originalPrice && (
              <span className="text-base font-medium text-[#FF0E32] leading-[150%] line-through ml-1">
                Rp{formatRp(plan.originalPrice)}
              </span>
            )}
          </div>

          <div className="min-h-[20px] mt-2">
            {plan.priceTotal && (
              <p className="text-xs font-medium text-white/40">
                Tagihan per-tahun Rp{formatRp(plan.priceTotal)}
              </p>
            )}
          </div>
        </div>

        {/* Checkbox */}
        <div
          className={cn(
            "w-8 h-8 rounded-md flex items-center justify-center border-2 transition-all shrink-0 ml-4",
            selected ? "bg-white border-white" : "border-[#BBB6C7] bg-transparent"
          )}
        >
          {selected && (
            <svg
              className="w-4 h-4 text-[#180841]"
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
  const featured = plan.billingCycle === "annual";
  return (
    <div
      onClick={() => onSelect(plan.id)}
      className={cn(
        "relative rounded-[22px] border p-5 cursor-pointer transition-all duration-300",
        featured
          ? "border-white/50 bg-gradient-to-b from-[#382274] to-[#180840] shadow-[0_0_30px_rgba(124,58,237,0.25)]"
          : selected
          ? "border-[#8b7bff]/70 bg-gradient-to-b from-[#382274] to-[#180840] shadow-[0_0_30px_rgba(124,58,237,0.25)]"
          : "border-[#D1D3DA]/30 bg-gradient-to-b from-[#382274] to-[#180840]"
      )}
    >
      {plan.label && (
        <span className="absolute -top-3 right-4 bg-gradient-to-r from-[#3A67FF] to-[#00F6FF] text-white text-[11px] font-medium px-3 py-1 rounded-full whitespace-nowrap shadow-sm">
          {plan.label}
        </span>
      )}
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-white/70 text-[14px] font-semibold mb-1">{plan.name}</p>
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
            <p className="text-[11px] font-medium text-white/40 mt-1">
              Tagihan per-tahun Rp{formatRp(plan.priceTotal)}
            </p>
          )}
        </div>
        <div
          className={cn(
            "w-6 h-6 rounded-md flex items-center justify-center border-2 transition-all shrink-0 ml-3",
            selected ? "bg-white border-white" : "border-[#BBB6C7] bg-transparent"
          )}
        >
          {selected && (
            <svg className="w-3.5 h-3.5 text-[#180841]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </div>
    </div>
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
        const mapped = sortAnnualFirst(
          withComparison(
            pkgs.filter((p) => p.isActive !== false).map(transformPlan)
          )
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
      // Amankan token untuk round-trip pembayaran: pindah ke localStorage supaya
      // selamat walau nanti Midtrans lempar keluar origin & balik di halaman baru
      // (sessionStorage rapuh). Handoff ke web app baru butuh token ini.
      tokenStorage.promoteToPersistent();

      // ── Transfer manual (Midtrans belum siap) ──────────────────────────────
      // Cuma pindah ke halaman Transfer Bank; payment BELUM dibuat di sini.
      // checkout-manual baru dipanggil saat user menekan "Konfirmasi Pembayaran"
      // di TransferBankPage, supaya user yang batal di tengah jalan tidak
      // meninggalkan payment pending yang tidak pernah dibayar.
      const plan = plans.find((p) => p.id === selectedPlan) || null;
      onCheckoutManual?.(plan, null);
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
        className="lg:hidden relative min-h-screen flex flex-col text-white bg-[#0D0B2E]"
        style={{
          backgroundImage: `url(${bgDark})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="flex items-center justify-between px-4 pt-4 pb-4 shrink-0">
          <Logo variant="mobile" />
          <ProfileMenu user={user} onSignOut={onSignOut} />
        </div>

        <div className="flex-1 px-4 pt-4 pb-4 overflow-y-auto">
          <h1 className="text-[32px] font-bold leading-tight mb-6 font-cera-pro">
            Ada apa di Sarang Gasing?
          </h1>
          <ul className="space-y-6 mb-8">
            {BENEFITS.map((b, i) => {
              const Icon = b.icon;
              return (
                <li key={i} className="flex items-start gap-4">
                  <Icon
                    className="w-6 h-6 text-[#ffffff] shrink-0 mt-0.5"
                    strokeWidth={2}
                  />
                  <p className="text-white  text-base leading-snug">
                    {b.text}
                  </p>
                </li>
              );
            })}
          </ul>

          <div className="space-y-3">
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

        <div className="sticky bottom-0 px-6 pb-6 pt-3 bg-gradient-to-t from-[#120833] via-[#120833]/95 to-transparent shrink-0">
          <button
            onClick={handleCheckout}
            disabled={loading}
            className={cn(
              "w-full py-4 rounded-full font-bold text-[15px] transition-all duration-200",
              "bg-gradient-to-r from-[#FFFFFF] to-[#FFFFFF] text-black hover:opacity-90 active:scale-[0.98]",
              "disabled:opacity-60 disabled:cursor-not-allowed",
              "flex items-center justify-center gap-2",
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

      {/* ═══════════════════════════ DESKTOP (dark) ═══════════════════════════ */}
      <div className="hidden lg:flex relative min-h-screen flex-col bg-[#0D0B2E] text-white">
        {/* wallpaper bokeh */}
        <img
          src={bgDesktop}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover"
        />

        {/* ── NAVBAR ── (z-20 > content z-10 supaya dropdown ProfileMenu tampil
            & bisa diklik; kalau sama-sama z-10, content nutupin popup) */}
        <nav className="relative z-20 flex items-center justify-between px-6 pt-6 pb-5 shrink-0">
          <Logo variant="full" />
          <ProfileMenu user={user} onSignOut={onSignOut} />
        </nav>

        {/* ── CONTENT ── */}
        <div className="relative z-10 flex-1 flex items-center">
          <div className="w-full max-w-[1150px] mx-auto px-8 grid lg:grid-cols-2 gap-16 xl:gap-24 items-center">
            {/* Kiri — copywriting */}
            <div className="animate-fade-in-up">
              <h1 className="text-[48px] font-cera-pro xl:text-[48px] font-bold text-white leading-[150%] mb-10">
                Ada apa di Sarang Gasing?
              </h1>
              <ul className="space-y-6">
                {BENEFITS.map((b, i) => {
                  const Icon = b.icon;
                  return (
                    <li key={i} className="flex items-center gap-4">
                      <Icon
                        className="w-8 h-8 text-[#ffffff] shrink-0"
                        strokeWidth={2}
                      />
                      <p className="text-white text-base leading-relaxed">
                        {b.text}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Kanan — plan cards */}
            <div className="animate-fade-in-up delay-200 space-y-6">
              <div className="space-y-6">
                {loadingPlans ? (
                  <div className="flex items-center justify-center py-12 text-white/40">
                    <Loader2 size={28} className="animate-spin" />
                  </div>
                ) : plans.length === 0 ? (
                  <div className="text-center py-12 text-white/40 text-sm">
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

              {error && (
                <div className="flex items-start gap-2 rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-300">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="pt-2">
                <button
                  onClick={handleCheckout}
                  disabled={loading}
                  className={cn(
                    "w-full py-4 rounded-full font-bold text-[#1a0b3d] text-base transition-all duration-200",
                    "bg-white hover:bg-white/90 active:scale-[0.98]",
                    "disabled:opacity-60 disabled:cursor-not-allowed",
                    "flex items-center justify-center gap-2 shadow-sm",
                  )}
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />{" "}
                      Memproses...
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
    </div>
  );
}
