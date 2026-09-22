import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LoginStatusModal } from '../LoginStatusModal'

// Modal payment_review: tombol Jelajahi Sarang Gasing (handoff web app, hanya
// dalam masa grace via meta.canExplore) + Log Out.

describe('LoginStatusModal — payment_review', () => {
  it('canExplore → menampilkan judul + kedua tombol', () => {
    render(<LoginStatusModal type="payment_review" meta={{ canExplore: true }} onClose={() => {}} onExplore={() => {}} />)

    expect(screen.getByText('Pembayaran Sedang Kami Tinjau')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Jelajahi Sarang Gasing' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Log Out' })).toBeInTheDocument()
  })

  it('Jelajahi → onExplore, Log Out → onClose', () => {
    const onClose = vi.fn()
    const onExplore = vi.fn()
    render(<LoginStatusModal type="payment_review" meta={{ canExplore: true }} onClose={onClose} onExplore={onExplore} />)

    fireEvent.click(screen.getByRole('button', { name: 'Jelajahi Sarang Gasing' }))
    expect(onExplore).toHaveBeenCalledTimes(1)
    expect(onClose).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Log Out' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('lewat grace (canExplore falsy) → Jelajahi disembunyikan, Log Out tetap ada', () => {
    render(<LoginStatusModal type="payment_review" meta={{ canExplore: false }} onClose={() => {}} onExplore={() => {}} />)

    expect(screen.queryByRole('button', { name: 'Jelajahi Sarang Gasing' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Log Out' })).toBeInTheDocument()
  })
})
