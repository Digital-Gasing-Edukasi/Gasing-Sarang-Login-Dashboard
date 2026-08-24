import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AdminDashboardPage from '../AdminDashboardPage'
import { adminApi, discourseApi, regionsApi, appConfigApi, trainingSessionsApi } from '@/lib/api'

// DB-005 #10: toast global (1 state utk semua tab) dulu nyangkut kalau ganti tab
// sebelum auto-dismiss 5s (mis. toast "Pendaftaran Trainer"/approve masih nempel
// pas pindah ke Riwayat Pelatihan). Fix: handleTabChange sekarang setToast(null).

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

const WAITING_USER = { id: 301, name: 'Sari Waiting', email: 'sari@x.com', verifiedStatus: 0 }
const GROUPS = [{ id: 5, name: 'TrainerUtama' }]
const SESSIONS = [{ id: 7, name: 'Sesi A' }]

function setupDefaultMocks() {
  adminApi.getUsers.mockImplementation((params = {}) => {
    if (params['filter[verifiedStatus]'] === 'waiting') return Promise.resolve({ data: [WAITING_USER] })
    if (params['filter[verifiedStatus]']) return Promise.resolve({ data: [] })
    return Promise.resolve({ data: [] })
  })
  adminApi.listManualPayments.mockResolvedValue({ data: [] })
  adminApi.getManualPaymentStats.mockResolvedValue({ data: {} })
  discourseApi.getGroups.mockResolvedValue({ data: GROUPS })
  regionsApi.list.mockResolvedValue({ data: [] })
  appConfigApi.get.mockResolvedValue({ value: {} })
  trainingSessionsApi.list.mockResolvedValue({ data: SESSIONS })
  adminApi.verifyUser.mockResolvedValue({})
}

// Approve WAITING user via ApproveModal -> toast "Akun Sari Waiting telah disetujui"
// muncul optimistic (SEBELUM scheduleAction commit 5s, jadi tidak perlu tunggu API).
async function triggerApproveToast(ue) {
  await screen.findByText('Sari Waiting')
  const row = screen.getByText('Sari Waiting').closest('tr')
  const rowButtons = within(row).getAllByRole('button')
  await ue.click(rowButtons[rowButtons.length - 2]) // tombol Setujui (hijau, sebelum Tolak)

  await ue.click(screen.getByText('Role').closest('button'))
  await ue.click(screen.getByText('Trainer Utama'))
  await ue.click(screen.getByText('Nama Pelatihan Pertama').closest('button'))
  await ue.click(screen.getByText('Sesi A'))
  await ue.click(screen.getByRole('button', { name: 'Konfirmasi' }))

  await screen.findByText((t) => t.includes('telah disetujui'))
}

// scheduleAction commit lewat setTimeout 5000ms REAL (bukan fake timers — RTL
// findBy/waitFor internal juga pakai setTimeout, gampang deadlock kalau di-fake).
const waitCommit = () => new Promise((r) => setTimeout(r, 5200))

describe('AdminDashboardPage — toast clear saat ganti tab (fix DB-005 #10)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupDefaultMocks()
  })

  it('toast dari tab Verifikasi Akun HILANG setelah pindah ke Riwayat Pelatihan', async () => {
    const ue = userEvent.setup()
    render(<AdminDashboardPage user={{}} onSignOut={() => {}} />)

    await triggerApproveToast(ue)
    expect(screen.getByText((t) => t.includes('telah disetujui'))).toBeInTheDocument()

    await ue.click(screen.getByRole('button', { name: /Riwayat Pelatihan/i }))

    expect(screen.queryByText((t) => t.includes('telah disetujui'))).toBeNull()
  }, 10000)

  // Guard FE: handleTabChange SENGAJA cuma setToast(null) (tampilan), TIDAK
  // clearTimeout(toastTimeoutId) — supaya scheduleAction (commit API delayed 5s,
  // undo-window) tetap jalan di background walau tab udah pindah sebelum 5 detik.
  // Kalau fix ini kebablasan ikut clearTimeout, verifyUser TIDAK akan pernah
  // terpanggil setelah pindah tab -> guard ini nangkep regresi itu.
  it('scheduleAction TETAP commit API walau tab dipindah sebelum 5 detik (bukan ikut ke-cancel)', async () => {
    const ue = userEvent.setup()
    render(<AdminDashboardPage user={{}} onSignOut={() => {}} />)

    await triggerApproveToast(ue)
    await ue.click(screen.getByRole('button', { name: /Riwayat Pelatihan/i }))

    await waitCommit()

    expect(adminApi.verifyUser).toHaveBeenCalledWith(
      WAITING_USER.id,
      expect.objectContaining({ status: 'approved' })
    )
  }, 10000)
})
