import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  // App di-serve dari root domain. Route publik: /login, /register,
  // /dashboard-admin, /payment/* (lihat src/lib/routes.js).
  base: '/',
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
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
});
