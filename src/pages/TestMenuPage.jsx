// src/pages/TestMenuPage.jsx
//
// Halaman menu test sederhana: navigasi cepat ke semua route project.
// Bukan bagian produk — cuma alat bantu dev/QA. Route: /test-menu.
import { useState } from "react";
import { Link } from "react-router-dom";
import { LoginStatusModal } from "@/components/shared/LoginStatusModal";

// Kelompok route sesuai <Routes> di App.jsx. Beberapa route butuh token/query
// (ditandai) atau auth (mis. dashboard-admin bisa redirect ke login).
const GROUPS = [
  {
    title: "Auth",
    items: [
      { to: "/login", label: "Login" },
      { to: "/login/forgot-password", label: "Lupa Password" },
      { to: "/login/check-email", label: "Cek Email" },
      { to: "/login/reset-password", label: "Reset Password", note: "butuh ?token" },
      { to: "/login/choice", label: "Pilihan Masuk (SSO)" },
      { to: "/login/sso-callback", label: "SSO Callback" },
    ],
  },
  {
    title: "Sign Up",
    items: [
      { to: "/register", label: "Sign Up — Data Akun" },
      { to: "/register/otp", label: "Sign Up — Verifikasi OTP" },
      { to: "/register/review", label: "Sign Up — Terima Kasih" },
      { to: "/register/revise", label: "Revisi Data", note: "butuh ?token" },
      { to: "/register/revise/invalid", label: "Revisi — Link Invalid" },
    ],
  },
  {
    title: "Langganan & Pembayaran",
    items: [
      { to: "/test-menu/subscription", label: "Paywall / Pilih Paket", note: "tanpa login" },
      { to: "/test-menu/transfer", label: "Transfer Bank", note: "tanpa login" },
      { to: "/payment/success", label: "Payment — Success" },
      { to: "/payment/finish", label: "Payment — Finish" },
      { to: "/payment/unfinish", label: "Payment — Unfinish" },
      { to: "/payment/error", label: "Payment — Error" },
      { to: "/midtrans-test", label: "Midtrans Test" },
    ],
  },
  {
    title: "Konfirmasi Email",
    items: [
      { to: "/confirm-email-change", label: "Konfirmasi Ubah Email (prod)", note: "butuh ?token" },
      { to: "/register/confirm-email-change", label: "Konfirmasi Ubah Email (staging)", note: "butuh ?token" },
    ],
  },
  {
    title: "Legal",
    items: [
      { to: "/register/id/TOS", label: "Ketentuan Layanan" },
      { to: "/register/id/privacy", label: "Kebijakan Privasi" },
    ],
  },
  {
    title: "Lainnya",
    items: [
      { to: "/dashboard-admin", label: "Dashboard Admin", note: "butuh login" },
      { to: "/komunitas", label: "Komunitas (Tamu)" },
    ],
  },
];

// Modal auth = 1 komponen (LoginStatusModal), 8 state visual via type + meta.
// Semua props-only, tanpa fetch backend. Responsive built-in: bottom-sheet
// di mobile, kartu tengah di desktop — cek mobile via resize viewport.
const MODAL_STATES = [
  { key: "pending", label: "Meninjau Akun", type: "pending" },
  { key: "expired", label: "Langganan Berakhir", type: "expired", note: "→ Log Out" },
  {
    key: "suspended",
    label: "Akun Ditangguhkan",
    type: "suspended",
    meta: { until: "2026-09-01T00:00:00Z", reason: "Melanggar panduan komunitas" },
  },
  {
    key: "pay-receipt",
    label: "Pembayaran Ditolak — Bukti",
    type: "payment_rejected",
    meta: { variant: "receipt" },
  },
  {
    key: "pay-amount",
    label: "Pembayaran Ditolak — Nominal",
    type: "payment_rejected",
    meta: { variant: "amount", amount: 1500000 },
  },
  {
    key: "pay-account",
    label: "Pembayaran Ditolak — Rekening",
    type: "payment_rejected",
    meta: { variant: "account" },
  },
  { key: "error", label: "Terjadi Kesalahan", type: "error" },
];

export default function TestMenuPage() {
  const [modal, setModal] = useState(null);
  const closeModal = () => setModal(null);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 font-sans text-slate-900">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8">
          <h1 className="text-2xl font-bold">Menu Test — Navigasi Route</h1>
          <p className="mt-1 text-sm text-slate-500">
            Klik untuk buka masing-masing page. Alat bantu dev/QA (route:{" "}
            <code className="rounded bg-slate-200 px-1 py-0.5 text-[12px]">/test-menu</code>).
          </p>
        </header>

        <div className="space-y-8">
          {GROUPS.map((group) => (
            <section key={group.title}>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                {group.title}
              </h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {group.items.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-100"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{item.label}</span>
                      <span className="block truncate font-mono text-[11px] text-slate-400">
                        {item.to}
                      </span>
                    </span>
                    {item.note && (
                      <span className="ml-2 shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                        {item.note}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          ))}

          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Modal Login Status (Auth)
            </h2>
            <p className="mb-3 -mt-1 text-[11px] text-slate-400">
              Render in-place. Resize viewport ke mobile buat cek bottom-sheet.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {MODAL_STATES.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setModal(m)}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-100"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{m.label}</span>
                    <span className="block truncate font-mono text-[11px] text-slate-400">
                      {m.type}
                    </span>
                  </span>
                  {m.note && (
                    <span className="ml-2 shrink-0 rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold text-sky-700">
                      {m.note}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>

      {modal && (
        <LoginStatusModal
          type={modal.type}
          meta={modal.meta || {}}
          onClose={closeModal}
          onRenew={closeModal}
          onRetry={closeModal}
          onReupload={closeModal}
        />
      )}
    </div>
  );
}
