# Flow: Riwayat Pelatihan & Pendaftaran Trainer (Admin Dashboard)

Dua alur admin di `AdminDashboardPage.jsx`. Sumber kode di catatan tiap langkah.

---

## Flow 1 — Tambah Riwayat Pelatihan

**Menu:** Riwayat Pelatihan. **Modal:** `AddPelatihanModal.jsx`. **Handler:** `handleAddPelatihan` (POST training-sessions + opsional import CSV peserta).

```mermaid
flowchart TD
    A[Admin klik 'Tambah Pelatihan Baru'] --> B[AddPelatihanModal buka]
    B --> C[Load provinsi: regionsApi.list]
    C --> D[Isi Nama Pelatihan]
    D --> E[Pilih Provinsi]
    E --> F[Load Kab/Kota: regionsApi.list REGENCY]
    F --> G[Pilih Kab/Kota]
    G --> H[Pilih rentang tanggal mulai & berakhir]
    H --> I{Upload CSV peserta?<br/>opsional}
    I -->|ya| J{Format .csv?}
    J -->|tidak| J1[Toast: format tidak didukung] --> I
    J -->|ya| K[File dipasang]
    I -->|tidak| L[Submit]
    K --> L[Submit]
    L --> M{Validasi:<br/>nama + daerah + tanggal}
    M -->|gagal| M1[Tampil error di modal] --> D
    M -->|lolos| N[onSave → tutup modal<br/>row optimistic status=Processing]
    N --> O[POST /admin/training-sessions<br/>adminApi.createTrainingSession]
    O -->|gagal| O1[row status=Error + apiError]
    O -->|sukses| P[Dapat sessionId → update id row]
    P --> Q{Ada CSV peserta?}
    Q -->|tidak| T[row status=Saved + toast]
    Q -->|ya| R[upload → waitJob → push → waitJob<br/>trainingHistoriesApi + queueApi]
    R -->|gagal| S[pesertaWarn<br/>session tetap dibuat]
    R -->|sukses| T
    S --> T
```

**Catatan:**
- Import peserta jalan **setelah** session sukses dibuat. Kalau import gagal, session **tetap** `Saved`, cuma ada warning di toast.
- Baris tabel optimistic: `Processing` (in-flight) → `Saved` / `Error`.
- Row invalid/duplikat di CSV di-skip oleh backend queue.

---

## Flow 2 — Tambah Pendaftaran Trainer (Admin + Moderator Discourse)

**Menu:** Pendaftaran Trainer. **Modal:** `AddPendaftaranTrainerModal.jsx`. **Handler:** `handleAddPendaftaran` → simpan ke app-config (`PENDAFTARAN_KEY = hero_banner-home-v2`), **bukan** training-sessions. Efeknya = banner pendaftaran di halaman komunitas (GA News).

```mermaid
flowchart TD
    subgraph DIS[Sisi Moderator Discourse]
        M1[Moderator buat topik pendaftaran<br/>di forum komunitas Discourse]
        M2[Dapat URL topik<br/>.../t/slug/143]
        M1 --> M2
    end

    subgraph ADM[Sisi Admin Dashboard]
        A[Admin klik 'Tambah' di Pendaftaran Trainer] --> B[AddPendaftaranTrainerModal buka]
        B --> C[Isi: Nama Pelatihan,<br/>Tautan Topik URL,<br/>Rentang Waktu, Batas Waktu]
        C --> D[Simpan → onSave]
        D --> E{parseThreadId url valid?}
        E -->|tidak| E1[apiError: tautan tidak valid<br/>STOP]
        E -->|ya| F[Bikin newRow: threadId, headerText,<br/>isActive=false, dedup threadId]
        F --> G[persistPendaftaran<br/>appConfigApi.set hero_banner-home-v2]
        G -->|gagal| G1[revert + apiError]
        G -->|sukses| H[Toast berhasil<br/>baris muncul di tabel]
        H --> I[Admin toggle status AKTIF]
        I --> J{Batas waktu sudah lewat?}
        J -->|ya| J1[apiError: perbarui batas waktu]
        J -->|tidak| K[Hanya 1 pelatihan aktif<br/>sisanya di-nonaktifkan → persist]
    end

    M2 -.URL disalin ke modal.-> C
    K --> N[Banner pendaftaran tampil<br/>di Komunitas / GA News]

    subgraph GURU[Sisi Guru / Trainer]
        N --> O[Guru klik 'Daftar' di banner]
        O --> P[Diarahkan ke topik Discourse]
        P --> Q[Daftar / reply di forum<br/>dikelola moderator Discourse]
    end
```

**Catatan:**
- Data tab ini disimpan sebagai JSON app-config (`hero_banner-home-v2`), **bukan** entity training-sessions.
- **Hanya 1** pendaftaran boleh `isActive` sekaligus.
- Auto-off: interval 30 detik cek `autoOffExpired` — baris yang batas waktunya lewat otomatis `isActive=false`.
- `parseThreadId` ambil id topik dari URL (`.../t/slug/143` → `143`); wajib valid, kalau tidak submit ditolak.
- Hapus = buang entry dari rows lalu tulis balik JSON tanpa entry itu (bukan DELETE endpoint).
