import { useEffect, useRef } from 'react'
import { withBase } from '@/lib/format'

// Force-reload client saat build baru terbit. Bandingkan id build bundle yang
// sedang jalan (`__BUILD_ID__`, di-inject vite.config.js) dengan
// `version.json` hasil build terakhir di server. Beda → reload sekali.
//
// - `version.json` ditulis tiap build ke dist root (plugin version-json).
// - Perbandingan `!==` sederhana: unik per build (commit-sha), dan stabil
//   sendiri saat rollback (sesudah reload, client == server).
// - localStorage `sg_last_seen_version`: bukti build baru sudah mendarat
//   pasca-reload + anti double-reload bila check kepicu beruntun.
// - Diam total saat offline/error/CDN hiccup — jangan pernah merusak app.
// - Nonaktif di DEV (bundle dev tidak punya buildId stabil).
export const VERSION_CHECK_INTERVAL_MS = 10 * 60 * 1000
export const VERSION_LS_KEY = 'sg_last_seen_version'

const getLocalBuildId = () =>
  typeof __BUILD_ID__ !== 'undefined' ? __BUILD_ID__ : 'dev'

const getServerBuildId = (data) => {
  if (!data || typeof data !== 'object') return null
  return data.buildId || data.commit || data.buildDate || null
}

export function useAppVersionCheck({ intervalMs = VERSION_CHECK_INTERVAL_MS, enabled = !import.meta.env.DEV } = {}) {
  const checkingRef = useRef(false)

  useEffect(() => {
    if (!enabled) return
    let stopped = false

    const check = async () => {
      if (checkingRef.current || document.hidden || stopped) return
      checkingRef.current = true
      try {
        const res = await fetch(`${withBase('/version.json')}?t=${Date.now()}`, { cache: 'no-store' })
        if (!res.ok || stopped) return
        const data = await res.json().catch(() => null)
        const serverId = getServerBuildId(data)
        if (!serverId || stopped) return
        if (serverId !== getLocalBuildId()) {
          try {
            localStorage.setItem(VERSION_LS_KEY, serverId)
          } catch {
            /* storage penuh/diblokir → reload tetap jalan */
          }
          window.location.reload()
        }
      } catch {
        /* offline / version.json belum ter-deploy → lewati diam-diam */
      } finally {
        checkingRef.current = false
      }
    }

    check()
    const timer = setInterval(check, intervalMs)
    const onVisible = () => {
      if (!document.hidden) check()
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onVisible)
    return () => {
      stopped = true
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onVisible)
    }
  }, [intervalMs, enabled])
}
