# 🚀 Panduan Deploy Staging — Gasing Circle Auth App

> **Target:** `https://dev-komunitas.gasingacademy.org`  
> **Tipe Deploy:** React SPA ke GCE VM via Nginx  
> **Estimasi Waktu:** 30–60 menit

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
cd "d:\Gasing Circle\Login page"
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
VITE_WA_NUMBER=6287788000305
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
scp -r "d:\Gasing Circle\Login page\dist\*" <USERNAME>@<IP_SERVER>:/tmp/gasing-upload/
```

Contoh:
```powershell
scp -r "d:\Gasing Circle\Login page\dist\*" user@34.101.xxx.xxx:/tmp/gasing-upload/
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

```bash
sudo mkdir -p /var/www/gasing-auth
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
# Harus terlihat: index.html dan folder assets/

cat /var/www/gasing-auth/index.html | head -5
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

Salin-tempel teks di bawah ini ke dalam editor `nano`:

```nginx
server {
    listen 80;
    server_name <IP_SERVER_ATAU_DOMAIN>;

    # Folder tempat file React disimpan
    root /var/www/gasing-auth;
    index index.html;

    # WAJIB untuk React SPA: semua request diarahkan ke index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache untuk asset statis (opsional tapi bagus untuk performa)
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

> Ganti `<IP_SERVER_ATAU_DOMAIN>` dengan IP server GCE atau domain yang digunakan.

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

Kamu seharusnya melihat **halaman Login Gasing Circle**.

### 6.2 Test navigasi

- Coba klik "Daftar" → seharusnya berpindah ke halaman Register
- Coba klik "Lupa Password" → seharusnya berpindah ke halaman Forgot Password
- Pastikan halaman tidak menampilkan error 404

### 6.3 Cek API terhubung

Coba login dengan akun yang ada. Jika muncul error koneksi (bukan error "password salah"), kemungkinan `VITE_API_URL` salah — ulangi dari Fase 1.

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
scp -r "d:\Gasing Circle\Login page\dist\*" <USER>@<IP>:/tmp/gasing-upload/

# 3. Di server — hapus yang lama, copy yang baru
sudo rm -rf /var/www/gasing-auth/*
sudo cp -r /tmp/gasing-upload/* /var/www/gasing-auth/
sudo chown -R www-data:www-data /var/www/gasing-auth

# 4. Tidak perlu restart Nginx
```

---

## 📞 Jika Butuh Bantuan

Jika ada langkah yang gagal, screenshot/copy:
1. Pesan error yang muncul
2. Output dari perintah `sudo nginx -t`
3. Output dari `sudo systemctl status nginx`

Dan bagikan ke sini untuk dianalisis lebih lanjut.

---

*Dibuat: 5 Mei 2026 — Gasing Circle Staging Deployment*
