// Alur Xendit one-time di halaman Subscription:
//   checkout → 201 (redirectUrl dibuka di tab baru) → poll status paymentId.
// Bentuk respons BE: dev/responses/xendit-{paid,pending,pending-declined,
// expired,not-found}.json + 409 { message, pendingPayment } saat checkout.

// Interval poll HARUS > RESPONSE_TTL GET-cache (4s, lihat api/client.js) supaya
// tiap poll benar-benar nembak backend, bukan baca cache.
export const XENDIT_POLL_INTERVAL_MS = 5000;
// Batas poll: 72x5s = 6 menit. Lewat itu berhenti → user tekan "Cek Lagi".
export const XENDIT_MAX_POLLS = 72;

// Klasifikasi SATU respons poll GET /subscription/payments/:paymentId.
// Return { outcome, payment } dengan outcome:
//   'paid'     → stop, sukses → halaman sukses.
//   'expired'  → stop (expired/cancelled/failed), user boleh retry.
//   'declined' → stop, pending + failureReason → tampilkan redirectUrl lagi.
//   'pending'  → lanjut polling.
export function interpretXenditStatus(res) {
  const p = res?.payment || res?.data || res || {};
  const status = String(p.status || '').toLowerCase();

  if (status === 'paid' || status === 'success' || status === 'settled' || status === 'captured') {
    return { outcome: 'paid', payment: p };
  }
  if (status === 'expired' || status === 'expire' || status === 'cancelled' || status === 'canceled' || status === 'failed') {
    return { outcome: 'expired', payment: p };
  }
  if (status === 'pending') {
    if (p.failureReason) return { outcome: 'declined', payment: p };
    return { outcome: 'pending', payment: p };
  }
  // Status tak dikenal → tetap polling (fail-safe: jangan strand di sukses,
  // jangan strand di retry — batas MAX_POLLS yang menghentikan).
  return { outcome: 'pending', payment: p };
}

// Normalisasi respons 201 checkout → { paymentId, redirectUrl, ... }.
// Return null bila tak lengkap (pemicu pesan error, bukan redirect buta).
export function normalizeXenditCheckout(res) {
  const d = res?.data || res || {};
  const paymentId = d.paymentId || d.payment_id || d.id || null;
  const redirectUrl = d.redirectUrl || d.redirect_url || null;
  if (!paymentId || !redirectUrl) return null;
  return {
    paymentId,
    redirectUrl,
    orderId: d.orderId || d.order_id || d.invoiceNumber || null,
    invoiceNumber: d.invoiceNumber || null,
    amount: d.amount ?? null,
  };
}

// Normalisasi 409 → pendingPayment lama { paymentId, redirectUrl, ... }.
// Return null bila tak lengkap.
export function normalizeXenditConflict(errData) {
  const d = errData || {};
  const pp = d.pendingPayment || d.pending_payment || d.payment || null;
  if (!pp) return null;
  const paymentId = pp.paymentId || pp.payment_id || pp.id || null;
  const redirectUrl = pp.redirectUrl || pp.redirect_url || null;
  if (!paymentId || !redirectUrl) return null;
  return {
    paymentId,
    redirectUrl,
    orderId: pp.orderId || pp.order_id || pp.invoiceNumber || null,
    invoiceNumber: pp.invoiceNumber || null,
    amount: pp.amount ?? null,
    message: d.message || '',
  };
}
