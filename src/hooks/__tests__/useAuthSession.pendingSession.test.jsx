import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { useAuthSession } from '../useAuthSession'

// Sesi sementara (user null): penentu dialog = session-status, bukan sessionType.
// handleGateVerifyEmail: token di tangan → OTP langsung; creds → login ulang.

vi.mock('@/lib/api', () => ({
  tokenStorage: {
    getAccess: vi.fn(),
    getRefresh: vi.fn(),
    clear: vi.fn(),
    setTokens: vi.fn(),
  },
  subscriptionApi: {
    getLatestPayment: vi.fn(() => Promise.resolve({})),
    getStatus: vi.fn(() => Promise.resolve({ hasActiveSubscription: false })),
  },
  authApi: {
    logout: vi.fn(() => Promise.resolve()),
    login: vi.fn(),
    sessionStatus: vi.fn(() => Promise.resolve({ blocked: false })),
  },
  profileApi: { getMe: vi.fn() },
  webAppApi: { redirectWithTokens: vi.fn() },
}))

import { authApi, profileApi, tokenStorage } from '@/lib/api'

function setup(deps = {}) {
  const wrapper = ({ children }) => (
    <MemoryRouter initialEntries={['/login']}>{children}</MemoryRouter>
  )
  return renderHook(() => useAuthSession(deps), { wrapper })
}

describe('useAuthSession — pending session (user null)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
  })

  it('emailConfirmation opts → gate email_unconfirmed aktif, tanpa fetch status', async () => {
    const { result } = setup()

    await act(async () => {
      await result.current.handleLoginSuccess(null, {
        emailConfirmation: { token: 'otp-tok', email: 'user@test.com' },
      })
    })

    expect(authApi.sessionStatus).not.toHaveBeenCalled()
    expect(result.current.gate.type).toBe('email_unconfirmed')
    expect(result.current.gate.waitSecs).toBe(0)
    expect(result.current.gate.otpToken).toBe('otp-tok')
  })

  it('provisional + email_unconfirmed → gate bawa creds + waitSecs', async () => {
    authApi.sessionStatus.mockResolvedValueOnce({
      blocked: true,
      reasonCode: 'email_unconfirmed',
      message: 'Please confirm your email first',
    })
    const { result } = setup()

    await act(async () => {
      await result.current.handleLoginSuccess(null, {
        pendingCreds: { email: 'user@test.com', password: 'secret123' },
        waitSecs: 161,
      })
    })

    expect(result.current.gate.type).toBe('email_unconfirmed')
    expect(result.current.gate.creds).toEqual({ email: 'user@test.com', password: 'secret123' })
    expect(result.current.gate.waitSecs).toBe(161)
  })

  it('provisional + revision_required → revision gate (prefill kosong tanpa profil)', async () => {
    profileApi.getMe.mockRejectedValueOnce(new Error('401'))
    authApi.sessionStatus.mockResolvedValueOnce({
      blocked: true,
      reasonCode: 'revision_required',
      message: 'Need revisions',
      data: {
        fields: [{ field: 'tanggalLahir', title: 'T', description: 'D' }],
      },
    })
    const { result } = setup()

    await act(async () => {
      await result.current.handleLoginSuccess(null, { pendingCreds: { email: 'a', password: 'b' } })
    })

    expect(result.current.gate.type).toBe('revision_required')
    expect(result.current.gate.fixData.invalid).toEqual(['tanggalLahir'])
    expect(result.current.gate.fixData.name).toBe('')
  })

  it('provisional + revision_required + getMe lolos → prefill dari profil', async () => {
    profileApi.getMe.mockResolvedValueOnce({
      id: 'u-1',
      name: 'Tes register ulang',
      email: 'getex22067@aganseo.com',
      birthdate: { date: '1995-01-01' },
      schoolName: 'Nice',
      firstTrainingYear: 2026,
      firstTrainingMonth: 3,
    })
    authApi.sessionStatus.mockResolvedValueOnce({
      blocked: true,
      reasonCode: 'revision_required',
      message: 'Need revisions',
      data: {
        fields: [{ field: 'tanggalLahir', title: 'T', description: 'D' }],
      },
    })
    const { result } = setup()

    await act(async () => {
      await result.current.handleLoginSuccess(null, { pendingCreds: { email: 'a', password: 'b' } })
    })

    expect(result.current.gate.type).toBe('revision_required')
    expect(result.current.gate.fixData.name).toBe('Tes register ulang')
    expect(result.current.gate.fixData.birthdate).toBe('1995-01-01')
    expect(result.current.gate.fixData.firstTrainingYear).toBe(2026)
    expect(result.current.gate.fixData.firstTrainingMonth).toBe(3)
  })

  it('handleGateVerifyEmail dengan otpToken → sesi OTP + gate tutup', async () => {
    const setFixData = vi.fn()
    const { result } = setup({ setFixData })

    await act(async () => {
      await result.current.handleLoginSuccess(null, {
        emailConfirmation: { token: 'otp-tok', email: 'user@test.com' },
      })
    })
    await act(async () => {
      await result.current.handleGateVerifyEmail()
    })

    expect(result.current.gate).toBeNull()
    expect(result.current.otpToken).toBe('otp-tok')
    expect(result.current.regEmail).toBe('user@test.com')
    expect(JSON.parse(sessionStorage.getItem('otp-session'))).toEqual({
      token: 'otp-tok',
      email: 'user@test.com',
    })
  })

  it('handleGateVerifyEmail via creds → re-login provisional → dialog dibuka ulang timer baru', async () => {
    authApi.sessionStatus.mockResolvedValueOnce({
      blocked: true,
      reasonCode: 'email_unconfirmed',
      message: 'Confirm first',
    })
    authApi.login.mockResolvedValueOnce({
      sessionType: 'provisional',
      accessToken: 'prov-2',
      additionalInfo: 'wait for 42 secs',
    })
    const { result } = setup()

    await act(async () => {
      await result.current.handleLoginSuccess(null, {
        pendingCreds: { email: 'user@test.com', password: 'secret123' },
        waitSecs: 0,
      })
    })
    await act(async () => {
      await result.current.handleGateVerifyEmail()
    })

    expect(authApi.login).toHaveBeenCalledWith('user@test.com', 'secret123')
    expect(result.current.gate.type).toBe('email_unconfirmed')
    expect(result.current.gate.waitSecs).toBe(42)
  })

  it('handleGateVerifyEmail via creds → email_confirmation → sesi OTP + gate tutup', async () => {
    authApi.sessionStatus.mockResolvedValueOnce({
      blocked: true,
      reasonCode: 'email_unconfirmed',
      message: 'Confirm first',
    })
    authApi.login.mockResolvedValueOnce({
      sessionType: 'email_confirmation',
      accessToken: 'otp-tok-2',
    })
    const { result } = setup()

    await act(async () => {
      await result.current.handleLoginSuccess(null, {
        pendingCreds: { email: 'user@test.com', password: 'secret123' },
        waitSecs: 0,
      })
    })
    await act(async () => {
      await result.current.handleGateVerifyEmail()
    })

    expect(result.current.gate).toBeNull()
    expect(result.current.otpToken).toBe('otp-tok-2')
  })
})
