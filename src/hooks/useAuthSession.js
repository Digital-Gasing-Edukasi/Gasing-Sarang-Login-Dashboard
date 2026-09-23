import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  tokenStorage,
  subscriptionApi,
  authApi,
  webAppApi,
} from "@/lib/api";
import { canAccessDiscourse, isSsoDisabled, isSuperAdmin } from "@/lib/roles";
import {
  evaluateLoginGate,
  evaluatePaymentGate,
  isPaymentGraceActive,
  isSubscriptionExpired,
} from "@/lib/loginGate";
import { buildRevisionFixData } from "@/lib/revisionFixData";

// Sesi auth + gate akun. Pure state + routing pasca-login; tidak tahu soal
// boot URL-params (itu urusan useAppBoot).
//
// `deps` menjembatani state milik useCheckoutFlow yang ikut berubah dari aksi
// modal gate: onRenew (retry) dan onReupload (langsung ke Transfer Bank).
export function useAuthSession({ setIsRetry, setCheckoutPlan, setManualPayment, setFixData } = {}) {
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(null);
  // gate: status akun yang memblokir masuk app (suspended/pending/expired).
  // Berlaku untuk login manual DAN restore sesi (reload dgn token tersimpan).
  const [gate, setGate] = useState(null);
  // DEV: ?admin=true membuka dashboard admin tanpa sesi (preview UI tanpa backend).
  const [devAdmin, setDevAdmin] = useState(false);
  const [otpToken, setOtpToken] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [fpEmail, setFpEmail] = useState("");

  // Tentukan halaman tujuan setelah login berdasarkan peran user.
  // Aturan peran ada di src/lib/roles.js (sumber kebenaran tunggal).
  //   - Admin operasional  → /dashboard-admin
  //   - Superadmin         → /login/choice
  //   - User biasa         → /login/choice bila langganan aktif, else /login/subscription
  const handleLoginSuccess = useCallback(
    async (user) => {
      // Login baru = sesi attempt baru: reset penanda retry. Tanpa ini, flag
      // true dari gate payment_rejected di login sebelumnya (sesi SPA sama,
      // tanpa reload) bocor ke checkout fresh → halaman sukses salah tampil
      // Log Out padahal ini pembayaran pertama. Gate di bawah meng-arm ulang
      // ke true bila login kali ini memang retry.
      setIsRetry?.(false);

      // Sesi diblokir BE (akun rejected / tidak aktif / email dsb):
      // GET /auth/session-status → { blocked, reasonCode, message }.
      // Dicek PALING DULU, sebelum payment. blocked:true → modal + stop.
      // Fetch gagal → fail-open (lanjut flow lama), hanya blocked eksplisit
      // yang menghentikan login.
      try {
        const st = await authApi.sessionStatus();
        console.log("sessionStatus", {st});
        

        // Bentuk BE: { blocked, reasonCode, message, data:{...} } di top-level.
        // Jangan asal ambil .data — itu payload revision, bukan wrapper respons.
        const raw = st || {};
        const s =
          raw.blocked !== undefined || raw.reasonCode !== undefined || raw.message !== undefined
            ? raw
            : raw.data || raw;
        if (s.blocked === true) {
          // reasonCode menentukan modal mana yang tampil (switch-case, bukan
          // if-else — varian baru tinggal tambah case). Default: session_blocked.
          switch (s.reasonCode) {
            case 'revision_required': {
              // Akun butuh registrasi ulang: modal daftar deskripsi per-field +
              // tombol Daftar Ulang → FixDataPage (prefill dari profil + penanda).
              const fields = Array.isArray(s.data?.fields) ? s.data.fields : [];
              setGate({
                type: 'revision_required',
                reasonCode: s.reasonCode,
                message: s.message || null,
                fields,
                fixData: buildRevisionFixData(user, fields),
                profile: user,
              });
              break;
            }
            case 'payment_rejected': {
              // Ada modal khusus (varian receipt/amount/account + tombol
              // Upload/Ulang). Detail diambil dari payment ter-embed di
              // s.data via evaluatePaymentGate; bila tak berbentuk payment,
              // fallback ke session_blocked supaya blokir tetap tampil.
              const payGate = evaluatePaymentGate(s.data);
              console.log({payGate});
              
              setGate(
                payGate
                  ? { ...payGate, profile: user }
                  : {
                      type: 'payment_rejected',
                      reasonCode: s.reasonCode,
                      message: s.message || null,
                      profile: user,
                    }
              );
              break;
            }
            default: {
              setGate({
                type: 'session_blocked',
                reasonCode: s.reasonCode || null,
                message: s.message || null,
                profile: user,
              });
              break;
            }
          }
          navigate('/login', { replace: true });
          return;
        }
      } catch {
        // Endpoint gagal / belum ada → abaikan, lanjut flow normal.
      }

      // Payment terakhir masih 'pending' → user dianggap boleh masuk walau
      // langganan belum aktif/expired (nunggu pembayaran diproses).
      // Dihitung sekali, dipakai di gate 'expired' + routing langganan di bawah.
      let paymentPending = false;
      let graceActive = false; // pending & MASIH < 24 jam → boleh akses web app
      let paymentRejected = null;
      let latestPayment = null; // payment terakhir utuh — sumber gate expired (subscription ter-embed)
      try {
        const latest = await subscriptionApi.getLatestPayment();
        const p = latest?.payment || latest?.data || latest || {};
        latestPayment = p;
        // Audit #60: backend manual memakai status 'receipt_uploaded' (menunggu
        // verifikasi admin), bukan 'pending'. Anggap keduanya sebagai pending
        // supaya user diarahkan ke modal tinjau, bukan kembali ke subscription.
        const st = String(p.status || '').toLowerCase();
        paymentPending = st === "pending" || st === "receipt_uploaded" || st === "waiting_verification" || st === "uploaded" || st === "waiting";
        // Akses sementara 24 jam sejak bayar (manual transfer) walau belum diverifikasi.
        graceActive = isPaymentGraceActive(p);
        console.log({graceActive});
        
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

      // User biasa: cek expired dari payment terakhir (subscription ter-embed —
      // GET /subscription/me hanya mengembalikan {hasActiveSubscription:false}
      // tanpa detail, jadi tidak bisa dipakai). Dibypass bila ada payment
      // pending (menunggu verifikasi admin) — sama seperti gate expired profil.
      if (isSubscriptionExpired(latestPayment) && !paymentPending) {
        setGate({ type: "expired", profile: user });
        navigate("/login", { replace: true });
        return;
      }

      // User biasa: cek status langganan untuk menentukan halaman.
      try {
        const sub = await subscriptionApi.getStatus();
        const isActive =
          sub?.hasActiveSubscription === true ||
          sub?.subscription?.status === "active";
      // Langganan aktif → handoff web app. Payment pending → SELALU modal
      // tinjau (tanpa auto-handoff): tombol Jelajahi hanya tampil dalam masa
      // grace 24 jam (canExplore) supaya user basi tidak bisa masuk app —
      // anti bounce-loop web app yang menolak lalu memantalkan ke /login.
      if (isActive) {
        webAppApi.redirectWithTokens();
      } else if (paymentPending) {
        setGate({ type: "payment_review", profile: user, canExplore: graceActive });
        navigate("/login", { replace: true });
      } else {
        navigate("/login/subscription", { replace: true });
      }
      } catch {
        // Gagal cek langganan → pending tetap modal (grace menentukan tombol
        // Jelajahi); selain itu halaman langganan. Grace TIDAK auto-handoff.
        if (paymentPending) {
          setGate({ type: "payment_review", profile: user, canExplore: graceActive });
          navigate("/login", { replace: true });
        } else {
          navigate("/login/subscription", { replace: true });
        }
      }
    },
    [navigate, setIsRetry],
  );

  const handleSignOut = useCallback(() => {
    // Kabari backend biar sesi/token dibatalin. Fire-and-forget: jangan
    // blok UI, kalau gagal tetap lanjut bersihin sesi lokal.
    authApi.logout().catch(() => {});
    tokenStorage.clear();
    setCurrentUser(null);
    setDevAdmin(false);
    navigate("/login", { replace: true });
  }, [navigate]);

  const handleOtpToken = useCallback((token, email) => {
    setOtpToken(token);
    setRegEmail(email);
  }, []);

  const handleEmailSent = useCallback(
    (email) => {
      setFpEmail(email);
      navigate("/login/check-email");
    },
    [navigate],
  );

  // Tutup/logout/dismiss modal gate → bersihkan sesi, kembali ke login.
  const handleGateClose = useCallback(() => {
    tokenStorage.clear();
    setCurrentUser(null);
    setGate(null);
    navigate("/login", { replace: true });
  }, [navigate]);

  // "Perbarui Langganan" (expired) / "Ulang Pembayaran" (payment ditolak
  // varian amount/account) → pilih paket di halaman langganan.
  const handleGateRenew = useCallback(() => {
    // Retry hanya bila gate ini "Pembayaran Ditolak" (Attempt sebelumnya
    // gagal) — 'expired' (langganan habis, belum pernah gagal bayar)
    // BUKAN retry, tetap attempt pertama.
    if (gate?.type === "payment_rejected") setIsRetry?.(true);
    const p = gate?.profile;
    setGate(null);
    if (p) setCurrentUser(p);
    navigate("/login/subscription", { replace: true });
  }, [navigate, gate, setIsRetry]);

  // "Daftar Ulang" (revision_required) → FixDataPage dengan prefill + penanda
  // error dari session-status. fixData milik App (dipakai route /register/revise).
  const handleGateReregister = useCallback(() => {
    const fix = gate?.fixData || null;
    const p = gate?.profile;
    setGate(null);
    if (p) setCurrentUser(p);
    if (fix) setFixData?.(fix);
    navigate("/register/revise", { replace: true });
  }, [navigate, gate, setFixData]);

  // "Jelajahi Sarang Gasing" (payment_review) → handoff ke web app dengan token
  // sesi saat ini (pola sama TransferBankPage.handleRedirectDefault).
  const handleGateExplore = useCallback(() => {
    webAppApi.redirectWithTokens();
  }, []);

  // "Upload Bukti Pembayaran" (payment ditolak varian receipt) → langsung
  // ke TransferBankPage dgn paket terakhir (skip pilih paket). Tanpa paket
  // terkenal → fallback ke halaman langganan. Selalu dari gate
  // payment_rejected → selalu retry (Attempt ke-2+).
  const handleGateReupload = useCallback(() => {
    const p = gate?.profile;
    const plan = gate?.plan;
    console.log({gate, p, plan});
    
    setIsRetry?.(true);
    setGate(null);
    if (p) setCurrentUser(p);
    if (plan?.id) {
      setCheckoutPlan?.(plan);
      setManualPayment?.(null);
      navigate("/login/subscription/transfer", { replace: true });
    } else {
      navigate("/login/subscription", { replace: true });
    }
  }, [navigate, gate, setIsRetry, setCheckoutPlan, setManualPayment]);

  return {
    currentUser,
    setCurrentUser,
    gate,
    setGate,
    devAdmin,
    setDevAdmin,
    otpToken,
    regEmail,
    fpEmail,
    handleLoginSuccess,
    handleSignOut,
    handleOtpToken,
    handleEmailSent,
    handleGateClose,
    handleGateRenew,
    handleGateReupload,
    handleGateReregister,
    handleGateExplore,
  };
}
