import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('@/lib/api', () => ({
  webAppApi: { redirectWithTokens: vi.fn() },
  fileManagerApi: { getDownloadUrl: vi.fn(() => '#'), upload: vi.fn() },
  subscriptionApi: {
    checkoutManual: vi.fn(),
    getLatestPayment: vi.fn(),
    uploadReceipt: vi.fn(),
    getBankAccounts: vi.fn(() => Promise.resolve(null)),
  },
}))

import TransferBankPage from '../TransferBankPage'
import { webAppApi, subscriptionApi, fileManagerApi } from '@/lib/api'

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

// Regresi: form submit sekarang ikut kirim senderName/senderBank/transferDate
// sebagai extra arg ke-3 uploadReceipt (Fix: bank origin field, lihat api.js
// subscriptionApi.uploadReceipt & TransferBankPage.jsx handleSubmit).
describe('TransferBankPage - submit mengirim data bank asal ke uploadReceipt', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('memanggil uploadReceipt(paymentId, fileId, { senderName, senderBank, transferDate }) sesuai isian form', async () => {
    const ue = userEvent.setup()
    fileManagerApi.upload.mockResolvedValue({ id: 'file-1' })
    subscriptionApi.uploadReceipt.mockResolvedValue({})

    render(
      <TransferBankPage
        user={{ name: 'Test User' }}
        plan={{ name: 'Basic', months: 1, priceTotal: 100000 }}
        payment={{ id: 'payment-77', orderId: 'ORDER-77' }}
        onSignOut={() => {}}
        onBack={() => {}}
      />
    )

    await ue.type(screen.getByPlaceholderText('Contoh: Budi Santoso'), 'Budi Santoso')
    await ue.type(screen.getByPlaceholderText('BCA / Mandiri / dll'), 'BCA')

    // DateField: klik pertama kali (belum ada value) langsung emit draft default (hari ini).
    await ue.click(screen.getByRole('button', { name: 'Pilih Tanggal' }))
    const today = new Date()
    const expectedTransferDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

    const fileInput = document.querySelector('input[type="file"]')
    const file = new File(['bukti'], 'bukti.png', { type: 'image/png' })
    await ue.upload(fileInput, file)

    // Dua CTA identik ke-render (desktop inline + mobile sticky footer, CSS-hidden
    // saja) → ambil yang pertama.
    const [cta] = screen.getAllByRole('button', { name: 'Konfirmasi Pembayaran' })
    await waitFor(() => expect(cta).not.toBeDisabled())
    await ue.click(cta)

    await waitFor(() => expect(subscriptionApi.uploadReceipt).toHaveBeenCalledTimes(1))
    expect(subscriptionApi.uploadReceipt).toHaveBeenCalledWith('payment-77', 'file-1', {
      senderName: 'Budi Santoso',
      senderBank: 'BCA',
      transferDate: expectedTransferDate,
    })
  })
})

// Regresi: rekening tujuan sekarang dari master data BE (getBankAccounts),
// bukan hardcode statis. Fallback ke default kalau fetch gagal/kosong.
describe('TransferBankPage - rekening tujuan dari master data', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('render nomor rekening default dulu, lalu update begitu getBankAccounts resolve', async () => {
    subscriptionApi.getBankAccounts.mockResolvedValue({
      data: [{ accountNumber: '999888777', accountName: 'PT Master Data Baru' }],
    })

    render(
      <TransferBankPage
        user={{ name: 'Test User' }}
        plan={{ name: 'Basic', months: 1, priceTotal: 100000 }}
        payment={null}
        onSignOut={() => {}}
        onBack={() => {}}
      />
    )

    // Render pertama: fallback default (tidak kosong/blank saat fetch belum selesai).
    expect(screen.getByText('1760007700071')).toBeInTheDocument()

    // Setelah fetch resolve: tampilan berpindah ke data master dari BE.
    await waitFor(() =>
      expect(screen.getByText('999888777')).toBeInTheDocument()
    )
    expect(screen.getByText('PT Master Data Baru')).toBeInTheDocument()
  })

  it('fetch gagal → tetap tampil rekening default, tidak crash', async () => {
    subscriptionApi.getBankAccounts.mockRejectedValue(new Error('network error'))

    render(
      <TransferBankPage
        user={{ name: 'Test User' }}
        plan={{ name: 'Basic', months: 1, priceTotal: 100000 }}
        payment={null}
        onSignOut={() => {}}
        onBack={() => {}}
      />
    )

    await waitFor(() => expect(subscriptionApi.getBankAccounts).toHaveBeenCalled())
    expect(screen.getByText('1760007700071')).toBeInTheDocument()
    expect(screen.getByText('Yayasan Teknologi Indonesia Jaya')).toBeInTheDocument()
  })

  it('payment sudah bawa field rekening sendiri → prioritas di atas master data', async () => {
    subscriptionApi.getBankAccounts.mockResolvedValue({
      data: [{ accountNumber: '999888777', accountName: 'PT Master Data Baru' }],
    })

    render(
      <TransferBankPage
        user={{ name: 'Test User' }}
        plan={{ name: 'Basic', months: 1, priceTotal: 100000 }}
        payment={{ accountNumber: '111222333', accountName: 'Rekening Khusus Payment' }}
        onSignOut={() => {}}
        onBack={() => {}}
      />
    )

    await waitFor(() => expect(subscriptionApi.getBankAccounts).toHaveBeenCalled())
    expect(screen.getByText('111222333')).toBeInTheDocument()
    expect(screen.getByText('Rekening Khusus Payment')).toBeInTheDocument()
    expect(screen.queryByText('999888777')).not.toBeInTheDocument()
  })
})
