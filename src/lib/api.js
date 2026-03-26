// src/lib/api.js
// ─── Base config ─────────────────────────────────────────────────────────────
const BASE_URL = import.meta.env.VITE_API_URL + "/api/v1/reg";

// ─── Token helpers ────────────────────────────────────────────────────────────
export const tokenStorage = {
  getAccess: () => localStorage.getItem("accessToken"),
  getRefresh: () => localStorage.getItem("refreshToken"),
  setTokens: (a, r) => {
    localStorage.setItem("accessToken", a);
    if (r) localStorage.setItem("refreshToken", r);
  },
  clear: () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  },
};

// ─── Core fetch wrapper ───────────────────────────────────────────────────────
async function request(endpoint, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...options.headers,
  };

  // Attach access token jika ada
  const token = tokenStorage.getAccess();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  // Jika 401 dan ada refresh token → coba refresh dulu
  if (res.status === 401 && tokenStorage.getRefresh()) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      // Retry request dengan token baru
      headers["Authorization"] = `Bearer ${tokenStorage.getAccess()}`;
      const retryRes = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
      });
      return handleResponse(retryRes);
    } else {
      // Refresh gagal → logout
      tokenStorage.clear();
      window.location.href = "/";
      return;
    }
  }

  return handleResponse(res);
}

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // Lempar error dengan message dari backend
    const message = data.message || `Error ${res.status}`;
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
    tokenStorage.setTokens(data.accessToken, null); // refresh hanya dapat accessToken baru
    return true;
  } catch {
    return false;
  }
}

// ─── AUTH endpoints ───────────────────────────────────────────────────────────
export const authApi = {
  // POST /auth/register
  // Body: { email, password, name, birthdate }
  // Response: { token (JWT OTP), message }
  register: (data) =>
    request("/auth/register", {
      method: "POST",
      body: data,
    }),

  // POST /auth/confirm-email
  // Body: { token (JWT dari register response), otp (6 digit) }
  confirmEmail: (token, otp) =>
    request("/auth/confirm-email", {
      method: "POST",
      body: { token, otp },
    }),

  // POST /auth/login
  // Response: { accessToken, refreshToken, tokenType, expiresIn }
  login: (email, password) =>
    request("/auth/login", {
      method: "POST",
      body: { email, password },
    }),

  // POST /auth/logout
  logout: () => request("/auth/logout", { method: "POST" }),

  // POST /auth/refresh
  // Body: { refreshToken }
  refresh: (refreshToken) =>
    request("/auth/refresh", {
      method: "POST",
      body: { refreshToken },
      headers: {}, // no auth header untuk refresh
    }),

  // POST /auth/forgot-password
  // Body: { email }
  forgotPassword: (email) =>
    request("/auth/forgot-password", {
      method: "POST",
      body: { email },
    }),

  // POST /auth/reset-password
  // Body: { token, email, newPassword }
  resetPassword: (token, email, newPassword) =>
    request("/auth/reset-password", {
      method: "POST",
      body: { token, email, newPassword },
    }),
};

// ─── PROFILE endpoints ────────────────────────────────────────────────────────
export const profileApi = {
  // GET /profile/me
  getMe: () => request("/profile/me"),

  // PATCH /profile
  // Body: { name, email, birthdate, timezone, currentPassword }
  update: (data) =>
    request("/profile", {
      method: "PATCH",
      body: data,
    }),

  // PATCH /profile/password
  // Body: { currentPassword, newPassword }
  changePassword: (currentPassword, newPassword) =>
    request("/profile/password", {
      method: "PATCH",
      body: { currentPassword, newPassword },
    }),

  // POST /profile/confirm-email
  // Body: { token }
  confirmEmailChange: (token) =>
    request("/profile/confirm-email", {
      method: "POST",
      body: { token },
    }),
};

// ─── TRAINING REGIONS endpoints ───────────────────────────────────────────────
export const regionsApi = {
  // GET /training-regions — public, tidak butuh token
  list: () =>
    fetch(`${BASE_URL}/training-regions`, {
      headers: { Accept: "application/json" },
    }).then((r) => r.json()),

  // GET /training-regions/:id
  get: (id) => request(`/training-regions/${id}`),
};

// ─── SUBSCRIPTION & PAYMENT endpoints ────────────────────────────────────────
export const subscriptionApi = {
  // GET /subscriptions/plans — ambil daftar paket
  // Response contoh: [{ id, name, price, priceMonthly, billingCycle, discount, ... }]
  getPlans: () => request("/subscriptions/plans"),

  // POST /subscriptions/checkout — buat transaksi Midtrans
  // Body: { planId }
  // Response: { redirectUrl } — URL Midtrans Snap untuk redirect
  // ⚠️ Ganti endpoint + body sesuai backend asli kamu
  checkout: (planId) =>
    request("/subscriptions/checkout", {
      method: "POST",
      body: { planId },
    }),

  // GET /subscriptions/status — cek status langganan user
  getStatus: () => request("/subscriptions/status"),
};
