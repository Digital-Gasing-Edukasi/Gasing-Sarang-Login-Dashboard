import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

// ROLE-02/ROLE-03 (showDashboard) + SSO toast regression (bug 3 fix in
// AuthChoicePage.jsx: failed handleRedirectSso now shows LoginFailedToast).
vi.mock('@/lib/api', () => ({
  tokenStorage: { clear: vi.fn() },
  discourseApi: { ssoLogin: vi.fn() },
  authApi: { logout: vi.fn(() => Promise.resolve()) },
  webAppApi: { redirectWithTokens: vi.fn() },
}))

import { AuthChoicePage } from '../AuthChoicePage'
import { discourseApi } from '@/lib/api'

describe('AuthChoicePage - tombol per role (ROLE-02/ROLE-03)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('superadmin (showDashboard=true) -> 4 tombol: Dashboard, Dashboard V2, Moderator (Discourse), Gasing Web App', () => {
    const onNavigate = vi.fn()
    render(<AuthChoicePage user={{ superadmin: true }} onNavigate={onNavigate} onSignOut={() => {}} />)

    expect(screen.getByRole('button', { name: 'Dashboard' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Dashboard V2' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Moderator \(Discourse\)/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Gasing Web App/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Dashboard V2' }))
    expect(onNavigate).toHaveBeenCalledWith('admin-dashboard-v2')
  })

  it('moderator non-superadmin (showDashboard=false) -> HANYA 2 tombol, TANPA Dashboard', () => {
    render(
      <AuthChoicePage
        user={{ capabilities: ['USER/DISCOURSE/MANAGE_EXTRA_GROUPS'] }}
        onNavigate={() => {}}
        onSignOut={() => {}}
      />,
    )

    expect(screen.queryByRole('button', { name: /Dashboard/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Moderator \(Discourse\)/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Gasing Web App/i })).toBeInTheDocument()
  })
})

describe('AuthChoicePage - handleRedirectSso toast (bug 3 fix)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('ssoLogin gagal -> LoginFailedToast tampil dgn pesan yg benar', async () => {
    discourseApi.ssoLogin.mockRejectedValueOnce(new Error('network down'))
    render(<AuthChoicePage user={{}} onNavigate={() => {}} onSignOut={() => {}} />)

    expect(screen.queryByText(/Gagal masuk ke Moderator \(Discourse\)/i)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Moderator \(Discourse\)/i }))

    await waitFor(() => {
      expect(
        screen.getByText('Gagal masuk ke Moderator (Discourse). Silakan coba lagi.'),
      ).toBeInTheDocument()
    })
  })

  it('ssoLogin sukses -> LoginFailedToast TIDAK tampil', async () => {
    discourseApi.ssoLogin.mockResolvedValueOnce(undefined)
    render(<AuthChoicePage user={{}} onNavigate={() => {}} onSignOut={() => {}} />)

    fireEvent.click(screen.getByRole('button', { name: /Moderator \(Discourse\)/i }))

    await waitFor(() => expect(discourseApi.ssoLogin).toHaveBeenCalledTimes(1))
    expect(screen.queryByText(/Gagal masuk ke Moderator \(Discourse\)/i)).not.toBeInTheDocument()
  })
})
