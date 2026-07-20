# Dokumentasi GASING CIRCLE — Peta Keseluruhan

Pintu masuk semua dokumentasi. Halaman ini **ga nyalin isi** dokumen lain — cuma nunjukin
harus baca yang mana. Detail selalu ada di dokumen tujuan.

**Apa ini:** SPA React 18 + Vite + **React Router v6** untuk autentikasi, langganan/pembayaran, dan
dashboard admin GASING CIRCLE. Backend NestJS terpisah. 79 file `.js`/`.jsx` di `src/`.

---

## Baca yang Mana?

| Kamu... | Baca ini | Kenapa |
|---------|----------|--------|
| Baru gabung, mau jalanin app | [`README.md`](../README.md) §5 Instalasi, §6 Environment | Setup < 5 menit |
| Mau ngerti struktur & alur data | [`ARCHITECTURE.md`](../ARCHITECTURE.md) | Routing, state, token, alur per-fitur |
| Cari URL suatu halaman | [`src/lib/routes.js`](../src/lib/routes.js) + [`README.md`](../README.md) §4 | Sumber kebenaran tunggal peta URL |
| Mau deploy ke staging/prod | [`DEPLOYMENT_GUIDE.md`](../DEPLOYMENT_GUIDE.md) | 6 fase + rollback. **SPA fallback wajib** |
| Mau nulis / jalanin tes | [`docs/TEST_SCENARIOS.md`](TEST_SCENARIOS.md) | ~65 skenario, per-fitur |
| Kerja di dashboard admin | [`docs/MANAJEMEN_AKUN.md`](MANAJEMEN_AKUN.md) | Modul manajemen akun + gap data |
| Kerja di verifikasi bukti transfer | [`docs/VERIFIKASI_PEMBAYARAN.md`](VERIFIKASI_PEMBAYARAN.md) | Sub-menu ke-2 admin, approve/reject manual transfer |
| Mau balikin pembayaran ke Midtrans | [`docs/PEMBAYARAN_MANUAL.md`](PEMBAYARAN_MANUAL.md) | Fitur manual = SEMENTARA. Checklist revert + gate login |
| Bikin tabel admin baru | [`docs/ADMIN_TABLE_LIMITS.md`](ADMIN_TABLE_LIMITS.md), [`docs/ADMIN_TABLE_SCROLL.md`](ADMIN_TABLE_SCROLL.md) | Limit, bulk action, aturan scroll |
| Kerja di alur revisi akun | [`docs/FIX_DATA_FLOW.md`](FIX_DATA_FLOW.md) + [ADR-0003](adr/0003-revise-token-flow.md) | Token JWT one-time dari email |
| Kerja di flow reset password | [`docs/RESET_PASSWORD_ROUTING.md`](RESET_PASSWORD_ROUTING.md) | Route `/login/reset-password` + kompat link email lama |
| Kerja di tampilan mobile | [`docs/MOBILE_RESPONSIVE.md`](MOBILE_RESPONSIVE.md) | 1 codebase, breakpoint `lg:` |
| Kerja di halaman legal (TOS/Privacy) | [`docs/LEGAL_PAGES.md`](LEGAL_PAGES.md) | Route `/register/id/TOS` & `/id/privacy`, tab baru dari signup |
| Kerja di halaman tamu (guest Komunitas) | [`docs/GUEST_KOMUNITAS.md`](GUEST_KOMUNITAS.md) + [ADR-0004](adr/0004-guest-static-komunitas.md) | Route `/komunitas/*` publik, statis, "Lanjut Sebagai Tamu" |
| Mau tau kenapa desainnya begitu | [`docs/adr/`](adr/) | Keputusan + trade-off |

---

## Peta Dokumen

```
README.md ................. Referensi utama: stack, folder, route, endpoint, Midtrans,
                            Discourse SSO, deploy, CI/CD, changelog (v1.0.0 → v3.0.0)
ARCHITECTURE.md ........... Arsitektur & alur data: React Router + boot sequence,
                            layer, token lifecycle, alur per-fitur, utang teknis
DEPLOYMENT_GUIDE.md ....... Runbook deploy staging: build → backup → upload →
                            Nginx (SPA fallback) → verifikasi → rollback
deploy/nginx-*.conf ....... Config Nginx siap pakai (base '/', try_files → index.html)
.env.example .............. Template environment + peringatan keamanan
docs/
  README.md ............... (kamu di sini) peta dokumentasi
  TEST_SCENARIOS.md ....... Skenario tes per-fitur, prioritas eksekusi
  MANAJEMEN_AKUN.md ....... Modul Manajemen Akun + kolom yang nunggu backend
  VERIFIKASI_PEMBAYARAN.md  Modul Verifikasi Pembayaran (bukti transfer manual)
  PEMBAYARAN_MANUAL.md .... Manual transfer = SEMENTARA; checklist balikin ke Midtrans
  ADMIN_TABLE_LIMITS.md ... Limit baris & bulk action tabel admin
  ADMIN_TABLE_SCROLL.md ... `getTableScrollProps` — aturan scroll tabel
  FIX_DATA_FLOW.md ........ Alur perbaikan data / revise
  RESET_PASSWORD_ROUTING.md Routing reset password + kompat link email lama
  MOBILE_RESPONSIVE.md .... Strategi responsive auth & payment
  LEGAL_PAGES.md .......... Halaman TOS & Privacy — routing, file, cara ubah isi
  adr/
    0001-fix-data-flow.md ................ Superseded by ADR-0003
    0002-refactor-junior-maintainability.md  Accepted
    0003-revise-token-flow.md ............ Accepted
```

---

## Peta Kode (`src/`)

| Folder | Isi | Dokumen detail |
|--------|-----|----------------|
| `App.jsx` | `<Routes>` React Router + boot sequence (deep-link, restore sesi) | ARCHITECTURE §3 |
| `lib/routes.js` | `PAGE_PATHS`, `pathForPage`, `isPublicStaticPath`, `skipSessionRestore` | README §4, ARCHITECTURE §3 |
| `lib/api.js` | Semua HTTP call, 15 grup API, auto-refresh token | README §9, ARCHITECTURE §5 |
| `lib/roles.js` | `isSuperAdmin`, `isOperationalAdmin`, `ADMIN_CAPABILITIES` | ARCHITECTURE §6.3 |
| `lib/loginGate.js` | `evaluateLoginGate` — blok login: suspended > pending > expired | TEST_SCENARIOS §2 |
| `lib/fixLink.js` | Encode/decode payload perbaikan data (legacy `?fix=`) | FIX_DATA_FLOW |
| `lib/utils.js` | `cn()` — merge className Tailwind | — |
| `pages/auth/` | 10 halaman: login, signup, OTP, forgot/reset, revise, SSO, choice | README §8.1 |
| `pages/legal/` | TermsPage, PrivacyPage, LegalLayout | LEGAL_PAGES |
| `pages/admin/` | 27 file: tabel, modal, mapper, helper scroll | README §8.2 |
| `pages/` (root) | Subscription, TransferBank, 4 halaman status Payment, MidtransTest | ARCHITECTURE §7.5–7.6 |
| `components/ui/` | shadcn/ui: button, input, label, checkbox, select | README §8.3 |
| `components/layout/` | LeftPanel, RightPanel, AuthFullLayout, StepIndicator | README §8.4 |
| `components/shared/` | IconInput, OtpInput, ErrorAlert, SuccessToast, LoginStatusModal, MobileReviewNotice, NoConnectionBanner | README §8.5 |
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
Detail: [FIX_DATA_FLOW.md](FIX_DATA_FLOW.md).

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
| Kolom Manajemen Akun belum lengkap | `GET /admin/users` | Riwayat count, Alumni Daerah, provinsi, subscription, voucher, role, suspend/deletion belum di-embed backend — [MANAJEMEN_AKUN.md](MANAJEMEN_AKUN.md) |
| Kolom Daerah & Peserta di Riwayat Pelatihan kosong | `GET /training-sessions` | Harus di-embed backend di respons list. **Jangan** resolve lewat loop per-baris di FE — memicu 429 dari throttler NestJS |
| Pendaftaran Trainer disimpan di `app-config` | `AdminDashboardPage.jsx` | Satu value JSON, bukan tabel: tanpa paginasi, tanpa audit trail, tulis = ganti seluruh value |
| `normalizeRevise` masih nebak nama field | `App.jsx` | Ada `TODO(verify)` — bentuk respons `/auth/revise` belum dikonfirmasi backend |
| Dua kosakata navigasi | `App.jsx`, `lib/routes.js` | Page masih pakai `onNavigate("<key>")`, di-shim ke URL. Sengaja (biar migrasi ga nyentuh 20+ file), tapi harus dijaga sinkron |
| Kode mati di `AccountActionModals.jsx` | `pages/admin/` | `SetujuiAkunModal` & `TangguhkanAkunModal` diekspor tapi ga dipakai — versi aktif ada di `SetujuiAkunModal.jsx` & `SuspendModal.jsx` |
| `authApi.submitCorrection` deprecated | `lib/api.js` | Diganti `getRevise`/`submitRevise`, hapus setelah migrasi kelar — ADR-0003 |
| `bad-words` dipin di v3 | `package.json` | Jangan upgrade ke 4.x — tarball tanpa `dist/`, build mati |
| `VITE_DISCOURSE_URL` tidak dibaca kode | README, DEPLOYMENT_GUIDE | Disebut di dokumen tapi ga ada di `src/` — redirect datang dari `redirectUrl` response backend |
| Belum ada test runner | — | `TEST_SCENARIOS.md` masih manual, belum ada Vitest/RTL |
| Isi halaman legal masih placeholder | `pages/legal/TermsPage.jsx`, `PrivacyPage.jsx` | Lorem ipsum — ganti teks legal final sebelum produksi, [LEGAL_PAGES.md](LEGAL_PAGES.md) |

Selengkapnya: [ARCHITECTURE.md §11](../ARCHITECTURE.md).
