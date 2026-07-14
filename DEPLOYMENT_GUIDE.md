# 🚀 Panduan Deploy Staging — Sarang Gasing Auth App

> **Target:** `https://sarang.gasingacademy.org`  
> **Tipe Deploy:** React SPA (React Router, `base: '/'`) ke GCE VM via Nginx  
> **Estimasi Waktu:** 30–60 menit
>
> ⚠️ **Sejak v3.0.0:** app di-serve dari **root domain**, bukan `/register`. Nginx
> **wajib** SPA-fallback semua path ke `index.html` (Fase 5). Kalau server ini pernah
> dipasangi versi lama, ada langkah migrasi di Fase 4.1.

---

## ⚠️ Sebelum Mulai — Cek Daftar Ini

- [ ] Sudah punya akses SSH ke server GCE
- [ ] Sudah punya URL API Backend Staging dari tim Backend
- [ ] Komputer lokal sudah terinstall Node.js 18+ dan npm 9+
- [ ] Sudah terinstall Git (opsional, untuk versi kontrol)

---

## FASE 1 — Build di Komputer Lokal

### 1.1 Buka Terminal / PowerShell

Tekan `Win + R` → ketik `powershell` → Enter.

### 1.2 Masuk ke folder project

```powershell
cd D:\SarangGasing\Login-Dashboard
```

Verifikasi kamu di folder yang benar:

```powershell
ls
# Harus terlihat: package.json, vite.config.js, src/, dll.
```

### 1.3 Isi `.env.staging` dengan URL yang benar

Buka file `.env.staging` di VS Code:

```powershell
code .env.staging
```

Pastikan isinya seperti ini (ganti nilai yang ada tanda `← GANTI`):

```env
VITE_API_URL=https://URL-DARI-TIM-BACKEND     ← GANTI INI
VITE_DISCOURSE_URL=https://dev-komunitas.gasingacademy.org
VITE_CONTACT_ADMIN=admin@gasingacademy.org
VITE_MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxxxxxx  ← GANTI INI
```

Simpan file (`Ctrl + S`).

### 1.4 Jalankan Build Staging

```powershell
npm run build:staging
```

Tunggu proses selesai. Output yang diharapkan:

```
✓ built in X.XXs
dist/index.html              1.23 kB
dist/assets/index-xxxx.js   XXX kB
dist/assets/index-xxxx.css  XX kB
```

> ❌ Jika ada error merah, **BERHENTI** dan selesaikan error-nya dulu sebelum lanjut.

### 1.5 Verifikasi folder `dist/` terbentuk

```powershell
ls dist
# Harus terlihat: index.html dan folder assets/
```

---

## FASE 2 — Backup Server (WAJIB Sebelum Upload)

> 💡 **Kenapa perlu backup?** Jika terjadi kesalahan saat konfigurasi Nginx, kamu bisa rollback ke kondisi semula tanpa panik.

### 2.1 SSH masuk ke server

```bash
ssh <USERNAME>@<IP_SERVER_GCE>
```

Contoh: `ssh user@34.101.xxx.xxx`

### 2.2 Cek kondisi Nginx saat ini

```bash
# Cek apakah Nginx sudah jalan
sudo systemctl status nginx

# Lihat konfigurasi yang aktif saat ini
ls /etc/nginx/sites-enabled/
cat /etc/nginx/nginx.conf
```

Catat hasilnya — ini kondisi "awal" sebelum kamu ubah apapun.

### 2.3 Backup konfigurasi Nginx yang ada

```bash
# Buat folder backup dengan timestamp
sudo mkdir -p /backup/nginx-$(date +%Y%m%d_%H%M)

# Copy semua konfigurasi Nginx
sudo cp -r /etc/nginx/ /backup/nginx-$(date +%Y%m%d_%H%M)/

# Verifikasi backup berhasil
ls /backup/
```

### 2.4 Cek apakah ada folder web yang sudah ada

```bash
ls /var/www/
```

Jika ada folder yang perlu diproteksi (misal folder Discourse), **jangan hapus atau ubah folder tersebut**.

---

## FASE 3 — Upload File ke Server

### 3.1 Di komputer lokal — Buka terminal/PowerShell BARU

Jangan tutup SSH yang tadi, buka PowerShell baru.

### 3.2 Upload folder `dist/` ke server

```powershell
# Ganti <USERNAME> dan <IP_SERVER> dengan milikmu
scp -r "D:\SarangGasing\Login-Dashboard\dist\*" <USERNAME>@<IP_SERVER>:/tmp/gasing-upload/
```

Contoh:
```powershell
scp -r "D:\SarangGasing\Login-Dashboard\dist\*" user@34.101.xxx.xxx:/tmp/gasing-upload/
```

Tunggu hingga selesai. Akan ada progress upload per file.

> **Jika command `scp` tidak dikenal di PowerShell**, install [OpenSSH](https://learn.microsoft.com/en-us/windows-server/administration/openssh/openssh_install_firstuse) atau gunakan aplikasi **WinSCP** (GUI, lebih mudah).

### 3.3 Verifikasi file sudah terupload (kembali ke terminal SSH)

```bash
ls /tmp/gasing-upload/
# Harus terlihat: index.html dan folder assets/
```

---

## FASE 4 — Deploy File ke Direktori Web

### 4.1 Buat folder untuk aplikasi React

> ⚠️ **BERUBAH sejak v3.0.0.** App sekarang di-build dengan **`base: '/'`** (dulu
> `/register`), jadi file build ditaruh **langsung di root folder web** — bukan lagi
> di subfolder `register/`.

```bash
sudo mkdir -p /var/www/gasing-auth
```

**Kalau server ini pernah dipasangi versi lama** (file ada di `register/`), rapikan dulu:

```bash
sudo mv /var/www/gasing-auth/register/index.html \
        /var/www/gasing-auth/register/assets /var/www/gasing-auth/
sudo rm -rf /var/www/gasing-auth/register
```

### 4.2 Copy file ke folder web

```bash
sudo cp -r /tmp/gasing-upload/* /var/www/gasing-auth/
```

### 4.3 Set permission yang benar

```bash
sudo chown -R www-data:www-data /var/www/gasing-auth
sudo chmod -R 755 /var/www/gasing-auth
```

### 4.4 Verifikasi file ada di tempatnya

```bash
ls /var/www/gasing-auth/
# Harus terlihat: index.html dan folder assets/ (TIDAK ada folder register/)

head -5 /var/www/gasing-auth/index.html
# Harus tampil baris pertama HTML
```

---

## FASE 5 — Konfigurasi Nginx

> ⚠️ **Ini bagian paling kritis.** Ikuti dengan teliti.

### 5.1 Buat file konfigurasi baru

```bash
sudo nano /etc/nginx/sites-available/gasing-auth
```

### 5.2 Ketik konfigurasi berikut

Versi lengkap (dengan TLS) ada di [`deploy/nginx-gasing-auth.conf`](deploy/nginx-gasing-auth.conf) —
salin dari sana. Versi minimal HTTP untuk staging:

```nginx
server {
    listen 80;
    server_name <IP_SERVER_ATAU_DOMAIN>;

    # File build ada langsung di sini: index.html + assets/
    root /var/www/gasing-auth;
    index index.html;

    # Root → halaman login.
    location = / {
        return 301 /login;
    }

    # Asset ber-hash aman di-cache lama (nama file berubah tiap build).
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # SPA fallback — WAJIB. Path apa pun yang bukan file nyata → index.html,
    # biar react-router yang menentukan halaman.
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Diamkan 404 favicon.
    location = /favicon.ico { access_log off; log_not_found off; }
}
```

> Ganti `<IP_SERVER_ATAU_DOMAIN>` dengan IP server GCE atau domain yang digunakan.
>
> ⚠️ **Baris `try_files $uri $uri/ /index.html;` adalah nyawa deploy ini.** App memakai
> React Router (BrowserRouter) dengan URL nyata (`/login`, `/dashboard-admin`,
> `/login/reset-password`, …). Tanpa fallback itu, halaman depan jalan tapi **refresh atau
> deep-link ke path mana pun = 404 dari Nginx**, karena file `/dashboard-admin` memang tidak ada
> di disk.
>
> ❌ **JANGAN pakai `alias` + `try_files` bareng** (pola config lama era `base: '/register'`).
> `$uri` masih membawa prefix path, jadi Nginx nyari file di direktori yang salah → asset 404,
> JS di-serve sebagai `text/html` → browser block (*"MIME type text/html is not executable"*) →
> layar putih. Pakai `root` seperti di atas.

Simpan dan keluar dari nano:
- Tekan `Ctrl + X`
- Tekan `Y`
- Tekan `Enter`

### 5.3 Aktifkan konfigurasi

```bash
sudo ln -s /etc/nginx/sites-available/gasing-auth /etc/nginx/sites-enabled/
```

### 5.4 Test konfigurasi Nginx — JANGAN SKIP!

```bash
sudo nginx -t
```

Output yang **benar**:
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

> ❌ Jika ada baris `[error]` atau `[warn]`, **BERHENTI**. Lanjut ke bagian **Rollback** di bawah.

### 5.5 Restart Nginx

```bash
sudo systemctl restart nginx
sudo systemctl status nginx
```

Pastikan statusnya `active (running)` berwarna hijau.

---

## FASE 6 — Verifikasi Hasil Deploy

### 6.1 Dari browser di komputer lokal

Buka browser dan akses:
```
http://<IP_SERVER_GCE>/
```

Harus otomatis redirect ke `/login` dan menampilkan **halaman Login Sarang Gasing**.

### 6.2 Test navigasi

- Klik "Daftar" → pindah ke `/register`
- Klik "Lupa Password" → pindah ke `/login/forgot-password`
- Pastikan tidak ada error 404

### 6.3 Test SPA fallback — JANGAN SKIP

Ini yang paling sering bocor. Buka **langsung** (ketik di address bar, atau tekan F5 di halaman itu):

| URL | Hasil benar | Kalau 404 |
| --- | --- | --- |
| `/login/forgot-password` | Halaman Lupa Password | `try_files` belum jalan → cek Fase 5.2 |
| `/dashboard-admin` | Redirect ke `/login` (belum ada sesi) | idem |
| `/register/id/TOS` | Halaman Syarat & Ketentuan | idem |

Kalau salah satu memberi **404 Nginx** (bukan halaman app), `location / { try_files … }` belum benar.

### 6.4 Cek asset ter-load

Buka DevTools → tab Network → refresh. File di `/assets/*.js` harus **200** dengan
`Content-Type: application/javascript`. Kalau `text/html` → config Nginx salah (lihat peringatan
`alias` di Fase 5.2).

### 6.5 Cek API terhubung

Coba login dengan akun yang ada. Jika muncul error koneksi (bukan error "password salah"),
kemungkinan `VITE_API_URL` salah — ulangi dari Fase 1.

---

## 🔄 Cara Rollback (Jika Ada Masalah)

### Skenario A — Nginx error setelah restart

```bash
# Kembalikan konfigurasi dari backup
sudo cp -r /backup/nginx-<TANGGAL_BACKUP>/nginx/ /etc/

# Test ulang
sudo nginx -t

# Restart
sudo systemctl restart nginx
```

### Skenario B — Halaman tampil tapi ada error

```bash
# Hapus file yang baru diupload
sudo rm -rf /var/www/gasing-auth/*

# Restore dari backup jika ada folder lama
# (jika tidak ada folder lama, server kembali ke kondisi sebelumnya)

# Nonaktifkan konfigurasi baru
sudo rm /etc/nginx/sites-enabled/gasing-auth
sudo systemctl restart nginx
```

### Skenario C — Rollback total ke kondisi awal

```bash
# Restore SEMUA konfigurasi Nginx dari backup
sudo systemctl stop nginx
sudo cp -r /backup/nginx-<TANGGAL_BACKUP>/nginx/* /etc/nginx/
sudo systemctl start nginx
sudo systemctl status nginx
```

---

## 🔁 Cara Update (Jika Ada Perubahan Kode)

Untuk update berikutnya, kamu hanya perlu mengulang **Fase 1 + 3 + 4**:

```bash
# 1. Build ulang di lokal
npm run build:staging

# 2. Upload dist/ yang baru
scp -r "D:\SarangGasing\Login-Dashboard\dist\*" <USER>@<IP>:/tmp/gasing-upload/

# 3. Di server — hapus yang lama, copy yang baru (langsung ke root, bukan subfolder)
sudo rm -rf /var/www/gasing-auth/*
sudo cp -r /tmp/gasing-upload/* /var/www/gasing-auth/
sudo chown -R www-data:www-data /var/www/gasing-auth

# 4. Tidak perlu restart Nginx (kecuali config-nya yang berubah:
#    sudo nginx -t && sudo systemctl reload nginx)
```

---

## 📞 Jika Butuh Bantuan

Jika ada langkah yang gagal, screenshot/copy:
1. Pesan error yang muncul
2. Output dari perintah `sudo nginx -t`
3. Output dari `sudo systemctl status nginx`

Dan bagikan ke sini untuk dianalisis lebih lanjut.

---

*Dibuat: 11 Mei 2026 · Diperbarui: 15 Juli 2026 (migrasi `base: '/'` + SPA fallback) — Sarang Gasing Staging Deployment*
