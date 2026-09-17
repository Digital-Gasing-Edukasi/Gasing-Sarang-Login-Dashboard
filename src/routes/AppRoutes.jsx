import { lazy, Suspense } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { tokenStorage } from "@/lib/api";
import { SplitLayout } from "@/components/layout/SplitLayout";
import { DashboardSpinner } from "@/components/layout/DashboardSpinner";
import { ReviseErrorPage } from "@/pages/auth/ReviseErrorPage";

import { LoginPage } from "@/pages/auth/LoginPage";
import { SignUpPage } from "@/pages/auth/SignUpPage";
import { FixDataPage } from "@/pages/auth/FixDataPage";
import { SignUpOtpPage } from "@/pages/auth/SignUpOtpPage";
import { SignUpReviewPage } from "@/pages/auth/SignUpReviewPage";
import { ForgotPasswordPage } from "@/pages/auth/ForgotPasswordPage";
import { CheckEmailPage } from "@/pages/auth/CheckEmailPage";
import { ResetPasswordPage } from "@/pages/auth/ResetPasswordPage";
import { ConfirmEmailChangePage } from "@/pages/auth/ConfirmEmailChangePage";
import { SsoCallbackPage } from "@/pages/auth/SsoCallbackPage";
import { AuthChoicePage } from "@/pages/auth/AuthChoicePage";
import { TermsPage } from "@/pages/legal/TermsPage";
import { PrivacyPage } from "@/pages/legal/PrivacyPage";

import SubscriptionPage from "@/pages/SubscriptionPage";
import TransferBankPage from "@/pages/TransferBankPage";
import PaymentSuccessPage from "@/pages/PaymentSuccessPage";
import PaymentFinishPage from "@/pages/PaymentFinishPage";
import PaymentUnfinishPage from "@/pages/PaymentUnfinishPage";
import PaymentErrorPage from "@/pages/PaymentErrorPage";
const AdminDashboardPage = lazy(() => import("@/pages/AdminDashboardPage"));
import MidtransTestPage from "@/pages/MidtransTestPage";
import KomunitasPage from "@/pages/komunitas/KomunitasPage";
import TestMenuPage from "@/pages/TestMenuPage";

// Semua <Route> aplikasi. Dipisah dari App.jsx agar App tinggal komposisi
// hooks + <AppRoutes/> + <LoginStatusModal/>. Prop-drilling disengaja
// (tanpa Context) supaya diff refactor nol-perilaku.
export function AppRoutes({
  currentUser,
  devAdmin,
  ssoParams,
  otpToken,
  regEmail,
  fpEmail,
  resetToken,
  resetEmail,
  confirmEmailToken,
  fixData,
  reviseData,
  reviseToken,
  checkoutPlan,
  manualPayment,
  activePlanName,
  isRetry,
  go,
  onLoginSuccess,
  onSignOut,
  onOtpToken,
  onEmailSent,
  onPaymentSuccess,
  onCheckoutManual,
}) {
  const navigate = useNavigate();
  const location = useLocation();

  // Route yang butuh sesi. Tanpa token → balik ke /login (kecuali bypass ?admin=true).
  const requireAuth = (element) =>
    tokenStorage.getAccess() || devAdmin ? element : <Navigate to="/login" replace />;

  return (
    <Routes>
      <Route
        path="/"
        element={
          // Cegah race dgn init(): tepat sesudah sessionChecked jadi true, render
          // ini kebagian giliran SEBELUM location dari useLocation() sempat
          // ke-update ke "/login/sso-callback" (masih kebaca "/" sesaat), padahal
          // window.location sendiri sudah berubah duluan (jadi cek raw URL di
          // sini gak reliable). ssoParams adalah React state, jadi konsisten
          // dgn render ini — pakai itu sbg sinyal utk gak ikut redirect ke
          // /login polos & nimpa tujuan /login/sso-callback yang benar.
          ssoParams ? null : <Navigate to="/login" replace />
        }
      />

      {/* ── Login & turunannya ─────────────────────────────────────────── */}
      <Route
        path="/login"
        element={
          <SplitLayout>
            <LoginPage
              onNavigate={go}
              onLoginSuccess={onLoginSuccess}
              isSsoMode={!!ssoParams}
            />
          </SplitLayout>
        }
      />
      {/* Flow lupa password: layout gelap full-bleed (bukan SplitLayout — page
          sudah membawa background/logo/footer sendiri lewat AuthDarkLayout). */}
      <Route
        path="/login/forgot-password"
        element={
          <ForgotPasswordPage onNavigate={go} onEmailSent={onEmailSent} />
        }
      />
      <Route
        path="/login/check-email"
        element={<CheckEmailPage email={fpEmail} onNavigate={go} />}
      />
      <Route
        path="/login/reset-password"
        element={
          <ResetPasswordPage
            token={resetToken}
            email={resetEmail}
            onNavigate={go}
          />
        }
      />
      {/* Konfirmasi ubah email — dua path: STAGING `/register/…`, PRODUCTION `/…`.
          Keduanya didaftarkan supaya link email jalan tanpa peduli env build. */}
      <Route
        path="/register/confirm-email-change"
        element={
          <ConfirmEmailChangePage token={confirmEmailToken} onNavigate={go} />
        }
      />
      <Route
        path="/confirm-email-change"
        element={
          <ConfirmEmailChangePage token={confirmEmailToken} onNavigate={go} />
        }
      />
      <Route
        path="/login/choice"
        element={requireAuth(
          <SplitLayout>
            <AuthChoicePage user={currentUser} onNavigate={go} onSignOut={onSignOut} />
          </SplitLayout>,
        )}
      />
      <Route
        path="/login/sso-callback"
        element={
          <SplitLayout>
            <SsoCallbackPage
              sso={ssoParams?.sso}
              sig={ssoParams?.sig}
              onNavigate={go}
            />
          </SplitLayout>
        }
      />
      <Route
        path="/login/subscription"
        element={requireAuth(
          <SubscriptionPage
            user={currentUser}
            onSignOut={onSignOut}
            onPaymentSuccess={onPaymentSuccess}
            onPaymentPending={() => navigate("/dashboard-admin")}
            onCheckoutManual={onCheckoutManual}
          />,
        )}
      />
      <Route
        path="/login/subscription/transfer"
        element={requireAuth(
          // Halaman ini butuh paket + payment dari langkah checkout. Deep-link
          // langsung (state kosong) → balik ke halaman langganan.
          checkoutPlan ? (
            <TransferBankPage
              user={currentUser}
              plan={checkoutPlan}
              payment={manualPayment}
              onSignOut={onSignOut}
              onBack={() => navigate("/login/subscription")}
              isRetry={isRetry}
            />
          ) : (
            <Navigate to="/login/subscription" replace />
          ),
        )}
      />

      {/* ── Pendaftaran (signup) & turunannya ───────────────────────────── */}
      <Route
        path="/register"
        element={
          <SplitLayout>
            <SignUpPage onNavigate={go} onOtpToken={onOtpToken} />
          </SplitLayout>
        }
      />
      <Route
        path="/register/otp"
        element={
          <SplitLayout>
            <SignUpOtpPage
              onNavigate={go}
              otpToken={otpToken}
              email={regEmail}
              onOtpToken={onOtpToken}
            />
          </SplitLayout>
        }
      />
      {/* Greeting pasca-daftar (OTP terverifikasi) — layout gelap full-bleed. */}
      <Route
        path="/register/review"
        element={<SignUpReviewPage onNavigate={go} />}
      />
      <Route
        path="/register/revise"
        element={
          <SplitLayout>
            <FixDataPage
              fixData={reviseData ?? fixData}
              reviseToken={reviseToken}
              onNavigate={go}
            />
          </SplitLayout>
        }
      />
      <Route
        path="/register/revise/invalid"
        element={<ReviseErrorPage onNavigate={go} />}
      />
      <Route
        path="/register/id/TOS"
        element={<TermsPage onNavigate={go} />}
      />
      <Route
        path="/register/id/privacy"
        element={<PrivacyPage onNavigate={go} />}
      />
      {/* Link reset password lama dari email masih menunjuk ke sini. */}
      <Route
        path="/register/reset-password"
        element={
          <Navigate
            to={{
              pathname: "/login/reset-password",
              search: location.search,
            }}
            replace
          />
        }
      />

      {/* ── Dashboard admin ─────────────────────────────────────────────── */}
      <Route
        path="/dashboard-admin"
        element={requireAuth(
          <Suspense fallback={<DashboardSpinner />}>
            <AdminDashboardPage
              user={currentUser}
              onSignOut={onSignOut}
            />
          </Suspense>,
        )}
      />

      {/* ── Pembayaran (landing Snap Redirect Midtrans) ─────────────────── */}
      <Route
        path="/payment/success"
        element={
          <PaymentSuccessPage
            user={currentUser}
            onSignOut={onSignOut}
            activePlanName={activePlanName}
            isRetry={isRetry}
          />
        }
      />
      <Route path="/payment/finish" element={<PaymentFinishPage />} />
      <Route path="/payment/unfinish" element={<PaymentUnfinishPage />} />
      <Route path="/payment/error" element={<PaymentErrorPage />} />

      <Route path="/midtrans-test" element={<MidtransTestPage />} />

      {/* Menu test navigasi (dev/QA) — HANYA di dev lokal (import.meta.env.DEV).
          Di build staging & production gate ini false → route test-menu tidak
          terdaftar, navigasi ke /test-menu jatuh ke catch-all → /login.
          Pakai data dummy TANPA auth, route terpisah dari flow asli. */}
      {import.meta.env.DEV && (
        <>
          <Route path="/test-menu" element={<TestMenuPage />} />
          <Route
            path="/test-menu/subscription"
            element={
              <SubscriptionPage
                user={{ name: "Test User" }}
                onSignOut={() => navigate("/test-menu")}
                onPaymentSuccess={() => navigate("/payment/success")}
                onPaymentPending={() => navigate("/test-menu")}
                onCheckoutManual={() => navigate("/test-menu/transfer")}
              />
            }
          />
          <Route
            path="/test-menu/transfer"
            element={
              <TransferBankPage
                user={{ name: "Test User" }}
                plan={{
                  id: "test",
                  name: "Tahunan",
                  billingCycle: "annual",
                  months: 12,
                  priceTotal: 396000,
                  priceMonthly: 33000,
                }}
                payment={null}
                onSignOut={() => navigate("/test-menu")}
                onBack={() => navigate("/test-menu/subscription")}
              />
            }
          />
          {/* Preview layar "Pembayaran Berhasil!" (state submitted) tanpa lewat
              form transfer — dipakai buat cek 1:1 layout ke referensi desain. */}
          <Route
            path="/test-menu/transfer/success"
            element={
              <TransferBankPage
                user={{ name: "Test User" }}
                plan={{
                  id: "test",
                  name: "Tahunan",
                  billingCycle: "annual",
                  months: 12,
                  priceTotal: 396000,
                  priceMonthly: 33000,
                }}
                payment={{ orderId: "0001SGINVGA-VIII2026" }}
                onSignOut={() => navigate("/test-menu")}
                onBack={() => navigate("/test-menu/subscription")}
                initialSubmitted
                initialReceiptFileId="test-receipt"
              />
            }
          />
        </>
      )}

      {/* ── Komunitas statis (guest / fake login) — publik, tanpa auth ──── */}
      {/* Lihat ADR-0004. Route catch-all /komunitas/* biar subpath ikut ke page. */}
      <Route
        path="/komunitas/*"
        element={<KomunitasPage onNavigate={go} />}
      />

      {/* Path tak dikenal → login (fail-safe, sama seperti fallback lama). */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
