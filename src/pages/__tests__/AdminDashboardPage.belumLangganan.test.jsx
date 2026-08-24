import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AdminDashboardPage from '../AdminDashboardPage'
import { adminApi, discourseApi, regionsApi, appConfigApi, trainingSessionsApi } from '@/lib/api'

// Regresi: sub-tab "Belum Langganan" harus dedupe terhadap user yang sudah
// submit bukti bayar (nongol di pembayaranMenunggu ATAU pembayaranDitolak) —
// jangan dobel-tampil. Fix: AdminDashboardPage.jsx `belumLangganan` filter
// exclude by Set of p.userId matched against u.id.

vi.mock('@/lib/api', () => ({
  adminApi: {
    getUsers: vi.fn(),
    getUser: vi.fn(),
    verifyUser: vi.fn(),
    rejectUser: vi.fn(),
    reviseUser: vi.fn(),
    requestUserDeletion: vi.fn(),
    cancelUserDeletion: vi.fn(),
    deleteUserPermanent: vi.fn(),
    suspendUser: vi.fn(),
    unsuspendUser: vi.fn(),
    grantPersonalVoucher: vi.fn(),
    updateDiscourseGroup: vi.fn(),
    listManualPayments: vi.fn(),
    getManualPaymentStats: vi.fn(),
    approveManualPayment: vi.fn(),
    rejectManualPayment: vi.fn(),
    createTrainingSession: vi.fn(),
    deleteTrainingSession: vi.fn(),
    updateTrainingSession: vi.fn(),
  },
  discourseApi: { getGroups: vi.fn() },
  regionsApi: { list: vi.fn() },
  appConfigApi: { get: vi.fn(), set: vi.fn() },
  trainingSessionsApi: { list: vi.fn() },
  trainingHistoriesApi: { upload: vi.fn(), push: vi.fn() },
  queueApi: { waitJob: vi.fn() },
}))

// Semua verifiedStatus:1, tanpa subscription aktif → accountStatus 'Disetujui',
// subscription 'Not Active' → satisfy predikat dasar "Belum Langganan".
const USER_KEEP    = { id: 201, name: 'Ani Belum Langganan', email: 'ani@x.com', verifiedStatus: 1 }
const USER_MENUNGGU = { id: 202, name: 'Budi Sudah Upload',   email: 'budi@x.com', verifiedStatus: 1 }
const USER_DITOLAK  = { id: 203, name: 'Citra Ditolak',        email: 'citra@x.com', verifiedStatus: 1 }

function setupMocks() {
  adminApi.getUsers.mockImplementation((params = {}) => {
    if (params['filter[verifiedStatus]']) return Promise.resolve({ data: [] })
    return Promise.resolve({ data: [USER_KEEP, USER_MENUNGGU, USER_DITOLAK] })
  })
  adminApi.listManualPayments.mockImplementation(({ filter } = {}) => {
    if (filter === 'receipt_uploaded') {
      return Promise.resolve({ data: [{ id: 'pay-menunggu', status: 'receipt_uploaded', user: USER_MENUNGGU }] })
    }
    if (filter === 'rejected') {
      return Promise.resolve({ data: [{ id: 'pay-ditolak', status: 'rejected', user: USER_DITOLAK }] })
    }
    return Promise.resolve({ data: [] })
  })
  adminApi.getManualPaymentStats.mockResolvedValue({ data: {} })
  discourseApi.getGroups.mockResolvedValue({ data: [] })
  regionsApi.list.mockResolvedValue({ data: [] })
  appConfigApi.get.mockResolvedValue({ value: {} })
  trainingSessionsApi.list.mockResolvedValue({ data: [] })
}

async function gotoBelumLangganan(ue) {
  await ue.click(screen.getByRole('button', { name: /Verifikasi Pembayaran/i }))
  await ue.click(screen.getByRole('button', { name: /Belum Langganan/i }))
}

describe('AdminDashboardPage — Verifikasi Pembayaran "Belum Langganan" dedupe', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMocks()
  })

  it('user yang juga ada di pembayaranMenunggu / pembayaranDitolak TIDAK muncul di Belum Langganan', async () => {
    const ue = userEvent.setup()
    render(<AdminDashboardPage user={{}} onSignOut={() => {}} />)

    await gotoBelumLangganan(ue)

    // User yang belum submit bukti sama sekali → tetap tampil.
    expect(await screen.findByText('Ani Belum Langganan')).toBeInTheDocument()
    // User yang sudah nongol di list pembayaran (menunggu/ditolak) → di-exclude.
    expect(screen.queryByText('Budi Sudah Upload')).not.toBeInTheDocument()
    expect(screen.queryByText('Citra Ditolak')).not.toBeInTheDocument()
  })

  it('user yang satisfy predikat dasar TANPA nongol di list pembayaran manapun tetap muncul (tidak over-exclude)', async () => {
    const ue = userEvent.setup()
    render(<AdminDashboardPage user={{}} onSignOut={() => {}} />)

    await gotoBelumLangganan(ue)

    const row = (await screen.findByText('Ani Belum Langganan')).closest('tr')
    expect(row).toBeInTheDocument()
    expect(within(row).getByText('ani@x.com')).toBeInTheDocument()
  })
})
