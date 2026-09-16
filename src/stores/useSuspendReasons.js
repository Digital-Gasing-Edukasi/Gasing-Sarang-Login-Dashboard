import { create } from 'zustand'
import { adminApi } from '@/lib/api'

// Cache daftar alasan suspend dari BE (GET /admin/users/suspend-reasons →
// [{ code, title, desc }], lihat dev/responses/admin-users-suspend-reasons.json).
// Daftar jarang berubah → fetch sekali per sesi, dipakai semua SuspendModal
// (single + bulk). Dedup via flag loaded/loading.
export const useSuspendReasons = create((set, get) => ({
  reasons: [],
  loading: false,
  loaded: false,
  error: null,

  fetchReasons: async () => {
    if (get().loaded || get().loading) return
    set({ loading: true, error: null })
    try {
      const data = await adminApi.getSuspendReasons()
      const list = Array.isArray(data) ? data : data?.data || data?.items || []
      set({ reasons: list, loaded: true, loading: false })
    } catch (e) {
      set({ loading: false, error: e })
    }
  },

  // Isolasi antar-test (vitest) — bukan untuk production.
  reset: () => set({ reasons: [], loading: false, loaded: false, error: null }),
}))
