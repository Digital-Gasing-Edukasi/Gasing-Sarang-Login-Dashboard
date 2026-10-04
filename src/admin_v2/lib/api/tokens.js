// Own token storage for admin_v2 (same browser keys as v1 so the session is
// shared, but cache handling is scoped to this client).
export const adminV2Tokens = {
  getAccess: () =>
    localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken"),
  getRefresh: () =>
    localStorage.getItem("refreshToken") || sessionStorage.getItem("refreshToken"),
  isPersistent: () => !!localStorage.getItem("accessToken"),
  setTokens: (accessToken, refreshToken, persistent = false) => {
    const storage = persistent ? localStorage : sessionStorage;
    const other = persistent ? sessionStorage : localStorage;
    storage.setItem("accessToken", accessToken);
    if (refreshToken) storage.setItem("refreshToken", refreshToken);
    other.removeItem("accessToken");
    other.removeItem("refreshToken");
  },
  clear: () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("refreshToken");
  },
};
