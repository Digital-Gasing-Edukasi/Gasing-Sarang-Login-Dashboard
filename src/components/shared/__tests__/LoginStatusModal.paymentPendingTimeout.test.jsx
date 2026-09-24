import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LoginStatusModal } from '../LoginStatusModal'

// Modal payment_pending_timeout: Log Out + Hubungi Admin (mailto).

describe('LoginStatusModal — payment_pending_timeout', () => {
  it('menampilkan judul, body, dan kedua tombol', () => {
    render(
      <LoginStatusModal type="payment_pending_timeout" meta={{}} onClose={() => {}} />
    )

    expect(screen.getByText('Pembayaran Belum Diverifikasi')).toBeInTheDocument()
    expect(
      screen.getByText(/Pembayaran kamu belum diverifikasi oleh admin dalam/)
    ).toBeInTheDocument()
    const hubungi = screen.getByRole('link', { name: 'Hubungi Admin' })
    expect(hubungi.getAttribute('href')).toMatch(/^mailto:/)
    expect(screen.getByRole('button', { name: 'Log Out' })).toBeInTheDocument()
  })

  it('Log Out → onClose', () => {
    const onClose = vi.fn()
    render(
      <LoginStatusModal type="payment_pending_timeout" meta={{}} onClose={onClose} />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Log Out' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
