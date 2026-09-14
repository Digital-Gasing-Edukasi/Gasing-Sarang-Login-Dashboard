import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { tokenStorage, profileApi } from "@/lib/api";
import { isPublicStaticPath, skipSessionRestore } from "@/lib/routes";
import { resolveBootPath } from "@/lib/boot/resolveBootPath";
import { buildGateTestMeta } from "@/lib/boot/gateTest";
import { fetchRevisePrefill } from "@/lib/boot/reviseLink";
import {
  isMidtransTestRequest,
  isDevAdminRequest,
  getFixPayload,
  getSsoParams,
  isConfirmEmailChangePath,
  getResetInfo,
  getPaymentSuccessPlan,
} from "@/lib/boot/authParams";

// Boot sekali-saat-mount: deep-link (revise/fix/SSO/reset/payment/confirm-email),
// bypass DEV, halaman publik, lalu restore sesi. Urutan cabang dipertahankan dari
// App.jsx lama — jangan di-reorder tanpa QA deep-link.
export function useAppBoot({
  onLoginSuccess,
  setGate,
  setDevAdmin,
  setSsoParams,
  setFixData,
  setReviseData,
  setReviseToken,
  setConfirmEmailToken,
  setResetToken,
  setResetEmail,
  setActivePlanName,
}) {
  const navigate = useNavigate();
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { params, pathname } = resolveBootPath();

      // Hapus query param dari URL tanpa menambah entri history (dan tanpa
      // memutus sinkronisasi dengan history milik React Router).
      const clearUrlParams = (to = pathname) => navigate(to, { replace: true });

      // ── DEV: uji modal gate tanpa backend ────────────────────────────────
      const gatetest = params.get("gatetest");
      if (gatetest) {
        setGate(buildGateTestMeta(gatetest));
        clearUrlParams("/login");
        setSessionChecked(true);
        return;
      }

      // ── Halaman publik statis (legal, landing pembayaran, midtrans test) ──
      if (isPublicStaticPath(pathname)) {
        setSessionChecked(true);
        return;
      }

      // ── Link "Revisi Data" dari email (token JWT dari backend) ────────────
      if (pathname.toLowerCase().startsWith("/register/revise")) {
        const reviseTokenParam = params.get("token");
        if (reviseTokenParam) {
          try {
            const normalized = await fetchRevisePrefill(reviseTokenParam);
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

      // ── Link "Perbaikan Data" (LEGACY ?fix=) ──────────────────────────────
      const decoded = getFixPayload(params);
      if (decoded) {
        setFixData(decoded);
        clearUrlParams("/register/revise");
        setSessionChecked(true);
        return;
      }

      if (isMidtransTestRequest(params)) {
        clearUrlParams("/midtrans-test");
        setSessionChecked(true);
        return;
      }

      const sso = getSsoParams(params);
      if (sso) {
        setSsoParams(sso);
        clearUrlParams(tokenStorage.getAccess() ? "/login/sso-callback" : "/login");
        setSessionChecked(true);
        return;
      }

      // ── DEV: ?admin=true → dashboard admin tanpa sesi ─────────────────────
      if (isDevAdminRequest(params)) {
        setDevAdmin(true);
        clearUrlParams("/dashboard-admin");
        setSessionChecked(true);
        return;
      }

      // ── Link konfirmasi ubah email (env-aware, SEBELUM branch `token` generik) ──
      // Token disimpan lalu dibuang dari URL; clearUrlParams() default
      // mempertahankan pathname aktif (env-aware).
      if (isConfirmEmailChangePath(pathname)) {
        setConfirmEmailToken(params.get("token") || "");
        clearUrlParams();
        setSessionChecked(true);
        return;
      }

      // ── Link reset password dari email ────────────────────────────────────
      const resetInfo = getResetInfo(params);
      if (resetInfo) {
        setResetToken(resetInfo.token);
        if (resetInfo.email) setResetEmail(resetInfo.email);
        // Token dibuang dari URL supaya tidak bocor lewat history/log.
        clearUrlParams("/login/reset-password");
        setSessionChecked(true);
        return;
      }

      // ── Snap Redirect legacy: ?payment=success ────────────────────────────
      const successPlan = getPaymentSuccessPlan(params);
      if (successPlan !== null) {
        if (successPlan) setActivePlanName(successPlan);
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
          await onLoginSuccess(profile);
        } catch {
          tokenStorage.clear();
        }
      }

      setSessionChecked(true);
    };
    init();
    // Boot hanya sekali saat mount; setter + onLoginSuccess stabil dari hooks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { sessionChecked };
}
