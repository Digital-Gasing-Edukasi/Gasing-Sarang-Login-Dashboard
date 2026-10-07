import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { SignUpPage } from '../SignUpPage'
import { authApi, regionsApi } from '@/lib/api'

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
}))

// bad-words (Filter) dipakai SignUpPage untuk cek nama/username — tidak
// relevan buat test ini (kita mulai langsung di step 2), tidak perlu di-mock.

function setupMocks() {
  regionsApi.list.mockImplementation((params = {}) => {
    if (params.type === 'REGENCY') return Promise.resolve({ data: [{ id: '1101', name: 'Kota Test' }] })
    return Promise.resolve({ data: [{ id: '11', name: 'Prov A' }] })
  })
}

// Isi semua field step 2 (birthdate, provinsi, kab/kota lokasi, provinsi,
// kab/kota pelatihan, sekolah) lalu klik "Lanjutkan" (submit register).
// Dimulai langsung di step 2 lewat location.state, jadi field step 1
// (nama/username/dll) tidak perlu diisi — handleRegister cuma memvalidasi
// field step 2.
async function fillStep2AndSubmit(ue) {
  await screen.findAllByText('Pilih Provinsi') // provinces selesai loading (bukan lagi "Memuat...")

  await ue.click(screen.getByText('Pilih Tanggal'))

  // Radix SelectValue naruh style pointer-events:none di span placeholder-nya
  // → klik trigger lewat elemen <button> pembungkusnya, bukan teks langsung.
  // Ada dua pasang provinsi/kabupaten (Lokasi + Daerah pelatihan): yang
  // pertama diisi adalah Lokasi, lalu yang masih placeholder adalah pelatihan.
  // Lokasi saat ini.
  await ue.click(screen.getAllByText('Pilih Provinsi')[0].closest('button'))
  await ue.click(await screen.findByRole('option', { name: 'Prov A' }))

  await ue.click((await screen.findAllByText('Pilih Kab./Kota'))[0].closest('button'))
  await ue.click(await screen.findByRole('option', { name: 'KOTA TEST' }))

  // Daerah pelatihan pertama (pasangan trigger kedua; yang pertama sudah terisi).
  await ue.click(screen.getByText('Pilih Provinsi').closest('button'))
  await ue.click(await screen.findByRole('option', { name: 'Prov A' }))

  await ue.click((await screen.findByText('Pilih Kab./Kota')).closest('button'))
  await ue.click(await screen.findByRole('option', { name: 'KOTA TEST' }))

  // Kapan pelatihan pertama (independen dari daerah).
  const currentYear = String(new Date().getFullYear())
  await ue.click(screen.getByText('Tahun').closest('button'))
  await ue.click(await screen.findByRole('option', { name: currentYear }))

  await ue.click(screen.getByText('Bulan').closest('button'))
  await ue.click(await screen.findByRole('option', { name: 'Januari' }))

  await ue.type(screen.getByPlaceholderText('Nama sekolah'), 'SD Test')

  const submit = screen.getByRole('button', { name: 'Lanjutkan' })
  await waitFor(() => expect(submit).not.toBeDisabled())
  await ue.click(submit)
}

describe('SignUpPage — handleRegister error translation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
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

    // Payload: tahun/bulan + firstTrainingRegionId = kab/kota pelatihan
    // yang dipilih (murni region, tanpa session).
    expect(authApi.register).toHaveBeenCalledWith(
      expect.objectContaining({
        regionId: '1101',
        firstTrainingYear: new Date().getFullYear(),
        firstTrainingMonth: 1,
        firstTrainingRegionId: '1101',
      })
    )
    expect(authApi.register.mock.calls[0][0]).not.toHaveProperty('firstTrainingSessionId')

    // Field-routing by keyword tetap jalan: balik ke step 1, error di bawah Email.
    const errText = await screen.findByText('Email sudah terdaftar. Gunakan email lain.')
    expect(errText).toBeInTheDocument()
    // Regresi utama: BUKAN pesan mentah backend.
    expect(screen.queryByText('Email already registered')).not.toBeInTheDocument()
    expect(onNavigate).not.toHaveBeenCalled() // gagal register → tidak lanjut ke OTP
  }, 15000)
})
