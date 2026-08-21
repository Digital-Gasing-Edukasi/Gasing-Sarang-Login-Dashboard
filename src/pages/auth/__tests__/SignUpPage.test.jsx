import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { SignUpPage } from '../SignUpPage'
import { authApi, regionsApi, trainingSessionsApi } from '@/lib/api'

// jsdom tidak mengimplementasikan Pointer Capture API / scrollIntoView — dipakai
// Radix Select (@radix-ui/react-select) internal saat klik trigger/item.
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false
}
if (!Element.prototype.setPointerCapture) {
  Element.prototype.setPointerCapture = () => {}
}
if (!Element.prototype.releasePointerCapture) {
  Element.prototype.releasePointerCapture = () => {}
}
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {}
}

// Regresi: SignUpPage.handleRegister catch harus (1) tetap routing field by
// keyword seperti sebelumnya, DAN (2) tampilkan teks yang SUDAH diterjemahkan
// (translateApiError), bukan e.message mentah dari backend.

vi.mock('@/lib/api', () => ({
  authApi: { register: vi.fn() },
  regionsApi: { list: vi.fn() },
  trainingSessionsApi: { list: vi.fn() },
}))

// bad-words (Filter) dipakai SignUpPage untuk cek nama/username — tidak
// relevan buat test ini (kita mulai langsung di step 2), tidak perlu di-mock.

function setupMocks() {
  regionsApi.list.mockImplementation((params = {}) => {
    if (params.type === 'REGENCY') return Promise.resolve({ data: [{ id: '1101', name: 'Kota Test' }] })
    return Promise.resolve({ data: [{ id: '11', name: 'Prov A' }] })
  })
  trainingSessionsApi.list.mockResolvedValue({
    data: [{ id: 's1', name: 'Kota Test', startDate: '2026-01-15', regionId: '1101' }],
  })
}

// Isi semua field step 2 (birthdate, provinsi, kab/kota, kapan, dimana, sekolah)
// lalu klik "Lanjutkan" (submit register). Dimulai langsung di step 2 lewat
// location.state, jadi field step 1 (nama/username/dll) tidak perlu diisi —
// handleRegister cuma memvalidasi field step 2.
async function fillStep2AndSubmit(ue) {
  await screen.findByText('Pilih Provinsi') // provinces selesai loading (bukan lagi "Memuat...")

  await ue.click(screen.getByText('Pilih Tanggal'))

  // Radix SelectValue naruh style pointer-events:none di span placeholder-nya
  // → klik trigger lewat elemen <button> pembungkusnya, bukan teks langsung.
  await ue.click(screen.getByText('Pilih Provinsi').closest('button'))
  await ue.click(await screen.findByText('Prov A'))

  await ue.click((await screen.findByText('Pilih Kab./Kota')).closest('button'))
  await ue.click(await screen.findByText('KOTA TEST'))

  await ue.click(screen.getByText('Tahun').closest('button'))
  await ue.click(await screen.findByText('2026'))

  await ue.click(screen.getByText('Bulan').closest('button'))
  await ue.click(await screen.findByText('Januari'))

  await ue.click(screen.getByText('Pilih Daerah'))
  await ue.click(await screen.findByText('KOTA TEST', { selector: 'button' }).catch(() => screen.findByRole('option', { name: 'KOTA TEST' })))

  await ue.type(screen.getByPlaceholderText('Nama sekolah'), 'SD Test')

  const submit = screen.getByRole('button', { name: 'Lanjutkan' })
  await waitFor(() => expect(submit).not.toBeDisabled())
  await ue.click(submit)
}

describe('SignUpPage — handleRegister error translation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMocks()
  })

  it('error backend mengandung "email" → field email + teks yang SUDAH diterjemahkan (bukan mentah)', async () => {
    const ue = userEvent.setup()
    authApi.register.mockRejectedValue(new Error('Email already registered'))
    const onNavigate = vi.fn()
    const onOtpToken = vi.fn()

    render(
      <MemoryRouter initialEntries={[{ pathname: '/register', state: { step: 2 } }]}>
        <SignUpPage onNavigate={onNavigate} onOtpToken={onOtpToken} />
      </MemoryRouter>
    )

    await fillStep2AndSubmit(ue)

    await waitFor(() => expect(authApi.register).toHaveBeenCalledTimes(1))

    // Field-routing by keyword tetap jalan: balik ke step 1, error di bawah Email.
    const errText = await screen.findByText('Email sudah terdaftar. Gunakan email lain atau masuk.')
    expect(errText).toBeInTheDocument()
    // Regresi utama: BUKAN pesan mentah backend.
    expect(screen.queryByText('Email already registered')).not.toBeInTheDocument()
    expect(onNavigate).not.toHaveBeenCalled() // gagal register → tidak lanjut ke OTP
  }, 15000)
})
