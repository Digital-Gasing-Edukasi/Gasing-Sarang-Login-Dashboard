import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { tokenStorage, subscriptionApi, profileApi, authApi, regionsApi, webAppApi } from "@/lib/api";
import { canAccessDiscourse, isSsoDisabled, isSuperAdmin } from "@/lib/roles";
import { decodeFixPayload } from "@/lib/fixLink";
import { evaluateLoginGate, evaluatePaymentGate, isPaymentGraceActive } from "@/lib/loginGate";
import { pathForPage, isPublicStaticPath, skipSessionRestore } from "@/lib/routes";
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

  // Tahun/bulan pelatihan diturunkan dari firstTrainingSession.startDate bila ada
  // (nama kanonik baru; lastTrainingSession dipertahankan sbg fallback respons lama).
  const startUnix = (u.firstTrainingSession || u.lastTrainingSession)?.startDate?.unix;
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
    lastTrainingSessionId: u.firstTrainingSessionId || u.firstTrainingSession?.id || u.lastTrainingSessionId || u.lastTrainingSession?.id || "",
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

// Shell dua kolom untuk halaman auth (login/signup/otp/...): panel kiri + konten.
function SplitLayout({ children }) {
  return (
    <div className="flex min-h-screen">
      <LeftPanel />
      {children}
    </div>
  );
}

function DashboardSpinner() {
  return (
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
  );
}

// Link revisi tidak valid / kadaluarsa / sudah dipakai (one-time token).
function ReviseErrorPage({ onNavigate }) {
  return (
    <SplitLayout>
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center space-y-4 max-w-[380px] animate-fade-in-up">
          <h1 className="text-[22px] font-bold text-foreground">Link Tidak Valid</h1>
          <p className="text-[13px] text-muted-foreground">
            Link revisi tidak valid atau sudah kadaluarsa. Silakan minta admin
            mengirim ulang email revisi.
          </p>
          <button
            onClick={() => onNavigate("login")}
            className="text-sm font-bold text-foreground hover:text-foreground/80 transition-colors"
          >
            Kembali ke Login
          </button>
        </div>
      </div>
    </SplitLayout>
  );
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const [otpToken, setOtpToken] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [fpEmail, setFpEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [confirmEmailToken, setConfirmEmailToken] = useState("");
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
  // isRetry: penanda "ini Payment Attempt ke-2+" (bukan attempt pertama).
  // TIDAK ADA counter dari backend (getLatestPayment cuma 1 record, tanpa
  // attemptNumber/retryCount) — jadi ditandai di FE saat user masuk ulang ke
  // Transfer Bank LEWAT gate "Pembayaran Ditolak" (tombol "Ulang Pembayaran" /
  // "Upload Bukti Pembayaran" di LoginStatusModal → onRenew/onReupload di bawah).
  // Default false = attempt pertama (checkout normal dari SubscriptionPage,
  // tanpa lewat gate). Reset otomatis tiap sesi baru (full reload) — tidak perlu
  // di-reset manual karena redirectWithTokens() = full page nav (state SPA hilang).
  const [isRetry, setIsRetry] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  // gate: status akun yang memblokir masuk app (suspended/pending/expired).
  // Berlaku untuk login manual DAN restore sesi (reload dgn token tersimpan).
  const [gate, setGate] = useState(null);
  // DEV: ?admin=true membuka dashboard admin tanpa sesi (preview UI tanpa backend).
  const [devAdmin, setDevAdmin] = useState(false);

  // Shim: halaman-halaman masih memanggil `onNavigate("<page-key>")`.
  // Terjemahkan page key → URL supaya file page tidak perlu diubah.
  const go = useCallback(
    (key, state) => navigate(pathForPage(key), state ? { state } : undefined),
    [navigate],
  );

  useEffect(() => {
    const init = async () => {
      const params = new URLSearchParams(window.location.search);
      const base = import.meta.env.BASE_URL;
      let pathname = window.location.pathname;
      if (base !== '/' && pathname.startsWith(base)) {
        pathname = pathname.slice(base.length);
        if (!pathname.startsWith('/')) pathname = '/' + pathname;
      }

      // Hapus query param dari URL tanpa menambah entri history (dan tanpa
      // memutus sinkronisasi dengan history milik React Router).
      const clearUrlParams = (to = pathname) => navigate(to, { replace: true });

      // ── DEV: uji modal gate tanpa backend ────────────────────────────────
      // ?gatetest=suspended | pending | expired → paksa tampil LoginStatusModal.
      // ?gatetest=payment_receipt | payment_amount | payment_account → modal
      //   "Pembayaran Ditolak" (varian ikut sufiks setelah "payment_").
      // ?gatetest=payment_review → modal "Pembayaran Sedang Kami Tinjau".
      const gatetest = params.get("gatetest");
      if (gatetest) {
        const meta =
          gatetest === "suspended"
            ? {
                type: "suspended",
                until: "2026-08-14 13:05:00",
                reason: "Terlalu agresif dan mengandung SARA",
              }
            : gatetest === "rejected"
            ? {
                type: "rejected",
                reasons: [
                  "Tanggal lahir tidak sesuai",
                  "Riwayat pelatihan tidak ditemukan",
                  "Nama sekolah tidak sesuai",
                ],
              }
            : gatetest.startsWith("payment") && gatetest !== "payment_review"
            ? {
                type: "payment_rejected",
                variant: gatetest.split("_")[1] || "receipt",
                amount: 1500000,
              }
            : { type: gatetest };
        setGate(meta);
        clearUrlParams("/login");
        setSessionChecked(true);
        return;
      }

      // ── Halaman publik statis (legal, landing pembayaran, midtrans test) ──
      // Router sudah memetakan path-nya; tidak perlu cek sesi.
      if (isPublicStaticPath(pathname)) {
        setSessionChecked(true);
        return;
      }

      // ── Link "Revisi Data" dari email (token JWT dari backend) ────────────
      // Route: /register/revise?token=<JWT>. Prefill diambil dari server (bukan URL).
      if (pathname.toLowerCase().startsWith("/register/revise")) {
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
            clearUrlParams("/register/revise");
          } catch {
            // Token invalid / kadaluarsa / sudah dipakai (one-time).
            clearUrlParams("/register/revise/invalid");
          }
        } else {
          // Akses /register/revise tanpa token JWT
          clearUrlParams("/register/revise/invalid");
        }
        setSessionChecked(true);
        return;
      }

      // ── Link "Perbaikan Data" (LEGACY ?fix=, superseded oleh /register/revise) ──
      const fixParam = params.get("fix");
      if (fixParam) {
        const decoded = decodeFixPayload(fixParam);
        if (decoded) {
          setFixData(decoded);
          clearUrlParams("/register/revise");
          setSessionChecked(true);
          return;
        }
      }

      if (params.get("midtrans-test") === "true") {
        clearUrlParams("/midtrans-test");
        setSessionChecked(true);
        return;
      }

      const ssoParam = params.get("sso");
      const sigParam = params.get("sig");
      if (ssoParam && sigParam) {
        setSsoParams({ sso: ssoParam, sig: sigParam });
        clearUrlParams(tokenStorage.getAccess() ? "/login/sso-callback" : "/login");
        setSessionChecked(true);
        return;
      }

      // ── DEV: ?admin=true → dashboard admin tanpa sesi ─────────────────────
      if (params.get("admin") === "true") {
        setDevAdmin(true);
        clearUrlParams("/dashboard-admin");
        setSessionChecked(true);
        return;
      }

      // ── Link konfirmasi ubah email dari email: …/confirm-email-change?token=… ──
      // Path backend beda per-env: STAGING `/register/confirm-email-change`,
      // PRODUCTION `/confirm-email-change`. Cocokkan KEDUA bentuk (endsWith) supaya
      // link jalan lintas-env. Harus diproses SEBELUM branch `token` generik di bawah
      // (yang melempar ke reset-password). Token disimpan lalu dibuang dari URL;
      // `clearUrlParams()` default mempertahankan pathname aktif (env-aware). Page
      // yang menembak POST /profile/confirm-email saat mount.
      if (pathname.toLowerCase().endsWith("/confirm-email-change")) {
        setConfirmEmailToken(params.get("token") || "");
        clearUrlParams();
        setSessionChecked(true);
        return;
      }

      // ── Link reset password dari email: /login/reset-password?token=... ────
      // (path lama /register/reset-password di-redirect oleh <Routes> di bawah)
      const token = params.get("token");
      if (token) {
        setResetToken(token);
        const emailParam = params.get("email");
        if (emailParam) setResetEmail(decodeURIComponent(emailParam));
        // Token dibuang dari URL supaya tidak bocor lewat history/log.
        clearUrlParams("/login/reset-password");
        setSessionChecked(true);
        return;
      }

      // ── Snap Redirect legacy: ?payment=success ────────────────────────────
      if (params.get("payment") === "success") {
        const planName = params.get("plan");
        if (planName) setActivePlanName(decodeURIComponent(planName));
        clearUrlParams("/payment/success");
        setSessionChecked(true);
        return;
      }

      // Halaman auth-entry (signup, reset/forgot password): jangan auto-restore
      // sesi — user di tengah pendaftaran tak boleh dilempar ke dashboard.
      if (skipSessionRestore(pathname)) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOtpToken = (token, email) => {
    setOtpToken(token);
    setRegEmail(email);
  };

  // Tentukan halaman tujuan setelah login berdasarkan peran user.
  // Aturan peran ada di src/lib/roles.js (sumber kebenaran tunggal).
  //   - Admin operasional  → /dashboard-admin
  //   - Superadmin         → /login/choice
  //   - User biasa         → /login/choice bila langganan aktif, else /login/subscription
  const handleLoginSuccess = async (user) => {
    // Payment terakhir masih 'pending' → user dianggap boleh masuk walau
    // langganan belum aktif/expired (nunggu pembayaran diproses).
    // Dihitung sekali, dipakai di gate 'expired' + routing langganan di bawah.
    let paymentPending = false;
    let graceActive = false; // pending & MASIH < 24 jam → boleh akses web app
    let paymentRejected = null;
    try {
      const latest = await subscriptionApi.getLatestPayment();
      const p = latest?.payment || latest?.data || latest || {};
      paymentPending = p.status === "pending";
      // Akses sementara 24 jam sejak bayar (manual transfer) walau belum diverifikasi.
      graceActive = isPaymentGraceActive(p);
      // Payment terakhir ditolak admin (failed/rejected) → gate "Pembayaran Ditolak".
      paymentRejected = evaluatePaymentGate(p);
    } catch {
      // Gagal / belum pernah bayar → anggap tidak ada pending / tolakan.
    }

    // Staff/capability holder (superadmin, DISABLED-SSO admin, moderator
    // Discourse) TIDAK punya "langganan" / alur verifikasi member → gate
    // kondisi akun (suspended/pending/expired/payment) di bawah TIDAK berlaku
    // buat mereka. Cek ini duluan, sebelum gate.
    const isStaffCapabilityHolder =
      isSuperAdmin(user) || canAccessDiscourse(user) || isSsoDisabled(user);

    // Guard status akun sebelum masuk. Prioritas:
    //   suspended / pending akun → selalu menang (blokir mutlak).
    //   payment ditolak          → menang atas 'expired' (arahkan perbaiki bayar).
    //   expired                  → di-bypass bila ada payment pending.
    // Dilewati sepenuhnya untuk staff/capability holder (lihat komentar di atas).
    if (!isStaffCapabilityHolder) {
      const blocked = evaluateLoginGate(user);
      if (blocked && blocked.type !== "expired") {
        setGate({ ...blocked, profile: user });
        navigate("/login", { replace: true });
        return;
      }
      if (paymentRejected) {
        setGate({ ...paymentRejected, profile: user });
        navigate("/login", { replace: true });
        return;
      }
      if (blocked && blocked.type === "expired" && !paymentPending) {
        setGate({ ...blocked, profile: user });
        navigate("/login", { replace: true });
        return;
      }
    }

    setCurrentUser(user);

    // Superadmin → SELALU ke panel pilih tujuan (3 tombol: Dashboard + Moderator/
    // Discourse + Web App), walau dia juga punya capability DISABLED-SSO.
    // Superadmin bypass capability, TIDAK bypass kondisi akun (API_ACCESS_MATRIX.md).
    if (isSuperAdmin(user)) {
      navigate("/login/choice", { replace: true });
      return;
    }

    // HANYA yang punya capability USER/DISCOURSE/DISABLED-SSO (dan BUKAN
    // superadmin, sudah ditangani di atas) yang boleh masuk Dashboard Admin
    // langsung.
    if (isSsoDisabled(user)) {
      navigate("/dashboard-admin", { replace: true });
      return;
    }

    // Moderator (pemilik USER/DISCOURSE/MANAGE_EXTRA_GROUPS) → panel pilih
    // tujuan, 2 tombol (Moderator/Discourse + Web App). JANGAN auto redirect.
    if (canAccessDiscourse(user)) {
      navigate("/login/choice", { replace: true });
      return;
    }

    // User biasa: cek status langganan untuk menentukan halaman.
    try {
      const sub = await subscriptionApi.getStatus();
      const isActive =
        sub?.hasActiveSubscription === true ||
        sub?.subscription?.status === "active";
      // Boleh handoff ke web app bila: langganan aktif, ATAU masih dalam masa
      // grace 24 jam sejak bayar manual (graceActive) walau belum diverifikasi.
      // Payment 'pending' yang grace-nya HABIS (> 24 jam) TIDAK dilempar — web
      // app pasti menolak lalu bounce ke /login → loop layar putih. Tahan di
      // modal "Pembayaran Sedang Kami Tinjau" sampai admin verifikasi.
      if (isActive || graceActive) {
        webAppApi.redirectWithTokens();
      } else if (paymentPending) {
        setGate({ type: "payment_review", profile: user });
        navigate("/login", { replace: true });
      } else {
        navigate("/login/subscription", { replace: true });
      }
    } catch {
      // Gagal cek langganan → grace 24 jam masih lolos ke web app; pending yang
      // grace-nya habis tampil modal tinjau; selain itu halaman langganan.
      if (graceActive) {
        webAppApi.redirectWithTokens();
      } else if (paymentPending) {
        setGate({ type: "payment_review", profile: user });
        navigate("/login", { replace: true });
      } else {
        navigate("/login/subscription", { replace: true });
      }
    }
  };

  const handleSignOut = () => {
    // Kabari backend biar sesi/token dibatalin. Fire-and-forget: jangan
    // blok UI, kalau gagal tetap lanjut bersihin sesi lokal.
    authApi.logout().catch(() => {});
    tokenStorage.clear();
    setCurrentUser(null);
    setDevAdmin(false);
    navigate("/login", { replace: true });
  };

  const handleEmailSent = (email) => {
    setFpEmail(email);
    navigate("/login/check-email");
  };

  const handlePaymentSuccess = (planName) => {
    if (planName) setActivePlanName(planName);
    navigate("/payment/success");
  };

  // Checkout manual berhasil → simpan paket + payment, buka halaman Transfer Bank.
  const handleCheckoutManual = (plan, payment) => {
    setCheckoutPlan(plan);
    setManualPayment(payment);
    navigate("/login/subscription/transfer");
  };

  // ── Session check loading ─────────────────────────────────────────────────
  if (!sessionChecked) return null;

  // Route yang butuh sesi. Tanpa token → balik ke /login (kecuali bypass ?admin=true).
  const requireAuth = (element) =>
    tokenStorage.getAccess() || devAdmin ? element : <Navigate to="/login" replace />;

  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* ── Login & turunannya ─────────────────────────────────────────── */}
        <Route
          path="/login"
          element={
            <SplitLayout>
              <LoginPage
                onNavigate={go}
                onLoginSuccess={handleLoginSuccess}
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
            <ForgotPasswordPage onNavigate={go} onEmailSent={handleEmailSent} />
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
              <AuthChoicePage user={currentUser} onNavigate={go} onSignOut={handleSignOut} />
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
              onSignOut={handleSignOut}
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentPending={() => navigate("/dashboard-admin")}
              onCheckoutManual={handleCheckoutManual}
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
                onSignOut={handleSignOut}
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
              <SignUpPage onNavigate={go} onOtpToken={handleOtpToken} />
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
                onOtpToken={handleOtpToken}
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
                onSignOut={handleSignOut}
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
              onSignOut={handleSignOut}
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

      {gate && (
        <LoginStatusModal
          type={gate.type}
          meta={gate}
          // Tutup/logout/dismiss → bersihkan sesi, kembali ke login.
          onClose={() => {
            tokenStorage.clear();
            setCurrentUser(null);
            setGate(null);
            navigate("/login", { replace: true });
          }}
          // "Perbarui Langganan" (expired) / "Ulang Pembayaran" (payment ditolak
          // varian amount/account) → pilih paket di halaman langganan.
          onRenew={() => {
            const p = gate.profile;
            // Retry hanya bila gate ini "Pembayaran Ditolak" (Attempt sebelumnya
            // gagal) — 'expired' (langganan habis, belum pernah gagal bayar)
            // BUKAN retry, tetap attempt pertama.
            if (gate.type === "payment_rejected") setIsRetry(true);
            setGate(null);
            setCurrentUser(p);
            navigate("/login/subscription", { replace: true });
          }}
          // "Upload Bukti Pembayaran" (payment ditolak varian receipt) → langsung
          // ke TransferBankPage dgn paket terakhir (skip pilih paket). Tanpa paket
          // terkenal → fallback ke halaman langganan. Selalu dari gate
          // payment_rejected → selalu retry (Attempt ke-2+).
          onReupload={() => {
            const p = gate.profile;
            const plan = gate.plan;
            setIsRetry(true);
            setGate(null);
            setCurrentUser(p);
            if (plan?.id) {
              setCheckoutPlan(plan);
              setManualPayment(null);
              navigate("/login/subscription/transfer", { replace: true });
            } else {
              navigate("/login/subscription", { replace: true });
            }
          }}
        />
      )}
    </>
  );
}
