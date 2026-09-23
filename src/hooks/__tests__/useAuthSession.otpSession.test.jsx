import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { useAuthSession } from '../useAuthSession'

// Regresi: token + email OTP hilang saat reload (sering di mobile) → backup ke
// sessionStorage (selamat reload, hilang tutup-tab), dihapus saat terverifikasi.

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

function setup() {
  const wrapper = ({ children }) => (
    <MemoryRouter initialEntries={['/login']}>{children}</MemoryRouter>
  )
  return renderHook(() => useAuthSession({}), { wrapper })
}

describe('useAuthSession — sesi OTP (reload-safe)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
  })

  it('handleOtpToken menyimpan state + backup sessionStorage', () => {
    const { result } = setup()

    act(() => {
      result.current.handleOtpToken('tok-123', 'user@test.com')
    })

    expect(result.current.otpToken).toBe('tok-123')
    expect(result.current.regEmail).toBe('user@test.com')
    expect(JSON.parse(sessionStorage.getItem('otp-session'))).toEqual({
      token: 'tok-123',
      email: 'user@test.com',
    })
  })

  it('mount dengan backup tersimpan → state ter-restore (simulasi reload)', () => {
    sessionStorage.setItem(
      'otp-session',
      JSON.stringify({ token: 'tok-reload', email: 'reload@test.com' })
    )

    const { result } = setup()

    expect(result.current.otpToken).toBe('tok-reload')
    expect(result.current.regEmail).toBe('reload@test.com')
  })

  it('clearOtpToken menghapus state + backup', () => {
    const { result } = setup()

    act(() => {
      result.current.handleOtpToken('tok-123', 'user@test.com')
    })
    act(() => {
      result.current.clearOtpToken()
    })

    expect(result.current.otpToken).toBe('')
    expect(result.current.regEmail).toBe('')
    expect(sessionStorage.getItem('otp-session')).toBeNull()
  })
})
