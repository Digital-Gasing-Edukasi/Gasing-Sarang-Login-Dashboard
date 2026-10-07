import { apiGet } from "./client.js";

// Geographic data is static in practice — keep it for the whole session.
export const REGION_CACHE = { staleTime: Infinity, gcTime: Infinity };

const asList = (res) => (Array.isArray(res) ? res : res?.data ?? res?.items ?? []);

export const regionLabel = (r) => r?.regionName || r?.name || "";

// GET /regions → provinces (bare array of { id, code, name, level, parentId }).
export async function fetchProvinces() {
  return asList(await apiGet("/regions"));
}

// GET /regions?type=REGENCY&parentId=<provinceId> → regencies of a province.
export async function fetchRegencies(parentId) {
  return asList(await apiGet("/regions", { type: "REGENCY", parentId }));
}

// GET /regions/:id → region detail (used to resolve a regency's province).
export async function fetchRegion(id) {
  const res = await apiGet(`/regions/${id}`);
  return res?.data ?? res;
}

export const regionsKeys = {
  all: ["admin_v2", "regions"],
  provinces: ["admin_v2", "regions", "provinces"],
  regencies: (parentId) => ["admin_v2", "regions", "regencies", { parentId }],
  byId: (id) => ["admin_v2", "regions", id],
};
