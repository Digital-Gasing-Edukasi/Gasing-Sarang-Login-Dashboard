// src/lib/api.js
const BASE_URL = import.meta.env.VITE_API_URL;

// ─── Token helpers ────────────────────────────────────────────────────────────
export const tokenStorage = {
  getAccess:  () => localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken"),
  getRefresh: () => localStorage.getItem("refreshToken") || sessionStorage.getItem("refreshToken"),
  setTokens:  (a, r, persistent = false) => {
    const storage = persistent ? localStorage : sessionStorage;
    storage.setItem("accessToken", a);
    if (r) storage.setItem("refreshToken", r);
  },
  clear: () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("refreshToken");
  },
};

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

function dedupeFetch(url, options = {}) {
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
async function request(endpoint, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...options.headers,
  };

  const token = tokenStorage.getAccess();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await dedupeFetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (res.status === 401 && tokenStorage.getRefresh()) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      headers["Authorization"] = `Bearer ${tokenStorage.getAccess()}`;
      const retryRes = await dedupeFetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
      });
      return handleResponse(retryRes);
    } else {
      tokenStorage.clear();
      window.location.href = "/";
      return;
    }
  }

  return handleResponse(res);
}

// Multipart (file upload) wrapper
async function requestMultipart(endpoint, formData) {
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
    throw err;
  }
  return data;
}

async function tryRefreshToken() {
  try {
    const res = await limitedFetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: tokenStorage.getRefresh() }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    tokenStorage.setTokens(data.accessToken, data.refreshToken || null);
    return true;
  } catch {
    return false;
  }
}

function buildQuery(params) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      q.append(key, value);
    }
  });
  return q.toString();
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data) =>
    request("/auth/register", { method: "POST", body: data }),

  confirmEmail: (token, otp) =>
    request("/auth/confirm-email", { method: "POST", body: { token, otp } }),

  login: (email, password) =>
    request("/auth/login", { method: "POST", body: { email, password } }),

  logout: () => request("/auth/logout", { method: "POST" }),

  logoutAll: () => request("/auth/logout-all", { method: "POST" }),

  refresh: (refreshToken) =>
    request("/auth/refresh", {
      method: "POST",
      body: { refreshToken },
      headers: {},
    }),

  forgotPassword: (email) =>
    request("/auth/forgot-password", { method: "POST", body: { email } }),

  resetPassword: (token, email, newPassword) =>
    request("/auth/reset-password", {
      method: "POST",
      body: { token, email, newPassword },
    }),

  // ── Alur Revise (akun diminta perbaiki data via token JWT dari email) ─────────
  // Auth lewat `token` di body (bukan access token) — user datang dari link email.
  //
  // getRevise: ambil profil + alasan + daftar field yang harus diperbaiki.
  getRevise: (token) =>
    request("/auth/revise", { method: "POST", body: { token }, headers: {} }),
  // submitRevise: kirim data yang sudah diperbaiki. Token one-time (di-revoke server).
  submitRevise: (data) =>
    request("/auth/revise/submit", { method: "POST", body: data, headers: {} }),

  // @deprecated — diganti getRevise/submitRevise (alur token-based backend).
  // Lihat ADR-0003. Dihapus setelah FixDataPage migrasi ke token.
  submitCorrection: (data) =>
    request("/auth/correct-data", { method: "POST", body: data }),
};

// ─── PROFILE ──────────────────────────────────────────────────────────────────
export const profileApi = {
  getMe: () => request("/profile/me"),

  update: (data) => request("/profile", { method: "PATCH", body: data }),

  changePassword: (currentPassword, newPassword) =>
    request("/profile/password", {
      method: "PATCH",
      body: { currentPassword, newPassword },
    }),

  updatePicture: (fileId) =>
    request("/profile/picture", { method: "PATCH", body: { fileId } }),

  confirmEmailChange: (token) =>
    request("/profile/confirm-email", { method: "POST", body: { token } }),
};

// ─── REGIONS (Province → Regency hierarchy) ─────────────────────────────────────
// list() defaults to provinces. Pass { type: "REGENCY", parentId, keyword } for regencies.
export const regionsApi = {
  list: (params = {}) => {
    const q = buildQuery(params);
    return dedupeFetch(`${BASE_URL}/regions${q ? "?" + q : ""}`, {
      headers: { Accept: "application/json" },
    }).then((r) => r.json());
  },

  get: (id) => request(`/regions/${id}`),
};

// ─── TRAINING SESSIONS ──────────────────────────────────────────────────────────
// list({ regionId }) returns sessions for a regency (used by the registration form).
// list({ page, limit, keyword }) paginates for admin browsing.
export const trainingSessionsApi = {
  list: (params = {}) => {
    const q = buildQuery(params);
    return dedupeFetch(`${BASE_URL}/training-sessions${q ? "?" + q : ""}`, {
      headers: { Accept: "application/json" },
    }).then((r) => r.json());
  },

  get: (id) => request(`/training-sessions/${id}`),
};

// ─── TRAINING HISTORIES (import peserta via CSV) ────────────────────────────────
// Alur: upload CSV → poll job validasi → review/koreksi rows → push (commit).
// Semua butuh capability TRAINING_HISTORY/MGMT.
export const trainingHistoriesApi = {
  // multipart: file (CSV kolom `email`) + trainingSessionId → { importId, trackId }
  upload: (file, trainingSessionId) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("trainingSessionId", trainingSessionId);
    return requestMultipart("/admin/training-histories/imports", fd);
  },

  listImports: (params = {}) => {
    const q = buildQuery({ page: 1, limit: 20, ...params });
    return request(`/admin/training-histories/imports${q ? "?" + q : ""}`);
  },

  // → { data: {header, status}, rows: { data:[{id,email,userId,valid,message}], meta } }
  getImport: (id, params = {}) => {
    const q = buildQuery({ page: 1, limit: 50, ...params });
    return request(`/admin/training-histories/imports/${id}${q ? "?" + q : ""}`);
  },

  getRow: (id, rowId) =>
    request(`/admin/training-histories/imports/${id}/rows/${rowId}`),

  // Update email 1 row → auto re-validate, balik row terbaru (valid+message).
  patchRow: (id, rowId, email) =>
    request(`/admin/training-histories/imports/${id}/rows/${rowId}`, {
      method: "PATCH",
      body: { email },
    }),

  deleteRow: (id, rowId) =>
    request(`/admin/training-histories/imports/${id}/rows/${rowId}`, {
      method: "DELETE",
    }),

  // Commit ke tabel training_histories (hanya saat status SAVED) → { trackId }.
  // Row invalid + duplikat di-skip otomatis.
  push: (id) =>
    request(`/admin/training-histories/imports/${id}/push`, { method: "POST" }),
};

// ─── QUEUE JOBS (polling proses async) ──────────────────────────────────────────
// getJob → { status: "COMPLETED"|..., progress, currentAction, error, result }
export const queueApi = {
  getJob: (id) => request(`/queue/jobs/${id}`),

  // Poll sampai COMPLETED / FAILED (default maks ~60 detik). Balik job final.
  waitJob: async (trackId, { interval = 1000, tries = 60 } = {}) => {
    for (let i = 0; i < tries; i++) {
      const res = await queueApi.getJob(trackId);
      const job = res?.data || res;
      if (job.status === "COMPLETED") return job;
      if (job.status === "FAILED") throw new Error(job.error || "Proses gagal di server.");
      await new Promise((r) => setTimeout(r, interval));
    }
    throw new Error("Timeout menunggu proses server.");
  },
};

// ─── APP CONFIGS ──────────────────────────────────────────────────────────────
// Key/value config store. get() publik; set() butuh cap SETTING/WRITE (admin).
// Dipakai untuk banner Pendaftaran Trainer di Home (key: hero_banner-home-v2).
export const appConfigApi = {
  get: (key) =>
    dedupeFetch(`${BASE_URL}/app-configs/${key}`, { headers: { Accept: "application/json" } })
      .then((r) => r.json()),

  set: (key, value) =>
    request(`/admin/app-configs/${key}`, { method: "PUT", body: { value } }),
};

// ─── TIMEZONE ─────────────────────────────────────────────────────────────────
export const timezoneApi = {
  list: () =>
    dedupeFetch(`${BASE_URL}/timezones`, { headers: { Accept: "application/json" } })
      .then((r) => r.json()),
};

// ─── SUBSCRIPTION & PAYMENT ───────────────────────────────────────────────────
export const subscriptionApi = {
  getPlans: () =>
    dedupeFetch(`${BASE_URL}/packages`, { headers: { Accept: "application/json" } })
      .then((r) => r.json()),

  getStatus: () => request("/subscription/me"),

  checkout: (packageId) =>
    request("/subscription/checkout", { method: "POST", body: { packageId } }),

  // ── Manual Transfer (dipakai sementara selama Midtrans belum siap) ──────────
  // Idempotent per user: bila sudah ada payment pending tanpa bukti, endpoint ini
  // meng-update payment yang sama (bukan bikin baru). Balik detail payment.
  checkoutManual: (packageId) =>
    request("/subscription/checkout-manual", { method: "POST", body: { packageId } }),

  // Lampirkan bukti transfer ke sebuah payment. fileId didapat dari
  // fileManagerApi.upload(). Setelah ini payment menunggu verifikasi admin.
  uploadReceipt: (paymentId, fileId) =>
    request(`/subscription/payments/${paymentId}/upload-receipt`, {
      method: "POST",
      body: { fileId },
    }),

  // Payment manual_transfer terakhir milik user (status apapun). 404 bila belum ada.
  getLatestPayment: () => request("/subscription/payments/latest"),

  // Detail satu payment milik user. 404 bila bukan milik user / tidak ada.
  getPayment: (paymentId) => request(`/subscription/payments/${paymentId}`),

  subscribe: (packageId) =>
    request("/subscription/subscribe", { method: "POST", body: { packageId } }),

  cancel: () => request("/subscription/cancel", { method: "POST" }),

  paymentHistory: (page = 1, limit = 20) =>
    request(`/subscription/history?page=${page}&limit=${limit}`),
};

// ─── VOUCHERS ─────────────────────────────────────────────────────────────────
export const voucherApi = {
  list: (params = {}) => {
    const q = buildQuery({ page: 1, limit: 20, ...params });
    return request(`/vouchers${q ? "?" + q : ""}`);
  },

  validate: (code) =>
    request("/vouchers/validate", { method: "POST", body: { code } }),

  redeem: (code) =>
    request("/vouchers/redeem", { method: "POST", body: { code } }),
};

// ─── DISCOURSE & SSO ──────────────────────────────────────────────────────────
export const discourseApi = {
  getGroups: () => request("/discourse/groups"),

  // Initiates SSO login flow — redirects browser to Discourse
  ssoLogin: (returnPath) =>
    request(
      `/discourse/sso-login${returnPath ? `?return_path=${encodeURIComponent(returnPath)}` : ""}`
    ).then(data => {
      const url = data.redirectUrl || data.redirect_url || data.url || data.ssoUrl
      if (url) {
        window.location.href = url
      } else {
        throw new Error("Redirect URL tidak ditemukan di respons server")
      }
    }),

  // SSO gateway: verifies sso+sig params from Discourse callback
  gateway: (sso, sig) =>
    request("/discourse/gateway", { method: "POST", body: { sso, sig } }),
};

// ─── EXTERNAL WEB APP (non-Discourse) ──────────────────────────────────────────
// Hands the current session over to the Gasing web app by forwarding the tokens
// on the callback URL. Contract: `token` = access token, `refresh` = refresh token.
const WEB_APP_CALLBACK_URL = "https://gasing.vercel.app/api/auth/callback";

export const webAppApi = {
  redirectWithTokens() {
    const access  = tokenStorage.getAccess();
    const refresh = tokenStorage.getRefresh();

    if (!access || !refresh) {
      console.warn("[webAppApi] redirectWithTokens: token tidak lengkap", { access: !!access, refresh: !!refresh });
    }

    const params = new URLSearchParams();
    if (access)  params.append("token", access);
    if (refresh) params.append("refresh", refresh);
    window.location.href = `${WEB_APP_CALLBACK_URL}?${params.toString()}`;
  },
};

// ─── FILE MANAGER ─────────────────────────────────────────────────────────────
export const fileManagerApi = {
  upload: (file, isPublic = true) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("isPublic", isPublic ? "1" : "0");
    return requestMultipart("/file-manager/upload", formData);
  },

  commit: (fileId) =>
    request(`/file-manager/commit/${fileId}`, { method: "PATCH" }),

  getDownloadUrl: (fileId) => `${BASE_URL}/file-manager/download/${fileId}`,
};

// ─── SKILLS & ENDORSEMENTS ──────────────────────────────────────────────────────
export const skillsApi = {
  getUserSkills: (username) => request(`/users/${username}/skills`),

  // Toggles endorsement of `skillId` for the skill owner identified by `userId`.
  toggleEndorse: (skillId, userId) =>
    request(`/skills/${skillId}/endorse`, {
      method: "POST",
      body: { user_id: userId },
    }),
};

// ─── ADMIN ────────────────────────────────────────────────────────────────────
export const adminApi = {
  // ── Users ──
  getUsers: (params = {}) => {
    const q = buildQuery({ page: 1, limit: 100, ...params });
    return request(`/admin/users${q ? "?" + q : ""}`);
  },

  getUser: (userId) => request(`/admin/users/${userId}`),

  // Peserta 1 session — pakai filter existing lastTrainingSessionId.
  // CATATAN: hanya user yang session TERAKHIR-nya = sessionId (bukan seluruh
  // riwayat). Sementara sampai backend sediakan endpoint participants khusus.
  getSessionParticipants: (sessionId, params = {}) => {
    const q = buildQuery({ page: 1, limit: 20, "filter[lastTrainingSessionId]": sessionId, ...params });
    return request(`/admin/users${q ? "?" + q : ""}`);
  },

  updateUser: (userId, data) =>
    request(`/admin/users/${userId}`, { method: "PATCH", body: data }),

  setUserPassword: (userId, newPassword) =>
    request(`/admin/users/${userId}/password`, {
      method: "PATCH",
      body: { newPassword },
    }),

  verifyUser: (userId, data) =>
    request(`/admin/users/${userId}/verify`, { method: "PATCH", body: data }),

  // Minta user memperbaiki data (status → REVISE). Backend generate token JWT +
  // kirim email berisi link revise. `fieldsToRevise` = array key field yang salah.
  reviseUser: (userId, { rejectedReason, fieldsToRevise }) =>
    request(`/admin/users/${userId}/verify`, {
      method: "PATCH",
      body: { status: "revise", rejectedReason, fieldsToRevise },
    }),

  // Tolak akun secara FINAL (status → REJECTED). User tidak bisa memperbaiki data.
  // Dipicu saat admin memilih "Lainnya" di RejectModal. `rejectedReason` = teks bebas.
  rejectUser: (userId, { rejectedReason }) =>
    request(`/admin/users/${userId}/verify`, {
      method: "PATCH",
      body: { status: "rejected", rejectedReason },
    }),

  // Kirim ulang email revise (token baru). Hanya untuk user berstatus REVISE.
  resendReviseEmail: (userId) =>
    request(`/admin/users/${userId}/resend-revise-email`, { method: "POST" }),

  updateDiscourseGroup: (userId, discourseGroupId) =>
    request(`/admin/users/${userId}/discourse-group`, {
      method: "PATCH",
      body: { discourseGroupId },
    }),

  // ── Hapus / Pulihkan akun (soft delete via deletion-request) ──
  // Hapus akun → jadwalkan penghapusan (akun masuk tab "Baru Dihapus").
  requestUserDeletion: (userId) =>
    request(`/admin/users/${userId}/deletion-request`, { method: "POST" }),
  // Pulihkan akun dari "Baru Dihapus" → batalkan jadwal penghapusan.
  cancelUserDeletion: (userId) =>
    request(`/admin/users/${userId}/deletion-request`, { method: "DELETE" }),

  // ── Tangguhkan / Pulihkan akun (suspend) ──
  // suspendedUntil: "YYYY-MM-DD HH:mm:ss". Akun masuk tab "Ditangguhkan".
  suspendUser: (userId, suspendedUntil) =>
    request(`/admin/users/${userId}/suspend`, {
      method: "POST",
      body: { suspendedUntil },
    }),
  // Pulihkan akun dari "Ditangguhkan" → cabut penangguhan.
  unsuspendUser: (userId) =>
    request(`/admin/users/${userId}/suspend`, { method: "DELETE" }),

  // ── Packages ──
  getPackages: () => request("/admin/packages"),

  getPackage: (id) => request(`/admin/packages/${id}`),

  createPackage: (data) =>
    request("/admin/packages", { method: "POST", body: data }),

  updatePackage: (id, data) =>
    request(`/admin/packages/${id}`, { method: "PATCH", body: data }),

  deactivatePackage: (id) =>
    request(`/admin/packages/${id}`, { method: "DELETE" }),

  // ── Subscriptions ──
  getSubscriptions: (params = {}) => {
    const q = buildQuery({ page: 1, limit: 20, ...params });
    return request(`/admin/subscriptions${q ? "?" + q : ""}`);
  },

  getSubscription: (id) => request(`/admin/subscriptions/${id}`),

  syncSubscriptions: () =>
    request("/admin/subscriptions/sync", { method: "POST" }),

  // ── Payments ──
  getPayments: (params = {}) => {
    const q = buildQuery({ page: 1, limit: 20, ...params });
    return request(`/admin/payments${q ? "?" + q : ""}`);
  },

  // ── Regions ──
  createRegion: (data) =>
    request("/admin/regions", { method: "POST", body: data }),

  updateRegion: (id, data) =>
    request(`/admin/regions/${id}`, { method: "PATCH", body: data }),

  deleteRegion: (id) =>
    request(`/admin/regions/${id}`, { method: "DELETE" }),

  // ── Training Sessions ──
  createTrainingSession: (data) =>
    request("/admin/training-sessions", { method: "POST", body: data }),

  updateTrainingSession: (id, data) =>
    request(`/admin/training-sessions/${id}`, { method: "PATCH", body: data }),

  deleteTrainingSession: (id) =>
    request(`/admin/training-sessions/${id}`, { method: "DELETE" }),

  // ── Skills ──
  getSkills: (params = {}) => {
    const q = buildQuery({ page: 1, limit: 20, ...params });
    return request(`/admin/skills${q ? "?" + q : ""}`);
  },

  createSkill: (data) =>
    request("/admin/skills", { method: "POST", body: data }),

  updateSkill: (id, data) =>
    request(`/admin/skills/${id}`, { method: "PATCH", body: data }),

  deleteSkill: (id) =>
    request(`/admin/skills/${id}`, { method: "DELETE" }),

  // ── UAC / IAM (requires superAdmin) ──
  getUacGroups: () => request("/admin/uac/groups"),

  getUacGroup: (id) => request(`/admin/uac/groups/${id}`),

  assignUacGroup: (userId, groupId) =>
    request("/admin/uac/assignments", {
      method: "POST",
      body: { userId, groupId },
    }),

  removeUacGroup: (userId, groupId) =>
    request("/admin/uac/assignments", {
      method: "DELETE",
      body: { userId, groupId },
    }),

  // ── Vouchers ──
  getVouchers: (params = {}) => {
    const q = buildQuery({ page: 1, limit: 20, ...params });
    return request(`/admin/vouchers${q ? "?" + q : ""}`);
  },

  getVoucher: (code) => request(`/admin/vouchers/${code}`),

  getVoucherUsage: (code, params = {}) => {
    const q = buildQuery({ page: 1, limit: 20, ...params });
    return request(`/admin/vouchers/${code}/usage${q ? "?" + q : ""}`);
  },

  createPoolVoucher: (data) =>
    request("/admin/vouchers/pool", { method: "POST", body: data }),

  grantPersonalVoucher: (data) =>
    request("/admin/vouchers/personal", { method: "POST", body: data }),

  revokeVoucher: (id) =>
    request(`/admin/vouchers/${id}/revoke`, { method: "PATCH" }),
};
