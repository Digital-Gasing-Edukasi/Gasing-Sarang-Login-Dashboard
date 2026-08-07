# Alur State User — Sarang Gasing (Login-Dashboard → Komonitas)

Dokumen ini petain **11 state user** dari daftar sampe masuk komunitas.
Tiap state ada flowchart sendiri + 1 flowchart gabungan di akhir.

- **Audience**: dev FE/BE + QA.
- **Sumber**: source code `Login-Dashboard/src` + `Komonitas`, docs internal, flowchart signup.
- **Legend**: ✅ lolos | 🚫 blok/modal | ⚠ gap (belum di-handle di code).

---

## Arsitektur singkat

| app | stack | tugas |
|-----|-------|-------|
| **Login-Dashboard** (`app0`) | React + Vite | daftar, login, bayar, admin dashboard, gate status |
| **Komonitas** (`app1`) | Next.js | konsumsi Discourse API, isi komunitas. Ga auth sendiri — terima JWT callback dari app0 |

```mermaid
flowchart LR
  U([User]) --> A0["app0<br/>Login-Dashboard<br/>(auth + bayar + admin)"]
  A0 -- "JWT ke /api/auth/callback" --> A1["app1<br/>Komonitas<br/>(Discourse API)"]
  A0 -. "GET /profile/me, /admin/users,<br/>/admin/payments/manual-transfer" .-> BE[(Backend)]
  A1 -. "GET /u/:username.json" .-> DC[(Discourse)]
```

**Enum `verifiedStatus`** (`mappers.js:258`):
`REJECTED=-1 | WAITING=0 | APPROVED=1 | REVISE=2 | PENDING_VOUCHER=3`

**Gate login** (`loginGate.js`) prioritas: `suspended > pending > expired`.

---

## 1. Baru daftar, email belum dikonfirmasi

Daftar lolos → lempar ke OTP. Belum ada sesi, belum bisa login.

```mermaid
flowchart TD
  A[Isi SignUpPage] --> B{Validasi<br/>username 3+, email, password kuat}
  B -- gagal --> B1[Error inline] --> A
  B -- lolos --> C[SignUpOtpPage<br/>kirim OTP ke email]
  C --> D{Isi 6 digit OTP}
  D -- salah/kurang --> D1[Error server] --> C
  D -- benar --> E[Email terkonfirmasi ✅<br/>lanjut ke state 2]
```

**File**: `SignUpPage.jsx`, `SignUpOtpPage.jsx`, `authApi.confirmEmail`.

---

## 2. Email dikonfirmasi, belum diverifikasi admin

`verifiedStatus = WAITING(0)`. Login diblok modal "sedang ditinjau (max 24 jam)".

```mermaid
flowchart TD
  A[Login] --> B[evaluateLoginGate]
  B --> C{verifiedStatus}
  C -- "0 / WAITING" --> D[🚫 Gate 'pending'<br/>Modal: Kami Sedang Meninjau Akunmu]
  D --> E[Login diblok, cek email berkala]
  C -- "1 APPROVED" --> F[lanjut ke state 3]
```

**File**: `loginGate.js:31`, `LoginStatusModal.jsx:77` (CONFIG.pending).
Admin: masih di alur **Verifikasi Akun**, belum masuk Manajemen Akun (`mappers.js:264`).

---

## 3. Terverifikasi admin, belum pernah beli paket

`APPROVED(1)` → gate lolos. Ga ada subscription → diarahin ke halaman langganan.

```mermaid
flowchart TD
  A[Login] --> B[Gate lolos ✅<br/>verifiedStatus=1]
  B --> C[cek role]
  C -- admin --> C1["/dashboard-admin/"]
  C -- user biasa --> D[subscriptionApi.getStatus]
  D --> E{hasActiveSubscription?}
  E -- tidak, no payment pending --> F["navigate /login/subscription<br/>pilih paket"]
  E -- ya --> G[ke Komonitas]
```

**File**: `App.jsx:388-404`, `loginGate.js:36-40` (belum pernah sub → lolos).

---

## 4. Checkout manual, belum upload bukti bayar (trial 24 jam aktif)

Payment `status=pending` → `paymentPending=true` → tetap dilolosin ke Komonitas. Halaman Transfer Bank kebuka.

```mermaid
flowchart TD
  A[Pilih paket di SubscriptionPage] --> B[Checkout manual]
  B --> C[handleCheckoutManual<br/>simpan plan + payment]
  C --> D[TransferBankPage<br/>tampil detail rekening]
  D --> E[getLatestPayment status=pending]
  E --> F[paymentPending=true ✅<br/>redirectWithTokens ke Komonitas]
```

**File**: `App.jsx:336-343` (paymentPending), `App.jsx:428-432` (checkout).
⚠ "trial 24 jam" = anotasi flowchart-mu. Di code cuma logika `paymentPending`, ga ada timer trial eksplisit.

---

## 5. Bukti bayar diupload, menunggu verifikasi admin

Payment masih `pending`, bukti sudah masuk (`receipt_uploaded`). User tetap boleh masuk. Admin verifikasi manual.

```mermaid
flowchart TD
  A[Upload bukti transfer] --> B[Payment status pending<br/>receipt_uploaded]
  B --> C[User: 'Pending Verifikasi Pembayaran'<br/>paymentPending ✅ tetap masuk Komonitas]
  B --> D[Admin: menu Verifikasi Pembayaran<br/>GET /admin/payments/manual-transfer<br/>filter=receipt_uploaded]
  D --> E{Keputusan admin}
  E -- approve --> F[state 7: subscription aktif]
  E -- reject --> G[state 6: pembayaran ditolak]
```

**File**: `mappers.js:348-355` (mapToPembayaran), `VerifikasiPembayaran`, memory verifikasi-pembayaran.

---

## 6. Pembayaran ditolak (belum pernah sub → dijadwalkan hapus)

Sesuai flowchart signup — alur **double-approval**. Reject-1 → perbaiki data → approval-2.

```mermaid
flowchart TD
  A[Payment status rejected] --> B[User coba login]
  B --> C[🚫 Akses komunitas ditolak]
  C --> D[Modal Penolakan:<br/>alasan + Sign Out + Perbaiki Data]
  D -- Sign Out --> E[Logout]
  D -- Perbaiki Data --> F[Modal: pembayaran sedang di Verifikasi]
  F --> G[Status: Menunggu Approval 2]
  G --> H{Keputusan Percobaan 2}
  H -- approve --> I[✅ Masuk sebagai user biasa + akses Komonitas]
  H -- reject --> E
  A -. "belum pernah sub" .-> J[⚠ Admin schedule hapus<br/>tab 'Baru Dihapus']
```

**File**: `mappers.js:352-355` (isRejected), `mappers.js:246` (deletionPending → Baru Dihapus).
`REVISE(2)` & `REJECTED(-1)` dua-duanya masuk tab admin **"Ditolak"** (`mappers.js:251`).

---

## 7. Subscription aktif (pembayaran disetujui)

`hasActiveSubscription=true` → langsung ke Komonitas, full akses.

```mermaid
flowchart TD
  A[Login] --> B[Gate lolos ✅]
  B --> C[subscriptionApi.getStatus]
  C --> D{"hasActiveSubscription ||<br/>subscription.status=active"}
  D -- ya --> E[webAppApi.redirectWithTokens<br/>✅ Komonitas full akses]
```

**File**: `App.jsx:390-396`.

---

## 8. Subscription expired / cancelled

`subscription.status='expired'` → gate `expired` → modal perbarui langganan. Kecuali ada payment pending.

```mermaid
flowchart TD
  A[Login] --> B[evaluateLoginGate]
  B --> C{subscription.status}
  C -- "expired" --> D{paymentPending?}
  D -- tidak --> E[🚫 Modal 'Masa Berlangganan Berakhir'<br/>Log Out / Perbarui Langganan]
  D -- ya --> F[✅ lolos, nunggu payment diproses]
  E -- Perbarui --> G[navigate halaman langganan]
  E -- Log Out --> H[konfirmasi logout]
```

**File**: `loginGate.js:36-40`, `App.jsx:348`, `LoginStatusModal.jsx:91` (CONFIG.expired).

---

## 9. Suspended

`suspendedUntil` keisi → gate `suspended` (prioritas TERTINGGI). Login blok.

```mermaid
flowchart TD
  A[Login] --> B[evaluateLoginGate]
  B --> C{"suspendedUntil / suspended?"}
  C -- ya --> D[🚫 Modal 'Akun Ditangguhkan'<br/>alasan + durasi + until]
  D --> E[Login diblok<br/>tombol: Hubungi Kami / Saya Mengerti]
  C -- tidak --> F[cek gate berikutnya: pending/expired]
```

**File**: `loginGate.js:16-23`, `LoginStatusModal.jsx:124` (SuspendedModal).
Admin: tab **"Ditangguhkan"**, endpoint `/suspend` (`mappers.js:247`, `SuspendModal.jsx`).

---

## 10. Dijadwalkan hapus (pending deletion)

`deletionPending` / `deletionScheduledAt` / `deletedAt` → admin tab "Baru Dihapus".

```mermaid
flowchart TD
  A[Admin request hapus<br/>/deletion-request] --> B[deletionPending=true]
  B --> C[Admin: tab 'Baru Dihapus'<br/>prioritas flag TERTINGGI]
  B --> D[⚠ Sisi login/gate BELUM handle<br/>loginGate.js ga punya cabang deletion]
```

**File**: `mappers.js:246` (prioritas: penghapusan > penangguhan > verifikasi).
⚠ **Gap**: `evaluateLoginGate` belum blok state ini. Kalau perlu blok login eksplisit → TODO.

---

## 11. Disabled (dinonaktifkan admin)

Tag `USER/DISCOURSE/DISABLED-SSO` → jangan lewat SSO. Routing beda, bukan blok penuh.

```mermaid
flowchart TD
  A[Login] --> B{isSsoDisabled?<br/>tag DISABLED-SSO}
  B -- tidak --> C[alur SSO normal]
  B -- ya --> D{"punya cap<br/>DISCOURSE/GROUP/SYNC?"}
  D -- ya --> E["/dashboard-admin/ langsung"]
  D -- tidak --> F[redirectWithTokens<br/>tanpa SSO]
```

**File**: `App.jsx:356-367`.
⚠ "disabled" di sini = **routing SSO**, BUKAN blok login penuh. Nama field beda dari "disabled akun".

---

## 12. User mendapatkan voucher (alur verifikasi 2-langkah)

Voucher dikasih admin **saat approve akun**, bukan flow terpisah. `verifiedStatus`
lewat state antara `PENDING_VOUCHER(3)` — duduk di antara state 2 (WAITING) dan
state 3 (APPROVED).

```mermaid
flowchart TD
  A["User WAITING(0)<br/>tab Pending Verifikasi"] --> B{"Admin: Approve Main Data<br/>langkah-1"}
  B --> C["verifyUser {status:'approved',<br/>discourseGroupId, lastTrainingSessionId}"]
  C --> D["User PENDING_VOUCHER(3)<br/>pindah tab Pending Voucher Setup<br/>SISTEM generate voucherCode"]
  D --> SPLIT{{"⚡ 2 proses BERSAMAAN (paralel)"}}
  SPLIT --> D2["Proses 1 · Shopee (eksternal):<br/>Admin salin kode ke Shopee<br/>buat voucher Shopee kode SAMA"]
  SPLIT --> E["Proses 2 · App (internal):<br/>Admin isi + konfirmasi Kode Voucher<br/>KirimVoucherModal → KonfirmasiVoucherModal"]
  D2 --> JOIN{{"✅ Kedua proses beres"}}
  E --> JOIN
  JOIN --> G{"Finalize<br/>langkah-2"}
  G --> H["verifyUser {status:'approved',<br/>discourseGroupId}<br/>lastTrainingSessionId TIDAK dikirim"]
  H --> I["User APPROVED(1) ✅<br/>voucher nempel di akun"]
  I --> J[User lihat kode voucher<br/>di dalam Komunitas]
  J --> K[User pakai kode di Shopee<br/>kode cocok = langsung kepakai]
```

**Kenapa 2 call terpisah** (`AdminDashboardPage.jsx:738-785`, memory `verifikasi-akun-voucher-flow`):
- **Langkah-1**: kehadiran `lastTrainingSessionId` = penanda "approve main data" → backend pindah ke `PENDING_VOUCHER(3)`, BUKAN langsung approved.
- **Langkah-2**: kirim `{ status, discourseGroupId }` **tanpa** `lastTrainingSessionId` → baru mendarat di `APPROVED(1)`. Kalau ikut kirim `lastTrainingSessionId`, akun mental balik ke `PENDING_VOUCHER`.

**Langkah manual ke Shopee** (di antara langkah-1 & finalize):
- Pas sistem **pertama kali** generate `voucherCode` (saat user masuk `PENDING_VOUCHER`), admin **wajib salin kode itu ke platform Shopee** — bikin voucher Shopee dengan **kode yang sama persis**.
- Tujuan: kode yang nanti user lihat di dalam **Komunitas** bisa **langsung dipakai di Shopee** (kode match). Redeem terjadi di **Shopee**, bukan di halaman langganan app ini.

**File**: `KirimVoucherModal.jsx`, `VoucherModals.jsx`, `PendingVoucherTable.jsx`, `adminApi.verifyUser`.
⚠ `genVoucherCode()` masih placeholder FE (`AdminDashboardPage.jsx:181`) — TODO(be): kode asli mestinya dari backend.
⚠ Sinkronisasi Shopee **manual** — risiko typo/mismatch (kode di app ≠ kode di Shopee). Belum ada integrasi otomatis. Pertimbangkan validasi/konfirmasi biar admin ga salah salin.

**Sisi user**: kode voucher tampil **di dalam Komunitas**, dipakai user **di Shopee** untuk potongan. Kolom `Kode Voucher` juga muncul di tabel Manajemen Akun (sisi admin).

---

## Flowchart Keseluruhan

Gabungan 11 state — dari daftar sampe Komonitas.

```mermaid
flowchart TD
  START([User daftar]) --> S1[1. SignUp + OTP email]
  S1 -- OTP salah --> S1
  S1 -- email OK --> LOGIN[User login]

  LOGIN --> GATE[evaluateLoginGate]

  GATE --> G_SUS{suspended?}
  G_SUS -- ya --> M_SUS[🚫 9. Modal Ditangguhkan]
  G_SUS -- tidak --> G_PEN{verifiedStatus=WAITING?}

  G_PEN -- ya --> M_PEN[🚫 2. Modal Sedang Ditinjau]
  G_PEN -- tidak --> G_EXP{subscription expired?}

  G_EXP -- "ya & no payment pending" --> M_EXP[🚫 8. Modal Berlangganan Berakhir]
  G_EXP -- tidak / payment pending --> ROLE{role?}

  ROLE -- "DISABLED-SSO" --> S11["11. routing khusus:<br/>dashboard admin / no-SSO"]
  ROLE -- admin --> ADM["/dashboard-admin/"]
  ROLE -- user biasa --> SUB[getStatus langganan]

  SUB --> Q_ACT{"aktif / paymentPending?"}
  Q_ACT -- "aktif (7)" --> KOM[✅ Komonitas full]
  Q_ACT -- "payment pending (4/5)" --> KOM
  Q_ACT -- "belum sub (3)" --> PAY["/login/subscription<br/>pilih paket"]

  PAY --> CHK[4. Checkout manual + Transfer Bank]
  CHK --> UP[5. Upload bukti → nunggu verif admin]
  UP --> DEC{Keputusan admin}
  DEC -- approve --> KOM
  DEC -- "reject (6)" --> REJ[Modal Penolakan:<br/>Sign Out / Perbaiki Data]
  REJ -- Perbaiki --> AP2{Approval 2}
  AP2 -- approve --> KOM
  AP2 -- reject --> OUT([Sign Out])
  REJ -- "belum pernah sub" --> DEL[⚠ 10. Dijadwalkan hapus<br/>tab Baru Dihapus]
  REJ -- Sign Out --> OUT
```

---

## Ringkasan mapping state → trigger → hasil

| # | State | Trigger / field | Hasil login |
|---|-------|-----------------|-------------|
| 1 | Baru daftar | belum konfirmasi OTP | belum ada sesi → OTP dulu |
| 2 | Belum verif admin | `verifiedStatus=0` | 🚫 modal pending |
| 3 | Verif, blm beli | `verifiedStatus=1`, no sub | ✅ → halaman langganan |
| 4 | Checkout, blm upload | payment `pending` | ✅ Komonitas (paymentPending) |
| 5 | Bukti upload | `receipt_uploaded` | ✅ Komonitas + admin verif |
| 6 | Bayar ditolak | payment `rejected` | 🚫 modal penolakan → perbaiki/approval-2 |
| 7 | Sub aktif | `hasActiveSubscription` | ✅ Komonitas full |
| 8 | Sub expired | `subscription.status=expired` | 🚫 modal perbarui |
| 9 | Suspended | `suspendedUntil` | 🚫 modal ditangguhkan |
| 10 | Pending deletion | `deletionPending` | ⚠ hanya view admin, login belum blok |
| 11 | Disabled | tag `DISABLED-SSO` | routing khusus, bukan blok |
| 12 | Dapat voucher | `PENDING_VOUCHER=3` (antara 2→3) | admin approve 2-langkah → voucher nempel |

---

## Catatan gap (buat BE/QA)

1. **State 10 & 11 belum di-gate di login** — `loginGate.js` cuma handle `suspended/pending/expired`. Pending-deletion & disabled cuma kuat di sisi admin/routing.
2. **Field masih `TODO(verify)`** — `verifiedStatus`, `suspendedUntil`, `deletionPending` nunggu bentuk asli `GET /profile/me` & `/admin/users` (lihat memory `manajemen-akun-data-gaps`).
3. **Trial 24 jam** (state 4) belum ada logika timer eksplisit — sekarang cuma `paymentPending` yg nglolosin.
4. **State 4 vs 5** identik dari sisi user (dua-duanya `paymentPending`); pembeda cuma filter admin `receipt_uploaded`.
</content>
</invoke>
