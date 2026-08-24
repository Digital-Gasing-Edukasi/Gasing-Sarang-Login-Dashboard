import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SignUpOtpPage } from '../SignUpOtpPage'
import { authApi } from '@/lib/api'

// Regresi: SignUpOtpPage — jalur gagal verify-OTP (status generik, bukan
// 400/401/422) DAN jalur gagal resend-OTP (bukan 429) harus tampilkan teks
// yang SUDAH diterjemahkan (translateApiError), bukan e.message mentah.

vi.mock('@/lib/api', () => ({
  authApi: { confirmEmail: vi.fn(), resendOtp: vi.fn() },
}))

// useCountdown real (120s) bikin tombol "Kirim ulang kode" baru muncul setelah
// waktu itu habis — mock supaya langsung expired (fokus ke behavior error di sini).
vi.mock('@/hooks/useCountdown', () => ({
  useCountdown: () => ({ display: '00:00', expired: true, reset: vi.fn() }),
}))

function fillOtp(container) {
  // OtpInput render 6 kotak <input>; isi semua biar handleVerify jalan (length===6).
  const inputs = container.querySelectorAll('input')
  inputs.forEach((inp, i) => fireEvent.change(inp, { target: { value: String(i) } }))
}

describe('SignUpOtpPage — error translation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('verify OTP gagal dgn status generik (bkn 400/401/422) → teks error yang SUDAH diterjemahkan', async () => {
    const ue = userEvent.setup()
    const err = new Error('Too many requests')
    err.status = 500
    authApi.confirmEmail.mockRejectedValue(err)

    const { container } = render(
      <SignUpOtpPage onNavigate={() => {}} otpToken="tok-1" email="user@test.com" onOtpToken={() => {}} />
    )
    fillOtp(container)

    await ue.click(screen.getByRole('button', { name: 'Konfirmasi' }))

    const alertEl = await screen.findByRole('alert')
    expect(alertEl.textContent).toBe('Terlalu banyak permintaan. Tunggu sebentar lalu coba lagi.')
    expect(alertEl.textContent).not.toBe('Too many requests')
  })

  it('verify OTP gagal dgn status 400/401/422 → tetap wording seragam "Kode OTP tidak valid" (bukan translateApiError)', async () => {
    const ue = userEvent.setup()
    const err = new Error('some raw invalid code message')
    err.status = 400
    authApi.confirmEmail.mockRejectedValue(err)

    const { container } = render(
      <SignUpOtpPage onNavigate={() => {}} otpToken="tok-1" email="user@test.com" onOtpToken={() => {}} />
    )
    fillOtp(container)

    await ue.click(screen.getByRole('button', { name: 'Konfirmasi' }))

    const alertEl = await screen.findByRole('alert')
    expect(alertEl.textContent).toBe('Kode OTP tidak valid. Coba lagi.')
  })

  it('resend OTP gagal (bukan 429) → teks error yang SUDAH diterjemahkan', async () => {
    // expired=true (default state useCountdown) supaya tombol "Kirim ulang kode" tampil & aktif.
    const err = new Error('expired session token')
    err.status = 500
    authApi.resendOtp.mockRejectedValue(err)

    render(
      <SignUpOtpPage onNavigate={() => {}} otpToken="tok-1" email="user@test.com" onOtpToken={() => {}} />
    )

    // Dua tombol identik ke-render (desktop footer + mobile inline, CSS-hidden saja).
    const [resendBtn] = await screen.findAllByRole('button', { name: 'Kirim ulang kode' })
    fireEvent.click(resendBtn)

    await waitFor(() => {
      const alertEl = screen.queryByText('Sesi atau kode sudah kedaluwarsa. Silakan coba lagi.')
      expect(alertEl).toBeInTheDocument()
    })
    expect(screen.queryByText('expired session token')).not.toBeInTheDocument()
  })
})
