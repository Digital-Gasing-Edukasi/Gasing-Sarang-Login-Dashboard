import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import SubscriptionPage from '../SubscriptionPage'
import { subscriptionApi, webAppApi } from '@/lib/api'

vi.mock('@/lib/api', () => ({
  subscriptionApi: {
    getPlans: vi.fn(),
    getLatestPayment: vi.fn(),
    getBankAccounts: vi.fn(() => Promise.resolve(null)),
  },
  tokenStorage: { promoteToPersistent: vi.fn() },
  fileManagerApi: { getDownloadUrl: vi.fn(() => '#') },
  webAppApi: { redirectWithTokens: vi.fn() },
}))

describe('SubscriptionPage — pending payment / waiting admin confirmation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    subscriptionApi.getPlans.mockResolvedValue([
      {
        id: 'pkg-1',
        name: 'Monthly',
        price: 39900,
        duration: 1,
        durationUnit: 'month',
        isActive: true,
      },
    ])
  })

  it('renders TransferBankPage with submitted=true when user has pending payment waiting for verification', async () => {
    subscriptionApi.getLatestPayment.mockResolvedValue({
      id: 'pay-pending-1',
      orderId: 'ORDER-PENDING-99',
      status: 'pending',
      amount: 396000,
      receiptFileId: 'rec-file-123',
      package: {
        id: 'pkg-yearly',
        name: 'Yearly',
        price: 396000,
        duration: 1,
        durationUnit: 'year',
      },
    })

    render(
      <SubscriptionPage
        user={{ name: 'Budi' }}
        onSignOut={() => {}}
        onPaymentSuccess={() => {}}
        onCheckoutManual={() => {}}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Pembayaran Berhasil!')).toBeInTheDocument()
    })

    expect(screen.getByText('ID: ORDER-PENDING-99')).toBeInTheDocument()
    expect(screen.getByText('Rp396.000')).toBeInTheDocument()
    expect(screen.getByText('Jelajahi Sarang Gasing')).toBeInTheDocument()
    expect(screen.getByText('Unduh Bukti')).toBeInTheDocument()
  })

  it('renders normal SubscriptionPage when no pending payment', async () => {
    subscriptionApi.getLatestPayment.mockResolvedValue({})

    render(
      <SubscriptionPage
        user={{ name: 'Budi' }}
        onSignOut={() => {}}
        onPaymentSuccess={() => {}}
        onCheckoutManual={() => {}}
      />
    )

    await waitFor(() => {
      expect(screen.queryByText('Pembayaran Berhasil!')).not.toBeInTheDocument()
    })
    expect(screen.getAllByRole('button', { name: 'Mulai Berlangganan' }).length).toBeGreaterThan(0)
  })
})
