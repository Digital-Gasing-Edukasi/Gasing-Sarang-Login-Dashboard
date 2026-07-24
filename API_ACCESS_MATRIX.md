# Base API — Matrix Akses Endpoint × Kondisi User

Rangkuman **matrix akses API** dari tim backend (spreadsheet "Matrix Akses Endpoint × Kondisi User").
Ini **sumber kebenaran** perilaku endpoint **setelah** perubahan `feat/account-access-gate`.

- **Audience**: dev FE + BE + QA.
- **Sumber**: Google Sheet 3 tab — *User Endpoints*, *Admin + Capability*, *Legenda*.
- **Terkait**: [USER_STATE_FLOW.md](USER_STATE_FLOW.md) (flow per-state, versi dev) · [README §9 API Layer](README.md#9-api-layer).

> ⚠️ Beberapa nama path di sini **beda** dari `src/lib/api.js` (FE). Lihat [§7 Gap FE↔BE](#7-gap-febe).

---

## 1. Legenda nilai akses

| Simbol | Arti |
|--------|------|
| ✅ | `OK` — 200, jalan normal |
| 🚫 | `Ditolak` — 401 (token invalid/tak ada) atau 403 |
| ⚠️ | `Ditolak + info status` — 403 + code `ACCOUNT_SUSPENDED` / `ACCOUNT_PENDING_DELETION`. FE redirect ke halaman status → tarik detail dari `GET /auth/access-status` |
| 🕒 | `Hanya selama trial` — OK cuma selagi trial 24 jam aktif; lewat itu 🚫 |
| 🌐 | `Publik` — siapa pun bisa akses, tanpa login |

## 2. Kondisi user (11 kolom)

| Kode | Kondisi | Penjelasan singkat |
|------|---------|--------------------|
| **C1** | Baru daftar, email belum dikonfirmasi | Belum bisa login (tak punya token). Cuma endpoint publik + confirm-email/resend-otp |
| **C2** | Email OK, belum diverifikasi admin | `verifiedStatus`: WAITING/REVISE/REJECTED/PENDING_VOUCHER. Login bisa, hampir semua fitur jalan; **tak bisa** checkout-manual & teaching records |
| **C3** | Terverifikasi, belum beli paket | Belum ada sub aktif. Forum & teaching records tertutup |
| **C4** | Checkout manual, belum upload bukti | Order pending tanpa receipt. Dapat **trial 24 jam (sekali seumur hidup)** → forum kebuka selama trial |
| **C5** | Bukti upload, nunggu verif admin | Order pending + receipt. Forum kebuka bila trial masih < 24 jam |
| **C6** | Pembayaran ditolak (belum pernah sub) | Auto **dijadwalkan hapus** (`payment_rejected`). Akun terkunci kecuali lihat profil/logout/cek status. **Kalau PERNAH sub, tolak TIDAK memicu hapus** |
| **C7** | Subscription aktif | Semua fitur member kebuka. Kalau sebelumnya dijadwalkan hapus (`payment_rejected`), jadwal **dibatalkan otomatis** |
| **C8** | Subscription expired / cancelled | Balik seperti belum punya paket; forum & teaching records tertutup |
| **C9** | Suspended | Masih bisa login, tapi semua endpoint ⚠️ kecuali lihat profil/logout/cek status. Detail: `GET /auth/access-status` |
| **C10** | Dijadwalkan hapus (pending deletion) | Sama seperti suspended + hitung mundur. Grace: **30 hari** (by admin) / config (payment_rejected) |
| **C11** | Disabled (dinonaktifkan admin) | **Tak bisa login sama sekali**; semua token dicabut |

---

## 3. User endpoints — dikelompokkan per Access Profile

Daripada 11 kolom, endpoint dikelompokkan jadi **7 profil akses**. Endpoint dalam satu profil = pola akses identik.

| Profil | C1 | C2 | C3 | C4 | C5 | C6 | C7 | C8 | C9 | C10 | C11 |
|--------|----|----|----|----|----|----|----|----|----|-----|-----|
| **A · Publik** | 🌐 | 🌐 | 🌐 | 🌐 | 🌐 | 🌐 | 🌐 | 🌐 | 🌐 | 🌐 | 🌐 |
| **B · Konfirmasi email** | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| **C · Sesi dasar** | 🚫 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 🚫 |
| **D · Fitur member** | 🚫 | ✅ | ✅ | ✅ | ✅ | ⚠️ | ✅ | ✅ | ⚠️ | ⚠️ | 🚫 |
| **E · Checkout manual** | 🚫 | 🚫 | ✅ | ✅ | ✅ | ⚠️ | ✅ | ✅ | ⚠️ | ⚠️ | 🚫 |
| **F · Forum (SSO)** | 🚫 | 🚫 | 🚫 | 🕒 | 🕒 | ⚠️ | ✅ | 🚫 | ⚠️ | ⚠️ | 🚫 |
| **G · Teaching records (tulis)** | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | ⚠️ | ✅ | 🚫 | ⚠️ | ⚠️ | 🚫 |

**Beda kunci antar profil:**
- **D vs E**: E (checkout-manual) tambah 🚫 di **C2** — user belum diverif admin ga boleh checkout manual.
- **F (forum)**: cuma OK di **C7** (sub aktif) + 🕒 selama trial (C4/C5). Expired (C8) langsung 🚫.
- **G (teaching)**: paling ketat — **cuma C7**. Butuh verified admin + sub aktif.
- **C6/C9/C10** = state "terkunci" → semua fitur member jadi ⚠️ (403 + info status).

### Isi tiap profil

**A · Publik** (🌐 semua): `/auth/register` · `/auth/forgot-password` · `/auth/reset-password` · `/auth/revise` · `/auth/revise/submit` · `/profile/confirm-email` · `/packages` · `/forum/members` · `/forum/members-roles` · `/forum/member/:username` · `GET /teaching-records/:userId` · `/regions` · `/training-sessions` · `/timezones` · `GET /app-configs/:key` · `GET /forum-banner`

**B · Konfirmasi email**: `POST /auth/resend-otp` · `POST /auth/confirm-email`

**C · Sesi dasar**: `POST /auth/login` · `POST /auth/refresh` · **`GET /auth/access-status`** (BARU — status & detail akses) · `POST /auth/logout` · `POST /auth/logout-all` · `GET /profile/me`

**D · Fitur member**: `PATCH /profile` · `PATCH /profile/password` · `PATCH /profile/picture` · `PATCH /profile/banner` · `GET /subscription/me` · `POST /subscription/checkout` · `POST /subscription/subscribe` · `POST /subscription/cancel` · `GET /subscription/history` · `POST /subscription/payments/:id/upload-receipt` · `GET /subscription/payments/latest` · `GET /subscription/payments/:id` · `GET /vouchers` · `POST /vouchers/validate` · `POST /vouchers/redeem` · `GET /users/:username/skills` · `POST /skills/:skillId/endorse` · `POST /file-manager/upload` · `PATCH /file-manager/commit/:id` · `GET /file-manager/download/:id` · `GET /queue/jobs` · `GET /queue/jobs/:id`

**E · Checkout manual**: `POST /subscription/checkout-manual` (+trial 24 jam; butuh verif admin)

**F · Forum (SSO)**: `GET /discourse/sso-login` · `POST /discourse/gateway`

**G · Teaching records (tulis)**: `POST /teaching-records` · `PATCH /teaching-records/:id` · `DELETE /teaching-records/:id`

---

## 4. Admin endpoints + Capability (UAC)

**Aturan admin:**
- Member biasa → 🚫 di **semua** endpoint admin.
- Admin → butuh **capability** di kolom bawah **DAN** tunduk kondisi akun yang sama (admin suspended/dijadwalkan-hapus juga terblokir).
- **Super admin** → bypass capability, **TIDAK** bypass kondisi akun.
- FE: `GET /profile/me` mengembalikan array `capabilities` user login → pakai buat show/hide menu. Super admin dapat seluruh daftar.

### User Management
| Endpoint | Method | Capability |
|----------|--------|-----------|
| `/admin/users` | GET | `USER/LIST` |
| `/admin/users/deleted` | GET | `USER/LIST` |
| `/admin/users/:id` | GET | `USER/MGMT` |
| `/admin/users/:id` | PATCH | `USER/MGMT` (termasuk email, disabled, superAdmin) |
| `/admin/users/:id` | DELETE | `USER/DELETE` (hapus permanen, tanpa grace) |
| `/admin/users/:id/password` | PATCH | **SUPER ADMIN ONLY** |
| `/admin/users/:id/verify` | PATCH | `USER/VERIFY` (approve/reject/revise) |
| `/admin/users/:id/resend-revise-email` | POST | `USER/VERIFY` |
| `/admin/users/:id/deletion-request` | POST | `USER/MGMT` (grace 30 hari) |
| `/admin/users/:id/deletion-request` | DELETE | `USER/MGMT` (batal jadwal hapus) |
| `/admin/users/:id/suspend` | POST | `USER/MGMT` |
| `/admin/users/:id/suspend` | DELETE | `USER/MGMT` |
| `/admin/users/:id/first-training-session` | PATCH | `USER/MGMT` |
| `/admin/users/training-history/:id` | GET | `TRAINING_HISTORY/MGMT` |

### Discourse / Forum
| Endpoint | Method | Capability |
|----------|--------|-----------|
| `/admin/users/:id/discourse-group` | PATCH | `USER/DISCOURSE/CHANGE_GROUP` |
| `/admin/users/:id/discourse-groups` | GET | `USER/DISCOURSE/MANAGE_EXTRA_GROUPS` |
| `/admin/users/:id/discourse-groups` | POST | `USER/DISCOURSE/MANAGE_EXTRA_GROUPS` |
| `/admin/users/:id/discourse-groups/:groupId` | DELETE | `USER/DISCOURSE/MANAGE_EXTRA_GROUPS` |
| `/discourse/groups` | GET | `USER/VERIFY` |
| `/discourse/groups/sync` | POST | `DISCOURSE/GROUP/SYNC` |
| `/forum-banner` | PUT | `FORUM_BANNER/MGMT` |

### Subscription & Pembayaran
| Endpoint | Method | Capability |
|----------|--------|-----------|
| `/admin/packages` | GET/POST | `PACKAGE/MGMT` |
| `/admin/packages/:id` | GET/PATCH/DELETE | `PACKAGE/MGMT` |
| `/admin/subscriptions` | GET | `PACKAGE/MGMT` |
| `/admin/subscriptions/:id` | GET | `PACKAGE/MGMT` |
| `/admin/subscriptions/sync` | POST | `PACKAGE/MGMT` |
| `/admin/payments` | GET | `PACKAGE/MGMT` |
| `/admin/payments/manual-transfer/list` | GET | `USER/LIST` |
| `/admin/payments/manual-transfer/stats` | GET | `USER/VERIFY` |
| `/admin/payments/manual-transfer/:id` | GET | `USER/VERIFY` |
| `/admin/payments/manual-transfer/:id/approve` | POST | `USER/VERIFY` |
| `/admin/payments/manual-transfer/:id/reject` | POST | `USER/VERIFY` |
| `/admin/subscription-period-groups` | GET | `USER/DISCOURSE/CHANGE_GROUP` |
| `/admin/subscription-period-groups/ensure` | POST | `USER/DISCOURSE/CHANGE_GROUP` |
| `/admin/subscription-period-groups/resync/:subscriptionId` | POST | `USER/DISCOURSE/CHANGE_GROUP` |

### Voucher
| Endpoint | Method | Capability |
|----------|--------|-----------|
| `/admin/vouchers` | GET | `VOUCHER/MGMT` |
| `/admin/vouchers/:idOrCode` | GET | `VOUCHER/MGMT` |
| `/admin/vouchers/:idOrCode/usage` | GET | `VOUCHER/MGMT` |
| `/admin/vouchers/pool` | POST | `VOUCHER/MGMT` |
| `/admin/vouchers/personal` | POST | `VOUCHER/MGMT` |
| `/admin/vouchers/:id/revoke` | PATCH | `VOUCHER/MGMT` |

### Training · Skills · Sistem
| Endpoint | Method | Capability |
|----------|--------|-----------|
| `/admin/training-histories/**` | ALL | `TRAINING_HISTORY/MGMT` (import CSV: upload, review, push) |
| `/admin/skills` | GET/POST | `SKILL/MGMT` |
| `/admin/skills/:id` | PATCH/DELETE | `SKILL/MGMT` |
| `/app-configs/:key` | PUT | `SETTING/WRITE` |
| `/admin/queue/jobs` | GET | **SUPER ADMIN ONLY** |
| `/admin/queue/jobs/:id` | GET | **SUPER ADMIN ONLY** |

### Super admin only (tanpa capability)
`POST /regions` · `PATCH|DELETE /regions/:id` · `POST /training-sessions` · `PATCH|DELETE /training-sessions/:id` · `GET /admin/uac/groups` · `GET /admin/uac/groups/:id` · `POST|DELETE /admin/uac/assignments`

---

## 5. Katalog Capability (`uac.config.json`)

| Capability | Nama | Keterangan |
|-----------|------|-----------|
| `USER/MGMT` | Manage user | Update data user |
| `USER/LIST` | View List User | Listing user |
| `USER/DELETE` | Delete user permanently | Direct delete tanpa grace |
| `USER/VERIFY` | Verify user | Approve/reject verifikasi + verifikasi pembayaran manual |
| `USER/DISCOURSE/CHANGE_GROUP` | Update user group | Ganti group utama Discourse |
| `USER/DISCOURSE/MANAGE_EXTRA_GROUPS` | Manage extra user groups | Tambah/hapus extra group (mis. moderator) |
| `USER/DISCOURSE/DISABLED-SSO` | Disables Discourse forum | Penanda blokir: user di group ini **tak bisa SSO** ke forum |
| `PACKAGE/MGMT` | Manage Package | CRUD paket + lihat subscription/payment |
| `VOUCHER/MGMT` | Manage voucher | CRUD voucher |
| `TRAINING_HISTORY/MGMT` | Manage Training History | Import riwayat training |
| `DISCOURSE/GROUP/SYNC` | Sync Discourse Groups | Sync cache group forum |
| `FORUM_BANNER/MGMT` | Manage Forum Banner | Update banner forum |
| `SETTING/WRITE` | Manage App Settings | Set `app_configs` |
| `SKILL/MGMT` | Manage Skills | CRUD skill untuk skills/endorsements |
| `QUEUE/LIST` ⚠️ | (belum terdaftar) | Dipakai controller tapi belum ada di `uac.config.json` → efektif super-admin-only (by design) |

## 6. Preset Group UAC (untuk assignment admin)

| Group | Capabilities |
|-------|-------------|
| **User Manager** | `USER/VERIFY`, `USER/DISCOURSE/CHANGE_GROUP`, `USER/LIST`, `USER/MGMT`, `USER/DELETE` |
| **User verify** | `USER/VERIFY`, `USER/DISCOURSE/CHANGE_GROUP`, `USER/LIST` |
| **Discourse Group Manager** | `USER/DISCOURSE/MANAGE_EXTRA_GROUPS` |
| **Package manager** | `PACKAGE/MGMT` |
| **Voucher manager** | `VOUCHER/MGMT` |
| **Disables Discourse forum** | `USER/DISCOURSE/DISABLED-SSO` |
| **Training Histories Management** | `TRAINING_HISTORY/MGMT` |
| **Discourse Group Sync** | `DISCOURSE/GROUP/SYNC` |
| **Forum Banner Manager** | `FORUM_BANNER/MGMT` |
| **Setting updater** | `SETTING/WRITE` |
| **Skill Manager** | `SKILL/MGMT` |

> **Admin operasional** (`isOperationalAdmin` di `roles.js`) = tag `DISCOURSE/GROUP/SYNC` → routing ke `/dashboard-admin`. Cross-check kolom `capabilities` dari `GET /profile/me`.

---

## 7. Gap FE↔BE

Nama path di matrix BE **beda** dari `src/lib/api.js` (FE). Perlu direkonsiliasi — cek waktu integrasi:

| Fungsi | Matrix BE (sheet) | FE `api.js` / README | Catatan |
|--------|-------------------|----------------------|---------|
| Checkout manual | `/subscription/checkout-manual` | `/subscription/checkout/manual` | Beda separator `-` vs `/` |
| Upload bukti | `/subscription/payments/:id/upload-receipt` | `/subscription/payments/:id/receipt` | Beda suffix |
| Cek status akses | `GET /auth/access-status` | *(belum ada di FE)* | BARU — buat halaman status suspend/deletion |
| Ganti banner | `PATCH /profile/banner` | *(belum ada di FE)* | FE baru punya `/profile/picture` |
| Detail voucher admin | `/admin/vouchers/:idOrCode` | `/admin/vouchers/:code` | Param idOrCode |
| Verify akun (langkah-2) | *(sheet tak detail payload)* | `{ status, discourseGroupId }` **tanpa** `lastTrainingSessionId` | README §9 masih tulis "{ status } saja" — **usang**, lihat [USER_STATE_FLOW.md §12](USER_STATE_FLOW.md) |

**Endpoint BE yang belum ada di FE** (kandidat fitur baru): `/admin/users/deleted`, `/admin/users/:id/first-training-session`, `/admin/users/training-history/:id`, `/admin/users/:id/discourse-groups` (extra groups), `/discourse/groups/sync`, `/admin/subscription-period-groups/*`, `/admin/queue/jobs`, `/admin/uac/groups`.

---

## 8. Aturan penting (ringkas)

1. **Trial 24 jam = sekali seumur hidup.** Kebuka pas checkout-manual (C4/C5) → forum akses selama < 24 jam.
2. **Payment ditolak & belum pernah sub** → auto `payment_rejected` → dijadwalkan hapus. **Pernah sub → tolak TIDAK menghapus.**
3. **Sub aktif membatalkan jadwal hapus** `payment_rejected` otomatis.
4. **Suspended & pending-deletion**: masih login, tapi semua ⚠️ kecuali lihat profil / logout / `GET /auth/access-status`.
5. **Disabled**: tak bisa login, semua token dicabut (C11 = 🚫 bahkan di sesi dasar).
6. **Admin tunduk kondisi akun** — admin suspended/dijadwalkan-hapus ikut terblokir. Super admin bypass capability, **bukan** kondisi akun.
7. **`Ditolak + info status`** selalu diikuti FE redirect ke halaman status + tarik detail dari `GET /auth/access-status`.
</content>
