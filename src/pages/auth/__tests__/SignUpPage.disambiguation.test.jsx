import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { SignUpPage } from '../SignUpPage'
import { regionsApi, trainingSessionsApi } from '@/lib/api'

// Regresi: dropdown "Dimana kamu mendapat pelatihan Gasing pertama?" (SearchableSelect,
// options = dimanaSelectOptions di SignUpPage.jsx) — kalau 2+ sesi collide ke label
// abbrevRegion sama DALAM TAHUN YANG SAMA, tambahin suffix "— <Bulan>" biar gak ambigu.
// Kalau cuma 1 sesi utk label itu, tanpa suffix.

if (!Element.prototype.hasPointerCapture) Element.prototype.hasPointerCapture = () => false
if (!Element.prototype.setPointerCapture) Element.prototype.setPointerCapture = () => {}
if (!Element.prototype.releasePointerCapture) Element.prototype.releasePointerCapture = () => {}
if (!Element.prototype.scrollIntoView) Element.prototype.scrollIntoView = () => {}

vi.mock('@/lib/api', () => ({
  authApi: { register: vi.fn() },
  regionsApi: { list: vi.fn() },
  trainingSessionsApi: { list: vi.fn() },
}))

function setupMocks(sessions) {
  regionsApi.list.mockResolvedValue({ data: [] })
  trainingSessionsApi.list.mockResolvedValue({ data: sessions })
}

async function gotoDimana(ue) {
  await screen.findByText('Pilih Provinsi') // tunggu load selesai
  await ue.click(screen.getByText('Tahun').closest('button'))
  await ue.click(await screen.findByText('2026'))
  // Dimana disabled sampai kapanYear terisi.
  await ue.click(screen.getByText('Pilih Daerah'))
}

describe('SignUpPage — disambiguasi label "Dimana" (SearchableSelect)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('2 sesi collide ke label sama dalam tahun sama → masing-masing dapat suffix bulan', async () => {
    const ue = userEvent.setup()
    setupMocks([
      { id: 's1', name: 'Kota Test', startDate: '2026-01-15' }, // Januari
      { id: 's2', name: 'Kota Test', startDate: '2026-03-10' }, // Maret
    ])

    render(
      <MemoryRouter initialEntries={[{ pathname: '/register', state: { step: 2 } }]}>
        <SignUpPage onNavigate={() => {}} onOtpToken={() => {}} />
      </MemoryRouter>
    )

    await gotoDimana(ue)

    expect(await screen.findByRole('option', { name: 'KOTA TEST — Januari' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'KOTA TEST — Maret' })).toBeInTheDocument()
    // Label polos TANPA suffix tidak boleh ada (ambigu).
    expect(screen.queryByRole('option', { name: 'KOTA TEST' })).not.toBeInTheDocument()
  })

  it('cuma 1 sesi utk label itu di tahun tsb → TANPA suffix bulan', async () => {
    const ue = userEvent.setup()
    setupMocks([
      { id: 's1', name: 'Kota Test', startDate: '2026-01-15' },
      { id: 's2', name: 'Kota Lain', startDate: '2026-05-01' },
    ])

    render(
      <MemoryRouter initialEntries={[{ pathname: '/register', state: { step: 2 } }]}>
        <SignUpPage onNavigate={() => {}} onOtpToken={() => {}} />
      </MemoryRouter>
    )

    await gotoDimana(ue)

    expect(await screen.findByRole('option', { name: 'KOTA TEST' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'KOTA LAIN' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: /KOTA TEST — /i })).not.toBeInTheDocument()
  })

  it('sesi collide tapi beda TAHUN → tidak dianggap ambigu (masing2 tahun difilter terpisah, tanpa suffix)', async () => {
    const ue = userEvent.setup()
    setupMocks([
      { id: 's1', name: 'Kota Test', startDate: '2025-06-01' }, // tahun beda, tidak ikut kefilter tahun 2026
      { id: 's2', name: 'Kota Test', startDate: '2026-03-10' },
    ])

    render(
      <MemoryRouter initialEntries={[{ pathname: '/register', state: { step: 2 } }]}>
        <SignUpPage onNavigate={() => {}} onOtpToken={() => {}} />
      </MemoryRouter>
    )

    await gotoDimana(ue)

    // Cuma sesi tahun 2026 yang tampil di dropdown (dimanaOptions difilter by kapanYear) → 1 opsi, tanpa suffix.
    expect(await screen.findByRole('option', { name: 'KOTA TEST' })).toBeInTheDocument()
  })
})
