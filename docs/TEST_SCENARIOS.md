# Skenario Pengetesan — Gasing Auth (Login-Dashboard)

Dokumen tes buat fitur yang **udah kelar/jalan**. Fokus alur nyata, bukan mimpi.
Format tiap kasus: **ID | Skenario | Langkah | Expected**.

Legend status: ✅ = fungsi selesai, siap dites.

---

## 1. Login (`LoginPage.jsx` + `authApi.login`) ✅

Aturan validasi: `EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/`, password ga boleh kosong.

| ID | Skenario | Langkah | Expected |
|----|----------|---------|----------|
| LOG-01 | Login sukses | Isi email valid + password bener → klik Masuk | Token kesimpen, redirect sesuai role/langganan |
| LOG-02 | Email kosong | Kosongin email → submit | Error "Format email tidak valid." / wajib isi |
| LOG-03 | Email format salah | Isi `abc@abc` (no TLD) → submit | Error "Format email tidak valid." |
| LOG-04 | Password kosong | Email valid, password kosong → submit | Error "Pastikan password tidak kosong." |
| LOG-05 | Kredensial salah | Password salah → submit | Error dari server tampil di field password |
| LOG-06 | Toggle password | Klik ikon mata | Password keliatan/ketutup gantian |
| LOG-07 | Clear error | Ada error email → ketik ulang | Error ilang pas ngetik |
| LOG-08 | Ke Forgot | Klik "Lupa password" | Pindah ke `forgot-password` |

## 2. Login Gate (`loginGate.js` → `evaluateLoginGate`) ✅

Prioritas: **suspended > pending > expired**. Modal: `LoginStatusModal`.

| ID | Skenario | Kondisi profil | Expected |
|----|----------|----------------|----------|
| GATE-01 | Akun suspended | `suspendedUntil` keisi | Modal `suspended`, tampil until + reason, login diblok |
| GATE-02 | Akun pending | `verifiedStatus` = waiting (bukan 1/2/-1) | Modal `pending`, login diblok |
| GATE-03 | Langganan expired | `subscription.status = 'expired'` | Modal `expired`, login diblok |
| GATE-04 | Prioritas | Suspended + pending barengan | Menang `suspended` |
| GATE-05 | Approved lolos | `verifiedStatus = 1` | Gate return null, lanjut routing |
| GATE-06 | Revise ga digate | `verifiedStatus = 2` | Return null (alur email sendiri) |
| GATE-07 | Rejected ga digate | `verifiedStatus = -1` | Return null |
| GATE-08 | Belum pernah langganan | ga ada subscription | Lolos → App arahin ke halaman langganan |

## 3. Role Routing (`roles.js`) ✅

`ADMIN_CAPABILITIES` = 6 cap wajib. Cek `isSuperAdmin`, `isOperationalAdmin`.

| ID | Skenario | Data user | Expected |
|----|----------|-----------|----------|
| ROLE-01 | Superadmin | `superadmin=true` | Ke `auth-choice`, BUKAN dashboard |
| ROLE-02 | Superadmin ejaan camel | `superAdmin=true` | Tetep kedeteksi superadmin |
| ROLE-03 | Admin operasional | punya SEMUA 6 cap, non-super | Ke `admin-dashboard` |
| ROLE-04 | Cap kurang 1 | 5 dari 6 cap | BUKAN admin operasional |
| ROLE-05 | Cap format array | `capabilities: [...]` | Kebaca bener |
| ROLE-06 | Cap format object | `capabilities: {cap:true}` | Kebaca bener (`cap in caps`) |
| ROLE-07 | Cap null | ga ada capabilities | `hasAllAdminCapabilities` = false |
| ROLE-08 | User biasa | non-super, no cap | Ke subscription/auth-choice sesuai langganan |

## 4. Sign Up + Password Rules (`SignUpPage.jsx`) ✅

Rules password: min 8 char, min 1 kapital, ada angka + simbol. Username min 3 char.

| ID | Skenario | Langkah | Expected |
|----|----------|---------|----------|
| SUP-01 | Daftar valid | Isi semua field bener → submit | Lanjut ke OTP (`SignUpOtpPage`) |
| SUP-02 | Username < 3 | Username 2 char | Error min 3 char |
| SUP-03 | Email invalid | Format salah | Error "Format email tidak valid." |
| SUP-04 | Password kosong | Kosong | Error "Password wajib diisi." |
| SUP-05 | Password lemah | `abc` | Error "belum memenuhi semua ketentuan" |
| SUP-06 | Checklist live | Ketik password bertahap | Tiap rule ✓ pas kepenuhi |
| SUP-07 | No kapital | `abcd1234!` | Rule kapital ga ✓ |
| SUP-08 | No simbol | `Abcd1234` | Rule angka+simbol ga ✓ |
| SUP-09 | Bad words | Username kata kotor (`bad-words`) | Ketolak/warning |

## 5. OTP Verifikasi Email (`SignUpOtpPage` + `authApi.confirmEmail`) ✅

Pake `OtpInput` + `useCountdown` buat resend.

| ID | Skenario | Langkah | Expected |
|----|----------|---------|----------|
| OTP-01 | OTP bener | Isi 6 digit valid | Konfirmasi sukses, lanjut review/login |
| OTP-02 | OTP salah | 6 digit salah | Error dari server |
| OTP-03 | OTP kurang digit | Isi 4 digit | Submit ga aktif / error |
| OTP-04 | Countdown resend | Tunggu timer | Tombol resend aktif pas countdown = 0 |
| OTP-05 | Resend sebelum habis | Klik resend pas timer jalan | Diblok/disabled |
| OTP-06 | Paste OTP | Paste 6 digit | Auto-isi tiap kotak |

## 6. Forgot & Reset Password ✅

`forgotPassword(email)` → `CheckEmailPage` → link → `ResetPasswordPage` → `resetPassword(token,email,newPassword)`.

| ID | Skenario | Langkah | Expected |
|----|----------|---------|----------|
| FP-01 | Kirim link sukses | Email valid → submit | Ke `check-email`, tampil email tujuan |
| FP-02 | Email invalid | Format salah | Error validasi |
| FP-03 | Reset sukses | Buka link (token+email di URL), password baru valid | Reset sukses, balik login |
| FP-04 | Token invalid/expired | Token bekas/kadaluarsa | Error dari server |
| FP-05 | Password baru lemah | Ga penuhin rules | Error validasi |
| FP-06 | Konfirmasi ga cocok | Password ≠ konfirmasi | Error mismatch |

## 7. Alur Revise / Fix Data (`FixDataPage` + `authApi.getRevise/submitRevise`) ✅

User dateng dari link email (token JWT di URL `/revise`). Token **one-time**.

| ID | Skenario | Langkah | Expected |
|----|----------|---------|----------|
| REV-01 | Prefill sukses | Buka `/revise?token=...` valid | `getRevise` isi form + alasan + field yg harus dibetulin |
| REV-02 | Token invalid | Token ngaco | Ke `revise-error` |
| REV-03 | Submit betulan | Betulin field → submit | `submitRevise` sukses, token di-revoke |
| REV-04 | Token dipake ulang | Submit 2x pake token sama | Ketolak (one-time) |
| REV-05 | Field wajib kosong | Kosongin field yg diminta | Error validasi |

## 8. SSO Callback (`SsoCallbackPage`) ✅

| ID | Skenario | Langkah | Expected |
|----|----------|---------|----------|
| SSO-01 | Ada access token | URL `?sso` + token ada | Ke `sso-callback`, proses profil |
| SSO-02 | No token | `?sso` tanpa token | Balik ke `login` |

## 9. Token & Refresh (`api.js` → `tryRefreshToken`) ✅

| ID | Skenario | Langkah | Expected |
|----|----------|---------|----------|
| TOK-01 | Auto-refresh 401 | Access token expired, refresh valid | Retry request diem-diem, sukses |
| TOK-02 | Refresh gagal | Refresh token juga mati | Logout, balik login |
| TOK-03 | Storage remember | Login "ingat saya" | Token di `localStorage` |
| TOK-04 | Storage session | Login tanpa remember | Token di `sessionStorage` |
| TOK-05 | Dedupe fetch | 2 request identik barengan | `dedupeFetch` gabung 1 |
| TOK-06 | Logout | Klik keluar | `authApi.logout`, token dibersihin |

## 10. Langganan & Pembayaran ✅

`SubscriptionPage` → pilih paket → `TransferBankPage` / Midtrans → halaman status.

| ID | Skenario | Langkah | Expected |
|----|----------|---------|----------|
| PAY-01 | Load paket | Buka subscription | `getPlans` tampil kartu paket |
| PAY-02 | Transfer bank | Pilih paket → transfer | Ke `transfer-bank`, detail muncul |
| PAY-03 | Payment finish | URL `/payment/finish` | Halaman `PaymentFinishPage` |
| PAY-04 | Payment unfinish | URL `/payment/unfinish` | Halaman `PaymentUnfinishPage` |
| PAY-05 | Payment error | URL `/payment/error` | Halaman `PaymentErrorPage` |
| PAY-06 | Payment success | `?status=success` | `PaymentSuccessPage`, URL dibersihin |
| PAY-07 | Udah aktif | login + `hasActiveSubscription` | Ke `auth-choice`, bukan subscription |

## 11. Admin Dashboard ✅

### 11a. Manajemen Akun (`ManajemenTable`, `AccountActionModals`, `SuspendModal`)

| ID | Skenario | Langkah | Expected |
|----|----------|---------|----------|
| ADM-01 | List user | Buka manajemen | Tabel keisi dari `GET /admin/users` |
| ADM-02 | Setujui akun | `SetujuiAkunModal` → approve | Status jadi approved |
| ADM-03 | Suspend | `SuspendModal` pilih reason + until | Akun tersuspend |
| ADM-04 | Filter tanggal | `CalendarRangePicker` | List kefilter range |
| ADM-05 | Bulk approve | `BulkApproveModal` pilih banyak | Semua keapprove |
| ADM-06 | Bulk reject | `BulkRejectModal` | Semua ketolak |

### 11b. Voucher (`KirimVoucherModal`, `PendingVoucherTable`)

Alur 2-langkah backend: `WAITING → PENDING_VOUCHER → APPROVED` (lihat memory verifikasi-akun).

| ID | Skenario | Langkah | Expected |
|----|----------|---------|----------|
| VCR-01 | Kirim voucher | `KirimVoucherModal` submit | Status pindah `PENDING_VOUCHER` |
| VCR-02 | Pending voucher list | Buka `PendingVoucherTable` | Yg `PENDING_VOUCHER` muncul |
| VCR-03 | Approve final | Approve dari pending | Jadi `APPROVED` |

### 11c. Pelatihan & Trainer (`RiwayatPelatihanTable`, `PendaftaranTrainerTable`)

| ID | Skenario | Langkah | Expected |
|----|----------|---------|----------|
| TRN-01 | Tambah pelatihan | `AddPelatihanModal` | Data pelatihan kesimpen |
| TRN-02 | Daftar peserta | `DaftarPesertaModal` | Peserta tampil |
| TRN-03 | Edit peserta | `EditPesertaModal` | Data keupdate |
| TRN-04 | Import CSV | Upload CSV email → poll job | `trainingHistoriesApi` validasi + push |
| TRN-05 | Row invalid CSV | CSV email ngaco | Row ditandai invalid, di-skip pas push |
| TRN-06 | Pendaftaran trainer | `AddPendaftaranTrainerModal` | Trainer terdaftar |

---

## Catatan Gap (belum siap dites penuh)

Lihat memory `manajemen-akun-data-gaps`: kolom **Riwayat count, Alumni Daerah, provinsi, subscription, voucher, role, suspend/deletion** masih nunggu field/embed dari `GET /admin/users`. Skenario yg nyangkut kolom itu tunda dulu sampe backend kasih data.

## Prioritas Eksekusi

1. **Kritikal**: LOG, GATE, ROLE, TOK — pintu masuk & keamanan.
2. **Tinggi**: SUP, OTP, FP, REV — onboarding user.
3. **Sedang**: PAY, ADM, VCR — bisnis flow.
4. **Rendah**: TRN — admin tooling.
