# ADR-0004: Halaman Komunitas statis untuk guest (fake login)

**Status:** Accepted
**Date:** 2026-07-17
**Deciders:** Ery (owner), FE Login-Dashboard

## Context

Permintaan baru:

1. **Guest access** — user bisa masuk tanpa login (tidak auth), hanya
   menampilkan halaman statis.
2. **Mobile-first** — versi mobile diprioritaskan; desktop menyusul (`lg:`).
3. **Replika Komunitas** — halaman persis seperti app `Komonitas`
   (`app/komunitas/page.tsx`: Hero + Trending + Latest + Panduan + Challenge),
   tapi dibuat **statis** di dalam app `Login-Dashboard`.
4. **Fake login** — seakan login beneran walau palsu; konten pure statis.

Kendala stack (dua app beda total):

| Aspek | Komonitas (sumber) | Login-Dashboard (target) |
|-------|--------------------|--------------------------|
| Framework | Next.js 16 (App Router, RSC) | Vite + React 18 SPA |
| React | 19.2 | 18.2 |
| Tailwind | v4 | v3 |
| Routing | file-based `app/` | react-router-dom v6 |
| Data | react-query → Discourse API | tidak ada (harus statis) |
| UI kit | shadcn penuh + `ui/sidebar`, `next-themes`, `vaul`, `sonner` | radix subset kecil |

Artinya "copy folder" tidak mungkin — komponen Komonitas bergantung ke
`"use client"`, `next/link`, `next/navigation`, `useTrendingKomunitasQuery`,
`next/font`, dan sidebar shadcn yang tidak ada di target. Port = **tulis ulang**,
bukan salin.

Gate boot LD saat ini (`App.jsx` + `lib/routes.js`): route app butuh token, kalau
tidak → `/login`. Sudah ada mekanisme `isPublicStaticPath()` (prefix publik yang
skip cek sesi) — ini titik sisip yang tepat untuk guest.

## Decision

1. **Port sebagai komponen native LD** (React 18 / TW3 / plain JS), data
   **hardcoded statis**. Tolak iframe dan salin-verbatim.
2. **Route publik `/komunitas`** ditambah ke `PUBLIC_PREFIXES` supaya boot
   melewati cek sesi → guest bisa buka tanpa token.
3. **Fake login**: tombol/entry point men-set `currentUser` palsu di memori
   (tanpa token, tanpa panggil `authApi`) lalu `navigate("/komunitas")`. Karena
   route sudah publik, tak ada `requireAuth`.
4. **Mobile-first**: layout mobile jadi baseline; bottom-nav meniru
   `mobile-nav.tsx`; desktop di-gate `lg:`.

## Options Considered

### Option A: Tulis ulang native LD + data statis (DIPILIH)

| Dimension | Assessment |
|-----------|------------|
| Complexity | Med — port ~6 komponen + shell mobile |
| Cost | Sekali kerja, nol dependency baru |
| Scalability | Tinggi — 1 codebase, konsisten TW3 |
| Team familiarity | Tinggi — sama seperti pola page LD lain |

**Pros:** nol dep baru; bundle kecil; konsisten pola LD (react-router + `onNavigate`
shim); benar-benar statis (aman untuk guest, tak ada call backend). Konten `Panduan`
di Komonitas sudah statis (`_constants/panduan.ts`) → tinggal pindah.
**Cons:** perlu tulis ulang markup; data topik Trending/Latest harus dibuat dummy;
styling TW4→TW3 (arbitrary values `bg-[#F1F2F7]` jalan di dua-duanya, tapi util TW4
seperti `size-*` perlu dicek).

### Option B: Embed Komonitas via iframe

| Dimension | Assessment |
|-----------|------------|
| Complexity | Low awal, High operasional |
| Cost | Perlu Komonitas ter-deploy & dijaga hidup |
| Scalability | Rendah |
| Team familiarity | Med |

**Pros:** markup persis tanpa port. **Cons:** bukan "statis" (butuh app Next hidup +
Discourse API); guest jadi bergantung backend; styling/route/mobile-nav LD tak
nyambung; auth/CORS ribet. **Tolak** — lawan tujuan "pure statis".

### Option C: Salin komponen Komonitas verbatim ke LD

| Dimension | Assessment |
|-----------|------------|
| Complexity | High |
| Cost | Tarik react-query, sidebar shadcn, next-themes, vaul, sonner, next/* |
| Scalability | Rendah — dua sistem TW bentrok |
| Team familiarity | Rendah |

**Pros:** copy-paste awal cepat. **Cons:** `next/link`/`next/navigation`/`next/font`
tak ada di Vite; butuh shim besar; TW4↔TW3 config bentrok; bundle bengkak. **Tolak.**

## Trade-off Analysis

Sumbu utama = **statis & mandiri** vs **mirip persis tanpa kerja**. Permintaan
eksplisit "pure statis / fake login" mematikan B dan C (dua-duanya menyeret runtime
Next/Discourse). A bayar di depan (tulis ulang markup) tapi menghasilkan halaman
guest yang benar-benar tanpa backend, mobile-first, dan hidup di satu codebase LD.
Data dummy dipisah ke satu file konstanta agar gampang diganti kalau nanti mau
sambung API beneran.

## Consequences

**Lebih mudah:** guest buka `/komunitas` tanpa token; nol dependency baru; page
konsisten dgn pola LD; aman (tak ada call backend dari guest).
**Lebih sulit:** markup Komonitas harus di-maintain manual di dua tempat kalau
desain berubah (drift risk); data Trending/Latest dummy, bukan real.
**Perlu ditinjau ulang:** kalau nanti guest perlu data nyata → ganti konstanta
dummy dengan fetch read-only; kalau desain mobile final dari user beda → sesuaikan
layout (user bilang "coba desain mobile nya nanti").

## Action Items

1. [ ] `src/lib/routes.js`: tambah `/komunitas` ke `PUBLIC_PREFIXES`; tambah key
       `komunitas: "/komunitas"` di `PAGE_PATHS`.
2. [ ] `src/App.jsx`: daftar `<Route path="/komunitas" .../>` (+ subpath bila perlu)
       tanpa `requireAuth`; guest boot lewat `isPublicStaticPath`.
3. [ ] Fake login: entry point (tombol "Masuk sebagai Tamu" / submit login palsu)
       set `currentUser` dummy + `navigate("/komunitas")`, tanpa `authApi`/token.
4. [ ] `src/pages/komunitas/` — port komponen: `KomunitasPage`, `Hero`, `Trending`,
       `Latest`, `Panduan` (+drawer mobile), `Challenge`. React18/TW3/plain.
5. [ ] `src/pages/komunitas/data.js` — data statis dummy (topik trending/terbaru,
       panduan dari `Komonitas/app/komunitas/_constants/panduan.ts`).
6. [ ] Shell mobile: bottom-nav ala `mobile-nav.tsx` (versi statis, tanpa
       Discourse query), mobile-first + `lg:` desktop.
7. [ ] Verifikasi di preview (mobile viewport). Catatan: kalau port 5173 kepake,
       skip preview, user cek sendiri.
8. [ ] Tunggu desain mobile final dari user sebelum finalisasi layout.

## Resolved Decisions (input user, 2026-07-17)

- **Fake login:** tombol **"Masuk sebagai Tamu"** terpisah di `LoginPage` →
  langsung `/komunitas`, tanpa isi form.
- **Scope:** **Landing + subpath** — `/komunitas` (landing), `/komunitas/trending`,
  `/komunitas/latest`, `/komunitas/forum/:slug` (detail). Semua statis.
- **Desain mobile:** **pakai layout Komonitas apa adanya**, mobile-first.
