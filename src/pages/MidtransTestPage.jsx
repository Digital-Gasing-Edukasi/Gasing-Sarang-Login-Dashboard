// src/pages/MidtransTestPage.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Halaman khusus untuk VERIFIKASI konfigurasi Midtrans Snap
// Akses via: http://localhost:5173/?midtrans-test=true
//
// ⚠️  HANYA untuk development lokal. Jangan deploy ke production.
//      Server Key dipakai langsung dari sini untuk generate token simulasi.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect } from "react";

const CLIENT_KEY = import.meta.env.VITE_MIDTRANS_CLIENT_KEY || "";
const SERVER_KEY = import.meta.env.VITE_MIDTRANS_SERVER_KEY || "";
const SNAP_API   = "https://app.sandbox.midtrans.com/snap/v1/transactions";

// ─── Status Badge ──────────────────────────────────────────────────────────
function StatusBadge({ ok, label, detail }) {
  return (
    <div className={`flex items-start gap-3 rounded-xl border p-4 ${ok ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
      <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-white text-sm font-bold ${ok ? "bg-green-500" : "bg-red-500"}`}>
        {ok ? "✓" : "✗"}
      </div>
      <div>
        <p className={`font-semibold text-sm ${ok ? "text-green-800" : "text-red-800"}`}>{label}</p>
        {detail && <p className={`text-xs mt-0.5 ${ok ? "text-green-600" : "text-red-600"}`}>{detail}</p>}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────
export default function MidtransTestPage() {
  const [snapLoaded,   setSnapLoaded]   = useState(false);
  const [clientKeyOk,  setClientKeyOk]  = useState(false);
  const [serverKeyOk,  setServerKeyOk]  = useState(false);

  // Untuk direct test
  const [amount,       setAmount]       = useState("10000");
  const [generating,   setGenerating]   = useState(false);
  const [genError,     setGenError]     = useState("");

  // Untuk manual token
  const [snapToken,    setSnapToken]    = useState("");
  const [popupResult,  setPopupResult]  = useState(null);
  const [popupDetail,  setPopupDetail]  = useState("");

  // ── Cek status konfigurasi ────────────────────────────────────────────────
  useEffect(() => {
    const checkSnap = () => setSnapLoaded(typeof window.snap !== "undefined");
    checkSnap();
    const interval = setInterval(checkSnap, 500);
    const timeout  = setTimeout(() => clearInterval(interval), 5000);

    setClientKeyOk(
      CLIENT_KEY.length > 0 &&
      CLIENT_KEY.startsWith("Mid-client-") &&
      !CLIENT_KEY.includes("xxxx")
    );
    setServerKeyOk(
      SERVER_KEY.length > 0 &&
      SERVER_KEY.startsWith("Mid-server-") &&
      !SERVER_KEY.includes("xxxx")
    );

    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, []);

  // ── Generate token langsung ke Midtrans Sandbox ───────────────────────────
  const handleGenerateAndPay = async () => {
    if (!serverKeyOk) {
      setGenError("VITE_MIDTRANS_SERVER_KEY belum dikonfigurasi di .env");
      return;
    }
    if (!snapLoaded) {
      setGenError("window.snap belum tersedia. Cek script di index.html.");
      return;
    }

    setGenerating(true);
    setGenError("");
    setPopupResult(null);
    setPopupDetail("");

    try {
      // Buat order_id unik berdasarkan timestamp
      const orderId = `TEST-${Date.now()}`;
      const grossAmount = parseInt(amount, 10) || 10000;

      // Panggil Midtrans Snap API langsung (khusus sandbox / dev)
      const authHeader = "Basic " + btoa(SERVER_KEY + ":");
      const res = await fetch(SNAP_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": authHeader,
        },
        body: JSON.stringify({
          transaction_details: {
            order_id: orderId,
            gross_amount: grossAmount,
          },
          customer_details: {
            first_name: "Test",
            last_name:  "User",
            email:      "test@gasingcircle.dev",
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error_messages?.join(", ") || `Error ${res.status}`);
      }

      const token = data.token;
      if (!token) throw new Error("Token tidak ditemukan di response Midtrans");

      // Tampilkan token di field manual (untuk referensi)
      setSnapToken(token);

      // Langsung buka popup
      triggerPopup(token);

    } catch (e) {
      setGenError(e.message || "Gagal generate token dari Midtrans Sandbox");
    } finally {
      setGenerating(false);
    }
  };

  // ── Trigger popup ─────────────────────────────────────────────────────────
  const triggerPopup = (token) => {
    window.snap.pay(token, {
      onSuccess: (result) => {
        setPopupResult("success");
        setPopupDetail(`Order: ${result.order_id} | Status: ${result.transaction_status}`);
        console.log("[Midtrans Test] ✅ Success:", result);
      },
      onPending: (result) => {
        setPopupResult("pending");
        setPopupDetail(`Order: ${result.order_id} | Menunggu pembayaran`);
        console.log("[Midtrans Test] ⏳ Pending:", result);
      },
      onError: (result) => {
        setPopupResult("error");
        setPopupDetail(result.status_message || "Pembayaran ditolak");
        console.log("[Midtrans Test] ❌ Error:", result);
      },
      onClose: () => {
        setPopupResult("closed");
        setPopupDetail("Popup ditutup sebelum pembayaran selesai.");
        console.log("[Midtrans Test] 🔲 Popup ditutup.");
      },
    });
  };

  const handleManualPay = () => {
    if (!snapToken.trim()) { alert("Masukkan Snap Token terlebih dahulu."); return; }
    if (!window.snap)      { alert("window.snap belum tersedia."); return; }
    setPopupResult(null);
    setPopupDetail("");
    triggerPopup(snapToken.trim());
  };

  const resultConfig = {
    success: { bg: "bg-green-50 border-green-200", text: "text-green-800", icon: "✅", label: "Pembayaran Berhasil!" },
    pending: { bg: "bg-yellow-50 border-yellow-200", text: "text-yellow-800", icon: "⏳", label: "Menunggu Pembayaran" },
    error:   { bg: "bg-red-50 border-red-200",    text: "text-red-800",    icon: "❌", label: "Pembayaran Gagal" },
    closed:  { bg: "bg-gray-50 border-gray-200",  text: "text-gray-700",  icon: "🔲", label: "Popup Ditutup" },
  };

  const allReady = snapLoaded && serverKeyOk;

  return (
    <div className="min-h-screen bg-[#f0f4ff] flex items-center justify-center p-6">
      <div className="w-full max-w-lg space-y-4">

        {/* Header */}
        <div className="text-center">
          <span className="inline-block bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full mb-3 uppercase tracking-widest">
            Midtrans Sandbox
          </span>
          <h1 className="text-2xl font-bold text-gray-900">Verifikasi Konfigurasi Midtrans</h1>
          <p className="text-sm text-gray-500 mt-1">
            Halaman ini hanya untuk keperluan testing. Jangan gunakan di production.
          </p>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Status Konfigurasi</h2>
          <div className="space-y-3">
            <StatusBadge
              ok={snapLoaded}
              label="window.snap tersedia"
              detail={snapLoaded
                ? "Script Midtrans Snap berhasil di-load dari index.html"
                : "Script belum ter-load. Cek tag <script> di index.html"}
            />
            <StatusBadge
              ok={clientKeyOk}
              label="VITE_MIDTRANS_CLIENT_KEY (Client Key)"
              detail={clientKeyOk
                ? `OK: ${CLIENT_KEY.slice(0, 22)}...`
                : "Belum diisi atau masih placeholder. Isi di .env dengan format SB-Mid-client-..."}
            />
            <StatusBadge
              ok={serverKeyOk}
              label="VITE_MIDTRANS_SERVER_KEY (untuk test page)"
              detail={serverKeyOk
                ? `OK: ${SERVER_KEY.slice(0, 22)}...`
                : "Belum diisi di .env. Isi dengan Server Key Sandbox (SB-Mid-server-...) untuk direct test."}
            />
          </div>
        </div>

        {/* ── CARA 1: Direct Test ─────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
          <div>
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Cara 1 — Direct Test (Tanpa Backend)</h2>
            <p className="text-xs text-gray-500 mt-1">
              Generate token simulasi langsung ke Midtrans Sandbox, lalu buka popup otomatis.
            </p>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Nominal Transaksi (Rp)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="1000"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="10000"
            />
          </div>

          {genError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
              ❌ {genError}
            </div>
          )}

          <button
            onClick={handleGenerateAndPay}
            disabled={!allReady || generating}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {generating ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Membuat token...
              </>
            ) : (
              "🚀 Generate Token & Buka Popup"
            )}
          </button>

          {!serverKeyOk && (
            <p className="text-xs text-amber-600 text-center">
              ⚠️ Isi <code className="bg-amber-100 px-1 rounded">VITE_MIDTRANS_SERVER_KEY</code> di <code className="bg-amber-100 px-1 rounded">.env</code> untuk menggunakan fitur ini.
            </p>
          )}
        </div>

        {/* ── CARA 2: Manual Token ────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
          <div>
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Cara 2 — Manual Token</h2>
            <p className="text-xs text-gray-500 mt-1">
              Paste Snap Token dari Postman / backend. Token yang di-generate Cara 1 juga akan muncul di sini.
            </p>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={snapToken}
              onChange={(e) => setSnapToken(e.target.value)}
              placeholder="Paste Snap Token di sini..."
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 font-mono"
            />
            <button
              onClick={handleManualPay}
              disabled={!snapLoaded || !snapToken.trim()}
              className="bg-gray-800 hover:bg-gray-900 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors whitespace-nowrap"
            >
              Buka Popup
            </button>
          </div>
        </div>

        {/* Hasil popup */}
        {popupResult && (() => {
          const cfg = resultConfig[popupResult];
          return (
            <div className={`rounded-2xl border p-4 ${cfg.bg}`}>
              <p className={`font-bold text-sm ${cfg.text}`}>{cfg.icon} {cfg.label}</p>
              {popupDetail && <p className={`text-xs mt-1 ${cfg.text} opacity-80`}>{popupDetail}</p>}
            </div>
          );
        })()}

        {/* Info kartu simulasi */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs text-blue-700 space-y-1">
          <p className="font-semibold">💳 Kartu kredit simulasi Midtrans Sandbox:</p>
          <div className="grid grid-cols-2 gap-1 mt-1">
            <div className="bg-white rounded-lg p-2">
              <p className="font-medium text-blue-900">Berhasil</p>
              <p className="font-mono">4811 1111 1111 1114</p>
              <p className="text-blue-500">CVV: 123 | Exp: 01/25</p>
            </div>
            <div className="bg-white rounded-lg p-2">
              <p className="font-medium text-blue-900">Gagal</p>
              <p className="font-mono">4911 1111 1111 1113</p>
              <p className="text-blue-500">CVV: 123 | Exp: 01/25</p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <a href="/" className="text-sm text-gray-400 hover:text-gray-600 underline underline-offset-2">
            ← Kembali ke Aplikasi
          </a>
        </div>
      </div>
    </div>
  );
}
