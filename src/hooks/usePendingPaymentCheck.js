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

    const loadPayments = subscriptionApi.paymentHistory
      ? subscriptionApi.paymentHistory(1, 100)
      : subscriptionApi.getLatestPayment();
    Promise.resolve(loadPayments)
      .then((res) => {
        if (cancelled) return;
        const all = Array.isArray(res)
          ? res
          : Array.isArray(res?.items)
            ? res.items
            : Array.isArray(res?.data)
              ? res.data
              : [res?.payment || res?.data || res].filter(Boolean);
        const p = all.find((candidate) => {
          const st = String(candidate?.status || "").toLowerCase();
          return ["pending", "receipt_uploaded", "waiting_verification", "uploaded", "waiting"].includes(st);
        }) || null;

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
