import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LoginStatusModal } from '../LoginStatusModal'

// Modal email_unconfirmed: countdown proteksi di tombol + Log Out / Verifikasi.

describe('LoginStatusModal — email_unconfirmed', () => {
  it('waitSecs > 0 → tombol disabled dengan timer', () => {
    render(
      <LoginStatusModal
        type="email_unconfirmed"
        meta={{ waitSecs: 161 }}
        onClose={() => {}}
        onVerifyEmail={() => {}}
        verifying={false}
      />
    )

    expect(screen.getByText('Selesaikan Verifikasi Email')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Verifikasi Email \(02:41\)/ })
    ).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Log Out' })).toBeInTheDocument()
  })

  it('waitSecs 0 → tombol langsung aktif', () => {
    render(
      <LoginStatusModal
        type="email_unconfirmed"
        meta={{ waitSecs: 0 }}
        onClose={() => {}}
        onVerifyEmail={() => {}}
        verifying={false}
      />
    )

    expect(screen.getByRole('button', { name: 'Verifikasi Email' })).not.toBeDisabled()
  })

  it('Verifikasi → onVerifyEmail, Log Out → onClose; verifying → spinner + terkunci', () => {
    const onClose = vi.fn()
    const onVerifyEmail = vi.fn()
    const { rerender } = render(
      <LoginStatusModal
        type="email_unconfirmed"
        meta={{ waitSecs: 0 }}
        onClose={onClose}
        onVerifyEmail={onVerifyEmail}
        verifying={false}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Verifikasi Email' }))
    expect(onVerifyEmail).toHaveBeenCalledTimes(1)

    rerender(
      <LoginStatusModal
        type="email_unconfirmed"
        meta={{ waitSecs: 0 }}
        onClose={onClose}
        onVerifyEmail={onVerifyEmail}
        verifying={true}
      />
    )
    expect(screen.getByRole('button', { name: /Memverifikasi/ })).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: 'Log Out' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
