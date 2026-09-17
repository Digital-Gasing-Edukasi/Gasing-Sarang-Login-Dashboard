import { decodeFixPayload } from "@/lib/fixLink";

// Kumpulan pembaca query-param boot yang murni (tanpa I/O / tanpa navigate).
// Masing-masing me-return nilai ter-decode atau null bila param tidak ada.

export function isMidtransTestRequest(params) {
  return params.get("midtrans-test") === "true";
}

export function isDevAdminRequest(params) {
  return params.get("admin") === "true";
}

// Link "Perbaikan Data" (LEGACY ?fix=, superseded oleh /register/revise).
export function getFixPayload(params) {
  const fixParam = params.get("fix");
  if (!fixParam) return null;
  return decodeFixPayload(fixParam);
}

export function getSsoParams(params) {
  const ssoParam = params.get("sso");
  const sigParam = params.get("sig");
  if (ssoParam && sigParam) return { sso: ssoParam, sig: sigParam };
  return null;
}

// Link konfirmasi ubah email dari email: …/confirm-email-change?token=….
// Path backend beda per-env: STAGING `/register/confirm-email-change`,
// PRODUCTION `/confirm-email-change`. Cocokkan KEDUA bentuk (endsWith) supaya
// link jalan lintas-env.
export function isConfirmEmailChangePath(pathname) {
  return pathname.toLowerCase().endsWith("/confirm-email-change");
}

// Link reset password dari email: /login/reset-password?token=... (&email=...).
export function getResetInfo(params) {
  const token = params.get("token");
  if (!token) return null;
  const emailParam = params.get("email");
  return {
    token,
    email: emailParam ? decodeURIComponent(emailParam) : "",
  };
}

// Snap Redirect legacy: ?payment=success (&plan=...).
export function getPaymentSuccessPlan(params) {
  if (params.get("payment") !== "success") return null;
  const planName = params.get("plan");
  return planName ? decodeURIComponent(planName) : "";
}
