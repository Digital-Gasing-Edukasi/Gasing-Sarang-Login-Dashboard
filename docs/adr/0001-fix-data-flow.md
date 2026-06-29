# ADR-0001: Mekanisme Perbaikan Data untuk Akun yang Ditolak

**Status:** Accepted
**Date:** 2026-06-29
**Deciders:** Frontend lead (ery), backend team (sign-off pending)

## Context

Akun yang ditolak admin sebelumnya tidak punya jalur untuk memperbaiki data yang
salah — admin hanya menulis alasan teks bebas dan user mentok. Dibutuhkan alur:
admin menandai data salah → user dapat email + link → user memperbaiki data lewat
form yang sudah terisi → kirim ulang.

Repo ini **frontend-only** (React + Vite, `gasing-auth`). Pengiriman email dan
penyimpanan data adalah domain backend. Backend untuk fitur ini **belum siap**
saat implementasi dimulai, sehingga FE harus bisa berdiri sendiri dan kontrak
backend ditandai sebagai TODO.

Kendala & gaya forces:
- Backend belum ada → FE tidak boleh bergantung pada endpoint baru untuk prefill.
- Tim FE kecil, ingin minim duplikasi & cepat rilis.
- Link akan dikirim via email → harus self-contained agar bisa dites tanpa backend.
- Data sensitif (nama, email, tanggal lahir) ikut di link.

## Decision

Tiga keputusan inti:

1. **Link prefill self-contained, di-encode pada URL** (`?fix=<base64url(JSON)>`),
   bukan token yang di-lookup ke backend.
2. **Halaman terpisah `FixDataPage`**, bukan menambah "fix mode" ke `SignUpPage`.
3. **Alasan penolakan terstruktur (checklist field)**, menggantikan alasan teks
   bebas pada `RejectModal`.

Registry field tunggal (`FIELD_DEFS` di `src/lib/fixLink.js`) menjadi sumber
kebenaran bersama untuk checklist admin dan bubble error user.

## Options Considered

### Keputusan 1 — Mekanisme link prefill

#### Option A: Encode data di URL (DIPILIH)
| Dimension | Assessment |
|-----------|------------|
| Complexity | Low |
| Cost | Rendah — tanpa endpoint baru |
| Scalability | Cukup; ukuran URL bertambah seiring jumlah field |
| Team familiarity | Tinggi |

**Pros:** FE mandiri, bisa dites tanpa backend, tanpa state server.
**Cons:** Data sensitif terlihat di URL (bisa ke-log/ke-share); payload tidak
bisa di-revoke; tidak ada validasi server saat link dibuka.

#### Option B: Token + lookup backend
| Dimension | Assessment |
|-----------|------------|
| Complexity | High |
| Cost | Butuh endpoint `GET /correction/:token` + storage |
| Scalability | Baik |
| Team familiarity | Tinggi |

**Pros:** URL pendek & opak, link bisa expire/di-revoke, data tidak terekspos.
**Cons:** Bergantung penuh pada backend yang belum siap → memblokir rilis FE.

### Keputusan 2 — Halaman perbaikan

#### Option A: `FixDataPage` baru (DIPILIH)
**Pros:** Alur bersih dan terpisah, tidak menambah kompleksitas/percabangan pada
`SignUpPage` (yang sudah punya 2 step + OTP). Mudah dipahami.
**Cons:** Duplikasi field form & helper (`asList`, `sessionDate`, dropdown lokasi).

#### Option B: Reuse `SignUpPage` + prop `fixMode`
**Pros:** Border merah + bubble jadi reusable, tidak ada duplikasi field.
**Cons:** `SignUpPage` membengkak dengan percabangan (prefill, fieldErrors, submit
ke endpoint berbeda, lewati OTP/step). Risiko regresi pada alur signup utama.

### Keputusan 3 — Bentuk alasan penolakan

#### Option A: Checklist field terstruktur (DIPILIH)
**Pros:** Memetakan langsung ke field yang harus dibetulkan → bisa di-render jadi
border merah + bubble per field. Catatan opsional per field.
**Cons:** Mengubah signature `onConfirm` & body API.

#### Option B: Tetap teks bebas
**Pros:** Tanpa perubahan API.
**Cons:** Tidak bisa dipetakan ke field tertentu secara otomatis; UX perbaikan
jadi tebak-tebakan.

## Trade-off Analysis

Pendorong utama keputusan adalah **backend belum siap + kebutuhan rilis FE
mandiri**. Option B pada keputusan 1 (token lookup) secara keamanan lebih unggul,
tapi memblokir seluruh FE pada backend yang belum ada. Encode-di-URL menukar
keamanan/kemampuan-revoke demi kemandirian dan kecepatan.

Penting: kontrak `buildFixUrl`/`decodeFixPayload` dirancang sebagai satu titik
perubahan. Migrasi ke pendekatan token (Option B) nanti cukup mengganti isi
`fixLink.js` + cara `App.jsx` mengambil payload, tanpa menyentuh `FixDataPage`.

Untuk keputusan 2 & 3, kesederhanaan dan keterpetaan ke UI menang atas penghematan
duplikasi.

## Consequences

**Lebih mudah:**
- FE bisa rilis & dites tanpa menunggu backend.
- Menambah field cukup di `FIELD_DEFS`; checklist & bubble ikut otomatis.
- Migrasi ke token-based terisolasi di `fixLink.js`.

**Lebih sulit / utang:**
- Data pribadi terekspos di URL — perlu ditinjau ulang sebelum produksi.
- Link tidak bisa expire / di-revoke selama masih encode-di-URL.
- Duplikasi field form antara `SignUpPage` dan `FixDataPage` harus dijaga sinkron.

**Perlu ditinjau ulang:**
- Saat backend siap, evaluasi pindah ke token + lookup untuk keamanan & revocation.
- Prefill `raw` di `mapToVerifikasi` memakai nama field asumsi — verifikasi
  terhadap respons `GET /admin/users` asli.

## Action Items

1. [x] Implementasi `fixLink.js`, `FixDataPage`, checklist `RejectModal`, routing.
2. [ ] Backend: terima `rejectedFields` + `correctionUrl` di `verify`, kirim email.
3. [ ] Backend: sediakan `POST /auth/correct-data`.
4. [ ] Verifikasi nama field `raw` di `mapToVerifikasi` vs respons API asli.
5. [ ] Tinjau keamanan data-di-URL; pertimbangkan migrasi token-based untuk produksi.

## Lihat Juga

- Dokumentasi fitur: [FIX_DATA_FLOW.md](../FIX_DATA_FLOW.md)
