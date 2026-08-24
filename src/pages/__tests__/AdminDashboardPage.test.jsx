import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AdminDashboardPage from '../AdminDashboardPage'
import { adminApi, discourseApi, regionsApi, appConfigApi, trainingSessionsApi } from '@/lib/api'

// DB-002 #11: error handling fix — scheduleAction's catch(err){ onError(err) } harus
// meneruskan Error asli dari API ke banner, bukan cuma pesan generik hardcode.
// Full-render AdminDashboardPage (bukan unit handler) karena handler2 ini closure
// di dalam komponen, tidak diexport terpisah.

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

// subscription HARUS aktif — Manajemen tab "Disetujui" menyaring user dgn
// subscription 'Not Active' keluar (mereka masih di "Belum Langganan").
const APPROVED_USER = {
  id: 101, name: 'Budi Approved', email: 'budi@x.com', verifiedStatus: 1,
  activeSubscription: { status: 'active' },
}

function setupDefaultMocks() {
  adminApi.getUsers.mockImplementation((params = {}) => {
    if (params['filter[verifiedStatus]']) return Promise.resolve({ data: [] })
    return Promise.resolve({ data: [APPROVED_USER] })
  })
  adminApi.listManualPayments.mockResolvedValue({ data: [] })
  adminApi.getManualPaymentStats.mockResolvedValue({ data: {} })
  discourseApi.getGroups.mockResolvedValue({ data: [] })
  regionsApi.list.mockResolvedValue({ data: [] })
  appConfigApi.get.mockResolvedValue({ value: {} })
  trainingSessionsApi.list.mockResolvedValue({ data: [] })
}

// Buka tab Manajemen Akun + tunggu baris Budi muncul (data manajemen dimuat mount).
async function gotoManajemen(ue) {
  await ue.click(screen.getByRole('button', { name: /Manajemen Akun/i }))
  await screen.findByText('Budi Approved')
}

async function openRowMenu(ue, name) {
  const row = screen.getByText(name).closest('tr')
  const buttons = within(row).getAllByRole('button')
  await ue.click(buttons[buttons.length - 1])
}

// scheduleAction commit lewat setTimeout 5000ms REAL (bukan fake timers — RTL
// findBy/waitFor internal juga pakai setTimeout, gampang deadlock kalau di-fake).
const waitCommit = () => new Promise((r) => setTimeout(r, 5200))

describe('AdminDashboardPage — error handling (DB-002 #11)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupDefaultMocks()
  })

  it('handleConfirmHapusAkun: pesan error asli dari BE tampil di banner (bukan cuma generik)', async () => {
    const ue = userEvent.setup()
    adminApi.requestUserDeletion.mockRejectedValue(new Error('pesan asli dari BE'))

    render(<AdminDashboardPage user={{}} onSignOut={() => {}} />)
    await gotoManajemen(ue)
    await openRowMenu(ue, 'Budi Approved')
    await ue.click(screen.getByText('Hapus Akun'))
    await ue.click(screen.getByRole('button', { name: 'Hapus Akun' }))

    await waitCommit()

    const banner = await screen.findByText((t) => t.includes('pesan asli dari BE'))
    expect(banner).toBeInTheDocument()
    expect(banner.textContent).toContain('Gagal menghapus akun.')
  }, 10000)

  it('handleConfirmTangguhkanAkun: pesan error asli dari BE tampil di banner', async () => {
    const ue = userEvent.setup()
    adminApi.suspendUser.mockRejectedValue(new Error('pesan asli dari BE'))

    render(<AdminDashboardPage user={{}} onSignOut={() => {}} />)
    await gotoManajemen(ue)
    await openRowMenu(ue, 'Budi Approved')
    await ue.click(screen.getByText('Tangguhkan Akun'))

    // SuspendModal: pilih preset + alasan lalu submit.
    const selects = document.querySelectorAll('select')
    await ue.selectOptions(selects[0], '6h') // durasi
    await ue.selectOptions(selects[1], 'Terindikasi spam') // alasan
    await ue.click(screen.getByRole('button', { name: 'Tangguhkan' }))

    await waitCommit()

    const banner = await screen.findByText((t) => t.includes('pesan asli dari BE'))
    expect(banner).toBeInTheDocument()
    expect(banner.textContent).toContain('Gagal menangguhkan akun.')
  }, 10000)

  // Regression guard: tanpa fix, banner cuma berisi copy generik ("Gagal ...") TANPA
  // pesan asli — pastikan behavior lama itu tidak "bocor balik".
  it('regresi guard: banner TIDAK cuma generik-tanpa-alasan saat API reject', async () => {
    const ue = userEvent.setup()
    adminApi.requestUserDeletion.mockRejectedValue(new Error('koneksi database putus'))

    render(<AdminDashboardPage user={{}} onSignOut={() => {}} />)
    await gotoManajemen(ue)
    await openRowMenu(ue, 'Budi Approved')
    await ue.click(screen.getByText('Hapus Akun'))
    await ue.click(screen.getByRole('button', { name: 'Hapus Akun' }))
    await waitCommit()

    const banner = await screen.findByText((t) => t.includes('Gagal menghapus akun'))
    // Generik-only lama = persis "Gagal menghapus akun." tanpa apa-apa lagi.
    expect(banner.textContent.trim()).not.toBe('Gagal menghapus akun.')
    expect(banner.textContent).toContain('koneksi database putus')
  }, 10000)
})

// Prioritas 2: prefix voucher GASI (2x ganti berturut: VERIF→SUB di DB-003,
// SUB→GASI di DB-002). Guard genVoucherCode() di AdminDashboardPage.jsx (lokal, tidak
// diexport) via alur approve akun WAITING -> voucherCode optimistic yang dirender di
// tabel "Pending Voucher Setup".
describe('AdminDashboardPage — genVoucherCode() prefix GASI (DB-002 #? / regresi ganda)', () => {
  const WAITING_USER = { id: 301, name: 'Sari Waiting', email: 'sari@x.com', verifiedStatus: 0 }
  const GROUPS = [{ id: 5, name: 'TrainerUtama' }]
  const SESSIONS = [{ id: 7, name: 'Sesi A' }]

  beforeEach(() => {
    vi.clearAllMocks()
    setupDefaultMocks()
    adminApi.getUsers.mockImplementation((params = {}) => {
      if (params['filter[verifiedStatus]'] === 'waiting') return Promise.resolve({ data: [WAITING_USER] })
      if (params['filter[verifiedStatus]']) return Promise.resolve({ data: [] })
      return Promise.resolve({ data: [] })
    })
    discourseApi.getGroups.mockResolvedValue({ data: GROUPS })
    trainingSessionsApi.list.mockResolvedValue({ data: SESSIONS })
    adminApi.verifyUser.mockResolvedValue({})
  })

  it('approve akun WAITING -> voucherCode optimistic berawalan GASI (bukan SUB/VERIF)', async () => {
    const ue = userEvent.setup()
    render(<AdminDashboardPage user={{}} onSignOut={() => {}} />)

    await screen.findByText('Sari Waiting')
    const row = screen.getByText('Sari Waiting').closest('tr')
    const rowButtons = within(row).getAllByRole('button')
    await ue.click(rowButtons[rowButtons.length - 2]) // tombol Setujui (hijau, sebelum Tolak)

    // ApproveModal: pilih role + pelatihan.
    await ue.click(screen.getByText('Role').closest('button'))
    await ue.click(screen.getByText('Trainer Utama'))
    await ue.click(screen.getByText('Nama Pelatihan Pertama').closest('button'))
    await ue.click(screen.getByText('Sesi A'))
    await ue.click(screen.getByRole('button', { name: 'Konfirmasi' }))

    // Pindah ke sub-tab "Pending Voucher Setup" buat lihat baris hasil approve.
    await ue.click(screen.getByText('Pending Voucher Setup'))

    const voucherRow = await screen.findByText('Sari Waiting')
    const voucherText = voucherRow.closest('tr').textContent
    // Format genVoucherCode(): prefix + 6 char random base36 uppercase.
    expect(voucherText).toMatch(/GASI[A-Z0-9]{6}/)
    expect(voucherText).not.toMatch(/\bSUB[A-Z0-9]{6}\b/)
    expect(voucherText).not.toMatch(/VERIF[A-Z0-9]{6}/)
  }, 10000)
})
