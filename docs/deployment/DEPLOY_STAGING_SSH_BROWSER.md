# 🚀 Deploy Staging via GCP SSH-in-Browser (Upload ZIP)

> Cara deploy **gasing-auth** ke VM staging **tanpa `scp`** — cukup upload `dist.zip`
> lewat tombol **UPLOAD FILE** di terminal SSH-in-browser Google Cloud, lalu unzip
> di server.
>
> Alur ini yang dipakai di screenshot deploy terakhir. Untuk metode `scp` + setup
> Nginx dari nol, lihat [`docs/deployment/DEPLOYMENT_GUIDE.md`](DEPLOYMENT_GUIDE.md).

| Item | Nilai |
| --- | --- |
| VM | `dev-sarang-gasing-clone` |
| Project / Zone | `sarang-gasing` / `asia-southeast2-a` |
| SSH user | `aisacredoctagon` |
| Web root | `/var/www/gasing-auth` |
| Staging dir | `/tmp/gasing-upload` |

---

## Prasyarat (sekali saja)

- Nginx sudah dikonfigurasi menunjuk `root /var/www/gasing-auth` + SPA fallback
  (lihat Fase 5 di `docs/deployment/DEPLOYMENT_GUIDE.md`). Deploy ulang **tidak** menyentuh Nginx.
- `unzip` terpasang di server: `sudo apt-get install -y unzip`
- Punya akses ke VM di GCP Console.

---

## FASE 1 — Build + ZIP di Komputer Lokal

```powershell
cd D:\SarangGasing\Login-Dashboard

# pastikan .env.staging benar (VITE_API_URL dari tim Backend, dll.)
npm run build:staging
```

Cek `dist/` terbentuk (ada `index.html` + `assets/`):

```powershell
ls dist
```

Kompres folder `dist` jadi `dist.zip` (folder `dist/` ikut jadi root di dalam zip —
ini penting, perintah copy di Fase 3 mengandalkan itu):

```powershell
Compress-Archive -Path dist -DestinationPath dist.zip -Force
```

> Hasil: `dist.zip` berisi `dist/index.html`, `dist/assets/...`

---

## FASE 2 — Upload ZIP ke Server

1. Buka **GCP Console → Compute Engine → VM instances**.
2. Baris VM `dev-sarang-gasing-clone` → klik tombol **SSH** (buka terminal SSH-in-browser).
3. Di jendela SSH, pojok kanan atas klik **⚙ / UPLOAD FILE**.
4. Pilih `D:\SarangGasing\Login-Dashboard\dist.zip`.
5. Tunggu notif **"Transferred 1 item — dist.zip"**. File mendarat di `~/dist.zip`
   (`/home/aisacredoctagon/dist.zip`).

---

## FASE 3 — Deploy di Server

Jalankan berurutan di terminal SSH. Ini persis urutan pada deploy terakhir:

```bash
# 1. Bersihkan sisa deploy sebelumnya
sudo rm -rf /tmp/gasing-upload/
sudo rm -rf /var/www/gasing-auth/
sudo mkdir /var/www/gasing-auth/

# 2. Ekstrak zip ke folder staging
sudo unzip -o ~/dist.zip -d /tmp/gasing-upload/

# 3. Salin isi build ke web root (perhatikan .../dist/* karena zip punya folder dist/)
sudo cp -r /tmp/gasing-upload/dist/* /var/www/gasing-auth/

# 4. Set kepemilikan + permission
sudo chown -R www-data:www-data /var/www/gasing-auth
sudo chmod -R 755 /var/www/gasing-auth
```

> `unzip -o` = overwrite tanpa tanya. Kalau `unzip: command not found` →
> `sudo apt-get install -y unzip` lalu ulangi.

Verifikasi:

```bash
ls /var/www/gasing-auth/
# harus: index.html  assets/   (TIDAK ada folder dist/ atau register/)

head -c 200 /var/www/gasing-auth/index.html
```

Nginx tidak perlu di-restart karena file statis. Kalau ragu:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

---

## FASE 4 — Bersih-bersih & Verifikasi

```bash
# hapus zip biar tidak menumpuk di home
rm ~/dist.zip
```

Buka di browser: `http://<IP_VM>/` → harus redirect ke `/login` dan tampil halaman Login.

Test SPA fallback (ketik langsung / F5 di halaman itu):

| URL | Hasil benar |
| --- | --- |
| `/login/forgot-password` | Halaman Lupa Password |
| `/dashboard-admin` | Redirect ke `/login` |
| `/register/id/TOS` | Halaman Syarat & Ketentuan |

DevTools → Network: file `/assets/*.js` harus **200** dengan
`Content-Type: application/javascript` (bukan `text/html`).

---

## One-liner untuk Deploy Ulang Berikutnya

Setelah `dist.zip` ter-upload ke `~`:

```bash
sudo rm -rf /tmp/gasing-upload /var/www/gasing-auth && \
sudo mkdir /var/www/gasing-auth && \
sudo unzip -o ~/dist.zip -d /tmp/gasing-upload/ && \
sudo cp -r /tmp/gasing-upload/dist/* /var/www/gasing-auth/ && \
sudo chown -R www-data:www-data /var/www/gasing-auth && \
sudo chmod -R 755 /var/www/gasing-auth && \
rm ~/dist.zip && echo "DEPLOY OK"
```

---

## Troubleshooting

| Gejala | Sebab | Fix |
| --- | --- | --- |
| `rm: cannot remove '~/dist.zip'` | zip belum ada / sudah terhapus | abaikan, bukan error |
| Layar putih, JS di-serve `text/html` | file kesalinan bertingkat (`gasing-auth/dist/...`) | pastikan copy pakai `/tmp/gasing-upload/dist/*`, cek `ls /var/www/gasing-auth` |
| 404 saat refresh `/dashboard-admin` | SPA fallback Nginx belum ada | lihat Fase 5 `docs/deployment/DEPLOYMENT_GUIDE.md` |
| `unzip: command not found` | paket belum terpasang | `sudo apt-get install -y unzip` |
| Permission denied di browser | owner salah | ulangi `chown`/`chmod` di Fase 3 |

---

*Sarang Gasing — Staging Deployment (metode upload ZIP via SSH-in-browser). Dibuat 27 Agustus 2026.*
