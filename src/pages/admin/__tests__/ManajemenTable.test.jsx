import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ManajemenTable } from '../ManajemenTable'

// Guard turunan dari fix parseManajemenStatus (REVISE(2) sekarang ikut masuk tab
// Ditolak). REVISE ga punya endpoint approve langsung di kontrak (cuma "unreject"
// yang sah, dan itu cuma valid dari REJECTED(-1)) — jadi tombol "Setujui Akun" harus
// disembunyikan khusus baris REVISE, baris REJECTED tetap dapat tombolnya.
describe('ManajemenTable — guard "Setujui Akun" tab Ditolak', () => {
  const base = { email: 'x@x.com', accountStatus: 'Ditolak' }
  const rejected = { ...base, id: 1, name: 'Budi Rejected', verifiedStatus: -1 }
  const revise   = { ...base, id: 2, name: 'Sari Revise',   verifiedStatus: 2 }

  async function openRowMenu(name) {
    const ue = userEvent.setup()
    const row = screen.getByText(name).closest('tr')
    const buttons = within(row).getAllByRole('button')
    await ue.click(buttons[buttons.length - 1]) // tombol aksi "..." = terakhir di baris
  }

  it('baris REJECTED(-1) tetap punya "Setujui Akun"', async () => {
    render(
      <ManajemenTable
        users={[rejected]}
        sortConfig={{}} onSort={() => {}} searchQuery=""
        activeFilter="Ditolak" onActionClick={() => {}}
      />
    )
    await openRowMenu('Budi Rejected')
    expect(screen.getByText('Setujui Akun')).toBeInTheDocument()
    expect(screen.getByText('Hapus Akun')).toBeInTheDocument()
  })

  it('baris REVISE(2) TIDAK punya "Setujui Akun" (cuma Hapus Akun)', async () => {
    render(
      <ManajemenTable
        users={[revise]}
        sortConfig={{}} onSort={() => {}} searchQuery=""
        activeFilter="Ditolak" onActionClick={() => {}}
      />
    )
    await openRowMenu('Sari Revise')
    expect(screen.queryByText('Setujui Akun')).toBeNull()
    expect(screen.getByText('Hapus Akun')).toBeInTheDocument()
  })
})
