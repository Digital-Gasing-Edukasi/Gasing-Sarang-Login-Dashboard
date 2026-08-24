import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { KonfirmasiVoucherModal } from '../VoucherModals'

// Prioritas 4: tombol Konfirmasi disabled pakai opacity-30 (bukan class disabled lama).
describe('KonfirmasiVoucherModal - tombol disabled state', () => {
  it('sebelum copy: tombol disabled, class opacity-30 ada', () => {
    const candidate = { name: 'Budi', voucherCode: 'XYZ999' }
    render(<KonfirmasiVoucherModal candidate={candidate} onConfirm={() => {}} onCancel={() => {}} />)
    const btn = screen.getByRole('button', { name: 'Konfirmasi' })
    expect(btn).toBeDisabled()
    expect(btn).toHaveClass('opacity-30')
  })
})
