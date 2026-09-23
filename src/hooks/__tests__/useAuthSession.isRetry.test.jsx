import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { useAuthSession } from '../useAuthSession'

// Regresi: isRetry true dari sesi login sebelumnya bocor ke checkout fresh
// (gate payment_rejected meng-arm true, tak pernah di-reset) → halaman sukses
// salah tampil Log Out padahal ini pembayaran pertama. handleLoginSuccess
// me-reset ke false di awal; gate meng-arm ulang bila memang retry.

vi.mock('@/lib/api', () => ({
  tokenStorage: { getAccess: vi.fn(), getRefresh: vi.fn(), clear: vi.fn() },
  subscriptionApi: {
    getLatestPayment: vi.fn(() => Promise.resolve({})),
    getStatus: vi.fn(() => Promise.resolve({ hasActiveSubscription: false })),
  },
  authApi: {
    logout: vi.fn(() => Promise.resolve()),
    sessionStatus: vi.fn(() => Promise.resolve({ blocked: false })),
  },
  webAppApi: { redirectWithTokens: vi.fn() },
}))

function setup(setIsRetry) {
  const wrapper = ({ children }) => (
    <MemoryRouter initialEntries={['/login']}>{children}</MemoryRouter>
  )
  return renderHook(() => useAuthSession({ setIsRetry }), { wrapper })
}

describe('useAuthSession — isRetry reset saat login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('login fresh me-reset isRetry ke false (sebelum cek apapun)', async () => {
    const setIsRetry = vi.fn()
    const { result } = setup(setIsRetry)

    await act(async () => {
      await result.current.handleLoginSuccess({ verifiedStatus: 'approved' })
    })

    // Reset terjadi sinkron di baris pertama — harus terpanggil walau flow
    // lanjut ke halaman subscription.
    expect(setIsRetry).toHaveBeenCalledWith(false)
  })

  it('tanpa setIsRetry (dep opsional) login tetap jalan normal', async () => {
    const { result } = setup(undefined)

    await act(async () => {
      await result.current.handleLoginSuccess({ verifiedStatus: 'approved' })
    })

    // Tidak throw; gate tidak diset untuk user bersih tanpa langganan
    // (navigasi ke subscription, bukan modal).
    expect(result.current.gate).toBeNull()
  })
})
