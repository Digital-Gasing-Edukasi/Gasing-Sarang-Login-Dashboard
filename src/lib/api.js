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

// ─── Core fetch wrapper ───────────────────────────────────────────────────────
async function request(endpoint, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...options.headers,
  };

  const token = tokenStorage.getAccess();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (res.status === 401 && tokenStorage.getRefresh()) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      headers["Authorization"] = `Bearer ${tokenStorage.getAccess()}`;
      const retryRes = await fetch(`${BASE_URL}${endpoint}`, {
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

  const res = await fetch(`${BASE_URL}${endpoint}`, {
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
    throw new Error(Array.isArray(message) ? message.join(", ") : message);
  }
  return data;
}

async function tryRefreshToken() {
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
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

// ─── TRAINING REGIONS ─────────────────────────────────────────────────────────
export const regionsApi = {
  list: () =>
    fetch(`${BASE_URL}/training-regions`, { headers: { Accept: "application/json" } })
      .then((r) => r.json()),

  get: (id) => request(`/training-regions/${id}`),

  getByAreaId: (areaId) => request(`/training-regions/by-area/${areaId}`),
};

// ─── TIMEZONE ─────────────────────────────────────────────────────────────────
export const timezoneApi = {
  list: () =>
    fetch(`${BASE_URL}/timezones`, { headers: { Accept: "application/json" } })
      .then((r) => r.json()),
};

// ─── SUBSCRIPTION & PAYMENT ───────────────────────────────────────────────────
export const subscriptionApi = {
  getPlans: () =>
    fetch(`${BASE_URL}/packages`, { headers: { Accept: "application/json" } })
      .then((r) => r.json()),

  getStatus: () => request("/subscription/me"),

  checkout: (packageId) =>
    request("/subscription/checkout", { method: "POST", body: { packageId } }),

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
      if (data.redirectUrl) window.location.href = data.redirectUrl
    }),

  // SSO gateway: verifies sso+sig params from Discourse callback
  gateway: (sso, sig) =>
    request("/discourse/gateway", { method: "POST", body: { sso, sig } }),
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

// ─── ADMIN ────────────────────────────────────────────────────────────────────
export const adminApi = {
  // ── Users ──
  getUsers: (params = {}) => {
    const q = buildQuery({ page: 1, limit: 100, ...params });
    return request(`/admin/users${q ? "?" + q : ""}`);
  },

  getUser: (userId) => request(`/admin/users/${userId}`),

  updateUser: (userId, data) =>
    request(`/admin/users/${userId}`, { method: "PATCH", body: data }),

  setUserPassword: (userId, newPassword) =>
    request(`/admin/users/${userId}/password`, {
      method: "PATCH",
      body: { newPassword },
    }),

  verifyUser: (userId, data) =>
    request(`/admin/users/${userId}/verify`, { method: "PATCH", body: data }),

  updateDiscourseGroup: (userId, discourseGroupId) =>
    request(`/admin/users/${userId}/discourse-group`, {
      method: "PATCH",
      body: { discourseGroupId },
    }),

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

  // ── Training Regions ──
  createTrainingRegion: (data) =>
    request("/admin/training-regions", { method: "POST", body: data }),

  updateTrainingRegion: (id, data) =>
    request(`/admin/training-regions/${id}`, { method: "PATCH", body: data }),

  deleteTrainingRegion: (id) =>
    request(`/admin/training-regions/${id}`, { method: "DELETE" }),

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
