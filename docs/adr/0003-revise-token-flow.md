# ADR-0003: Perbaikan Data via Token JWT (Menggantikan Link Self-Contained)

**Status:** Accepted
**Date:** 2026-07-01
**Deciders:** Frontend lead (ery), backend team
**Supersedes:** [ADR-0001](0001-fix-data-flow.md)

## Context

[ADR-0001](0001-fix-data-flow.md) memilih **link self-contained** (`?fix=base64(payload)`)
untuk alur "akun ditolak → perbaiki data", **karena backend belum siap**. Trade-off yang
diterima saat itu: data pribadi terekspos di URL, link tidak bisa di-revoke, tanpa validasi
server.

Backend kini **sudah menyediakan endpoint** untuk alur ini (lihat Postman
`komunitas-api` 01-07-2026) — yaitu persis "Option B: token + lookup backend" yang
ADR-0001 tunda. Karena syarat pemblokir (backend belum ada) sudah hilang, alasan utama
memilih Option A gugur.

Endpoint baru:
- **Admin** `PATCH /admin/users/:id/verify` dengan `{ status: "revise", rejectedReason,
  fieldsToRevise: [] }` → backend generate token JWT + kirim email revise ke user.
- **Admin** `POST /admin/users/:id/resend-revise-email` → kirim ulang (token baru).
- **User** `POST /auth/revise` `{ token }` → balikin profil + alasan + daftar field. Auth
  via token di body, tanpa access token.
- **User** `POST /auth/revise/submit` `{ token, ...field }` → simpan, set status WAITING,
  notifikasi admin `USER/VERIFY`. **Token one-time** (di-revoke setelah dipakai).

Status verifikasi (dari respons `profile/me`): `verifiedStatus` numerik — konfirmasi
mapping REVISE = 2 dengan backend.

## Decision

**Pindah ke alur token-based**, buang mekanisme link self-contained.

1. **Admin** (RejectModal) memilih aksi lewat checklist:
   - Centang field (Tanggal Lahir/Lokasi/Riwayat Pelatihan/Nama Sekolah) → `status:'revise'`
     + `fieldsToRevise` (backend generate token & email link revise).
   - Centang **"Lainnya"** → `status:'rejected'` (tolak final) + `rejectedReason` dari
     textarea "Catatan Tambahan". "Lainnya" menang: checklist field diabaikan.
   Tidak lagi membangun `correctionUrl` di FE.
2. **User** prefill dari `POST /auth/revise` (bukan decode URL); submit ke
   `POST /auth/revise/submit`.
3. Deprecate `fixLink.js` (encode/`buildFixUrl`), `authApi.submitCorrection`, dan
   dependensi payload-di-URL.

`fieldsToRevise` bersifat **opaque bagi backend** — FE yang menentukan arti key
(`birthdate`, `region`, `training`, `school`, `lainnya`). Registry key tetap di
`FIELD_DEFS`.

### Status implementasi
- **Sisi admin: SELESAI.** `adminApi.reviseUser` + `resendReviseEmail`,
  `handleConfirmReject` → `reviseUser`, `FIELD_DEFS` (+`lainnya`), buang `buildFixUrl`.
- **Sisi user: PENDING.** `FixDataPage` masih baca `?fix=` payload lama. Migrasi ke
  `getRevise`/`submitRevise` menunggu desain user-side + kesepakatan param link email.

## Options Considered

### Option A: Token-based (DIPILIH — sekarang backend siap)
| Dimension | Assessment |
|-----------|------------|
| Complexity | Medium |
| Keamanan | Tinggi — data tidak di URL, token bisa di-revoke, one-time |
| Ketergantungan | Butuh endpoint backend (kini tersedia) |
| Team familiarity | Tinggi |

**Pros:** URL pendek & opak; link bisa expire/di-revoke; validasi server; selaras kontrak
backend nyata. **Cons:** FE tidak lagi mandiri dari backend (tidak masalah, backend siap).

### Option B: Tetap link self-contained (ADR-0001)
**Pros:** FE mandiri. **Cons:** data pribadi di URL, tidak bisa revoke, dobel kontrak
dengan backend yang kini punya endpoint sendiri → divergensi & utang. **Ditolak.**

## Trade-off Analysis

Pemicu utama pembalik keputusan: **backend sudah menyediakan endpoint token**. Semua
kelemahan yang membuat ADR-0001 memilih link self-contained (keamanan, revocation,
validasi) kini bisa dihindari tanpa biaya pemblokir rilis. Mempertahankan `?fix=` berarti
FE memelihara mekanisme paralel yang tidak dipakai backend → utang murni.

Catatan `buildFixUrl` yang salah (`/?fix=` kena redirect `/`→`/register`) jadi **tidak
relevan** karena mekanismenya dibuang.

## Consequences

**Lebih mudah:**
- Kontrak FE = kontrak backend nyata (Postman), tidak ada payload URL untuk dijaga.
- Data pribadi tidak lagi bocor via URL; link bisa expire/di-revoke.
- Resend email tinggal panggil satu endpoint.

**Lebih sulit / utang tersisa:**
- FixDataPage harus ditulis ulang jadi token-based (pending desain user-side).
- **Param link email revise belum disepakati.** `?token=` sudah dipakai reset-password di
  `App.jsx`; perlu param berbeda (mis. `?revise=<jwt>`) — koordinasi FE ↔ backend.
- Konfirmasi angka `verifiedStatus` (REVISE=2, WAITING=?) ke backend.

**Perlu ditinjau ulang:**
- Setelah user-side migrasi: hapus `fixLink.js` encode/`buildFixUrl`, `decodeFixPayload`
  di `App.jsx`, dan `authApi.submitCorrection`.

## Action Items

1. [x] `api.js`: `adminApi.reviseUser`, `resendReviseEmail`; `authApi.getRevise`,
   `submitRevise`.
2. [x] `AdminDashboardPage.handleConfirmReject` → `reviseUser`; buang `buildFixUrl`.
3. [x] `FIELD_DEFS` selaras desain (+`lainnya`).
4. [x] Route revise disepakati: **`/register/revise?token=[JWT]`**. App.jsx deteksi
   `pathname.includes('/revise')` → `getRevise` → prefill. Relay ke backend (set config).
5. [x] `App.jsx` baca token revise + `getRevise` + loading/error; `FixDataPage.doSubmit`
   pakai `submitRevise` bila `reviseToken` ada. `normalizeRevise` diselaraskan ke respons
   asli: `reviseReason`/`reviseFields` top-level, `birthdate` object → `.date`, tahun/bulan
   dari `lastTrainingSession.startDate`. Respons TIDAK punya provinsi → boot fetch detail
   region untuk `parentId` agar cascade lokasi prefill. Visual form final ikut desain user-side.
6. [x] List verifikasi pakai `filter[verifiedStatus]=waiting` (guide backend).
7. [ ] Setelah user-side migrasi: hapus `fixLink.js` payload helpers + `submitCorrection`.

## Lihat Juga

- [FIX_DATA_FLOW.md](../FIX_DATA_FLOW.md) — alur end-to-end (perlu update sisi user).
- [ADR-0001](0001-fix-data-flow.md) — keputusan lama (superseded).
