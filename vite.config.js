import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Cap waktu build (WIB) — di-inject ke bundle lewat `define`. Dipakai penanda
// versi di halaman login supaya gampang identifikasi build mana yang lagi live.
const BUILD_DATE = new Date().toLocaleString('sv-SE', {
  timeZone: 'Asia/Jakarta',
}).slice(0, 16).replace('T', ' '); // "2026-07-24 14:30"

export default defineConfig(({ mode }) => ({
  // App di-serve dari root domain. Route publik: /login, /register,
  // /dashboard-admin, /payment/* (lihat src/lib/routes.js).
  base: mode === 'production' ? '/' : '/register',
  define: {
    __BUILD_DATE__: JSON.stringify(BUILD_DATE),
    __APP_MODE__: JSON.stringify(mode),
  },
  plugins: [react()],
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
  server: {
    proxy: {
      "/api": {
        target: "https://dev-dge-comunity.baka.work",
        changeOrigin: true,
        secure: true,
      },
      "/midtrans-api": {
        target: "https://app.sandbox.midtrans.com",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/midtrans-api/, "")
      }
    },
  },
}));
