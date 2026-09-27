import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { SignUpOtpPage } from '../SignUpOtpPage'
import { authApi, tokenStorage } from '@/lib/api'

// Aliran login-provisional: email belum dikenal (datang belakangan via resend),
// cooldown awal dari backup sessionStorage (proteksi BE, bukan 180 detik).

vi.mock('@/lib/api', () => ({
  authApi: { confirmEmail: vi.fn(), resendOtp: vi.fn() },
  tokenStorage: { clear: vi.fn() },
}))

describe('SignUpOtpPage — provisional (tanpa email awal)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
  })

  it('tanpa email → info email disembunyikan', () => {
    render(
      <SignUpOtpPage onNavigate={() => {}} otpToken="tok-1" email="" onOtpToken={() => {}} />
    )

    expect(screen.queryByText('Masukkan kode yang telah kami kirimkan ke email')).not.toBeInTheDocument()
    // Form OTP tetap tampil normal.
    expect(document.querySelectorAll('input')).toHaveLength(6)
  })

  it('dengan email → info email tampil seperti biasa', () => {
    render(
      <SignUpOtpPage onNavigate={() => {}} otpToken="tok-1" email="user@test.com" onOtpToken={() => {}} />
    )

    expect(screen.getByText('Masukkan kode yang telah kami kirimkan ke email')).toBeInTheDocument()
  })

  it('cooldown awal ikut backup (8 detik, bukan 180)', () => {
    sessionStorage.setItem(
      'otp-session',
      JSON.stringify({ token: 'tok-1', email: '', cooldownSecs: 100 })
    )

    render(
      <SignUpOtpPage onNavigate={() => {}} otpToken="tok-1" email="" onOtpToken={() => {}} />
    )

    // Resend terkunci dengan sisa backup: 100 detik = 01:40 (mobile + desktop).
    expect(screen.getAllByText('01:40').length).toBeGreaterThan(0)
  })

  it('resend memakai email dari respons BE', async () => {
    sessionStorage.setItem(
      'otp-session',
      JSON.stringify({ token: 'tok-1', email: '', cooldownSecs: null })
    )
    // useCountdown real 180s di-mock expired via prop? Tidak — dengan cooldown
    // null, backup kosong → RESEND_COOLDOWN penuh. Untuk test ini, paksa
    // cooldown 0 lewat backup agar tombol langsung tampil.
    sessionStorage.setItem(
      'otp-session',
      JSON.stringify({ token: 'tok-1', email: '', cooldownSecs: 1 })
    )
    authApi.resendOtp.mockResolvedValue({
      token: 'tok-2',
      email: 't*******1@email.com',
    })
    const onOtpToken = vi.fn()
    const props = (email) => ({
      onNavigate: () => {},
      otpToken: 'tok-1',
      email,
      onOtpToken,
    })

    const { rerender } = render(<SignUpOtpPage {...props('')} />)

    // Tunggu cooldown 1 detik habis → tombol Kirim Ulang tampil.
    const [resendBtn] = await screen.findAllByRole('button', { name: 'Kirim Ulang' }, { timeout: 5000 })
    fireEvent.click(resendBtn)

    await waitFor(() => expect(onOtpToken).toHaveBeenCalledWith('tok-2', 't*******1@email.com'))
    // App meneruskan email baru sebagai prop (simulasi re-render) → blok email tampil.
    rerender(<SignUpOtpPage {...props('t*******1@email.com')} />)
    expect(screen.getByText('Masukkan kode yang telah kami kirimkan ke email')).toBeInTheDocument()
  })

  it('verify sukses asal login → dialog 1x24 jam (bukan review)', async () => {
    sessionStorage.setItem(
      'otp-session',
      JSON.stringify({ token: 'tok-1', email: 'user@test.com', cooldownSecs: null, origin: 'login' })
    )
    sessionStorage.setItem('signup-draft', JSON.stringify({ step: 2 }))
    authApi.confirmEmail.mockResolvedValue({})
    const onNavigate = vi.fn()
    const onVerified = vi.fn()

    const { container } = render(
      <SignUpOtpPage onNavigate={onNavigate} otpToken="tok-1" email="user@test.com" onOtpToken={() => {}} onVerified={onVerified} />
    )
    const inputs = container.querySelectorAll('input')
    inputs.forEach((inp, i) => fireEvent.change(inp, { target: { value: String(i) } }))
    fireEvent.click(screen.getByRole('button', { name: 'Konfirmasi' }))

    await waitFor(() => expect(screen.getByText('Verifikasi Berhasil!')).toBeInTheDocument())
    expect(onNavigate).not.toHaveBeenCalledWith('signup-review')
    expect(onVerified).toHaveBeenCalled()

    // Kembali ke Login → bersih total + nav login.
    fireEvent.click(screen.getByRole('button', { name: 'Kembali ke Login' }))
    expect(tokenStorage.clear).toHaveBeenCalled()
    expect(sessionStorage.getItem('otp-session')).toBeNull()
    expect(sessionStorage.getItem('signup-draft')).toBeNull()
    expect(onNavigate).toHaveBeenCalledWith('login')
  })

  it('verify sukses asal register → tetap ke review', async () => {
    sessionStorage.setItem(
      'otp-session',
      JSON.stringify({ token: 'tok-1', email: 'user@test.com', cooldownSecs: null, origin: 'register' })
    )
    authApi.confirmEmail.mockResolvedValue({})
    const onNavigate = vi.fn()

    const { container } = render(
      <SignUpOtpPage onNavigate={onNavigate} otpToken="tok-1" email="user@test.com" onOtpToken={() => {}} onVerified={() => {}} />
    )
    const inputs = container.querySelectorAll('input')
    inputs.forEach((inp, i) => fireEvent.change(inp, { target: { value: String(i) } }))

    // Dua CTA identik (mobile + desktop, CSS-hidden saja) — ambil yang pertama.
    const [cta] = screen.getAllByRole('button', { name: 'Konfirmasi' })
    fireEvent.click(cta)

    await waitFor(() => expect(onNavigate).toHaveBeenCalledWith('signup-review'))
    expect(screen.queryByText('Verifikasi Berhasil!')).not.toBeInTheDocument()
  })
})
