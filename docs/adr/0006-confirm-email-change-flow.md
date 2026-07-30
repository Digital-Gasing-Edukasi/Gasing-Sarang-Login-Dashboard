# ADR-0006: Konfirmasi Ubah Email via Token (noAuth) dari Link Email

**Status:** Accepted
**Date:** 2026-07-29
**Deciders:** Frontend lead (ery), backend team
**Terkait:** [ADR-0003](0003-revise-token-flow.md) (pola link-email token), [RESET_PASSWORD_ROUTING.md](../RESET_PASSWORD_ROUTING.md)

## Context

User yang mengganti alamat email menerima **email konfirmasi** berisi link:

```
STAGING     {baseurl}/register/confirm-email-change?token=xxxx
PRODUCTION  {baseurl}/confirm-email-change?token=xxxx
```

Membuka link harus mengonfirmasi perubahan ke backend lewat `POST /profile/confirm-email`
dengan body `{ token }`. Tidak ada input dari user — halaman cukup menembak API saat mount
lalu menampilkan hasil (loading → sukses / gagal).

**Path beda per-env:** backend memakai prefix `/register/` di staging, tanpa prefix di
production. FE harus melayani keduanya tanpa dua build terpisah untuk logika routing.

Tiga hal perlu diputuskan:

1. **Mode auth request.** `profileApi.confirmEmailChange` semula mengirim **Bearer**
   (access token akun login). Tapi link dibuka dari email — bisa di browser/perangkat yang
   **tidak punya sesi login**. Kalau tetap butuh Bearer, konfirmasi gagal di perangkat lain.
2. **Penempatan branch route.** Path `…/confirm-email-change?token=` membawa `?token=`, sama
   seperti reset-password. Boot sequence `App.jsx` punya cek `?token=` **generik** yang
   melempar ke `/login/reset-password`. Kalau confirm-email diproses setelah cek generik itu,
   link-nya ke-hijack ke reset-password (regresi yang sama persis dgn bug lama di
   [RESET_PASSWORD_ROUTING.md §4](../RESET_PASSWORD_ROUTING.md)).
3. **Cara melayani dua path per-env** tanpa mem-fork logika boot/route per build.

## Decision

1. **Auth = token di body, tanpa Bearer (`noAuth: true`).** Token URL itu sendiri yang jadi
   bukti otorisasi, konsisten dengan jalur link-email lain (`authApi.getRevise`,
   `authApi.resetPassword`). Link jalan di perangkat mana pun tanpa perlu login dulu.
2. **Branch `confirm-email-change` diproses SEBELUM cek `?token=` generik** di boot sequence
   `App.jsx`. Token dibaca sekali, disimpan ke state `confirmEmailToken`, lalu **dibuang dari
   URL** (`clearUrlParams`) supaya tidak bocor lewat history/log.
3. **Path per-env tanpa fork logika.** Boot sequence mencocokkan `pathname.endsWith(
   "/confirm-email-change")` (bukan `startsWith` prefix) → cocok untuk staging & production.
   `clearUrlParams()` tanpa argumen mempertahankan pathname aktif (env-aware, tanpa hardcode).
   Path kanonik `PAGE_PATHS["confirm-email-change"]` ikut `isProduction()` (`lib/env.js`).
   Kedua `<Route>` (`/register/confirm-email-change` & `/confirm-email-change`) didaftarkan.
4. Halaman `ConfirmEmailChangePage` menembak `profileApi.confirmEmailChange(token)` **saat
   mount** (guard `useRef` untuk StrictMode double-invoke — token one-time). Sukses →
   auto-redirect ke `/login` dalam 10 detik (plus tombol manual).

## Options Considered

### Opsi A: Token di body, `noAuth` (DIPILIH)
| Dimension | Assessment |
|-----------|------------|
| Complexity | Low |
| Keandalan | Tinggi — jalan tanpa sesi login, di perangkat mana pun |
| Konsistensi | Selaras pola revise/reset (link-email token) |
| Ketergantungan | Backend harus terima auth via `token` body (bukan Bearer) |

**Pros:** link andal lintas-perangkat; satu pola dengan jalur email lain; URL opak + dibuang.
**Cons:** bergantung kontrak backend yang mengizinkan `token`-only. **Perlu konfirmasi BE.**

### Opsi B: Tetap kirim Bearer
**Pros:** tanpa ubah `api.js`. **Cons:** gagal saat link dibuka tanpa sesi (device lain,
browser beda) — kasus paling umum untuk link email. **Ditolak.**

## Trade-off Analysis

Kasus pemakaian dominan link email = dibuka di perangkat/browser **tanpa sesi**. Opsi B
membuat fitur gagal justru di jalur utamanya. Opsi A menghapus ketergantungan sesi dengan
biaya satu asumsi kontrak backend (`token`-only) yang **sudah jadi pola** di revise & reset —
jadi bukan mekanisme baru untuk dijaga.

## Consequences

**Lebih mudah:**
- Link konfirmasi jalan tanpa login; UX seragam dengan reset-password.
- Token tidak bocor lewat URL (dibuang setelah dibaca).

**Perlu dijaga:**
- **Urutan branch di boot sequence.** `confirm-email-change` WAJIB sebelum cek `?token=`
  generik. Setiap route baru ber-`?token=` harus ikut aturan urutan ini
  ([RESET_PASSWORD_ROUTING.md §4](../RESET_PASSWORD_ROUTING.md)).
- **Sinkron path per-env dengan backend.** Kalau BE mengubah prefix (mis. staging ikut
  drop `/register/`), sesuaikan `CONFIRM_EMAIL_CHANGE_PATH` di `routes.js`. Match `endsWith`
  di boot tetap aman selama segmen akhir `/confirm-email-change` dipertahankan.
- **Kontrak backend.** BE `POST /profile/confirm-email` harus mengotorisasi via `token` body,
  bukan Bearer. Konfirmasi ke tim backend.

## Action Items

1. [x] `api.js`: `profileApi.confirmEmailChange` set `noAuth: true`.
2. [x] `routes.js`: `CONFIRM_EMAIL_CHANGE_PATH` per-env (`isProduction()` → `/…`, else `/register/…`).
3. [x] `App.jsx`: branch boot (`endsWith`, sebelum cek `?token=` generik) + dua `<Route>`.
4. [x] `pages/auth/ConfirmEmailChangePage.jsx`: fire-on-mount + status loading/success/error.
5. [ ] Konfirmasi backend: `POST /profile/confirm-email` menerima auth `token`-only (noAuth).

## Lihat Juga

- [CONFIRM_EMAIL_CHANGE.md](../CONFIRM_EMAIL_CHANGE.md) — alur & routing end-to-end.
- [ADR-0003](0003-revise-token-flow.md) — pola link-email token JWT one-time.
