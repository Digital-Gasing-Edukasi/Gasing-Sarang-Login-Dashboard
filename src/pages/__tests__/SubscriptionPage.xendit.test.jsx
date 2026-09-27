import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SubscriptionPage from '../SubscriptionPage'
import { subscriptionApi } from '@/lib/api'

// Alur Xendit one-time: tombol → checkout → tab baru + poll → terminal state.

vi.mock('@/lib/api', () => ({
  subscriptionApi: {
    getPlans: vi.fn(),
    checkoutXendit: vi.fn(),
    getPayment: vi.fn(),
  },
  tokenStorage: { promoteToPersistent: vi.fn() },
}))

const PKG = {
  id: 'pkg-1', name: 'Monthly', price: 39900,
  duration: 1, durationUnit: 'month', isActive: true,
}

const CHECKOUT_201 = {
  paymentId: 'pay-1',
  orderId: 'SUB-X',
  invoiceNumber: 'INV-X',
  redirectUrl: 'https://dev.xen.to/AbCdEf12',
  amount: 39900,
}

function mockTab() {
  const tab = { location: {}, close: vi.fn() }
  window.open = vi.fn(() => tab)
  return tab
}

function renderPage(props = {}) {
  return render(
    <SubscriptionPage
      user={{ name: 'Test' }}
      onSignOut={() => {}}
      onPaymentSuccess={() => {}}
      onCheckoutManual={() => {}}
      {...props}
    />
  )
}

describe('SubscriptionPage — Xendit one-time', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    subscriptionApi.getPlans.mockResolvedValue([PKG])
    mockTab()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('tombol "Bayar menggunakan Xendit" tampil di bawah "Mulai Berlangganan" (mobile + desktop)', async () => {
    renderPage()
    const mulai = await screen.findAllByRole('button', { name: 'Mulai Berlangganan' })
    const xendit = await screen.findAllByRole('button', { name: 'Bayar menggunakan Xendit' })
    expect(mulai.length).toBeGreaterThan(0)
    expect(xendit.length).toBeGreaterThan(0)
  })

  it('201 → buka tab redirect + paid di poll pertama → sukses', async () => {
    const onPaymentSuccess = vi.fn()
    subscriptionApi.checkoutXendit.mockResolvedValue(CHECKOUT_201)
    subscriptionApi.getPayment.mockResolvedValue({ status: 'paid' })
    renderPage({ onPaymentSuccess })

    const [btn] = await screen.findAllByRole('button', { name: 'Bayar menggunakan Xendit' })
    fireEvent.click(btn)

    await vi.waitFor(() => expect(subscriptionApi.checkoutXendit).toHaveBeenCalledWith('pkg-1'))
    // Tab dibuka SETELAH redirectUrl tiba (bukan tab kosong dulu).
    await vi.waitFor(() =>
      expect(window.open).toHaveBeenCalledWith(
        'https://dev.xen.to/AbCdEf12',
        '_blank',
        'noopener,noreferrer'
      )
    )
    expect(window.open).not.toHaveBeenCalledWith('about:blank', expect.anything(), expect.anything())
    await vi.waitFor(() => expect(subscriptionApi.getPayment).toHaveBeenCalledWith('pay-1'))
    await vi.waitFor(() => expect(onPaymentSuccess).toHaveBeenCalledWith('Bulanan'))
  })

  it('pending → terus polling; paid kemudian → sukses', async () => {
    const onPaymentSuccess = vi.fn()
    subscriptionApi.checkoutXendit.mockResolvedValue(CHECKOUT_201)
    subscriptionApi.getPayment
      .mockResolvedValueOnce({ status: 'pending' })
      .mockResolvedValueOnce({ status: 'pending' })
      .mockResolvedValue({ status: 'paid' })
    renderPage({ onPaymentSuccess })

    const [btn] = await screen.findAllByRole('button', { name: 'Bayar menggunakan Xendit' })
    vi.useFakeTimers()
    fireEvent.click(btn)
    await vi.advanceTimersByTimeAsync(0)
    expect(subscriptionApi.getPayment).toHaveBeenCalledTimes(1)
    expect(screen.getAllByText('Menunggu pembayaran…').length).toBeGreaterThan(0)

    await vi.advanceTimersByTimeAsync(5000)
    expect(subscriptionApi.getPayment).toHaveBeenCalledTimes(2)
    await vi.advanceTimersByTimeAsync(5000)
    expect(onPaymentSuccess).toHaveBeenCalledWith('Bulanan')
  })

  it('expired → stop + tampil retry, tanpa sukses', async () => {
    const onPaymentSuccess = vi.fn()
    subscriptionApi.checkoutXendit.mockResolvedValue(CHECKOUT_201)
    subscriptionApi.getPayment.mockResolvedValue({ status: 'expired' })
    renderPage({ onPaymentSuccess })

    const [btn] = await screen.findAllByRole('button', { name: 'Bayar menggunakan Xendit' })
    vi.useFakeTimers()
    fireEvent.click(btn)
    await vi.advanceTimersByTimeAsync(0)

    expect(screen.getAllByText('Masa pembayaran habis. Silakan buat pembayaran baru.').length).toBeGreaterThan(0)
    expect(onPaymentSuccess).not.toHaveBeenCalled()

    // Coba Lagi → reset ke idle.
    fireEvent.click(screen.getAllByRole('button', { name: 'Coba Lagi' })[0])
    expect(screen.queryByText('Masa pembayaran habis. Silakan buat pembayaran baru.')).not.toBeInTheDocument()
  })

  it('404 → stop + tampil retry', async () => {
    const err = new Error('Payment not found')
    err.status = 404
    subscriptionApi.checkoutXendit.mockResolvedValue(CHECKOUT_201)
    subscriptionApi.getPayment.mockRejectedValue(err)
    renderPage({})

    const [btn] = await screen.findAllByRole('button', { name: 'Bayar menggunakan Xendit' })
    vi.useFakeTimers()
    fireEvent.click(btn)
    await vi.advanceTimersByTimeAsync(0)

    expect(screen.getAllByText('Data pembayaran tidak ditemukan. Silakan buat pembayaran baru.').length).toBeGreaterThan(0)
  })

  it('pending-declined → stop + tampilkan alasan + link redirect lagi', async () => {
    subscriptionApi.checkoutXendit.mockResolvedValue(CHECKOUT_201)
    subscriptionApi.getPayment.mockResolvedValue({
      status: 'pending',
      failureReason: 'Kartu ditolak. Silakan gunakan kartu lain.',
    })
    renderPage({})

    const [btn] = await screen.findAllByRole('button', { name: 'Bayar menggunakan Xendit' })
    vi.useFakeTimers()
    fireEvent.click(btn)
    await vi.advanceTimersByTimeAsync(0)

    expect(screen.getAllByText('Kartu ditolak. Silakan gunakan kartu lain.').length).toBeGreaterThan(0)
    const links = screen.getAllByRole('link', { name: 'Buka Laman Pembayaran' })
    expect(links[0].getAttribute('href')).toBe('https://dev.xen.to/AbCdEf12')
    expect(screen.getAllByRole('button', { name: 'Cek Status' }).length).toBeGreaterThan(0)
  })

  it('409 → kartu resume + polling payment lama (tanpa checkout baru)', async () => {
    const err = new Error('Anda masih memiliki pembayaran pending yang belum selesai.')
    err.status = 409
    err.data = {
      message: 'Anda masih memiliki pembayaran pending yang belum selesai.',
      pendingPayment: {
        paymentId: 'pay-9',
        invoiceNumber: 'INV-9',
        amount: 39900,
        redirectUrl: 'https://link-web-staging.xendit.co/confirm',
      },
    }
    subscriptionApi.checkoutXendit.mockRejectedValue(err)
    subscriptionApi.getPayment.mockResolvedValue({ status: 'pending' })
    const onPaymentSuccess = vi.fn()
    renderPage({ onPaymentSuccess })

    const [btn] = await screen.findAllByRole('button', { name: 'Bayar menggunakan Xendit' })
    vi.useFakeTimers()
    fireEvent.click(btn)
    await vi.advanceTimersByTimeAsync(0)

    expect(screen.getAllByText('Melanjutkan pembayaran tertunda…').length).toBeGreaterThan(0)
    expect(subscriptionApi.getPayment).toHaveBeenCalledWith('pay-9')
    expect(onPaymentSuccess).not.toHaveBeenCalled()
  })

  it('paket dummy (backend mati) → ditolak dengan pesan jelas, tanpa checkout', async () => {
    subscriptionApi.getPlans.mockResolvedValue([])
    renderPage({})

    const [btn] = await screen.findAllByRole('button', { name: 'Bayar menggunakan Xendit' })
    fireEvent.click(btn)

    expect((await screen.findAllByText('Paket tidak tersedia dari server. Coba lagi nanti.')).length).toBeGreaterThan(0)
    expect(subscriptionApi.checkoutXendit).not.toHaveBeenCalled()
  })
})
