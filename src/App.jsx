import { useState, useEffect, lazy, Suspense } from "react";
import { tokenStorage, subscriptionApi, profileApi, authApi, regionsApi } from "@/lib/api";
import { isSuperAdmin, isOperationalAdmin } from "@/lib/roles";
import { decodeFixPayload } from "@/lib/fixLink";
import { evaluateLoginGate } from "@/lib/loginGate";
import { LoginStatusModal } from "@/components/shared/LoginStatusModal";

// Normalisasi respons `POST /auth/revise` → bentuk prefill FixDataPage.
// TODO(verify): sesuaikan nama field dengan respons `/auth/revise` yang sebenarnya
// dan desain user-side final (contoh submit backend memakai teachingGrade, tanpa
// field training — lihat ADR-0003).
function normalizeRevise(res) {
  const u = res?.user || res?.profile || res?.data || res || {};
  // reviseReason & reviseFields ada di top-level (sibling dari `user`).
  const fields = res?.reviseFields || u.reviseFields || u.fieldsToRevise || [];
  const reason = res?.reviseReason || u.reviseReason || "";

  // Tahun/bulan pelatihan diturunkan dari lastTrainingSession.startDate bila ada.
  const startUnix = u.lastTrainingSession?.startDate?.unix;
  let firstTrainingYear = "";
  let firstTrainingMonth = "";
  if (startUnix) {
    const d = new Date(startUnix * 1000);
    firstTrainingYear = String(d.getFullYear());
    firstTrainingMonth = d.getMonth() + 1; // 1-based (FixDataPage mengurangi 1)
  }

  return {
    uid: u.id,
    name: u.name || "",
    username: u.username || "",
    email: u.email || "",
    birthdate:
      u.birthdate && typeof u.birthdate === "object"
        ? u.birthdate.date || ""
        : u.birthdate || "",
    regionId: u.regionId || u.region?.id || "",
    // Respons revise tidak menyertakan provinsi — dilengkapi di boot (fetch detail region).
    provinceId: u.provinceId || u.region?.parentId || "",
    firstTrainingYear,
    firstTrainingMonth,
    lastTrainingSessionId: u.lastTrainingSessionId || u.lastTrainingSession?.id || "",
    schoolName: u.schoolName || "",
    // reviseFields (kosakata FE: tanggalLahir/lokasi/riwayatPelatihan/namaSekolah)
    invalid: Array.isArray(fields) ? fields : [],
    reviseReason: reason,
    notes: {},
  };
}
import { LeftPanel } from "@/components/layout/LeftPanel";

import { LoginPage } from "@/pages/auth/LoginPage";
import { SignUpPage } from "@/pages/auth/SignUpPage";
import { FixDataPage } from "@/pages/auth/FixDataPage";
import { SignUpOtpPage } from "@/pages/auth/SignUpOtpPage";
import { SignUpReviewPage } from "@/pages/auth/SignUpReviewPage";
import { ForgotPasswordPage } from "@/pages/auth/ForgotPasswordPage";
import { CheckEmailPage } from "@/pages/auth/CheckEmailPage";
import { ResetPasswordPage } from "@/pages/auth/ResetPasswordPage";
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

export default function App() {
  const [page, setPage] = useState("login");
  const [otpToken, setOtpToken] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [fpEmail, setFpEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [ssoParams, setSsoParams] = useState(null);
  const [fixData, setFixData] = useState(null);
  const [reviseData, setReviseData] = useState(null);
  const [reviseToken, setReviseToken] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [activePlanName, setActivePlanName] = useState("");
  // Transfer manual: paket terpilih + payment pending yang diteruskan ke halaman
  // Transfer Bank (unggah bukti).
  const [checkoutPlan, setCheckoutPlan] = useState(null);
  const [manualPayment, setManualPayment] = useState(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  // gate: status akun yang memblokir masuk app (suspended/pending/expired).
  // Berlaku untuk login manual DAN restore sesi (reload dgn token tersimpan).
  const [gate, setGate] = useState(null);

  useEffect(() => {
    const init = async () => {
      const params = new URLSearchParams(window.location.search);
      const pathname = window.location.pathname;

      // ── Halaman legal (dibuka di tab baru dari SignUpPage) ────────────────
      // URL: /id/privacy → Kebijakan Privasi, /id/TOS → Ketentuan Layanan.
      const legalPath = pathname.toLowerCase();
      if (legalPath.includes("/id/privacy")) {
        setPage("privacy");
        setSessionChecked(true);
        return;
      }
      if (legalPath.includes("/id/tos")) {
        setPage("terms");
        setSessionChecked(true);
        return;
      }

      // ── Snap Redirect landing pages (Midtrans redirects browser ke sini) ────
      if (pathname.includes("/payment/finish")) {
        setPage("payment-finish");
        setSessionChecked(true);
        return;
      }
      if (pathname.includes("/payment/unfinish")) {
        setPage("payment-unfinish");
        setSessionChecked(true);
        return;
      }
      if (pathname.includes("/payment/error")) {
        setPage("payment-error");
        setSessionChecked(true);
        return;
      }

      // ── Query param routing ───────────────────────────────────────────────
      const paymentStatus = params.get("payment");
      const token = params.get("token");
      const emailParam = params.get("email");
      const adminParam = params.get("admin");
      const midtransTest = params.get("midtrans-test");
      const ssoParam = params.get("sso");
      const sigParam = params.get("sig");
      const fixParam = params.get("fix");

      const clearUrlParams = () =>
        window.history.replaceState({}, "", window.location.pathname);

      // ── DEV: uji modal gate tanpa backend ────────────────────────────────
      // ?gatetest=suspended | pending | expired → paksa tampil LoginStatusModal.
      const gatetest = params.get("gatetest");
      if (gatetest) {
        const meta =
          gatetest === "suspended"
            ? {
                type: "suspended",
                until: "2026-08-14 13:05:00",
                reason: "Melanggar panduan komunitas",
              }
            : { type: gatetest };
        setGate(meta);
        setPage("login");
        clearUrlParams();
        setSessionChecked(true);
        return;
      }

      // ── Link "Revisi Data" dari email (token JWT dari backend) ────────────
      // Route: /register/revise?token=<JWT>. Prefill diambil dari server (bukan URL).
      if (pathname.includes("/revise")) {
        const reviseTokenParam = params.get("token");
        if (reviseTokenParam) {
          try {
            const data = await authApi.getRevise(reviseTokenParam);
            const normalized = normalizeRevise(data);
            // Respons revise hanya punya regionId (kabupaten), tanpa provinsi induk.
            // Lengkapi provinceId dari detail region agar cascade lokasi bisa prefill.
            if (normalized.regionId && !normalized.provinceId) {
              try {
                const region = await regionsApi.get(normalized.regionId);
                const r = region?.data || region || {};
                normalized.provinceId = r.parentId || r.parent?.id || "";
              } catch {
                /* biarkan kosong — user pilih provinsi/kota ulang */
              }
            }
            setReviseData(normalized);
            setReviseToken(reviseTokenParam);
            clearUrlParams();
            setPage("fix-data");
          } catch {
            // Token invalid / kadaluarsa / sudah dipakai (one-time).
            setPage("revise-error");
          }
          setSessionChecked(true);
          return;
        } else {
          // Akses /revise tanpa token JWT
          setPage("revise-error");
          setSessionChecked(true);
          return;
        }
      }

      // ── Link "Perbaikan Data" (LEGACY ?fix=, superseded oleh /revise) ──────
      if (fixParam) {
        const decoded = decodeFixPayload(fixParam);
        if (decoded) {
          setFixData(decoded);
          clearUrlParams();
          setPage("fix-data");
          setSessionChecked(true);
          return;
        }
      }

      if (midtransTest === "true") {
        setPage("midtrans-test");
        setSessionChecked(true);
        return;
      }

      if (ssoParam && sigParam) {
        setSsoParams({ sso: ssoParam, sig: sigParam });
        clearUrlParams();
        setPage(tokenStorage.getAccess() ? "sso-callback" : "login");
        setSessionChecked(true);
        return;
      }

      if (adminParam === "true" || pathname.includes("/admin-dashboard")) {
        setPage("admin-dashboard");
        clearUrlParams();
        setSessionChecked(true);
        return;
      }

      // Link reset password dari email: /register/reset-password?token=...
      // Harus dicek SEBELUM /register generic (yang mengandung "/register").
      if (pathname.includes("/reset-password") || token) {
        if (token) {
          setResetToken(token);
          if (emailParam) setResetEmail(decodeURIComponent(emailParam));
        }
        setPage("reset-password");
        clearUrlParams();
        setSessionChecked(true);
        return;
      }

      // /register → halaman Pendaftaran (signup). URL dibiarkan tetap /register
      // (tujuan tombol "Kembali ke Pendaftaran" dari halaman legal).
      if (pathname.includes("/register")) {
        setPage("login");
        setSessionChecked(true);
        return;
      }

      if (paymentStatus === "success") {
        const planName = params.get("plan");
        if (planName) setActivePlanName(decodeURIComponent(planName));
        setPage("payment-success");
        clearUrlParams();
        setSessionChecked(true);
        return;
      }

      if (tokenStorage.getAccess()) {
        try {
          const profile = await profileApi.getMe();
          await handleLoginSuccess(profile);
        } catch {
          tokenStorage.clear();
        }
      }

      setSessionChecked(true);
    };
    init();
  }, []);

  const handleOtpToken = (token, email) => {
    setOtpToken(token);
    setRegEmail(email);
  };

  // Tentukan halaman tujuan setelah login berdasarkan peran user.
  // Aturan peran ada di src/lib/roles.js (sumber kebenaran tunggal).
  //   - Admin operasional  → admin-dashboard
  //   - Superadmin         → auth-choice
  //   - User biasa         → auth-choice bila langganan aktif, else subscription
  const handleLoginSuccess = async (user) => {
    // Guard status akun sebelum masuk: suspended / pending / expired → modal,
    // jangan set currentUser / jangan routing ke halaman app.
    const blocked = evaluateLoginGate(user);
    if (blocked) {
      setGate({ ...blocked, profile: user });
      setPage("login");
      return;
    }

    setCurrentUser(user);

    if (isOperationalAdmin(user)) {
      setPage("admin-dashboard");
      return;
    }

    if (isSuperAdmin(user)) {
      setPage("auth-choice");
      return;
    }

    // User biasa: cek status langganan untuk menentukan halaman.
    try {
      const sub = await subscriptionApi.getStatus();
      const isActive =
        sub?.hasActiveSubscription === true ||
        sub?.subscription?.status === "active";
      setPage(isActive ? "auth-choice" : "subscription");
    } catch {
      // Gagal cek langganan → arahkan ke halaman langganan (fail-safe).
      setPage("subscription");
    }
  };

  const handleSignOut = () => {
    tokenStorage.clear();
    setCurrentUser(null);
    setPage("login");
  };

  const handleEmailSent = (email) => {
    setFpEmail(email);
    setPage("check-email");
  };

  const handlePaymentSuccess = (planName) => {
    if (planName) setActivePlanName(planName);
    setPage("payment-success");
  };

  // Checkout manual berhasil → simpan paket + payment, buka halaman Transfer Bank.
  const handleCheckoutManual = (plan, payment) => {
    setCheckoutPlan(plan);
    setManualPayment(payment);
    setPage("transfer-bank");
  };

  // ── Session check loading ─────────────────────────────────────────────────
  if (!sessionChecked) return null;

  // ── Full-screen pages ─────────────────────────────────────────────────────
  if (page === "payment-finish") return <PaymentFinishPage />;
  if (page === "payment-unfinish") return <PaymentUnfinishPage />;
  if (page === "payment-error") return <PaymentErrorPage />;
  if (page === "midtrans-test") return <MidtransTestPage />;
  if (page === "privacy") return <PrivacyPage onNavigate={setPage} />;
  if (page === "terms") return <TermsPage onNavigate={setPage} />;
  if (page === "subscription")
    return (
      <SubscriptionPage
        user={currentUser}
        onSignOut={handleSignOut}
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentPending={() => setPage("admin-dashboard")}
        onCheckoutManual={handleCheckoutManual}
      />
    );
  if (page === "transfer-bank")
    return (
      <TransferBankPage
        user={currentUser}
        plan={checkoutPlan}
        payment={manualPayment}
        onSignOut={handleSignOut}
        onBack={() => setPage("subscription")}
      />
    );
  if (page === "payment-success")
    return (
      <PaymentSuccessPage
        user={currentUser}
        onSignOut={handleSignOut}
        activePlanName={activePlanName}
      />
    );
  if (page === "forgot-password")
    return (
      <ForgotPasswordPage onNavigate={setPage} onEmailSent={handleEmailSent} />
    );
  if (page === "check-email")
    return <CheckEmailPage email={fpEmail} onNavigate={setPage} />;
  if (page === "reset-password")
    return (
      <ResetPasswordPage
        token={resetToken}
        email={resetEmail}
        onNavigate={setPage}
      />
    );
  if (page === "admin-dashboard")
    return (
      <Suspense
        fallback={
          <div className="flex h-screen items-center justify-center">
            <svg
              className="animate-spin h-10 w-10 text-blue-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </div>
        }
      >
        <AdminDashboardPage user={currentUser} onSignOut={handleSignOut} />
      </Suspense>
    );

  if (page === "revise-error")
    return (
      <div className="flex h-screen overflow-hidden">
        <LeftPanel />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center space-y-4 max-w-[380px] animate-fade-in-up">
            <h1 className="text-[22px] font-bold text-foreground">Link Tidak Valid</h1>
            <p className="text-[13px] text-muted-foreground">
              Link revisi tidak valid atau sudah kadaluarsa. Silakan minta admin
              mengirim ulang email revisi.
            </p>
            <button
              onClick={() => setPage("login")}
              className="text-sm font-bold text-foreground hover:text-foreground/80 transition-colors"
            >
              Kembali ke Login
            </button>
          </div>
        </div>
      </div>
    );

  // ── Split-layout pages (login / signup) ───────────────────────────────────
  const authPages = {
    login: (
      <LoginPage
        onNavigate={setPage}
        onLoginSuccess={handleLoginSuccess}
        isSsoMode={!!ssoParams}
      />
    ),
    signup: <SignUpPage onNavigate={setPage} onOtpToken={handleOtpToken} />,
    "fix-data": (
      <FixDataPage
        fixData={reviseData ?? fixData}
        reviseToken={reviseToken}
        onNavigate={setPage}
      />
    ),
    "signup-otp": (
      <SignUpOtpPage
        onNavigate={setPage}
        otpToken={otpToken}
        email={regEmail}
      />
    ),
    "signup-review": <SignUpReviewPage onNavigate={setPage} />,
    "auth-choice": (
      <AuthChoicePage onNavigate={setPage} onSignOut={handleSignOut} />
    ),
    "sso-callback": (
      <SsoCallbackPage
        sso={ssoParams?.sso}
        sig={ssoParams?.sig}
        onNavigate={setPage}
      />
    ),
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <LeftPanel />
      {authPages[page] ?? authPages["login"]}

      {gate && (
        <LoginStatusModal
          type={gate.type}
          meta={gate}
          // Tutup/logout/dismiss → bersihkan sesi, kembali ke login.
          onClose={() => {
            tokenStorage.clear();
            setCurrentUser(null);
            setGate(null);
            setPage("login");
          }}
          // "Perbarui Langganan" (expired) → lanjut ke halaman langganan.
          onRenew={() => {
            const p = gate.profile;
            setGate(null);
            setCurrentUser(p);
            setPage("subscription");
          }}
        />
      )}
    </div>
  );
}
