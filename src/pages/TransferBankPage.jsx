// src/pages/TransferBankPage.jsx
//
// Halaman pembayaran manual (Transfer Bank). Dipakai sementara selama gateway
// Midtrans belum siap: user transfer manual → unggah bukti → menunggu
// verifikasi admin di dashboard (tabel verifikasi menyusul).
//
// Alur backend (lihat subscriptionApi) — semuanya berjalan saat user menekan
// "Konfirmasi Pembayaran", bukan saat halaman dibuka:
//   1. checkoutManual(packageId) → payment pending (idempotent per user).
//   2. fileManagerApi.upload(file) → dapat fileId.
//   3. uploadReceipt(paymentId, fileId) → payment menunggu review admin.
import mandiriLogo from "@/assets/subscription/mandiri-logo.png";
import { DATE_MAX, DateField } from "@/components/shared/DateField";
import { Logo } from "@/components/shared/Logo";
import { ProfileMenu } from "@/components/shared/ProfileMenu";
import { fileManagerApi, subscriptionApi, webAppApi } from "@/lib/api";
import { DEFAULT_BANK, fetchBankAccount } from "@/lib/bankAccount";
import { translateApiError } from "@/lib/errorMessages";
import { formatRp, localizePlanName } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronLeft,
  ClipboardCheck,
  Copy,
  FileText,
  Loader2,
  Trash2,
  Upload,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import bgDesktop from "@/assets/dark-mode/Background-Desktop.png";
import bgDark from "@/assets/dark-mode/Background.png";

const MAX_FILE_MB = 5;
const ACCEPTED = ["image/jpeg", "image/png", "application/pdf"];

// Format ukuran file jadi "245 KB" / "1,2 MB".
function formatFileSize(bytes) {
  const b = Number(bytes) || 0;
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${Math.round(b / 1024)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
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

// ─── BACKGROUND ───────────────────────────────────────────────────────────────
function Decorations() {
  return (
    <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden bg-[#0D0B2E]">
      {/* Mobile background */}
      <div
        className="lg:hidden absolute inset-0 w-full h-full"
        style={{
          backgroundImage: `url(${bgDark})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      {/* Desktop background */}
      <img
        src={bgDesktop}
        alt=""
        aria-hidden="true"
        className="hidden lg:block absolute inset-0 h-full w-full select-none object-cover"
      />
    </div>
  );
}

export default function TransferBankPage({
  user,
  plan,
  payment,
  onSignOut,
  onBack,
  // onHome: tujuan tombol "Kembali ke Home" di layar "Sedang Ditinjau"
  // (fallback ke onBack bila tidak diberikan).
  onHome,
  initialSubmitted = false,
  initialReceiptFileId = null,
  // isRetry: true bila user sampai sini lewat gate "Pembayaran Ditolak"
  // (Attempt ke-2+, lihat App.jsx handler onRenew/onReupload). Dipakai di
  // layar "Pembayaran Sedang Ditinjau" (submitted). Saat ini belum dipakai
  // di JSX karena desain baru tidak membedakan Attempt #1 vs #2+.
  isRetry = false,
}) {
  // Rekening tujuan aktif dari master data BE (fetchBankAccount, ganti
  // DEFAULT_BANK hardcoded). Mulai dari DEFAULT_BANK biar render pertama
  // (sebelum fetch selesai) tetap tampil, bukan kosong.
  const [masterBank, setMasterBank] = useState(DEFAULT_BANK);
  useEffect(() => {
    let cancelled = false;
    fetchBankAccount().then((acc) => {
      if (!cancelled) setMasterBank(acc);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const bank = {
    accountNumber:
      pick(payment, "bankAccountNumber", "accountNumber", "vaNumber") ||
      masterBank.accountNumber,
    accountName:
      pick(payment, "bankAccountName", "accountName") ||
      masterBank.accountName,
  };

  const durationMonths =
    plan?.billingCycle === "annual" ? 12 : plan?.months || 1;
  const total = pick(payment, "amount", "grossAmount") ?? plan?.priceTotal ?? plan?.priceMonthly ?? 0;
  const packageLabel = plan?.name ? `Paket ${localizePlanName(plan.name)}` : "Paket Langganan";

  const [copied, setCopied] = useState(false);
  const [senderName, setSenderName] = useState("");
  const [senderBankName, setSenderBankName] = useState("");
  const [transferDate, setTransferDate] = useState("");
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(initialSubmitted);
  const [receiptFileId, setReceiptFileId] = useState(initialReceiptFileId);
  const [txnId, setTxnId] = useState(null);
  // "Cara Pembayaran": collapsible di mobile (default tutup), selalu tampil desktop.
  const [caraOpen, setCaraOpen] = useState(false);
  const fileInputRef = useRef(null);

  const ADMIN_EMAIL = import.meta.env.VITE_CONTACT_ADMIN || "admin@gasingacademy.org";

  const handleRedirectDefault = () => {
    webAppApi.redirectWithTokens();
  };

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
    if (!senderBankName.trim()) return setError("Bank asal wajib diisi.");
    if (!transferDate) return setError("Tanggal transfer wajib diisi.");
    if (!file) return setError("Unggah bukti transfer terlebih dahulu.");

    setLoading(true);
    try {
      // 1. Buat payment pending manual_transfer. Endpoint ini idempotent per
      //    user: bila sudah ada payment pending tanpa bukti, payment yang sama
      //    di-update, bukan bikin baru. Dipanggil di sini (bukan di halaman
      //    paket) supaya user yang batal tidak meninggalkan payment pending.
      //    Bila `payment` sudah diteruskan dari checkout, langkah ini dilewati.
      let source = payment;
      if (!source && plan?.id) {
        const res = await subscriptionApi.checkoutManual(plan.id);
        source = res?.data || res || null;
      }

      // 2. Unggah file bukti → dapat fileId.
      const uploaded = await fileManagerApi.upload(file, true);
      const fileId = pick(uploaded, "id", "fileId") || pick(uploaded?.data, "id", "fileId");
      if (!fileId) throw new Error("Gagal mengunggah bukti, coba lagi.");

      // 3. Tentukan paymentId. Bila checkout tidak mengembalikannya, ambil
      //    payment manual terakhir milik user.
      let paymentId = pick(source, "id", "paymentId") || pick(source?.data, "id", "paymentId");
      // ID transaksi untuk ditampilkan di layar konfirmasi (utamakan orderId).
      let resolvedTxnId =
        pick(source, "orderId", "orderNumber", "id") ||
        pick(source?.data, "orderId", "orderNumber", "id");
      if (!paymentId || !resolvedTxnId) {
        const latest = await subscriptionApi.getLatestPayment().catch(() => null);
        paymentId = paymentId || pick(latest, "id", "paymentId") || pick(latest?.data, "id", "paymentId");
        resolvedTxnId =
          resolvedTxnId ||
          pick(latest, "orderId", "orderNumber", "id") ||
          pick(latest?.data, "orderId", "orderNumber", "id");
      }
      if (!paymentId) throw new Error("Data pembayaran tidak ditemukan.");

      // 4. Lampirkan bukti → payment menunggu verifikasi admin.
      //    Field backend terkonfirmasi: { fileId, senderName, senderBankName,
      //    transferDate } (audit #53).
      await subscriptionApi.uploadReceipt(paymentId, fileId, {
        senderName,
        senderBankName,
        transferDate,
      });
      setReceiptFileId(fileId);
      setTxnId(resolvedTxnId || paymentId);
      setSubmitted(true);
    } catch (e) {
      console.error(e);

      // Audit #53: pesan backend mentah → Indonesia, loading selalu pulih via finally.
      setError(translateApiError(e.message) || "Gagal mengirim bukti, coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    "w-full rounded-full bg-white/[0.05] border border-white/20 px-4 lg:px-4 py-3 text-[14px] text-white placeholder:text-white/30 outline-none transition-colors focus:border-[#22d3ee]/60 focus:bg-white/[0.06]";

  // Satu definisi CTA; dipakai di footer sticky (mobile) & inline (desktop).
  const cta = (
    <button
      onClick={handleSubmit}
      disabled={
        loading ||
        !senderName.trim() ||
        !senderBankName.trim() ||
        !transferDate ||
        !file
      }
      className={cn(
        "h-[48px] w-full py-4 rounded-full font-bold text-[15px] transition-all duration-200",
        "bg-gradient-to-r from-[#FFFFFF] to-[#FFFFFF] text-black hover:opacity-90 active:scale-[0.98]",
        "disabled:opacity-30 disabled:cursor-not-allowed",
        "flex items-center justify-center gap-2",
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
  );

  return (
    <div className="relative overflow-hidden font-sans text-white flex flex-col h-[100dvh] lg:block lg:h-auto lg:min-h-screen">
      <Decorations />

      {/* ── NAVBAR (nempel atas, mobile app-shell) ── */}
      <nav className="relative z-20 shrink-0 flex items-center justify-between px-4 py-4 lg:px-6 lg:py-6">
        <Logo variant="full" />
        <ProfileMenu user={user} onSignOut={onSignOut} className="h-9 w-9 text-xs" />
      </nav>

      {/* ── CONTENT (scroll di tengah pada mobile app-shell) ── */}
      <div className="relative z-10 flex-1 min-h-0 overflow-y-auto lg:overflow-visible lg:flex-none">
        {submitted ? (
          <div className="relative z-10 max-w-[1128px] mx-auto px-4 lg:px-10 pt-4 lg:pt-10 pb-10 lg:pb-24 grid lg:grid-cols-[1.15fr_1fr] gap-8 lg:gap-12 items-start animate-fade-in-up">
            {/* ── KIRI ── */}
            <div className="min-w-0">
              <button
                onClick={handleRedirectDefault}
                className="flex items-center gap-2 text-[14px] text-white/70 hover:text-white transition-colors mb-4"
              >
                <ChevronLeft size={18} />
                Kembali ke Home
              </button>
              <h1 className="text-[32px] lg:text-[36px] font-bold leading-[130%] tracking-tight mb-3">
                Pembayaran Sedang Ditinjau
              </h1>
              <p className="text-white/60 text-[14px] lg:text-[15px] leading-[150%] max-w-[520px] mb-8">
                Pembayaranmu sedang kami tinjau. Proses peninjauan membutuhkan
                waktu maksimal 1x24 jam.
              </p>

              {/* Tahapan Pembayaran */}
              <div className="rounded-3xl border border-white/15 bg-white/[0.06] backdrop-blur-md p-5 lg:p-6">
                <div className="flex items-center justify-between mb-6">
                  <p className="text-[14px] font-medium">Tahapan Pembayaran</p>
                  <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[12px] text-white/90">
                    Sedang Ditinjau
                  </span>
                </div>

                <ol>
                  {REVIEW_STEPS.map((step, i) => {
                    const isLast = i === REVIEW_STEPS.length - 1;
                    return (
                      <li key={step.title} className="relative flex gap-4">
                        {/* Garis penghubung antar tahap */}
                        {!isLast && (
                          <span
                            aria-hidden="true"
                            className="absolute left-[16px] top-[40px] bottom-[2px] w-px bg-white/25"
                          />
                        )}
                        <ReviewStepIcon state={step.state} />
                        <div className={cn("min-w-0", !isLast && "pb-7")}>
                          <p
                            className={cn(
                              "text-[16px] font-semibold leading-[32px]",
                              step.state === "pending" && "text-white/60"
                            )}
                          >
                            {step.title}
                          </p>
                          <p className="text-[13px] text-white/60 leading-[150%]">
                            {step.desc}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </div>

            {/* ── KANAN ── */}
            <div className="min-w-0 space-y-8 lg:pt-[52px]">
              {/* Ringkasan Pembayaran */}
              <div className="rounded-3xl border border-white/15 bg-white/[0.06] backdrop-blur-md p-5 lg:p-6">
                <p className="text-[16px] font-semibold mb-3">Ringkasan Pembayaran</p>
                <SummaryRow
                  label="Paket Langganan"
                  value={packageLabel}
                  valueClassName="font-semibold"
                />
                <SummaryRow label="Durasi Langganan" value={`${durationMonths} Bulan`} />
                <div className="border-t border-white/15 my-5" />
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[14px] text-white/80">Total pembayaran</span>
                  <span className="text-[28px] lg:text-[30px] font-bold text-[#1DF5FF]">
                    Rp{formatRp(total)}
                  </span>
                </div>
                <p className="mt-5 text-[12px] leading-[160%] text-white/60">
                  <span className="font-semibold text-white/80">Catatan:</span>{" "}
                  Akses langgananmu belum aktif dan akan diaktifkan setelah
                  pembayaran berhasil diverifikasi.
                </p>
              </div>

              {/* Bantuan */}
              <div className="px-1">
                <p className="text-[14px] font-semibold mb-1">Sudah lebih dari 1×24 jam?</p>
                <p className="text-[12px] text-white/60 leading-[160%] max-w-[360px] mb-4">
                  Hubungi tim bantuan agar kami dapat membantu memeriksa pembayaranmu.
                </p>
                <a
                  href={`mailto:${ADMIN_EMAIL}?subject=${encodeURIComponent(
                    `Bantuan Pembayaran ${txnId || orderId}`
                  )}`}
                  className="inline-flex w-full md:w-fit h-12 items-center justify-center px-10 rounded-full border border-white/25 bg-[#4A1D8F]/30 font-semibold text-[14px] hover:bg-[#4A1D8F]/80 active:scale-[0.98] transition-all"
                >
                  Hubungi Kami
                </a>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative z-10 max-w-[1128px] mx-auto px-4 lg:px-10 pt-4 pb-6 lg:pb-24 grid lg:grid-cols-2 lg:gap-12 items-start animate-fade-in-up">
            {/* ── KIRI ── */}
            <div className="min-w-0">
              {onBack && (
                <button
                  onClick={onBack}
                  className="hidden lg:flex items-center gap-2 text-[14px] text-white/60 hover:text-white transition-colors mb-4"
                >
                  <ChevronLeft size={18} />
                  Kembali ke Pilihan Paket
                </button>
              )}
              <h1 className="text-[28px] font-bold leading-[140%] mb-1 lg:mb-2">
                Transfer Pembayaran
              </h1>
              <p className="text-white/50 text-[15px] mb-5 lg:mb-4">
                Mohon transfer ke rekening bank berikut:
              </p>

              {/* Kartu rekening */}
              <div className="relative rounded-3xl border border-[#3A67FF] bg-[#ffffff]/10 p-5 lg:p-5 mb-4 lg:mb-4 shadow-[0_0_40px_rgba(124,58,237,0.15)]">
                <div className="flex items-center gap-2 mb-4 lg:mb-4">
                  <div className="h-8 w-15 bg-white rounded-md flex items-center justify-center overflow-hidden p-1">
                    <img
                      src={mandiriLogo}
                      alt="Bank Mandiri"
                      className="w-full h-full"
                    />
                  </div>
                  <span className="text-lg font-bold">Bank Mandiri</span>
                </div>
                <p className="text-white/50 text-xs mb-[2px]">No. Rekening</p>
                <div className="flex items-center justify-between gap-3">
                  <span className="min-w-0 break-all text-xl font-bold tracking-wide">
                    {bank.accountNumber}
                  </span>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/25 text-xs font-semibold hover:bg-white/10 transition-colors shrink-0"
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    {copied ? "Tersalin" : "Salin"}
                  </button>
                </div>
                <p className="text-white/50 text-xs mt-4 lg:mt-2 mb-[2px]">Atas Nama</p>
                <p className="text-sm font-semibold">{bank.accountName}</p>
              </div>

              {/* Cara Pembayaran — collapsible di mobile, selalu tampil di desktop */}
              <div className="rounded-3xl border border-white/20 bg-white/[0.05] p-5 lg:p-5 mb-4 lg:mb-6">
                <button
                  type="button"
                  onClick={() => setCaraOpen((o) => !o)}
                  className="flex w-full items-center justify-between text-[14px] lg:text-xs font-semibold lg:cursor-default"
                >
                  <span>Cara Pembayaran:</span>
                  <ChevronDown
                    size={20}
                    className={cn(
                      "lg:hidden text-white/60 transition-transform duration-200",
                      caraOpen && "rotate-180"
                    )}
                  />
                </button>
                <ol className={cn("space-y-3 mt-4", !caraOpen && "hidden lg:block")}>
                  {[
                    "Salin nomor rekening di atas",
                    'Transfer nominal sesuai "Total Bayar" ke rekening tersebut',
                    "Cantumkan nama lengkap kamu di kolom keterangan transfer",
                    "Simpan bukti transfer (screenshot/struk)",
                    "Unggah bukti pembayaran",
                  ].map((step, i) => (
                    <li
                      key={i}
                      className="flex gap-3 text-[12px] text-white/70 leading-relaxed"
                    >
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
            <div className="min-w-0 space-y-4 lg:space-y-5 lg:pt-10">
              {/* Ringkasan */}
              <div className="rounded-3xl border border-white/20 bg-white/[0.05] p-5 lg:p-6">
                <p className="text-base font-semibold mb-2">Ringkasan Pesanan</p>
                <SummaryRow label={packageLabel} value={`Rp${formatRp(total)}`} />
                <SummaryRow
                  label="Durasi Subkripsi"
                  value={`${durationMonths} Bulan`}
                />
                <div className="border-t border-white/20 my-4" />
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold">Total Bayar</span>
                  <span className="text-lg font-bold text-[#1DF5FF]">
                    Rp{formatRp(total)}
                  </span>
                </div>
              </div>

              {/* Nama Pengirim */}
              <div>
                <label className="block text-[14px] lg:text-[12px] font-regular lg:font-medium text-white/70 lg:!mt-8 mb-1.5">
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[14px] lg:text-[12px] font-regular lg:font-medium text-white/70 mb-1.5">
                    Bank Asal
                  </label>
                  <input
                    value={senderBankName}
                    onChange={(e) => setSenderBankName(e.target.value)}
                    placeholder="BCA / Mandiri / dll"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-[14px] lg:text-[12px] font-regular lg:font-medium text-white/70 mb-1.5">
                    Tanggal Transfer
                  </label>
                  <DateField
                    value={transferDate}
                    onChange={(e) => setTransferDate(e.target.value)}
                    maxDate={DATE_MAX.today}
                    defaultDraft={{
                      y: new Date().getFullYear(),
                      m: new Date().getMonth(),
                      d: new Date().getDate(),
                    }}
                    dialogLabel="Pilih tanggal transfer"
                    iconClassName="text-white"
                    className="!h-[47px] !rounded-full !bg-white/[0.05] !border-white/20 !px-4 !text-[14px] !text-white hover:!border-white/20 transition-colors [&.border-primary]:!border-[#22d3ee]/60 [&.ring-2]:!ring-0"
                  />
                </div>
              </div>

              {/* Bukti transfer: dropzone saat kosong, baris ringkas saat sudah ada */}
              {file ? (
                <div className="flex items-center gap-3 rounded-3xl bg-white/[0.04] border border-white/20 px-4 py-3 lg:h-[76px]">
                  <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                    <FileText size={20} className="text-[#22d3ee]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-[14px] truncate">{file.name}</p>
                    <p className="text-white/40 text-[12px]">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      setError("");
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    aria-label="Hapus bukti pembayaran"
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                  >
                    <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                      <Trash2 size={20} className="text-white" />
                    </div>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    className="hidden"
                    onChange={(e) => handleFile(e.target.files?.[0])}
                  />
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleFile(e.dataTransfer.files?.[0]);
                  }}
                  className="rounded-3xl border border-dashed border-white/20 bg-white/[0.05] px-4 py-5 flex flex-row items-center gap-4 cursor-pointer hover:border-[#22d3ee]/50 hover:bg-white/[0.05] transition-colors lg:h-[76px] lg:py-0"
                >
                  <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <Upload size={20} className="text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-[14px] text-white">Unggah Bukti Transfer</p>
                    <p className="text-white/40 text-[12px] mt-0.5">
                      {`JPG, PNG, atau PDF (maks. ${MAX_FILE_MB}MB)`}
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    className="hidden"
                    onChange={(e) => handleFile(e.target.files?.[0])}
                  />
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2 rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-300">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* CTA — desktop inline; mobile dipindah ke footer sticky. */}
              <div className="hidden lg:block">{cta}</div>
            </div>
          </div>
        )}

        <footer className="hidden lg:block relative z-10 pb-8 text-center">
          <p className="text-[13px] text-white/30">
            ©2026 Gasing Academy. All rights reserved.
          </p>
        </footer>
      </div>

      {/* CTA nempel bawah — khusus mobile (form). Desktop pakai tombol inline. */}
      {!submitted && (
        <div className=" lg:hidden shrink-0 relative z-20 px-4 pt-5 pb-5 bg-gradient-to-t from-[#0b0a1f] via-[#0b0a1f]/95 to-transparent">
          {cta}
        </div>
      )}
    </div>
  );
}

// ─── TAHAPAN PEMBAYARAN (layar "Sedang Ditinjau") ────────────────────────────
const REVIEW_STEPS = [
  {
    title: "Pengajuan pembayaran",
    desc: "Informasi pembayaran masuk ke proses peninjauan.",
    state: "done",
  },
  {
    title: "Peninjauan Oleh Tim Sarang Gasing",
    desc: "Sedang berlangsung, maksimal 1x24 jam.",
    state: "active",
  },
  {
    title: "Hasil Peninjauan",
    desc: "Menunggu peninjauan selesai. Langganan belum aktif.",
    state: "pending",
  },
];

function ReviewStepIcon({ state }) {
  const base = "relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0";
  if (state === "done") {
    return (
      <div className={cn(base, "bg-[#E4DAFF] text-[#210965]")}>
        <Check size={18} strokeWidth={3} />
      </div>
    );
  }
  if (state === "active") {
    return (
      <div className={cn(base, "bg-[#E4DAFF] text-[#210965]")}>
        <Loader2 size={18} strokeWidth={2.5} className="animate-spin" />
      </div>
    );
  }
  return (
    <div className={cn(base, "bg-white/10 text-white/60")}>
      <ClipboardCheck size={16} />
    </div>
  );
}

// ─── SUMMARY ROW ──────────────────────────────────────────────────────────────
function SummaryRow({ label, value, valueClassName = "font-regular" }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-white/60 text-[14px]">{label}</span>
      <span className={`${valueClassName} text-[14px]`}>{value}</span>
    </div>
  );
}
