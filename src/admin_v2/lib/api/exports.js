import { apiGet, apiPost } from "./client.js";

// Export endpoints per user list. Keyed by the scope strings the tables use.
export const EXPORT_ENDPOINTS = {
  waiting: "/admin/users/export/verifikasi-akun",
  pending_voucher: "/admin/users/export/pending-voucher",
  belum_langganan: "/admin/users/export/belum-langganan",
  menunggu_verifikasi: "/admin/users/export/menunggu-verifikasi",
  pembayaran_ditolak: "/admin/users/export/pembayaran-ditolak",
  disetujui: "/admin/users/export/disetujui",
  ditolak: "/admin/users/export/ditolak",
  ditangguhkan: "/admin/users/export/ditangguhkan",
  dihapus: "/admin/users/export/dihapus",
  training_sessions: "/admin/training-sessions/export",
};

export const EXPORT_LABELS = {
  waiting: "Verifikasi Akun",
  pending_voucher: "Pending Voucher Setup",
  belum_langganan: "Belum Langganan",
  menunggu_verifikasi: "Menunggu Verifikasi",
  pembayaran_ditolak: "Pembayaran Ditolak",
  disetujui: "Disetujui",
  ditolak: "Ditolak",
  ditangguhkan: "Ditangguhkan",
  dihapus: "Baru Dihapus",
  training_sessions: "Riwayat Pelatihan",
  training_session_history: "Detail Riwayat Pelatihan",
};

// Download history grouping (one tab per menu). Scopes map to their menu;
// anything unmapped lands in "lainnya".
export const EXPORT_CATEGORIES = [
  {
    key: "verifikasi-akun",
    title: "Verifikasi Akun",
    scopes: ["waiting", "pending_voucher"],
  },
  {
    key: "verifikasi-pembayaran",
    title: "Verifikasi Pembayaran",
    scopes: ["belum_langganan", "menunggu_verifikasi", "pembayaran_ditolak"],
  },
  {
    key: "manajemen-akun",
    title: "Manajemen Akun",
    scopes: ["disetujui", "ditolak", "ditangguhkan", "dihapus"],
  },
  {
    key: "riwayat-pelatihan",
    title: "Riwayat Pelatihan",
    scopes: ["training_sessions", "training_session_history"],
  },
];

export const OTHER_EXPORT_CATEGORY = { key: "lainnya", title: "Lainnya" };

export function exportCategoryOf(scope) {
  const found = EXPORT_CATEGORIES.find((c) => c.scopes.includes(scope));
  return found ? found.key : OTHER_EXPORT_CATEGORY.key;
}

export function exportCategoryTitle(key) {
  const found = EXPORT_CATEGORIES.find((c) => c.key === key);
  return found ? found.title : OTHER_EXPORT_CATEGORY.title;
}

// POST <scope endpoint> (no payload) → { trackId }
export async function requestExport(filter, { sessionId } = {}) {
  let endpoint = EXPORT_ENDPOINTS[filter];
  let query;

  if (filter === "training_session_history") {
    if (!sessionId) throw new Error("Session ID is required for this export.");
    endpoint = `/admin/training-histories/sessions/${encodeURIComponent(sessionId)}/export`;
    query = { "sort[by]": "createdAt", "sort[order]": "desc" };
  }

  if (!endpoint) throw new Error(`Unknown export scope: ${filter}`);
  const res = query
    ? await apiPost(endpoint, undefined, query)
    : await apiPost(endpoint);
  return res?.trackId ?? res?.data?.trackId;
}

// GET /queue/jobs/:trackId → { id, status, progress, currentAction, error, result }
export function fetchExportJob(trackId) {
  return apiGet(`/queue/jobs/${trackId}`);
}

export const exportJobKeys = {
  all: ["admin_v2", "export-jobs"],
  byId: (trackId) => ["admin_v2", "export-jobs", trackId],
};
