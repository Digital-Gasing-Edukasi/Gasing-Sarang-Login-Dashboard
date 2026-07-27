# Pembayaran Manual (Transfer Bank) — Fitur SEMENTARA

> **STATUS: SEMENTARA.** Dipakai selama Midtrans belum siap. Dokumen ini catat semua
> titik yang diubah + langkah balikin ke Midtrans.
>
> Modul terkait: sisi admin → [`VERIFIKASI_PEMBAYARAN.md`](./VERIFIKASI_PEMBAYARAN.md).

---

## 1. Kenapa Ada

Midtrans (payment gateway) belum siap dipakai di produksi. Sementara ini user bayar
lewat **transfer bank manual**, upload bukti, lalu **admin verifikasi manual** di
Dashboard Admin. Kode Midtrans **tidak dihapus** — cuma dilewati (bypass), biar gampang
dibalikin.

---

## 2. Alur Sekarang vs Alur Midtrans

```
SEKARANG (manual)
  SubscriptionPage  ──POST /subscription/checkout-manual──►  payment: pending
        │
        ▼
  TransferBankPage  ──upload bukti──►  POST /subscription/payments/:id/upload-receipt
        │                                    status → receipt_uploaded
        ▼
  Admin (Verifikasi Pembayaran)  ──approve──►  langganan aktif
                                 ──reject───►  status rejected

NANTI (Midtrans)
  SubscriptionPage  ──POST /subscription/checkout──►  snap token / redirect_url
        │
        ▼
  Midtrans Snap  ──callback──►  /payment/finish | /payment/unfinish | /payment/error
```

---

## 3. Titik Ubahan (Checklist Revert)

Semua kode Midtrans masih ada. Balikin = ganti pemanggilan, bukan nulis ulang.

| # | File | Sekarang (manual) | Balikin ke Midtrans |
|---|---|---|---|
| 1 | [`src/pages/SubscriptionPage.jsx:329`](../src/pages/SubscriptionPage.jsx#L329) `handleCheckout` | panggil `subscriptionApi.checkoutManual(selectedPlan)` → `onCheckoutManual(plan, payment)` | balikin ke `subscriptionApi.checkout(selectedPlan)` + buka Snap / redirect ke `redirect_url` |
| 2 | [`src/lib/api.js:388`](../src/lib/api.js#L388) | `checkoutManual`, `uploadReceipt`, `getLatestPayment`, `getPayment` | `checkout()` (baris 385) sudah ada — tinggal dipakai lagi. Fungsi manual boleh dibiarkan (dipakai admin) |
| 3 | [`src/App.jsx:332`](../src/App.jsx#L332) `handleLoginSuccess` | cek `getLatestPayment()`; `status === 'pending'` → **tetap boleh masuk** (bypass gate `expired` + langsung `redirectWithTokens`) | **HAPUS** blok ini. Midtrans bayar realtime, gak ada masa "nunggu admin" |
| 4 | [`src/App.jsx`](../src/App.jsx) `handleCheckoutManual` + state `manualPayment`, `checkoutPlan` | simpan payment → route `/login/subscription/transfer` | hapus handler + state, hapus route TransferBank |
| 5 | [`src/pages/TransferBankPage.jsx`](../src/pages/TransferBankPage.jsx) | halaman upload bukti transfer | hapus / arsipkan. Route `transfer-bank` di [`src/lib/routes.js:16`](../src/lib/routes.js#L16) ikut dihapus |
| 6 | Dashboard Admin — sub-menu **Verifikasi Pembayaran** | approve/reject bukti transfer, endpoint `/admin/payments/manual-transfer/*` | sembunyikan sub-menu (data lama tetap perlu dibaca? kalau ya, biarkan read-only) |

**Halaman Midtrans yang masih utuh (jangan dihapus):**
`PaymentFinishPage.jsx`, `PaymentUnfinishPage.jsx`, `PaymentErrorPage.jsx`,
`PaymentSuccessPage.jsx`, `MidtransTestPage.jsx` + route-nya di
[`src/lib/routes.js`](../src/lib/routes.js) (`/payment/*`, `/midtrans-test`).

---

## 4. Endpoint

### Dipakai sementara (manual)

| Method | Endpoint | Catatan |
|---|---|---|
| POST | `/subscription/checkout-manual` | body `{ packageId }`. **Idempotent per user** — kalau sudah ada payment pending tanpa bukti, update payment yang sama |
| POST | `/subscription/payments/:id/upload-receipt` | body `{ fileId }` (dari `fileManagerApi.upload()`) → status `receipt_uploaded` |
| GET | `/subscription/payments/latest` | payment terakhir user, status apapun. **404 kalau belum pernah bayar** |
| GET | `/subscription/payments/:id` | detail satu payment |
| GET/POST | `/admin/payments/manual-transfer/*` | list, stats, approve, reject (sisi admin) |

### Dipakai lagi nanti (Midtrans)

| Method | Endpoint | Catatan |
|---|---|---|
| POST | `/subscription/checkout` | sudah ada di `api.js:385`, belum dipanggil siapa-siapa |

### Status payment

`pending` → `receipt_uploaded` → `paid` | `rejected`

---

## 5. Gate Login (paling gampang kelewat pas revert)

[`src/App.jsx`](../src/App.jsx) `handleLoginSuccess` sekarang:

1. Fetch `GET /subscription/payments/latest` **duluan**, sebelum gate.
2. Kalau `status === 'pending'`:
   - gate `expired` dari [`src/lib/loginGate.js`](../src/lib/loginGate.js) **di-bypass**
   - routing langganan → `webAppApi.redirectWithTokens()` (masuk web app), bukan `/login/subscription`
   - juga lolos kalau `subscriptionApi.getStatus()` error
3. Gate `suspended` & `pending` (verifikasi akun) **tetap blokir** — gak kena bypass ini.

**Alasan:** user yang sudah transfer tapi belum di-approve admin gak boleh kekunci di
luar. Dengan Midtrans hal ini gak berlaku (pembayaran realtime) → **blok ini wajib
dihapus pas revert**, kalau nggak user yang belum bayar bisa nyelonong masuk.

Catatan: cuma literal `'pending'` yang dihitung. Status `receipt_uploaded` (bukti sudah
diupload, nunggu admin) **belum** dihitung lolos — kalau mau ikut, tambah di kondisi
`paymentPending`.

### 5.1 Gate "Pembayaran Ditolak" (payment `failed`/`rejected`)

Payment terakhir yang **ditolak admin** (status `failed` / `rejected`) memblokir masuk +
tampilkan modal `LoginStatusModal type="payment_rejected"`. Discriminator varian dari
alasan tolak (`evaluatePaymentGate` di [`src/lib/loginGate.js`](../src/lib/loginGate.js)):
baca `rejectionReason`/`rejectReason`/`reason`/`notes`, cocokkan value-code **atau**
kata kunci label `TOLAK_REASONS` (admin kirim LABEL sbg `notes`, lihat
[`VERIFIKASI_PEMBAYARAN.md`](./VERIFIKASI_PEMBAYARAN.md) §2):

| Alasan (value / kata kunci) | `meta.variant` | Isi modal | Tombol primary → tujuan |
|---|---|---|---|
| `receipt_unreadable` / "bukti", "terbaca" | `receipt` | Tips foto struk | **Upload Bukti Pembayaran** → `/login/subscription/transfer` (paket terakhir, skip pilih paket) |
| `wrong_amount` / "nominal" | `amount` | Total tagihan (dari `amount`/`total`/`grossAmount`) | **Ulang Pembayaran** → `/login/subscription` (pilih paket) |
| `wrong_account` / "rekening" | `account` | Rekening resmi (`RECEIVER_BANK`) | **Ulang Pembayaran** → `/login/subscription` (pilih paket) |

Default (alasan tak dikenal) → `receipt` (paling aman: minta unggah ulang).

**Paket terakhir** (`meta.plan`) dibaca `evaluatePaymentGate` dari payment terakhir
(`package.id/name` · `packageId` · `amount`), dibentuk kompatibel dgn prop `plan`
TransferBankPage. Tanpa `plan.id` terbaca → varian receipt **fallback** ke
`/login/subscription`.

**Prioritas gate** di `handleLoginSuccess` ([`src/App.jsx`](../src/App.jsx)):
`suspended` / `pending` akun **> `payment_rejected` > `expired`**. Payment ditolak menang
atas `expired` (arahkan user perbaiki bayar), tapi kalah dari blok akun. Tombol **Log Out**
→ `onClose` (bersihkan sesi). Primary bercabang per varian: `receipt` → `onReupload`
(set `checkoutPlan`, deep-link transfer), `amount`/`account` → `onRenew` (pilih paket).

`RECEIVER_BANK` di [`LoginStatusModal.jsx`](../src/components/shared/LoginStatusModal.jsx)
duplikat `DEFAULT_BANK` di [`TransferBankPage.jsx`](../src/pages/TransferBankPage.jsx) —
backend belum kembalikan detail rekening; satukan bila endpoint sudah ada.

**Revert Midtrans:** hapus blok `paymentRejected` bareng blok `paymentPending` (§3 #3) —
Midtrans bayar realtime, gak ada tolakan admin manual.

**Uji tanpa backend:** `?gatetest=payment_receipt` | `payment_amount` | `payment_account`.

---

## 6. Urutan Revert

1. Balikin `handleCheckout` di `SubscriptionPage.jsx` → `subscriptionApi.checkout()` + Snap.
2. Hapus blok `paymentPending` di `handleLoginSuccess` (`App.jsx`) — **jangan sampai kelewat**.
3. Hapus `handleCheckoutManual`, state `manualPayment`/`checkoutPlan`, route TransferBank.
4. Hapus/arsipkan `TransferBankPage.jsx` + route `transfer-bank`.
5. Sembunyikan sub-menu admin **Verifikasi Pembayaran**.
6. Uji: checkout → Snap → `/payment/finish` → langganan aktif; user belum bayar tetap
   ditahan di `/login/subscription`.
