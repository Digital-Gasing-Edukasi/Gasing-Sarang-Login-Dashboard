// src/lib/api/files.js — upload/commit/unduh file via file-manager.
import { BASE_URL, request, requestMultipart } from "./client.js";

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
