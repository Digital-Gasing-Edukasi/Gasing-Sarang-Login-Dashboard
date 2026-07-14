// src/pages/TransferBankPage.jsx
//
// Halaman pembayaran manual (Transfer Bank). Dipakai sementara selama gateway
// Midtrans belum siap: user transfer manual → unggah bukti → menunggu
// verifikasi admin di dashboard (tabel verifikasi menyusul).
//
// Alur backend (lihat subscriptionApi):
//   1. SubscriptionPage memanggil checkoutManual(packageId) → payment pending.
//   2. Halaman ini unggah file bukti (fileManagerApi.upload) → dapat fileId.
//   3. uploadReceipt(paymentId, fileId) → payment menunggu review admin.
import { useState, useRef } from "react";
import {
  Copy,
  Check,
  UploadCloud,
  Loader2,
  LogOut,
  AlertCircle,
  FileText,
  ArrowRight,
  ChevronLeft,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { subscriptionApi, fileManagerApi } from "@/lib/api";
import mandiriLogo from "@/assets/subscription/mandiri-logo.png";

// Rekening tujuan. Default statis (backend belum mengembalikan detail rekening);
// bila payment membawa field rekening, nilai itu dipakai lebih dulu.
const DEFAULT_BANK = {
  accountNumber: "1760007700071",
  accountName: "Yayasan Teknologi Indonesia Jaya",
};

const MAX_FILE_MB = 5;
const ACCEPTED = ["image/jpeg", "image/png", "application/pdf"];

function formatRp(n) {
  return new Intl.NumberFormat("id-ID").format(Number(n) || 0);
}

// Ambil nilai pertama yang terdefinisi dari beberapa kemungkinan nama field
// (kontrak respons payment belum final).
function pick(obj, ...keys) {
  if (!obj) return undefined;
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null && obj[k] !== "") return obj[k];
  }
  return undefined;
}

function Avatar({ name = "" }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="w-9 h-9 rounded-full bg-[#f43f5e] text-white flex items-center justify-center text-sm font-semibold">
      {initials || "U"}
    </div>
  );
}

// ─── BACKGROUND ───────────────────────────────────────────────────────────────
function Decorations() {
  return (
    <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
      <div className="absolute inset-0 bg-[#0b0a1f]" />
      <div className="absolute -top-1/4 -left-1/4 w-[70vw] h-[70vw] rounded-full bg-[#6d28d9]/30 blur-[120px]" />
      <div className="absolute top-1/3 right-0 w-[55vw] h-[55vw] rounded-full bg-[#7c3aed]/25 blur-[130px]" />
      <div className="absolute bottom-0 left-1/4 w-[50vw] h-[50vw] rounded-full bg-[#4338ca]/25 blur-[120px]" />
    </div>
  );
}

export default function TransferBankPage({
  user,
  plan,
  payment,
  onSignOut,
  onBack,
}) {
  const bank = {
    accountNumber:
      pick(payment, "bankAccountNumber", "accountNumber", "vaNumber") ||
      DEFAULT_BANK.accountNumber,
    accountName:
      pick(payment, "bankAccountName", "accountName") ||
      DEFAULT_BANK.accountName,
  };

  const durationMonths =
    plan?.billingCycle === "annual" ? 12 : plan?.months || 1;
  const total = pick(payment, "amount", "grossAmount") ?? plan?.priceTotal ?? plan?.priceMonthly ?? 0;
  const packageLabel = plan?.name ? `Paket ${plan.name}` : "Paket Langganan";

  const [copied, setCopied] = useState(false);
  const [senderName, setSenderName] = useState("");
  const [senderBank, setSenderBank] = useState("");
  const [transferDate, setTransferDate] = useState("");
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [receiptFileId, setReceiptFileId] = useState(null);
  const [txnId, setTxnId] = useState(null);
  const fileInputRef = useRef(null);

  const WA_NUMBER = import.meta.env.VITE_WA_NUMBER || "628123456789";
  const orderId =
    pick(payment, "orderId", "orderNumber", "id") ||
    pick(payment?.data, "orderId", "id") ||
    "-";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(bank.accountNumber.replace(/\D/g, ""));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard ditolak — abaikan */
    }
  };

  const handleFile = (f) => {
    if (!f) return;
    if (!ACCEPTED.includes(f.type)) {
      setError("Format harus JPG, PNG, atau PDF.");
      return;
    }
    if (f.size > MAX_FILE_MB * 1024 * 1024) {
      setError(`Ukuran file maksimal ${MAX_FILE_MB}MB.`);
      return;
    }
    setError("");
    setFile(f);
  };

  const handleSubmit = async () => {
    setError("");
    if (!senderName.trim()) return setError("Nama pengirim wajib diisi.");
    if (!senderBank.trim()) return setError("Bank asal wajib diisi.");
    if (!transferDate) return setError("Tanggal transfer wajib diisi.");
    if (!file) return setError("Unggah bukti transfer terlebih dahulu.");

    setLoading(true);
    try {
      // 1. Unggah file bukti → dapat fileId.
      const uploaded = await fileManagerApi.upload(file, true);
      const fileId = pick(uploaded, "id", "fileId") || pick(uploaded?.data, "id", "fileId");
      if (!fileId) throw new Error("Gagal mengunggah bukti, coba lagi.");

      // 2. Tentukan paymentId. Bila tidak diteruskan dari checkout, ambil payment
      //    manual terakhir milik user.
      let paymentId = pick(payment, "id", "paymentId") || pick(payment?.data, "id", "paymentId");
      // ID transaksi untuk ditampilkan di layar konfirmasi (utamakan orderId).
      let resolvedTxnId =
        pick(payment, "orderId", "orderNumber", "id") ||
        pick(payment?.data, "orderId", "orderNumber", "id");
      if (!paymentId || !resolvedTxnId) {
        const latest = await subscriptionApi.getLatestPayment().catch(() => null);
        paymentId = paymentId || pick(latest, "id", "paymentId") || pick(latest?.data, "id", "paymentId");
        resolvedTxnId =
          resolvedTxnId ||
          pick(latest, "orderId", "orderNumber", "id") ||
          pick(latest?.data, "orderId", "orderNumber", "id");
      }
      if (!paymentId) throw new Error("Data pembayaran tidak ditemukan.");

      // 3. Lampirkan bukti → payment menunggu verifikasi admin.
      //    Catatan: senderName/senderBank/transferDate dikumpulkan untuk admin,
      //    dikirim ke backend saat skema field tersebut sudah tersedia.
      await subscriptionApi.uploadReceipt(paymentId, fileId);
      setReceiptFileId(fileId);
      setTxnId(resolvedTxnId || paymentId);
      setSubmitted(true);
    } catch (e) {
      setError(e.message || "Gagal mengirim bukti, coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    "w-full rounded-2xl bg-white/[0.04] border border-white/10 px-5 py-4 text-[15px] text-white placeholder:text-white/30 outline-none transition-colors focus:border-[#22d3ee]/60 focus:bg-white/[0.06]";

  return (
    <div className="min-h-screen relative overflow-hidden font-sans text-white">
      <Decorations />

      {/* ── NAVBAR ── */}
      <nav className="relative z-10 flex items-center justify-between px-8 lg:px-14 py-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center" />
          <span className="font-bold text-lg tracking-tight">Gasing Circle</span>
        </div>
        <div className="flex items-center gap-4">
          {onSignOut && (
            <button
              onClick={onSignOut}
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-white/80 hover:bg-white/10 transition-colors"
            >
              <LogOut size={15} />
              Log Out
            </button>
          )}
          <Avatar name={user?.name || user?.profile?.namaLengkap || "HK"} />
        </div>
      </nav>

      {/* ── CONTENT ── */}
      {submitted ? (
        <div className="relative z-10 max-w-xl mx-auto px-6 pt-6 pb-24 flex flex-col items-center text-center animate-fade-in-up">
          {/* Ceklis hijau */}
          <div className="w-20 h-20 rounded-full bg-[#22c55e] flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(34,197,94,0.4)]">
            <Check size={40} strokeWidth={3} className="text-white" />
          </div>

          <h1 className="text-[42px] font-bold tracking-tight mb-4">
            Pembayaran Berhasil!
          </h1>
          <p className="text-white/55 text-[16px] leading-relaxed max-w-md mb-10">
            Terima kasih, pembayaran kamu telah kami terima dan sedang diproses.
          </p>

          {/* Rincian Transaksi */}
          <div className="w-full rounded-3xl border border-white/10 bg-white/[0.03] p-7 text-left mb-8">
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-bold">Rincian Transaksi</span>
              <span className="text-sm text-white/40">ID: {txnId || orderId}</span>
            </div>
            <div className="border-t border-white/10 mb-4" />
            <SummaryRow label="Paket Langganan" value={packageLabel} />
            <SummaryRow label="Durasi" value={`${durationMonths} Bulan`} />
            <SummaryRow label="Metode Pembayaran" value="Transfer Bank" />
            <div className="border-t border-white/10 my-4" />
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold">Total Bayar</span>
              <span className="text-2xl font-bold text-[#22d3ee]">
                Rp{formatRp(total)}
              </span>
            </div>
          </div>

          {/* Aksi */}
          <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
            <button
              onClick={onSignOut}
              className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-white text-[#0b0a1f] font-bold text-[15px] hover:bg-white/90 active:scale-[0.98] transition-all"
            >
              Kembali ke Login
              <ArrowRight size={18} />
            </button>
            {receiptFileId && (
              <a
                href={fileManagerApi.getDownloadUrl(receiptFileId)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-full border border-white/25 font-semibold text-[15px] hover:bg-white/10 active:scale-[0.98] transition-all"
              >
                <Download size={18} />
                Unduh Bukti
              </a>
            )}
          </div>

          <p className="text-[14px] text-white/40 mt-8">
            Ada kendala?{" "}
            <a
              href={`https://wa.me/${WA_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-white/80 underline hover:text-white transition-colors"
            >
              Hubungi Bantuan
            </a>
          </p>
        </div>
      ) : (
        <div className="relative z-10 max-w-[1180px] mx-auto px-6 lg:px-10 pt-4 pb-24 grid lg:grid-cols-2 gap-8 lg:gap-14 items-start animate-fade-in-up">
          {/* ── KIRI ── */}
          <div>
            {onBack && (
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-[14px] text-white/60 hover:text-white transition-colors mb-4"
              >
                <ChevronLeft size={18} />
                Kembali ke Pilihan Paket
              </button>
            )}
            <h1 className="text-[40px] lg:text-[46px] font-bold tracking-tight leading-none mb-3">
              Transfer Pembayaran
            </h1>
            <p className="text-white/50 text-[15px] mb-8">
              Mohon transfer ke rekening bank berikut:
            </p>

            {/* Kartu rekening */}
            <div className="relative rounded-3xl border border-[#7c3aed]/60 bg-gradient-to-br from-[#7c3aed]/25 to-[#4338ca]/10 p-7 mb-6 shadow-[0_0_40px_rgba(124,58,237,0.15)]">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-8 w-15 bg-white rounded-md flex items-center justify-center overflow-hidden p-1">
                  <img
                    src={mandiriLogo}
                    alt="Bank Mandiri"
                    className="w-full h-full"
                  />
                </div>
                <span className="text-lg font-bold">Bank Mandiri</span>
              </div>
              <p className="text-white/50 text-sm mb-2">No. Rekening</p>
              <div className="flex items-center justify-between gap-4">
                <span className="text-[30px] font-bold tracking-wide">
                  {bank.accountNumber}
                </span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/25 text-sm font-medium hover:bg-white/10 transition-colors shrink-0"
                >
                  {copied ? <Check size={15} /> : <Copy size={15} />}
                  {copied ? "Tersalin" : "Salin"}
                </button>
              </div>
              <p className="text-white/50 text-sm mt-5 mb-1">Atas Nama</p>
              <p className="text-lg font-semibold">{bank.accountName}</p>
            </div>

            {/* Cara Pembayaran */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-7 mb-6">
              <p className="font-semibold mb-4">Cara Pembayaran:</p>
              <ol className="space-y-3">
                {[
                  "Salin nomor rekening di atas",
                  'Transfer nominal sesuai "Total Bayar" ke rekening tersebut',
                  "Cantumkan nama lengkap kamu di kolom keterangan transfer",
                  "Simpan bukti transfer (screenshot/struk)",
                  "Unggah bukti pembayaran",
                ].map((step, i) => (
                  <li key={i} className="flex gap-3 text-[14px] text-white/70 leading-relaxed">
                    <span className="text-[#22d3ee] font-semibold shrink-0">
                      {i + 1}.
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* ── KANAN ── */}
          <div className="space-y-6">
            {/* Ringkasan */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
              <p className="text-xl font-bold mb-5">Ringkasan Pesanan</p>
              <SummaryRow label={packageLabel} value={`Rp${formatRp(total)}`} />
              <SummaryRow label="Durasi Subkripsi" value={`${durationMonths} Bulan`} />
              <div className="border-t border-white/10 my-4" />
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold">Total Bayar</span>
                <span className="text-2xl font-bold text-[#22d3ee]">
                  Rp{formatRp(total)}
                </span>
              </div>
            </div>

            {/* Nama Pengirim */}
            <div>
              <label className="block text-[15px] font-semibold mb-2">
                Nama Pengirim
              </label>
              <input
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="Contoh: Budi Santoso"
                className={inputCls}
              />
            </div>

            {/* Bank Asal + Tanggal */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[15px] font-semibold mb-2">
                  Bank Asal
                </label>
                <input
                  value={senderBank}
                  onChange={(e) => setSenderBank(e.target.value)}
                  placeholder="BCA / Mandiri / dll"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-[15px] font-semibold mb-2">
                  Tanggal Transfer
                </label>
                <input
                  type="date"
                  value={transferDate}
                  onChange={(e) => setTransferDate(e.target.value)}
                  className={cn(inputCls, "[color-scheme:dark]")}
                />
              </div>
            </div>

            {/* Dropzone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleFile(e.dataTransfer.files?.[0]);
              }}
              className="rounded-3xl border-2 border-dashed border-white/15 bg-white/[0.03] px-6 py-10 flex flex-col items-center text-center cursor-pointer hover:border-[#22d3ee]/50 hover:bg-white/[0.05] transition-colors"
            >
              <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mb-4">
                {file ? (
                  <FileText size={24} className="text-[#22d3ee]" />
                ) : (
                  <UploadCloud size={24} className="text-white/50" />
                )}
              </div>
              <p className="font-semibold">
                {file ? file.name : "Unggah Bukti Transfer"}
              </p>
              <p className="text-white/40 text-[13px] mt-1">
                {file
                  ? "Klik untuk mengganti file"
                  : `JPG, PNG, atau PDF (maks. ${MAX_FILE_MB}MB)`}
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-300">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* CTA */}
            <button
              onClick={handleSubmit}
              disabled={loading || !senderName.trim() || !senderBank.trim() || !transferDate || !file}
              className={cn(
                "w-full py-4 rounded-2xl font-bold text-[15px] transition-all duration-200",
                "bg-gradient-to-r from-[#7c3aed] to-[#4338ca] text-white hover:opacity-90 active:scale-[0.98]",
                "disabled:opacity-60 disabled:cursor-not-allowed",
                "flex items-center justify-center gap-2"
              )}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Mengirim...
                </>
              ) : (
                "Konfirmasi Pembayaran"
              )}
            </button>
          </div>
        </div>
      )}

      <footer className="relative z-10 pb-8 text-center">
        <p className="text-[13px] text-white/30">
          ©2026 Gasing Circle. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

// ─── SUMMARY ROW ──────────────────────────────────────────────────────────────
function SummaryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-white/60 text-[15px]">{label}</span>
      <span className="font-semibold text-[15px]">{value}</span>
    </div>
  );
}
