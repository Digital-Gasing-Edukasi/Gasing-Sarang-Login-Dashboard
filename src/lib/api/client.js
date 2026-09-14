// src/lib/api/client.js — infra inti: concurrency limiter, in-flight GET dedupe,
// TTL cache GET, core fetch wrapper (auth header + 401 refresh), multipart,
// error handling, query builder.
//
// Domain modules (auth.js, profile.js, ...) mengimpor `request` / `dedupeFetch`
// / `buildQuery` dari sini. `tokenStorage` tinggal di tokens.js (diimpor ke sini);
// tokens.js mengimpor `clearApiCache` dari sini — siklus ESM yang aman karena
// keduanya hanya dipakai di dalam badan fungsi (tidak saat evaluasi modul).
import { withBase } from "../format";
import { tokenStorage } from "./tokens.js";

export const BASE_URL = import.meta.env.VITE_API_URL;

// ─── Concurrency limiter + in-flight GET dedupe ───────────────────────────────
// Backend pakai NestJS ThrottlerException (429) kalau kena burst request. Batasi
// jumlah request paralel global + gabungkan GET identik yang lagi in-flight biar
// halaman yang nembak banyak endpoint sekaligus (mis. dashboard) nggak kena limit.
const MAX_CONCURRENT = 4;
let activeRequests = 0;
const waitQueue = [];

function acquireSlot() {
  if (activeRequests < MAX_CONCURRENT) {
    activeRequests++;
    return Promise.resolve();
  }
  return new Promise((resolve) => waitQueue.push(resolve));
}

function releaseSlot() {
  const next = waitQueue.shift();
  if (next) next(); // slot langsung dipakai antrean berikut (activeRequests tetap)
  else activeRequests--;
}

async function limitedFetch(url, options) {
  await acquireSlot();
  try {
    return await fetch(url, options);
  } finally {
    releaseSlot();
  }
}

// Dedupe: dua pemanggil GET URL sama yang barengan → satu request jaringan, tiap
// pemanggil dapat clone response-nya sendiri (body cuma bisa dibaca sekali).
const inflightGets = new Map();

// TTL cache GET (di atas in-flight dedupe). Dedupe cuma menyatukan request yang
// BARENGAN; cache ini menyatukan request identik yang BERDEKATAN tapi tidak overlap
// — mis. beberapa useEffect di mount menembak endpoint sama berurutan (loadUsers
// 'manajemen' dipanggil saat mount lalu lagi setelah discourse groups siap).
// Menyimpan hasil PARSED (bukan Response) supaya bebas dari masalah body sekali baca.
// Mutasi (non-GET) membuang seluruh cache → pembacaan berikutnya selalu fresh.
const RESPONSE_TTL = 4000;
const getCache = new Map(); // url -> { ts, data }

export function clearApiCache() {
  getCache.clear();
  inflightGets.clear(); // request A-session yang masih in-flight jangan dipakai ulang
}

export function dedupeFetch(url, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  if (method !== "GET") return limitedFetch(url, options);

  if (inflightGets.has(url)) {
    return inflightGets.get(url).then((res) => res.clone());
  }
  const p = limitedFetch(url, options);
  inflightGets.set(url, p);
  p.finally(() => inflightGets.delete(url));
  return p.then((res) => res.clone());
}

// ─── Core fetch wrapper ───────────────────────────────────────────────────────
export async function request(endpoint, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const url = `${BASE_URL}${endpoint}`;

  // GET: layani dari cache kalau masih fresh. Non-GET (mutasi): buang cache dulu
  // supaya pembacaan setelahnya tidak mengembalikan data basi.
  if (method === "GET") {
    const hit = getCache.get(url);
    if (hit && Date.now() - hit.ts < RESPONSE_TTL) return hit.data;
  } else {
    getCache.clear();
  }

  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...options.headers,
  };

  // Endpoint pre-auth (register/login/dll) TIDAK boleh kirim Bearer: token akun
  // lama yang nyangkut bikin backend mengira user lama, mis. /auth/register →
  // "Email cannot be changed for existing registration." Set { noAuth: true }.
  const token = options.noAuth ? null : tokenStorage.getAccess();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await dedupeFetch(url, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (res.status === 401 && tokenStorage.getRefresh()) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      headers["Authorization"] = `Bearer ${tokenStorage.getAccess()}`;
      const retryRes = await dedupeFetch(url, {
        ...options,
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
      });
      const data = await handleResponse(retryRes);
      if (method === "GET") getCache.set(url, { ts: Date.now(), data });
      return data;
    } else {
      tokenStorage.clear();
      window.location.href = withBase("/login");
      return;
    }
  }

  const data = await handleResponse(res);
  if (method === "GET") getCache.set(url, { ts: Date.now(), data });
  return data;
}

// Multipart (file upload) wrapper
export async function requestMultipart(endpoint, formData) {
  const token = tokenStorage.getAccess();
  const headers = { Accept: "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await limitedFetch(`${BASE_URL}${endpoint}`, {
    method: "POST",
    headers,
    body: formData,
  });
  return handleResponse(res);
}

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    let message = data.message || `Error ${res.status}`;
    if (data.errors) {
      if (Array.isArray(data.errors)) {
        message = data.errors.join(", ");
      } else if (typeof data.errors === 'object') {
        message = Object.values(data.errors).flat().join(", ");
      }
    }
    const err = new Error(Array.isArray(message) ? message.join(", ") : message);
    err.status = res.status; // dipakai UI untuk bedakan 5xx (server error) vs 4xx.
    err.data = data;         // payload mentah (mis. suspendedUntil/reason saat akun ditangguhkan).
    // 429 (ThrottlerException): sisa waktu tunggu dari header Retry-After (detik)
    // supaya UI bisa hitung mundur, bukan cuma bilang "coba lagi nanti".
    if (res.status === 429) {
      const ra = parseInt(res.headers.get("Retry-After") || "", 10);
      err.retryAfter = Number.isFinite(ra) && ra > 0 ? ra : 60;
    }
    throw err;
  }
  return data;
}

// Diekspor karena dipakai web-app.js (refresh dulu sebelum handoff token).
export async function tryRefreshToken() {
  try {
    const res = await limitedFetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: tokenStorage.getRefresh() }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    // Pertahankan lokasi storage semula (jangan turunkan localStorage → session).
    tokenStorage.setTokens(data.accessToken, data.refreshToken || null, tokenStorage.isPersistent());
    return true;
  } catch {
    return false;
  }
}

export function buildQuery(params) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      q.append(key, value);
    }
  });
  return q.toString();
}
