# Dokumentasi GASING CIRCLE — Peta Keseluruhan

Pintu masuk semua dokumentasi. Halaman ini **ga nyalin isi** dokumen lain — cuma nunjukin
harus baca yang mana. Detail selalu ada di dokumen tujuan.

**Apa ini:** SPA React 18 + Vite + **React Router v6** untuk autentikasi, langganan/pembayaran, dan
dashboard admin GASING CIRCLE. Backend NestJS terpisah. 94 file `.js`/`.jsx` di `src/`.

---

## Baca yang Mana?

| Kamu... | Baca ini | Kenapa |
|---------|----------|--------|
| Baru gabung, mau jalanin app | [`README.md`](../README.md) §5 Instalasi, §6 Environment | Setup < 5 menit |
| Mau ngerti struktur & alur data | [`ARCHITECTURE.md`](ARCHITECTURE.md) | Routing, state, token, alur per-fitur |
| Mau paham perilaku akun (12 state) | [`USER_STATE_FLOW.md`](USER_STATE_FLOW.md) (dev) · [`USER_FLOW.md`](USER_FLOW.md) (designer) | Field, gate, `file:line` vs bahasa awam |
| Cari URL suatu halaman | [`src/lib/routes.js`](../src/lib/routes.js) + [`README.md`](../README.md) §4 | Sumber kebenaran tunggal peta URL |
| Mau deploy ke staging/prod | [`deployment/DEPLOYMENT_GUIDE.md`](deployment/DEPLOYMENT_GUIDE.md) (6 fase + rollback) · [`deployment/DEPLOY_STAGING_SSH_BROWSER.md`](deployment/DEPLOY_STAGING_SSH_BROWSER.md) (upload zip) | **SPA fallback wajib** |
| Mau nulis / jalanin tes | [`TEST_SCENARIOS.md`](TEST_SCENARIOS.md) | ~65 skenario, per-fitur |
| Kerja di import peserta pelatihan (CSV) | [`admin/RIWAYAT_PELATIHAN_TABLE_IMPORT.md`](admin/RIWAYAT_PELATIHAN_TABLE_IMPORT.md) + [`flows/flow-riwayat-dan-pendaftaran-trainer.md`](flows/flow-riwayat-dan-pendaftaran-trainer.md) | Aturan Member / Non Member, alur pendaftaran trainer |
| Kerja di dashboard admin | [`docs/admin/MANAJEMEN_AKUN.md`](admin/MANAJEMEN_AKUN.md) | Modul manajemen akun + gap data |
| Kerja di verifikasi bukti transfer | [`docs/admin/VERIFIKASI_PEMBAYARAN.md`](admin/VERIFIKASI_PEMBAYARAN.md) | Sub-menu ke-2 admin, approve/reject manual transfer |
| Mau balikin pembayaran ke Midtrans | [`docs/admin/PEMBAYARAN_MANUAL.md`](admin/PEMBAYARAN_MANUAL.md) | Fitur manual = SEMENTARA. Checklist revert + gate login |
| Bikin tabel admin baru | [`docs/admin/ADMIN_TABLE_LIMITS.md`](admin/ADMIN_TABLE_LIMITS.md), [`docs/admin/ADMIN_TABLE_SCROLL.md`](admin/ADMIN_TABLE_SCROLL.md) | Limit, bulk action, aturan scroll |
| Kerja di alur revisi akun | [`docs/flows/FIX_DATA_FLOW.md`](flows/FIX_DATA_FLOW.md) + [ADR-0003](adr/0003-revise-token-flow.md) | Token JWT one-time dari email |
| Kerja di flow reset password | [`docs/flows/RESET_PASSWORD_ROUTING.md`](flows/RESET_PASSWORD_ROUTING.md) | Route `/login/reset-password` + kompat link email lama |
| Kerja di flow konfirmasi ubah email | [`docs/flows/CONFIRM_EMAIL_CHANGE.md`](flows/CONFIRM_EMAIL_CHANGE.md) + [ADR-0006](adr/0006-confirm-email-change-flow.md) | Route `confirm-email-change?token=` (staging `/register/…`, prod `/…`), noAuth, fire-on-mount |
| Kerja di tampilan mobile | [`docs/ui/MOBILE_RESPONSIVE.md`](ui/MOBILE_RESPONSIVE.md) | 1 codebase, breakpoint `lg:` |
| Ubah bentuk field/tombol (radius) | [`docs/ui/PILL_SHAPE_INPUTS.md`](ui/PILL_SHAPE_INPUTS.md) | Input, dropdown, calendar, CTA = pill (`rounded-full`) |
| Value dropdown ke-indent saat dipilih | [`docs/ui/DROPDOWN_TEXT_ALIGN.md`](ui/DROPDOWN_TEXT_ALIGN.md) | `text-left` di `TRIGGER_CLS` — fix warisan `text-align: center` |
| Kerja di halaman legal (TOS/Privacy) | [`docs/ui/LEGAL_PAGES.md`](ui/LEGAL_PAGES.md) | Route `/register/id/TOS` & `/id/privacy`, tab baru dari signup |
| Kerja di halaman tamu (guest Komunitas) | [`docs/flows/GUEST_KOMUNITAS.md`](flows/GUEST_KOMUNITAS.md) + [ADR-0004](adr/0004-guest-static-komunitas.md) | Route `/komunitas/*` publik, statis, "Lanjut Sebagai Tamu" |
| Mau tau kenapa desainnya begitu | [`docs/adr/`](adr/) | Keputusan + trade-off |

---

## Peta Dokumen

```
(root repo)
  README.md .............. Referensi utama: stack, folder, route, endpoint, Midtrans,
                          Discourse SSO, deploy, CI/CD, changelog
  API_ACCESS_MATRIX.md .. Matrix akses endpoint × kondisi user + capability admin (UAC)
  CHANGELOG.md ........... Riwayat versi
  deploy/nginx-*.conf ... Config Nginx siap pakai (base '/', try_files → index.html)
  .env.example .......... Template environment + peringatan keamanan

docs/
├── README.md ............ (kamu di sini) peta dokumentasi
├── ARCHITECTURE.md ..... Arsitektur & alur data: React Router + boot sequence, layer,
│                         token lifecycle, alur per-fitur, utang teknis
├── TEST_SCENARIOS.md ... Skenario tes per-fitur, prioritas eksekusi
├── USER_FLOW.md ........ Flow 12 state user — versi designer (bahasa awam)
├── USER_STATE_FLOW.md .. Flow 12 state user — versi developer (field, gate, file:line)
│
├── flows/
│   ├── FIX_DATA_FLOW.md ................... Alur perbaikan data / revise (token JWT one-time)
│   ├── RESET_PASSWORD_ROUTING.md .......... Routing reset password + kompat link email lama
│   ├── CONFIRM_EMAIL_CHANGE.md ............ Routing konfirmasi ubah email (noAuth token)
│   ├── GUEST_KOMUNITAS.md ................. Halaman tamu Komunitas (/komunitas/* publik, statis)
│   └── flow-riwayat-dan-pendaftaran-trainer.md  Alur riwayat pelatihan + pendaftaran trainer
│
├── admin/
│   ├── MANAJEMEN_AKUN.md ................. Modul Manajemen Akun + kolom yang nunggu backend
│   ├── VERIFIKASI_PEMBAYARAN.md .......... Modul Verifikasi Pembayaran (bukti transfer manual)
│   ├── PEMBAYARAN_MANUAL.md .............. Manual transfer = SEMENTARA; checklist balikin ke Midtrans
│   ├── ADMIN_TABLE_LIMITS.md ............. Limit baris & bulk action tabel admin
│   ├── ADMIN_TABLE_SCROLL.md ............. `getTableScrollProps` — aturan scroll tabel
│   └── RIWAYAT_PELATIHAN_TABLE_IMPORT.md . Import peserta via CSV (aturan Member / Non Member)
│
├── ui/
│   ├── MOBILE_RESPONSIVE.md .............. Strategi responsive auth & payment (breakpoint lg:)
│   ├── LEGAL_PAGES.md .................... Halaman TOS & Privacy — routing, file, cara ubah isi
│   ├── PILL_SHAPE_INPUTS.md .............. Field/dropdown/calendar/CTA bentuk pill (rounded-full)
│   └── DROPDOWN_TEXT_ALIGN.md ............ Fix value dropdown ke-indent saat dipilih (text-left)
│
├── deployment/
│   ├── DEPLOYMENT_GUIDE.md ............... Runbook deploy staging: build → backup → upload →
│   │                                      Nginx (SPA fallback) → verifikasi → rollback
│   └── DEPLOY_STAGING_SSH_BROWSER.md .... Deploy via GCP SSH-in-browser (upload dist.zip)
│
└── adr/
    ├── 0001-fix-data-flow.md ................... Superseded by ADR-0003
    ├── 0002-refactor-junior-maintainability.md . Accepted
    ├── 0003-revise-token-flow.md ............... Accepted
    ├── 0004-guest-static-komunitas.md .......... Accepted (/komunitas/* publik, statis)
    ├── 0005-environment-visibility.md .......... Accepted
    └── 0006-confirm-email-change-flow.md ....... Accepted (konfirmasi ubah email, noAuth token)
```

---

## Peta Kode (`src/`)

| Folder | Isi | Dokumen detail |
|--------|-----|----------------|
| `App.jsx` | `<Routes>` React Router + boot sequence (deep-link, restore sesi) | ARCHITECTURE §3 |
| `lib/routes.js` | `PAGE_PATHS`, `pathForPage`, `isPublicStaticPath`, `skipSessionRestore` | README §4, ARCHITECTURE §3 |
| `lib/api.js` | Semua HTTP call, 15 grup API, auto-refresh token | README §9, ARCHITECTURE §5 |
| `lib/roles.js` | `isSsoDisabled`, `canAccessDiscourse`, `ADMIN_CAPABILITIES` | ARCHITECTURE §6.3 |
| `lib/loginGate.js` | `evaluateLoginGate` — blok login: suspended > pending > expired | TEST_SCENARIOS §2 |
| `lib/fixLink.js` | Encode/decode payload perbaikan data (legacy `?fix=`) | FIX_DATA_FLOW |
| `lib/utils.js` | `cn()` — gabung className (`clsx` saja, **bukan** tailwind-merge) | [PILL_SHAPE_INPUTS.md §5](ui/PILL_SHAPE_INPUTS.md) |
| `lib/format.js` | Format bersama: `formatRp`/`fmtRupiah`, `localizePlanName`, `fmtTimeAmPm`, `ID_MONTHS`, `withBase`, `downloadCsv` | — |
| `lib/password.js` | Aturan password bersama: `getPasswordRules(pw)`, `isPasswordValid(pw)` — dipakai SignUp & ResetPassword | — |
| `pages/auth/` | 11 halaman: login, signup, OTP, forgot/reset, revise, SSO, choice, confirm-email-change | README §8.1 |
| `pages/legal/` | TermsPage, PrivacyPage, LegalLayout | LEGAL_PAGES |
| `pages/admin/` | 31 file: tabel, modal, mapper, helper scroll | README §8.2 |
| `pages/` (root) | AdminDashboardPage (shell admin), Subscription, TransferBank, 4 halaman status Payment, MidtransTest | ARCHITECTURE §7.5–7.6 |
| `components/ui/` | shadcn/ui: button, input, label, checkbox, select | README §8.3 |
| `components/layout/` | LeftPanel, RightPanel, AuthFullLayout, StepIndicator | README §8.4 |
| `components/shared/` | IconInput, OtpInput, ErrorAlert, SuccessToast, LoginStatusModal, MobileReviewNotice, NoConnectionBanner, DarkAuth, DateField, Logo, PaymentStatusLayout | README §8.5 |
| `hooks/useCountdown.js` | Timer OTP & resend | README §8.6 |

---

## Alur Utama (ringkas)

```
Sign Up → OTP → Review ──┐
                         ├──► Login ──► evaluateLoginGate()
Forgot → Reset ──────────┘                    │
                                    ┌─────────┴──────────┐
                             gate nyala            gate lolos
                                    │                    │
                       LoginStatusModal            roles.js
                    (suspended/pending/expired)         │
                                          ┌─────────────┼──────────────┐
                                    superadmin   admin operasional   user
                                          │             │              │
                                    auth-choice   admin-dashboard  langganan aktif?
                                                                   ├─ ya → auth-choice
                                                                   └─ ga → subscription
                                                                            → Midtrans/Transfer
                                                                            → payment status
```

Email revisi akun masuk lewat jalur terpisah: link `/revise?token=` → `FixDataPage`.
Detail: [FIX_DATA_FLOW.md](flows/FIX_DATA_FLOW.md).

---

## Perintah

| Perintah | Fungsi |
|----------|--------|
| `npm run dev` | Dev server, mode `staging` |
| `npm run build` | Build production → `dist/` |
| `npm run build:staging` | Build mode staging |
| `npm run preview` | Serve hasil build |
| `npm run lint` | ESLint |

---

## Peringatan Keamanan

`VITE_MIDTRANS_SERVER_KEY` **ikut ter-bundle ke JS produksi** dan bisa dibaca siapa pun lewat
DevTools. Server Key = akses penuh akun Midtrans (refund, charge). **Kosongkan sebelum
`npm run build` untuk production.** Isi hanya saat pakai `/?midtrans-test=true` di localhost.

Baca [`.env.example`](../.env.example) sebelum ngisi environment.

---

## Utang Teknis Terbuka

| Item | Lokasi | Catatan |
|------|--------|---------|
| **Nginx SPA fallback belum tentu ter-deploy** | server staging/prod | `base: '/'` + React Router → semua path harus jatuh ke `index.html`. Tanpa itu, refresh di `/dashboard-admin` = 404. Config siap pakai: [`deploy/nginx-gasing-auth.conf`](../deploy/nginx-gasing-auth.conf) |
| Kolom Manajemen Akun belum lengkap | `GET /admin/users` | Riwayat count, Alumni Daerah, provinsi, subscription, voucher, role, suspend/deletion belum di-embed backend — [MANAJEMEN_AKUN.md](admin/MANAJEMEN_AKUN.md) |
| Kolom Daerah & Peserta di Riwayat Pelatihan kosong | `GET /training-sessions` | Harus di-embed backend di respons list. **Jangan** resolve lewat loop per-baris di FE — memicu 429 dari throttler NestJS |
| Pendaftaran Trainer disimpan di `app-config` | `AdminDashboardPage.jsx` | Satu value JSON, bukan tabel: tanpa paginasi, tanpa audit trail, tulis = ganti seluruh value |
| `normalizeRevise` masih nebak nama field | `App.jsx` | Ada `TODO(verify)` — bentuk respons `/auth/revise` belum dikonfirmasi backend |
| Dua kosakata navigasi | `App.jsx`, `lib/routes.js` | Page masih pakai `onNavigate("<key>")`, di-shim ke URL. Sengaja (biar migrasi ga nyentuh 20+ file), tapi harus dijaga sinkron |
| Kode mati di `AccountActionModals.jsx` | `pages/admin/` | `SetujuiAkunModal` & `TangguhkanAkunModal` diekspor tapi ga dipakai — versi aktif ada di `SetujuiAkunModal.jsx` & `SuspendModal.jsx` |
| `authApi.submitCorrection` deprecated | `lib/api.js` | Diganti `getRevise`/`submitRevise`, hapus setelah migrasi kelar — ADR-0003 |
| `bad-words` dipin di v3 | `package.json` | Jangan upgrade ke 4.x — tarball tanpa `dist/`, build mati |
| Filter SARA tanpa term identitas | `SignUpPage.jsx` | Daftar kata sengaja tak memuat identitas/agama netral (cina/islam/kristen/dst) — tolak nama & sekolah sah. Cuma slur asli. Jangan tambah balik |
| `VITE_DISCOURSE_URL` tidak dibaca kode | README, DEPLOYMENT_GUIDE | Disebut di dokumen tapi ga ada di `src/` — redirect datang dari `redirectUrl` response backend |
| Belum ada test runner | — | `TEST_SCENARIOS.md` masih manual, belum ada Vitest/RTL |
| Isi halaman legal masih placeholder | `pages/legal/TermsPage.jsx`, `PrivacyPage.jsx` | Lorem ipsum — ganti teks legal final sebelum produksi, [LEGAL_PAGES.md](ui/LEGAL_PAGES.md) |

Selengkapnya: [ARCHITECTURE.md §11](ARCHITECTURE.md).
