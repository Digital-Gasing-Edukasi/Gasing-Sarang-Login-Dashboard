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

  it('verify sukses asal login → tetap ke review (sama seperti register)', async () => {
    sessionStorage.setItem(
      'otp-session',
      JSON.stringify({ token: 'tok-1', email: 'user@test.com', cooldownSecs: null, origin: 'login' })
    )
    authApi.confirmEmail.mockResolvedValue({})
    const onNavigate = vi.fn()
    const onVerified = vi.fn()

    const { container } = render(
      <SignUpOtpPage onNavigate={onNavigate} otpToken="tok-1" email="user@test.com" onOtpToken={() => {}} onVerified={onVerified} />
    )
    const inputs = container.querySelectorAll('input')
    inputs.forEach((inp, i) => fireEvent.change(inp, { target: { value: String(i) } }))
    fireEvent.click(screen.getByRole('button', { name: 'Konfirmasi' }))

    await waitFor(() => expect(onNavigate).toHaveBeenCalledWith('signup-review'))
    expect(onVerified).toHaveBeenCalled()
  })

  it('double-click Konfirmasi → confirmEmail sekali (anti double-submit)', async () => {
    sessionStorage.setItem(
      'otp-session',
      JSON.stringify({ token: 'tok-1', email: 'user@test.com', cooldownSecs: null, origin: 'login' })
    )
    // Resolusi lambat agar dua klik jatuh dalam satu tick (lolos state loading).
    authApi.confirmEmail.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({}), 50))
    )

    const { container } = render(
      <SignUpOtpPage onNavigate={() => {}} otpToken="tok-1" email="user@test.com" onOtpToken={() => {}} onVerified={() => {}} />
    )
    const inputs = container.querySelectorAll('input')
    inputs.forEach((inp, i) => fireEvent.change(inp, { target: { value: String(i) } }))
    const [cta] = screen.getAllByRole('button', { name: 'Konfirmasi' })
    fireEvent.click(cta)
    fireEvent.click(cta)

    await waitFor(() => expect(authApi.confirmEmail).toHaveBeenCalledTimes(1))
  })

  it('REGRESI: App mengosongkan otpToken sesudah sukses → guard diam (tidak logout/nav login)', async () => {
    // Race nyata: onVerified (App clearOtpToken) + onNavigate review jalan
    // beriringan; render peralihan ber-prop kosong sempat menendang ke login.
    sessionStorage.setItem(
      'otp-session',
      JSON.stringify({ token: 'tok-1', email: 'user@test.com', cooldownSecs: null, origin: 'register' })
    )
    authApi.confirmEmail.mockResolvedValue({})
    const onNavigate = vi.fn()
    const props = (otpToken) => ({
      onNavigate,
      otpToken,
      email: 'user@test.com',
      onOtpToken: () => {},
      onVerified: () => {},
    })

    const { container, rerender } = render(<SignUpOtpPage {...props('tok-1')} />)
    const inputs = container.querySelectorAll('input')
    inputs.forEach((inp, i) => fireEvent.change(inp, { target: { value: String(i) } }))
    const [cta] = screen.getAllByRole('button', { name: 'Konfirmasi' })
    fireEvent.click(cta)

    await waitFor(() => expect(onNavigate).toHaveBeenCalledWith('signup-review'))

    // Simulasi App membersihkan state OTP sesudah sukses (prop jadi kosong).
    tokenStorage.clear.mockClear()
    onNavigate.mockClear()
    rerender(<SignUpOtpPage {...props('')} />)

    // Guard mount-only: tidak ada logout paksa / redirect login susulan.
    expect(tokenStorage.clear).not.toHaveBeenCalled()
    expect(onNavigate).not.toHaveBeenCalledWith('login')
  })
})
