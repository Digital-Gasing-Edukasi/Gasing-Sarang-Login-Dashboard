import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TolakPembayaranModal, TOLAK_REASONS } from '../PembayaranModals'

// Regresi: reason enum & notes wajib-angka dikonfirmasi dari
// komunitas-api.postman_collection (kontrak resmi BE, bukan tebakan).
describe('TolakPembayaranModal', () => {
  const candidate = { id: 'u-1', name: 'Budi' }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('value TOLAK_REASONS[0] persis "unsuficient_transfer" (ejaan BE, bukan "insufficient_transfer")', () => {
    expect(TOLAK_REASONS[0].value).toBe('unsuficient_transfer')
    expect(TOLAK_REASONS.map((r) => r.value)).toEqual([
      'unsuficient_transfer',
      'fund_not_retrieved',
      'payment_receipt_unclear',
    ])
  })

  it('alasan default "unsuficient_transfer" -> tombol Tolak disabled sampai notes angka diisi', async () => {
    const ue = userEvent.setup()
    const onConfirm = vi.fn()
    render(<TolakPembayaranModal candidate={candidate} onConfirm={onConfirm} onCancel={() => {}} />)

    const btn = screen.getByRole('button', { name: 'Tolak Pembayaran' })
    expect(btn).toBeDisabled()

    await ue.type(screen.getByPlaceholderText('Contoh: 1000000'), '1000000')
    expect(btn).not.toBeDisabled()

    await ue.click(btn)
    expect(onConfirm).toHaveBeenCalledWith({
      candidate,
      reason: 'unsuficient_transfer',
      reasonLabel: 'Transfer tidak mencukupi',
      notes: '1000000',
    })
  })

  it('notes non-angka -> tombol tetap disabled + pesan error tampil', async () => {
    const ue = userEvent.setup()
    render(<TolakPembayaranModal candidate={candidate} onConfirm={() => {}} onCancel={() => {}} />)

    await ue.type(screen.getByPlaceholderText('Contoh: 1000000'), 'abc')
    expect(screen.getByRole('button', { name: 'Tolak Pembayaran' })).toBeDisabled()
    expect(screen.getByText(/Nominal harus berupa angka saja/)).toBeInTheDocument()
  })

  it('pilih alasan "Dana tidak diterima" -> notes jadi opsional (textarea bebas), tombol langsung aktif', async () => {
    const ue = userEvent.setup()
    const onConfirm = vi.fn()
    render(<TolakPembayaranModal candidate={candidate} onConfirm={onConfirm} onCancel={() => {}} />)

    await ue.click(screen.getByText('Dana tidak diterima'))
    const btn = screen.getByRole('button', { name: 'Tolak Pembayaran' })
    expect(btn).not.toBeDisabled()

    await ue.click(btn)
    expect(onConfirm).toHaveBeenCalledWith({
      candidate,
      reason: 'fund_not_retrieved',
      reasonLabel: 'Dana tidak diterima',
      notes: '',
    })
  })

  it('ganti kandidat -> reason & notes reset ke default', async () => {
    const { rerender } = render(
      <TolakPembayaranModal candidate={candidate} onConfirm={() => {}} onCancel={() => {}} />
    )
    const ue = userEvent.setup()
    await ue.type(screen.getByPlaceholderText('Contoh: 1000000'), '500000')

    rerender(
      <TolakPembayaranModal candidate={{ id: 'u-2', name: 'Ani' }} onConfirm={() => {}} onCancel={() => {}} />
    )
    expect(screen.getByPlaceholderText('Contoh: 1000000')).toHaveValue('')
  })
})
