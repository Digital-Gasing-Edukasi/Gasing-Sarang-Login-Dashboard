import { adminV2Tokens } from "./tokens.js";

export const ADMIN_V2_BASE_URL = import.meta.env.VITE_API_URL;

export class ApiError extends Error {
  constructor(message, { status, data } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

async function parseBody(res) {
  return res.json().catch(() => ({}));
}

function toApiError(data, res) {
  let message = data.message || `Error ${res.status}`;
  if (Array.isArray(message)) message = message.join(", ");
  if (data.errors) {
    if (Array.isArray(data.errors)) message = data.errors.join(", ");
    else if (typeof data.errors === "object") {
      message = Object.values(data.errors).flat().join(", ");
    }
  }
  return new ApiError(message, { status: res.status, data });
}

// Single-flight refresh: concurrent 401s share one /auth/refresh call.
let refreshPromise = null;

async function tryRefreshToken() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const res = await fetch(`${ADMIN_V2_BASE_URL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: adminV2Tokens.getRefresh() }),
        });
        if (!res.ok) return false;
        const data = await parseBody(res);
        if (!data.accessToken) return false;
        adminV2Tokens.setTokens(
          data.accessToken,
          data.refreshToken || null,
          adminV2Tokens.isPersistent(),
        );
        return true;
      } catch {
        return false;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

function buildUrl(endpoint, query) {
  const qs = new URLSearchParams();
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== "") {
        qs.append(key, String(value));
      }
    }
  }
  const search = qs.toString();
  return `${ADMIN_V2_BASE_URL}${endpoint}${search ? `?${search}` : ""}`;
}

async function doFetch(url, { method, body }) {
  const headers = { Accept: "application/json" };
  const token = adminV2Tokens.getAccess();
  if (token) headers.Authorization = `Bearer ${token}`;

  const init = { method, headers };
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(body);
  }
  return fetch(url, init);
}

export async function apiRequest(endpoint, { method = "GET", query, body } = {}) {
  const url = buildUrl(endpoint, query);
  let res = await doFetch(url, { method, body });

  if (res.status === 401 && adminV2Tokens.getRefresh()) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      res = await doFetch(url, { method, body });
    } else {
      adminV2Tokens.clear();
      window.location.href = "/login";
      return;
    }
  }

  const data = await parseBody(res);
  if (!res.ok) throw toApiError(data, res);
  return data;
}

export const apiGet = (endpoint, query) =>
  apiRequest(endpoint, { method: "GET", query });

export const apiPost = (endpoint, body, query) =>
  apiRequest(endpoint, { method: "POST", body, query });

export const apiPatch = (endpoint, body, query) =>
  apiRequest(endpoint, { method: "PATCH", body, query });

export const apiDelete = (endpoint, query) =>
  apiRequest(endpoint, { method: "DELETE", query });
