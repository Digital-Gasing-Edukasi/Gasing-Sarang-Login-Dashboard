import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginPage } from '../LoginPage'
import { authApi, profileApi, tokenStorage } from '@/lib/api'

// LoginPage mendelegasikan provisional/email_confirmation ke handleLoginSuccess
// (penentu dialog = session-status di sana). Di sini: token disimpan, getMe
// dilewati, onLoginSuccess dipanggil dengan opts yang benar.

vi.mock('@/lib/api', () => ({
  authApi: { login: vi.fn() },
  profileApi: { getMe: vi.fn() },
  tokenStorage: { setTokens: vi.fn(), clear: vi.fn(), getAccess: vi.fn() },
}))

const PROVISIONAL = {
  accessToken: 'provisional-tok',
  tokenType: 'Bearer',
  expiresIn: '20m',
  sessionType: 'provisional',
  additionalInfo: 'please wait for 161 secs',
}

const EMAIL_CONFIRMATION = {
  accessToken: 'otp-tok',
  tokenType: 'Bearer',
  expiresIn: '2h',
  sessionType: 'email_confirmation',
  additionalInfo: null,
}

async function fillAndSubmit(ue) {
  await ue.type(screen.getByPlaceholderText('Masukkan email kamu'), 'user@test.com')
  await ue.type(screen.getByPlaceholderText('Masukkan password kamu'), 'secret123')
  await ue.click(screen.getByRole('button', { name: 'Log In' }))
}

describe('LoginPage — sessionType delegation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('provisional → token disimpan, getMe dilewati, onLoginSuccess(null, {pendingCreds, waitSecs})', async () => {
    const ue = userEvent.setup()
    authApi.login.mockResolvedValue(PROVISIONAL)
    const onLoginSuccess = vi.fn()

    render(<LoginPage onNavigate={() => {}} onLoginSuccess={onLoginSuccess} />)
    await fillAndSubmit(ue)

    await waitFor(() => expect(onLoginSuccess).toHaveBeenCalledTimes(1))
    expect(tokenStorage.setTokens).toHaveBeenCalledWith('provisional-tok', null, false)
    expect(profileApi.getMe).not.toHaveBeenCalled()
    expect(onLoginSuccess).toHaveBeenCalledWith(null, {
      pendingCreds: { email: 'user@test.com', password: 'secret123' },
      waitSecs: 161,
    })
    // Dialog email hidup App-level — bukan di sini.
    expect(screen.queryByText('Selesaikan Verifikasi Email')).not.toBeInTheDocument()
  })

  it('email_confirmation → onLoginSuccess(null, {emailConfirmation}), token tak disimpan', async () => {
    const ue = userEvent.setup()
    authApi.login.mockResolvedValue(EMAIL_CONFIRMATION)
    const onLoginSuccess = vi.fn()

    render(<LoginPage onNavigate={() => {}} onLoginSuccess={onLoginSuccess} />)
    await fillAndSubmit(ue)

    await waitFor(() => expect(onLoginSuccess).toHaveBeenCalledTimes(1))
    expect(onLoginSuccess).toHaveBeenCalledWith(null, {
      emailConfirmation: { token: 'otp-tok', email: 'user@test.com' },
    })
    expect(tokenStorage.setTokens).not.toHaveBeenCalled()
    expect(profileApi.getMe).not.toHaveBeenCalled()
  })

  it('login normal (tanpa sessionType) → flow lama tidak berubah', async () => {
    const ue = userEvent.setup()
    authApi.login.mockResolvedValue({ accessToken: 'a', refreshToken: 'r' })
    profileApi.getMe.mockResolvedValue({ verifiedStatus: 'approved' })
    const onLoginSuccess = vi.fn()

    render(<LoginPage onNavigate={() => {}} onLoginSuccess={onLoginSuccess} />)
    await fillAndSubmit(ue)

    await waitFor(() => expect(onLoginSuccess).toHaveBeenCalledWith({ verifiedStatus: 'approved' }))
  })
})
