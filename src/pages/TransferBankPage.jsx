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
import { useState, useRef, useEffect } from "react";
import {
  Copy,
  Check,
  Upload,
  Loader2,
  AlertCircle,
  FileText,
  ArrowRight,
  ChevronLeft,
  ChevronDown,
  Download,
  Trash2,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { subscriptionApi, fileManagerApi, webAppApi } from "@/lib/api";
import mandiriLogo from "@/assets/subscription/mandiri-logo.png";
import { Logo } from "@/components/shared/Logo";
import { ProfileMenu } from "@/components/shared/ProfileMenu";
import { DateField, DATE_MAX } from "@/components/shared/DateField";
import { formatRp, localizePlanName } from "@/lib/format";
import { fetchBankAccount, DEFAULT_BANK } from "@/lib/bankAccount";

import bgDark from "@/assets/dark-mode/Background.png";
import bgDesktop from "@/assets/dark-mode/Background-Desktop.png";

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
  initialSubmitted = false,
  initialReceiptFileId = null,
  // isRetry: true bila user sampai sini lewat gate "Pembayaran Ditolak"
  // (Attempt ke-2+, lihat App.jsx handler onRenew/onReupload). Dipakai di
  // layar "Pembayaran Berhasil!" (submitted) utk beda tombol: Attempt #1 →
  // "Jelajahi Sarang Gasing" (auto-login web app), Attempt #2+ → "Log Out"
  // (pakai `onSignOut` yg sudah ada, jangan bikin fungsi baru).
  // TODO(UI dev): belum dipakai di JSX — swap CTA di blok `submitted` (baris
  // ~316) berdasarkan flag ini.
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
  const [senderBank, setSenderBank] = useState("");
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
    if (!senderBank.trim()) return setError("Bank asal wajib diisi.");
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
      //    Catatan: nama field senderName/senderBank/transferDate BLM dikonfirmasi
      //    skema backend (API_ACCESS_MATRIX.md §7, docs/VERIFIKASI_PEMBAYARAN.md §6
      //    cuma dokumentasikan { fileId }) — pakai nama sama dgn fallback mapper admin.
      await subscriptionApi.uploadReceipt(paymentId, fileId, {
        senderName,
        senderBank,
        transferDate,
      });
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
    "w-full rounded-full bg-white/[0.05] border border-white/20 px-4 lg:px-4 py-3 text-[14px] text-white placeholder:text-white/30 outline-none transition-colors focus:border-[#22d3ee]/60 focus:bg-white/[0.06]";

  // Satu definisi CTA; dipakai di footer sticky (mobile) & inline (desktop).
  const cta = (
    <button
      onClick={handleSubmit}
      disabled={
        loading ||
        !senderName.trim() ||
        !senderBank.trim() ||
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
        {/* Mobile: pembayaran manual pakai tombol back, bukan logo. Desktop: logo. */}
        <button
          type="button"
          onClick={onBack}
          aria-label="Kembali ke pilihan paket"
          className="lg:hidden flex h-9 w-9 items-center justify-center rounded-full text-white/85 transition-colors hover:bg-white/10"
        >
          <ChevronLeft size={24} />
        </button>
        <Logo variant="full" className="hidden lg:block" />
        <ProfileMenu user={user} onSignOut={onSignOut} className="h-9 w-9 text-xs" />
      </nav>

      {/* ── CONTENT (scroll di tengah pada mobile app-shell) ── */}
      <div className="relative z-10 flex-1 min-h-0 overflow-y-auto lg:overflow-visible lg:flex-none">
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
              <span className="text-sm text-white/40">
                ID: {txnId || orderId}
              </span>
            </div>
            <div className="border-t border-white/10 mb-4" />
            <SummaryRow label="Paket Langganan" value={packageLabel} />
            <SummaryRow label="Durasi" value={`${durationMonths} Bulan`} />
            <SummaryRow label="Metode Pembayaran" value="Transfer Bank" />
            <div className="border-t border-white/10 my-4" />
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold">Total Bayar</span>
              <span className="text-2xl font-bold text-[#1DF5FF]">
                Rp{formatRp(total)}
              </span>
            </div>
          </div>

          {/* Aksi */}
          <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
            {receiptFileId && (
              <a
                href={fileManagerApi.getDownloadUrl(receiptFileId)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center px-8 py-3.5 rounded-full border border-white/25 font-semibold text-[15px] hover:bg-white/10 active:scale-[0.98] transition-all"
              >
                Unduh Bukti
              </a>
            )}
            {isRetry ? (
              <button
                onClick={onSignOut}
                className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-white text-[#0b0a1f] font-bold text-[15px] hover:bg-white/90 active:scale-[0.98] transition-all"
              >
                <LogOut size={18} />
                Log Out
              </button>
            ) : (
              <button
                onClick={handleRedirectDefault}
                className="flex items-center justify-center px-8 py-3.5 rounded-full bg-white text-[#0b0a1f] font-bold text-[15px] hover:bg-white/90 active:scale-[0.98] transition-all"
              >
                Jelajahi Sarang Gasing
              </button>
            )}
          </div>

          <p className="text-[14px] text-white/40 mt-8">
            Ada kendala?{" "}
            <a
              href={`mailto:${ADMIN_EMAIL}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-white underline hover:text-white/80 transition-colors"
            >
              Hubungi Bantuan
            </a>
          </p>
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
                  value={senderBank}
                  onChange={(e) => setSenderBank(e.target.value)}
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
          ©2026 Gasing Academy. All rights reserved..
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

// ─── SUMMARY ROW ──────────────────────────────────────────────────────────────
function SummaryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-white/60 text-[15px]">{label}</span>
      <span className="font-semibold text-[15px]">{value}</span>
    </div>
  );
}
