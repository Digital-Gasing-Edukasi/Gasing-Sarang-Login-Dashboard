import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// Regression matrix for App.jsx handleLoginSuccess (bug 1: isSuperAdmin checked
// BEFORE isSsoDisabled; bug 2: isStaffCapabilityHolder bypasses evaluateLoginGate
// / paymentRejected for superadmin, discourse-moderator, DISABLED-SSO admin).
// See docs/TEST_SCENARIOS.md ROLE-01..08 (ROLE-03b there is now STALE — it
// pre-dates the fix and says "Superadmin + DISABLED-SSO -> admin-dashboard",
// the exact bug this file locks in as WRONG; correct behavior is /login/choice).

const box = vi.hoisted(() => ({ user: null }))

vi.mock('@/pages/auth/LoginPage', () => ({
  LoginPage: (props) => (
    <button onClick={() => props.onLoginSuccess(box.user)}>DO_LOGIN</button>
  ),
}))

vi.mock('@/pages/AdminDashboardPage', () => ({
  default: () => <div>MOCK_ADMIN_DASHBOARD</div>,
}))

vi.mock('@/pages/SubscriptionPage', () => ({
  default: () => <div>MOCK_SUBSCRIPTION_PAGE</div>,
}))

vi.mock('@/components/shared/LoginStatusModal', () => ({
  LoginStatusModal: ({ type, meta }) => (
    <div data-testid="gate-modal" data-type={type}>
      {JSON.stringify(meta)}
    </div>
  ),
}))

vi.mock('@/lib/api', () => ({
  tokenStorage: {
    getAccess: vi.fn(() => 'fake-token'), // truthy: lolos requireAuth utk /login/choice & /dashboard-admin
    getRefresh: vi.fn(() => null),
    clear: vi.fn(),
  },
  subscriptionApi: {
    getLatestPayment: vi.fn(() => Promise.resolve({})),
    getStatus: vi.fn(() => Promise.resolve({ hasActiveSubscription: false })),
  },
  profileApi: {
    // init() auto-restore pakai ini kalau getAccess truthy saat mount — dibikin
    // gagal supaya TIDAK ganggu login manual via tombol DO_LOGIN di tiap test.
    getMe: vi.fn(() => Promise.reject(new Error('no session in test'))),
  },
  authApi: {
    logout: vi.fn(() => Promise.resolve()),
  },
  regionsApi: { get: vi.fn() },
  webAppApi: { redirectWithTokens: vi.fn() },
}))

import App from '../App'
import { webAppApi, tokenStorage, subscriptionApi } from '@/lib/api'

// App renders null sampai init() (async useEffect) set sessionChecked=true.
// Tunggu tombol stub DO_LOGIN muncul dulu sebelum klik, biar gak ngeklik body kosong.
async function login(user) {
  box.user = user
  const btn = await screen.findByText('DO_LOGIN')
  fireEvent.click(btn)
}

function renderApp() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <App />
    </MemoryRouter>,
  )
}

describe('handleLoginSuccess routing matrix', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    tokenStorage.getAccess.mockReturnValue('fake-token')
    box.user = null
  })

  it('ROLE-03: superadmin, no other capability -> /login/choice', async () => {
    renderApp()
    await login({ superadmin: true })

    await waitFor(() =>
      expect(screen.getByText('Pilih Tujuan Login')).toBeInTheDocument(),
    )
    expect(screen.getByRole('button', { name: /Dashboard/i })).toBeInTheDocument()
  })

  it('ROLE-03b (bug 1 fix): superadmin WITH DISABLED-SSO -> STILL /login/choice, NOT /dashboard-admin', async () => {
    renderApp()
    await login({ superadmin: true, capabilities: ['USER/DISCOURSE/DISABLED-SSO'] })

    await waitFor(() =>
      expect(screen.getByText('Pilih Tujuan Login')).toBeInTheDocument(),
    )
    expect(screen.queryByText('MOCK_ADMIN_DASHBOARD')).not.toBeInTheDocument()
  })

  it('ROLE-01: non-superadmin admin, ONLY DISABLED-SSO -> /dashboard-admin', async () => {
    renderApp()
    await login({ capabilities: ['USER/DISCOURSE/DISABLED-SSO'] })

    await waitFor(() =>
      expect(screen.getByText('MOCK_ADMIN_DASHBOARD')).toBeInTheDocument(),
    )
  })

  it('ROLE-02: moderator (canAccessDiscourse), no DISABLED-SSO -> /login/choice, 2 tombol', async () => {
    renderApp()
    await login({ capabilities: ['USER/DISCOURSE/MANAGE_EXTRA_GROUPS'] })

    await waitFor(() =>
      expect(screen.getByText('Pilih Tujuan Login')).toBeInTheDocument(),
    )
    expect(screen.queryByRole('button', { name: /Dashboard/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Moderator \(Discourse\)/i })).toBeInTheDocument()
  })

  it('bug 2 fix: moderator with blocking account condition (subscription expired) -> STILL /login/choice, NOT bounced to /login', async () => {
    renderApp()
    await login({
      capabilities: ['USER/DISCOURSE/MANAGE_EXTRA_GROUPS'],
      subscription: { status: 'expired' },
    })

    await waitFor(() =>
      expect(screen.getByText('Pilih Tujuan Login')).toBeInTheDocument(),
    )
    expect(screen.queryByTestId('gate-modal')).not.toBeInTheDocument()
  })

  it('bug 2 fix: moderator with non-approved verifiedStatus (would block a member) -> STILL /login/choice', async () => {
    renderApp()
    await login({
      capabilities: ['USER/DISCOURSE/MANAGE_EXTRA_GROUPS'],
      verifiedStatus: 'waiting',
    })

    await waitFor(() =>
      expect(screen.getByText('Pilih Tujuan Login')).toBeInTheDocument(),
    )
    expect(screen.queryByTestId('gate-modal')).not.toBeInTheDocument()
  })

  it('regular member with blocking condition (pending) -> bounced to /login, gate modal shown (NO bypass regression)', async () => {
    renderApp()
    await login({ verifiedStatus: 'waiting' })

    await waitFor(() =>
      expect(screen.getByTestId('gate-modal')).toBeInTheDocument(),
    )
    expect(screen.getByTestId('gate-modal')).toHaveAttribute('data-type', 'pending')
    // Balik ke LoginPage (stub), bukan choice/dashboard.
    expect(screen.getByText('DO_LOGIN')).toBeInTheDocument()
  })

  it('regular member, suspended -> bounced to /login, gate type suspended', async () => {
    renderApp()
    await login({ suspendedUntil: '2026-08-14 13:05:00' })

    await waitFor(() =>
      expect(screen.getByTestId('gate-modal')).toBeInTheDocument(),
    )
    expect(screen.getByTestId('gate-modal')).toHaveAttribute('data-type', 'suspended')
  })

  it('regular member, healthy/active account -> webAppApi.redirectWithTokens dipanggil (unchanged)', async () => {
    subscriptionApi.getStatus.mockResolvedValueOnce({ hasActiveSubscription: true })
    renderApp()
    await login({ verifiedStatus: 'approved' })

    await waitFor(() => expect(webAppApi.redirectWithTokens).toHaveBeenCalled())
  })
})
