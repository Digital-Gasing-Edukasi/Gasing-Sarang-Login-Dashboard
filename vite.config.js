import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import fs from "fs";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Cap waktu build (WIB) — di-inject ke bundle lewat `define`. Dipakai penanda
// versi di halaman login supaya gampang identifikasi build mana yang lagi live.
const BUILD_DATE = new Date().toLocaleString('sv-SE', {
  timeZone: 'Asia/Jakarta',
}).slice(0, 16).replace('T', ' '); // "2026-07-24 14:30"

// Identitas unik tiap build untuk force-reload client (lihat
// src/hooks/useAppVersionCheck.js). Commit short-sha + penanda dirty (pohon
// kerja kotor = bundle belum tentu sama dgn commit). Fallback 'unknown' bila
// git tidak tersedia (mis. CI tanpa history).
function git(command, fallback) {
  try {
    return execSync(command, { cwd: __dirname, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() || fallback;
  } catch {
    return fallback;
  }
}
const COMMIT = git('git rev-parse --short HEAD', 'unknown');
const BUILD_ID = git('git status --porcelain', '') === '' ? COMMIT : `${COMMIT}-dirty`;
const PKG_VERSION = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8')).version;

// Tulis dist/version.json setiap build — dibaca client oleh useAppVersionCheck
// untuk deteksi build baru. Ditulis langsung ke outDir (bukan public/) supaya
// tidak mengotori working tree. Host WAJIB serve file ini `Cache-Control:
// no-cache`, kalau tidak pengecekannya sendiri basi.
function versionJsonPlugin(version) {
  return {
    name: 'version-json',
    writeBundle(options) {
      const outDir = options.dir || path.join(__dirname, 'dist');
      fs.writeFileSync(
        path.join(outDir, 'version.json'),
        JSON.stringify({ version, buildDate: BUILD_DATE, commit: COMMIT, buildId: BUILD_ID }),
      );
    },
  };
}

export default defineConfig(({ mode }) => {
  // App di-serve dari root domain. Route publik: /login, /register,
  // /dashboard-admin, /payment/* (lihat src/lib/routes.js).
  const env = loadEnv(mode, __dirname, '');
  const appVersion = env.VITE_APP_VERSION || PKG_VERSION;
  return {
  base: mode === 'production' ? '/' : '/register',
  define: {
    __BUILD_DATE__: JSON.stringify(BUILD_DATE),
    __APP_MODE__: JSON.stringify(mode),
    __BUILD_ID__: JSON.stringify(BUILD_ID),
  },
  plugins: [react(), versionJsonPlugin(appVersion)],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            return "vendor";
          }
        },
      },
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.js"],
    include: ["src/**/*.test.{js,jsx}"],
  },
  server: {
    proxy: {
      "/api": {
        target: "https://dev-dge-comunity.baka.work",
        changeOrigin: true,
        secure: true,
      },
    },
  },
  };
});
