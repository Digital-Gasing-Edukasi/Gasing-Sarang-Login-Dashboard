import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { DaftarPesertaModal } from '../DaftarPesertaModal'
import { adminApi, trainingHistoriesApi } from '@/lib/api'

// DB-005 #4 fix — modal "Lihat peserta" pindah endpoint dari
// adminApi.getSessionParticipants (deprecated, filter[firstTrainingSessionId] gak
// ke-update oleh import CSV -> selalu kosong) ke
// trainingHistoriesApi.listSessionParticipants (query langsung tabel
// training_session_participants). Guard: modal HARUS pakai endpoint baru, dan
// TIDAK menyentuh endpoint lama sama sekali.
vi.mock('@/lib/api', () => ({
  adminApi: { getSessionParticipants: vi.fn(), updateUser: vi.fn() },
  trainingHistoriesApi: { listSessionParticipants: vi.fn() },
}))

const SESSION = { id: 99, nama: 'Pelatihan Gasing A', daerah: 'Kab. Bogor', tglMulai: '10 Jan 2026' }

const ROWS = [
  { userId: 1, name: 'Budi Aktif', email: 'budi@x.com', status: 'active' },
  { userId: 2, name: 'Sari Nonaktif', email: 'sari@x.com', status: 'nonactive' },
  { email: 'belum@x.com', status: 'unreg' }, // tanpa userId
]

describe('DaftarPesertaModal — endpoint baru (DB-005 #4)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    trainingHistoriesApi.listSessionParticipants.mockResolvedValue({ data: ROWS })
  })

  it('fetch pakai trainingHistoriesApi.listSessionParticipants (endpoint BARU), bukan adminApi.getSessionParticipants (lama)', async () => {
    render(<DaftarPesertaModal isOpen session={SESSION} onClose={() => {}} />)

    await screen.findByText('Budi Aktif')

    expect(trainingHistoriesApi.listSessionParticipants).toHaveBeenCalledWith(
      SESSION.id, expect.objectContaining({ limit: 100 })
    )
    expect(adminApi.getSessionParticipants).not.toHaveBeenCalled()
  })

  it('label Langganan render bener per status: Aktif / Non-Aktif / Belum Terdaftar', async () => {
    render(<DaftarPesertaModal isOpen session={SESSION} onClose={() => {}} />)
    await screen.findByText('Budi Aktif')

    const rowAktif = screen.getByText('Budi Aktif').closest('tr')
    const rowNonaktif = screen.getByText('Sari Nonaktif').closest('tr')
    const rowUnreg = screen.getByText('belum@x.com').closest('tr')

    expect(within(rowAktif).getByText('Aktif')).toBeInTheDocument()
    expect(within(rowNonaktif).getByText('Non-Aktif')).toBeInTheDocument()
    expect(within(rowUnreg).getByText('Belum Terdaftar')).toBeInTheDocument()
  })

  it('tombol Edit DISABLED khusus baris unreg (tanpa userId), enabled utk active/nonactive', async () => {
    render(<DaftarPesertaModal isOpen session={SESSION} onClose={() => {}} />)
    await screen.findByText('Budi Aktif')

    const rowAktif = screen.getByText('Budi Aktif').closest('tr')
    const rowNonaktif = screen.getByText('Sari Nonaktif').closest('tr')
    const rowUnreg = screen.getByText('belum@x.com').closest('tr')

    const editAktif = within(rowAktif).getByTitle('Edit peserta')
    const editNonaktif = within(rowNonaktif).getByTitle('Edit peserta')
    const editUnreg = within(rowUnreg).getByTitle('Belum terdaftar — tidak bisa diedit')

    expect(editAktif).toBeEnabled()
    expect(editNonaktif).toBeEnabled()
    expect(editUnreg).toBeDisabled()
  })
})
