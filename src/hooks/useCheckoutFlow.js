import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

// Alur checkout langganan: paket terpilih + payment pending yang diteruskan ke
// halaman Transfer Bank (unggah bukti), plus nama plan aktif untuk landing sukses.
export function useCheckoutFlow() {
  const navigate = useNavigate();

  const [activePlanName, setActivePlanName] = useState("");
  // Transfer manual: paket terpilih + payment pending yang diteruskan ke halaman
  // Transfer Bank (unggah bukti).
  const [checkoutPlan, setCheckoutPlan] = useState(null);
  const [manualPayment, setManualPayment] = useState(null);
  // isRetry: penanda "ini Payment Attempt ke-2+" (bukan attempt pertama).
  // TIDAK ADA counter dari backend (getLatestPayment cuma 1 record, tanpa
  // attemptNumber/retryCount) — jadi ditandai di FE saat user masuk ulang ke
  // Transfer Bank LEWAT gate "Pembayaran Ditolak" (tombol "Ulangi pembayaran" /
  // "Upload bukti pembayaran" di LoginStatusModal → onRenew/onReupload).
  // Default false = attempt pertama (checkout normal dari SubscriptionPage,
  // tanpa lewat gate). Reset otomatis tiap sesi baru (full reload) — tidak perlu
  // di-reset manual karena redirectWithTokens() = full page nav (state SPA hilang).
  const [isRetry, setIsRetry] = useState(false);

  const handlePaymentSuccess = useCallback(
    (planName) => {
      if (planName) setActivePlanName(planName);
      navigate("/payment/success");
    },
    [navigate],
  );

  // Checkout manual berhasil → simpan paket + payment, buka halaman Transfer Bank.
  const handleCheckoutManual = useCallback(
    (plan, payment) => {
      setCheckoutPlan(plan);
      setManualPayment(payment);
      navigate("/login/subscription/transfer");
    },
    [navigate],
  );

  return {
    activePlanName,
    setActivePlanName,
    checkoutPlan,
    setCheckoutPlan,
    manualPayment,
    setManualPayment,
    isRetry,
    setIsRetry,
    handlePaymentSuccess,
    handleCheckoutManual,
  };
}
