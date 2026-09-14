import { useState } from "react";
import { LoginStatusModal } from "@/components/shared/LoginStatusModal";
import { AppRoutes } from "@/routes/AppRoutes";
import { useAppNavigation } from "@/hooks/useAppNavigation";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useCheckoutFlow } from "@/hooks/useCheckoutFlow";
import { useAppBoot } from "@/hooks/useAppBoot";

export default function App() {
  const { go } = useAppNavigation();
  const checkout = useCheckoutFlow();
  const auth = useAuthSession({
    setIsRetry: checkout.setIsRetry,
    setCheckoutPlan: checkout.setCheckoutPlan,
    setManualPayment: checkout.setManualPayment,
  });

  // Boot/deep-link transient state (diisi useAppBoot dari URL, dikonsumsi Routes).
  const [ssoParams, setSsoParams] = useState(null);
  const [fixData, setFixData] = useState(null);
  const [reviseData, setReviseData] = useState(null);
  const [reviseToken, setReviseToken] = useState("");
  const [confirmEmailToken, setConfirmEmailToken] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [resetEmail, setResetEmail] = useState("");

  const { sessionChecked } = useAppBoot({
    onLoginSuccess: auth.handleLoginSuccess,
    setGate: auth.setGate,
    setDevAdmin: auth.setDevAdmin,
    setSsoParams,
    setFixData,
    setReviseData,
    setReviseToken,
    setConfirmEmailToken,
    setResetToken,
    setResetEmail,
    setActivePlanName: checkout.setActivePlanName,
  });

  // ── Session check loading ─────────────────────────────────────────────────
  if (!sessionChecked) return null;

  return (
    <>
      <AppRoutes
        currentUser={auth.currentUser}
        devAdmin={auth.devAdmin}
        ssoParams={ssoParams}
        otpToken={auth.otpToken}
        regEmail={auth.regEmail}
        fpEmail={auth.fpEmail}
        resetToken={resetToken}
        resetEmail={resetEmail}
        confirmEmailToken={confirmEmailToken}
        fixData={fixData}
        reviseData={reviseData}
        reviseToken={reviseToken}
        checkoutPlan={checkout.checkoutPlan}
        manualPayment={checkout.manualPayment}
        activePlanName={checkout.activePlanName}
        isRetry={checkout.isRetry}
        go={go}
        onLoginSuccess={auth.handleLoginSuccess}
        onSignOut={auth.handleSignOut}
        onOtpToken={auth.handleOtpToken}
        onEmailSent={auth.handleEmailSent}
        onPaymentSuccess={checkout.handlePaymentSuccess}
        onCheckoutManual={checkout.handleCheckoutManual}
      />

      {auth.gate && (
        <LoginStatusModal
          type={auth.gate.type}
          meta={auth.gate}
          onClose={auth.handleGateClose}
          onRenew={auth.handleGateRenew}
          onReupload={auth.handleGateReupload}
        />
      )}
    </>
  );
}
