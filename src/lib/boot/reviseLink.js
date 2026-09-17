import { authApi, regionsApi } from "@/lib/api";
import { normalizeRevise } from "@/lib/normalizeRevise";

// Link "Revisi Data" dari email: /register/revise?token=<JWT>.
// Prefill diambil dari server (bukan URL). Respons revise hanya punya regionId
// (kabupaten), tanpa provinsi induk — lengkapi provinceId dari detail region
// agar cascade lokasi bisa prefill.
export async function fetchRevisePrefill(reviseTokenParam) {
  const data = await authApi.getRevise(reviseTokenParam);
  const normalized = normalizeRevise(data);
  if (normalized.regionId && !normalized.provinceId) {
    try {
      const region = await regionsApi.get(normalized.regionId);
      const r = region?.data || region || {};
      normalized.provinceId = r.parentId || r.parent?.id || "";
    } catch {
      /* biarkan kosong — user pilih provinsi/kota ulang */
    }
  }
  return normalized;
}
