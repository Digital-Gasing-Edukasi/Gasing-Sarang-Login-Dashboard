import { useEffect, useRef, useState } from "react";
import { XenditComponents } from "xendit-components-web";
import { QrCode, Loader2 } from "lucide-react";
import danaLogo from "@/assets/payments/logo-dana.svg";
import gopayLogo from "@/assets/payments/logo-gopay.webp";

// Channel-specific host styling. Adjust these values when tuning the
// provider-rendered component layout for each payment method.
export const channelHostClasses = {
  QRIS: "absolute h-px w-px overflow-hidden opacity-0 pointer-events-none",
  CARDS: "min-h-[120px] bg-white/60 p-4 rounded-lg",
  BRI_DIRECT_DEBIT: "min-h-[120px]",
  OVO: "min-h-[120px] bg-white/60 p-4 rounded-lg",
  DANA: "hidden",
  GOPAY: "hidden",
  SHOPEEPAY: "absolute h-px w-px overflow-hidden opacity-0 pointer-events-none",
};

const codePopupChannels = new Set(["QRIS", "SHOPEEPAY"]);

export default function XenditPaymentForm({ session, channelCode, onDone }) {
  const hostClassName = channelHostClasses[channelCode] || "min-h-[120px]";
  const isCodePopupChannel = codePopupChannels.has(channelCode);
  const codeLabel = channelCode === "SHOPEEPAY" ? "ShopeePay" : "QRIS";
  const host = useRef(null);
  const sdkRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [qrisClosed, setQrisClosed] = useState(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    let dead = false;
    let sdk;
    let picker;
    const listeners = [];
    try {
      sdk = new XenditComponents({
        componentsSdkKey: session.componentsSdkKey,
        iframeFieldAppearance: {
          inputStyles: {
            color: "#f6f2ff",
            backgroundColor: "#2b1e48",
            fontFamily: "sans-serif",
          },
          placeholderStyles: { color: "#b9accf" },
        },
      });
      sdkRef.current = sdk;
      const listen = (name, fn) => {
        sdk.addEventListener(name, fn);
        listeners.push([name, fn]);
      };
      listen("init", () => {
        const channel = sdk
          .getActiveChannels()
          .find((item) => item.channelCode === channelCode);
        if (!channel) return setError("Metode pembayaran ini tidak tersedia.");
        picker = sdk.createChannelComponent(channel);
        host.current?.replaceChildren(picker);
        if (isCodePopupChannel) {
          setTimeout(() => {
            if (!dead) sdk.submit();
          }, 0);
        }
      });
      listen("submission-ready", () => !dead && setReady(true));
      listen("submission-not-ready", () => !dead && setReady(false));
      listen("submission-begin", () => !dead && setBusy(true));
      listen("submission-resume", () => !dead && setBusy(true));
      listen("submission-end", (event) => {
        if (!dead) {
          setBusy(false);
          if (event.userErrorMessage?.length)
            setError(event.userErrorMessage.join("\n"));
        }
      });
      listen("action-end", () => {
        if (!dead && isCodePopupChannel) {
          setBusy(false);
          setQrisClosed(true);
        }
      });
      listen("session-complete", () => !dead && onDoneRef.current());
      listen("session-expired-or-canceled", () => {
        if (!dead && isCodePopupChannel) {
          setBusy(false);
          setQrisClosed(true);
        }
      });
    } catch {
      setError("Tidak dapat membuka komponen pembayaran Xendit.");
    }
    return () => {
      dead = true;
      listeners.forEach(([name, fn]) => sdk?.removeEventListener(name, fn));
      sdk?.destroy?.();
      host.current?.replaceChildren();
    };
  }, [session, channelCode, onDone]);

  return (
    <>
      {busy || host === null ? (
        <div className="flex items-center justify-center my-4">
          <Loader2 className="animate-spin" aria-label="Memuat pembayaran" />
        </div>
      ) : (
        <div
          ref={host}
          aria-label="Form pembayaran aman Xendit"
          className={hostClassName}
        />
      )}
      {isCodePopupChannel && (
        <div className="mt-4 text-center">
          <style>{`@keyframes qris-scan { 0%, 100% { transform: translateY(-38px); opacity: .35; } 50% { transform: translateY(38px); opacity: 1; } }`}</style>
          <div className="mx-auto relative flex h-28 w-28 items-center justify-center rounded-2xl bg-white/10 border border-white/15 overflow-hidden">
            <QrCode size={72} strokeWidth={1.4} className="text-white/75" />
            <span
              aria-hidden="true"
              className="absolute left-3 right-3 h-0.5 rounded-full bg-[#22d3ee] shadow-[0_0_12px_#22d3ee]"
              style={{ animation: "qris-scan 2s ease-in-out infinite" }}
            />
          </div>
          {qrisClosed && (
            <button
              type="button"
              disabled={busy}
              className="bg-white text-black rounded-full py-2 w-full font-semibold mt-5 disabled:opacity-60"
              onClick={() => {
                setQrisClosed(false);
                setBusy(true);
                sdkRef.current?.submit();
              }}
            >
              {busy ? `Membuka kode ${codeLabel}…` : `Lihat kode ${codeLabel}`}
            </button>
          )}
          <div className="mt-6 text-left text-sm text-white/70 leading-relaxed">
            <p className="font-semibold text-white mb-2">Cara Pembayaran:</p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Buka aplikasi E-Wallet atau M-Banking kamu.</li>
              <li>Scan QR Code diatas melalui aplikasimu.</li>
              <li>Pastikan nominal pembayaran sesuai.</li>
              <li>Selesaikan transaksi di aplikasi kamu.</li>
            </ol>
          </div>
        </div>
      )}
      {channelCode === "DANA" && (
        <div className="mt-4 flex flex-col items-center text-center">
          <img src={danaLogo} alt="DANA" className="h-12 w-auto" />
          <p className="mt-3 text-sm text-white/70">
            Klik untuk melanjutkan pembayaran
          </p>
        </div>
      )}
      {channelCode === "GOPAY" && (
        <div className="mt-4 flex flex-col items-center text-center">
          <img src={gopayLogo} alt="GOPAY" className="h-24 w-auto" />
          <p className="mt-3 text-sm text-white/70">
            Klik untuk melanjutkan pembayaran
          </p>
        </div>
      )}
      {error && (
        <p role="alert" className="text-[#ff9eaa] text-sm mt-3">
          {error}
        </p>
      )}
      {!isCodePopupChannel && (
        <button
          disabled={!ready || busy}
          className="bg-white text-black rounded-full py-2 w-full font-semibold mt-4"
          onClick={async () => {
            setBusy(true);
            try {
              await sdkRef.current.submit();
            } catch {
              setBusy(false);
              setError(
                "Pembayaran belum dapat diajukan. Cek status order lalu coba lagi.",
              );
            }
          }}
        >
          {busy ? "Memproses…" : "Bayar Sekarang"}
        </button>
      )}
      <p className="text-xs text-white/50 mt-3">
        Data pembayaran ditangani Xendit.
      </p>
    </>
  );
}
