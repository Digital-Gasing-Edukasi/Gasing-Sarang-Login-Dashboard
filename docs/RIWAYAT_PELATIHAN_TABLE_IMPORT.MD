Bahan Diskusi 28 Juli 2026 :
Riwayat Pelatihan, menambahkan peserta pelatihan:

1. langganan aktif = ter-regeister dan sudah berlangganan.
2. langganan non member = tidak terregister / tidak berlangganan sama sekali.
lihat peserta : semua akun yang dimasukan dalam bentuk csv di masukan.
FLOW : Add user -> register ke riwayat pelatihan -> masukin semua data user.

Konfirmasi pembayaran : dapet apa yang di upload mas risky saat di dashboard, udah ada blm (nama pengirim, nama bank, tanggal transfer) ? 

Mention Email Notifikasi Lagi Ke Mas risky.
Max MB buat Gambar yang di upload berapa mb?
Change Email Lewat Admin gak bisa di rubah, harus lewat Email Verifikasi (ini cuman ada di dev)

```mermaid
flowchart TD
    A[Admin buka tab Riwayat Pelatihan] --> B{Pintu masuk?}
    B -->|Tambah Pelatihan Baru| C[AddPelatihanModal]
    B -->|Edit row klik pensil| D[PerbaruiRiwayatModal]

    C --> E[Isi nama, daerah, tanggal]
    E --> F[Drop/pilih file .CSV peserta<br/>kolom: email — opsional]
    D --> F

    F --> G{Validasi file .csv?}
    G -->|bukan .csv| H[Toast: format tidak didukung] --> F
    G -->|ok| I[Klik Simpan / Tambah]

    I --> J{Field wajib valid?<br/>nama + daerah + tanggal}
    J -->|kosong| K[Error merah di modal] --> I
    J -->|valid| L[onSave data + pesertaFile<br/>modal ditutup]

    L --> M[Row optimistic: status Processing]
    M --> N{Mode?}
    N -->|Tambah| O[POST /admin/training-sessions<br/>createTrainingSession → sessionId]
    N -->|Edit| P[PATCH /admin/training-sessions/:id]

    O --> Q{Ada pesertaFile?}
    P --> Q
    Q -->|tidak| Z[Row status: Saved + toast sukses]

    Q -->|ya| R[POST /admin/training-histories/imports<br/>upload CSV + trainingSessionId → importId, trackId]
    R --> S[queueApi.waitJob trackId — validasi]
    S --> T[POST imports/:importId/push → trackId]
    T --> U[queueApi.waitJob trackId — commit]
    U --> V{Import sukses?}
    V -->|gagal| W[Row tetap Saved<br/>toast + peringatan import gagal]
    V -->|sukses| Z

    O -.->|create gagal| X[Row status: Error + apiError]

    Z --> Y[Klik Nama Peserta → DaftarPesertaModal]
    Y --> AA[Tampilkan SEMUA akun dari CSV<br/>1 email = 1 baris, tanpa skip]
    AA --> AB{Cek tiap akun}
    AB -->|terregister & berlangganan| AC[Badge: Langganan Aktif hijau]
    AB -->|tidak terregister / tidak berlangganan| AD[Badge: Non Member abu]
```

toast pada copy nomor rekening saat di page transfer.

Dashboard
Riwayat pelatihan
-nama pelatihan, daerah pelatihan & email harusnya panjang boxnya (width di lebarin di Riwayat pelatihan) (Desain Udah ada)

verifikasi pembayaran
-di menunggu verifikasi -> tambahin timer & submitted (last verified apus) last verified => di kolom verifikasi akun pending voucher, jadi Last Update.
-tambahin 1 filter/tabel (Desain Udah Ada) (done)
tambah table (Sub Menu) di verifikasi pembayaran (done)

manajemen akun
-button hapus akun harusnya lebar
-di laman upload bukti pembayaran, tambahin max mb buat image bukti pembayaran
-blm ada toast di upload bukti pembayaran -> upload Berhasil, upload image di hapus.

Table : 
scrool nya di luar semua (kaya browser) -> Tambah Reference di desain. (DUMMY )