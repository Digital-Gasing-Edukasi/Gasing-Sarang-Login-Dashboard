import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

vi.mock('@/lib/api', () => ({
  webAppApi: { redirectWithTokens: vi.fn() },
  fileManagerApi: { getDownloadUrl: vi.fn(() => '#'), upload: vi.fn() },
  subscriptionApi: {
    checkoutManual: vi.fn(),
    getLatestPayment: vi.fn(),
    uploadReceipt: vi.fn(),
  },
}))

import TransferBankPage from '../TransferBankPage'
import { webAppApi } from '@/lib/api'

// Regression guard: tombol "Jelajahi Sarang Gasing" di layar submitted harus
// redirect ke web app (SSO handoff), BUKAN sign out user. Bug lama:
// onClick={onSignOut} — salah pasang, bikin user ke-logout.
describe('TransferBankPage - submitted screen', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('klik "Jelajahi Sarang Gasing" redirect via webAppApi, TIDAK sign out', () => {
    const onSignOut = vi.fn()
    render(
      <TransferBankPage
        user={{ name: 'Test User' }}
        plan={{ name: 'Basic', months: 1, priceTotal: 100000 }}
        payment={null}
        onSignOut={onSignOut}
        onBack={() => {}}
        initialSubmitted={true}
        initialReceiptFileId="file-123"
      />
    )

    const btn = screen.getByRole('button', { name: 'Jelajahi Sarang Gasing' })
    fireEvent.click(btn)

    expect(webAppApi.redirectWithTokens).toHaveBeenCalledTimes(1)
    expect(onSignOut).not.toHaveBeenCalled()
  })

  it('tombol "Unduh Bukti" tampil & tidak terganggu saat ada receiptFileId', () => {
    render(
      <TransferBankPage
        user={{ name: 'Test User' }}
        plan={{ name: 'Basic', months: 1, priceTotal: 100000 }}
        payment={null}
        onSignOut={() => {}}
        onBack={() => {}}
        initialSubmitted={true}
        initialReceiptFileId="file-123"
      />
    )

    const downloadLink = screen.getByRole('link', { name: 'Unduh Bukti' })
    expect(downloadLink).toBeInTheDocument()
    expect(downloadLink).toHaveAttribute('href', '#')
  })

  // isRetry: Attempt ke-2+ (lewat gate payment_rejected -> onRenew/onReupload)
  // harus tampil "Log Out" (pakai onSignOut), BUKAN "Jelajahi Sarang Gasing".
  it('isRetry=true -> tombol "Log Out" tampil, klik panggil onSignOut, BUKAN redirect webapp', () => {
    const onSignOut = vi.fn()
    render(
      <TransferBankPage
        user={{ name: 'Test User' }}
        plan={{ name: 'Basic', months: 1, priceTotal: 100000 }}
        payment={null}
        onSignOut={onSignOut}
        onBack={() => {}}
        initialSubmitted={true}
        initialReceiptFileId="file-123"
        isRetry={true}
      />
    )

    expect(
      screen.queryByRole('button', { name: 'Jelajahi Sarang Gasing' })
    ).not.toBeInTheDocument()

    const btn = screen.getByRole('button', { name: 'Log Out' })
    fireEvent.click(btn)

    expect(onSignOut).toHaveBeenCalledTimes(1)
    expect(webAppApi.redirectWithTokens).not.toHaveBeenCalled()
  })

  it('isRetry=false (default) -> tombol "Log Out" TIDAK tampil', () => {
    render(
      <TransferBankPage
        user={{ name: 'Test User' }}
        plan={{ name: 'Basic', months: 1, priceTotal: 100000 }}
        payment={null}
        onSignOut={() => {}}
        onBack={() => {}}
        initialSubmitted={true}
        initialReceiptFileId="file-123"
      />
    )

    expect(screen.queryByRole('button', { name: 'Log Out' })).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Jelajahi Sarang Gasing' })
    ).toBeInTheDocument()
  })
})
