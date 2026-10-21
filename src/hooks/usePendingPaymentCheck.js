import { useState, useEffect } from "react";
import { subscriptionApi } from "@/lib/api";
import { evaluatePaymentGate } from "@/lib/loginGate";

export function extractPlanFromPayment(payment) {
  if (!payment) return null;
  const pkg = payment.package || payment.subscription?.package || {};
  const isAnnual =
    pkg.durationUnit === "year" ||
    String(pkg.name || "").toLowerCase().includes("year") ||
    String(pkg.name || "").toLowerCase().includes("tahun");
  return {
    id: pkg.id || payment.packageId,
    name: pkg.name || "Langganan",
    billingCycle: isAnnual ? "annual" : "monthly",
    months: isAnnual ? 12 : (pkg.duration || 1),
    priceTotal: pkg.price ?? payment.amount ?? 0,
    priceMonthly: isAnnual
      ? Math.round((pkg.price ?? payment.amount ?? 0) / 12)
      : (pkg.price ?? payment.amount ?? 0),
  };
}

export function usePendingPaymentCheck() {
  const [loading, setLoading] = useState(true);
  const [pendingPayment, setPendingPayment] = useState(null);

  useEffect(() => {
    let cancelled = false;

    if (typeof subscriptionApi?.getLatestPayment !== "function") {
      setLoading(false);
      return;
    }

    subscriptionApi
      .getLatestPayment()
      .then((res) => {
        if (cancelled) return;
        const p = Array.isArray(res?.data)
          ? res.data[0]
          : res?.payment || res?.data || res || null;

        if (!p || (!p.id && !p.status)) {
          setPendingPayment(null);
          return;
        }

        const st = String(p.status || "").toLowerCase();
        const isPending =
          st === "pending" ||
          st === "receipt_uploaded" ||
          st === "waiting_verification" ||
          st === "uploaded" ||
          st === "waiting";

        const isRejected =
          st === "rejected" ||
          st === "failed" ||
          evaluatePaymentGate(p) !== null;

        const isTerminalOrActive =
          st === "paid" ||
          st === "success" ||
          st === "expired" ||
          p.subscription?.status === "active";

        if (isPending && !isRejected && !isTerminalOrActive) {
          setPendingPayment(p);
        } else {
          setPendingPayment(null);
        }
      })
      .catch(() => {
        if (!cancelled) setPendingPayment(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const plan = pendingPayment ? extractPlanFromPayment(pendingPayment) : null;
  const receiptFileId =
    pendingPayment?.receiptFileId ||
    pendingPayment?.receipt_file_id ||
    pendingPayment?.receiptFile?.id ||
    null;

  return {
    loading,
    isPending: Boolean(pendingPayment),
    pendingPayment,
    plan,
    receiptFileId,
  };
}
