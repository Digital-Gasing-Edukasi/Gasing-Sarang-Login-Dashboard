import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAppVersionCheck, VERSION_LS_KEY } from '../useAppVersionCheck'

// Force-reload client: bandingkan __BUILD_ID__ bundle dgn version.json server.

const reloadMock = vi.fn()
const realLocation = Object.getOwnPropertyDescriptor(window, 'location')

function mockFetch(data, ok = true) {
  global.fetch = vi.fn(() =>
    Promise.resolve({ ok, json: () => Promise.resolve(data) })
  )
}

describe('useAppVersionCheck', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    localStorage.clear()
    globalThis.__BUILD_ID__ = 'local-abc'
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { reload: reloadMock },
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    globalThis.__BUILD_ID__ = 'test-build'
    delete global.fetch
    if (realLocation) Object.defineProperty(window, 'location', realLocation)
  })

  async function flush() {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
  }

  it('buildId sama → tidak reload, localStorage tidak ditulis', async () => {
    mockFetch({ version: '0.1.7', buildId: 'local-abc' })
    renderHook(() => useAppVersionCheck({ enabled: true }))
    await flush()

    expect(global.fetch).toHaveBeenCalledTimes(1)
    expect(global.fetch.mock.calls[0][0]).toMatch(/^\/version\.json\?t=\d+$/)
    expect(reloadMock).not.toHaveBeenCalled()
    expect(localStorage.getItem(VERSION_LS_KEY)).toBeNull()
  })

  it('buildId beda → tulis localStorage + reload sekali', async () => {
    mockFetch({ version: '0.1.8', buildId: 'server-xyz' })
    renderHook(() => useAppVersionCheck({ enabled: true }))
    await flush()

    expect(localStorage.getItem(VERSION_LS_KEY)).toBe('server-xyz')
    expect(reloadMock).toHaveBeenCalledTimes(1)
  })

  it('bentuk legacy {commit} ikut dibandingkan (fallback key)', async () => {
    mockFetch({ commit: 'server-xyz' })
    renderHook(() => useAppVersionCheck({ enabled: true }))
    await flush()

    expect(reloadMock).toHaveBeenCalledTimes(1)
  })

  it('fetch gagal / non-ok → diam, tidak reload', async () => {
    global.fetch = vi.fn(() => Promise.reject(new Error('offline')))
    renderHook(() => useAppVersionCheck({ enabled: true }))
    await flush()
    expect(reloadMock).not.toHaveBeenCalled()

    mockFetch(null, false)
    renderHook(() => useAppVersionCheck({ enabled: true }))
    await flush()
    expect(reloadMock).not.toHaveBeenCalled()
  })

  it('interval 10 menit memicu check ulang', async () => {
    mockFetch({ buildId: 'local-abc' })
    renderHook(() => useAppVersionCheck({ enabled: true }))
    await flush()
    expect(global.fetch).toHaveBeenCalledTimes(1)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10 * 60 * 1000)
    })
    expect(global.fetch).toHaveBeenCalledTimes(2)
  })

  it('tab kembali fokus memicu check ulang', async () => {
    mockFetch({ buildId: 'local-abc' })
    renderHook(() => useAppVersionCheck({ enabled: true }))
    await flush()
    expect(global.fetch).toHaveBeenCalledTimes(1)

    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'))
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(global.fetch).toHaveBeenCalledTimes(2)
  })

  it('enabled:false → tidak fetch sama sekali (jalur DEV)', async () => {
    global.fetch = vi.fn()
    renderHook(() => useAppVersionCheck({ enabled: false }))
    await flush()

    expect(global.fetch).not.toHaveBeenCalled()
  })
})
