import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FixDataPage } from '../FixDataPage'
import { authApi, regionsApi, trainingSessionsApi, tokenStorage } from '@/lib/api'

// submitRevise butuh token: reviseToken (JWT email) diutamakan; aliran Daftar
// Ulang tak punya itu → fallback accessToken sesi saat ini.

// jsdom tidak mengimplementasikan Pointer Capture API / scrollIntoView — dipakai
// Select internal saat klik trigger/item.
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

vi.mock('@/lib/api', () => ({
  authApi: { submitRevise: vi.fn() },
  regionsApi: { list: vi.fn(), get: vi.fn() },
  trainingSessionsApi: { list: vi.fn() },
  tokenStorage: { getAccess: vi.fn() },
}))

const FIX_DATA = {
  uid: 'u-1',
  name: 'Tes register ulang',
  username: 'test_regisulang',
  email: 'test_regisulang@email.com',
  birthdate: '1995-01-01',
  schoolName: 'Nice',
  provinceId: 'p-1',
  regionId: 'r-1',
  firstTrainingYear: 2026,
  firstTrainingMonth: 3,
  lastTrainingSessionId: 's-1',
  invalid: [],
  notes: {},
}

function setupMocks() {
  regionsApi.list.mockImplementation((params = {}) => {
    if (params.type === 'REGENCY') {
      return Promise.resolve({ data: [{ id: 'r-1', regionName: 'Kab Test' }] })
    }
    return Promise.resolve({ data: [{ id: 'p-1', regionName: 'Prov Test' }] })
  })
  regionsApi.get.mockResolvedValue({ data: { id: 'r-1', parentId: 'p-1' } })
  trainingSessionsApi.list.mockResolvedValue({
    data: [{ id: 's-1', name: 'Kab Test', startDate: '2026-03-10', regionId: 'r-1' }],
  })
  authApi.submitRevise.mockResolvedValue({})
}

describe('FixDataPage — token submitRevise', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMocks()
  })

  it('tanpa reviseToken → pakai accessToken sesi', async () => {
    const ue = userEvent.setup()
    tokenStorage.getAccess.mockReturnValue('access-123')

    render(<FixDataPage fixData={FIX_DATA} reviseToken="" onNavigate={() => {}} />)

    const [cta] = await screen.findAllByRole('button', { name: 'Kirim Perbaikan Data' })
    await waitFor(() => expect(cta).not.toBeDisabled())
    await ue.click(cta)

    await waitFor(() => expect(authApi.submitRevise).toHaveBeenCalledTimes(1))
    expect(authApi.submitRevise).toHaveBeenCalledWith(
      expect.objectContaining({ token: 'access-123' })
    )
  })

  it('dengan reviseToken → token email dipakai (bukan accessToken)', async () => {
    const ue = userEvent.setup()
    tokenStorage.getAccess.mockReturnValue('access-123')

    render(<FixDataPage fixData={FIX_DATA} reviseToken="jwt-dari-email" onNavigate={() => {}} />)

    const [cta] = await screen.findAllByRole('button', { name: 'Kirim Perbaikan Data' })
    await waitFor(() => expect(cta).not.toBeDisabled())
    await ue.click(cta)

    await waitFor(() => expect(authApi.submitRevise).toHaveBeenCalledTimes(1))
    expect(authApi.submitRevise).toHaveBeenCalledWith(
      expect.objectContaining({ token: 'jwt-dari-email' })
    )
  })
})
