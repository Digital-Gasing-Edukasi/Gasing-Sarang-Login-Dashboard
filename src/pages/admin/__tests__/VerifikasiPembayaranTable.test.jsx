import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { VerifikasiPembayaranTable } from '../VerifikasiPembayaranTable'

// Prioritas 2 (empty state copy) + Prioritas 3 (line-clamp nama user).
describe('VerifikasiPembayaranTable', () => {
  it('empty state tanpa search: "Tidak Ada Antrean" + subteks', () => {
    render(
      <VerifikasiPembayaranTable
        users={[]}
        sortConfig={{}}
        onSort={() => {}}
        searchQuery=""
      />
    )
    expect(screen.getByText('Tidak Ada Antrean')).toBeInTheDocument()
    expect(screen.getByText('Belum ada akun yang masuk untuk diverifikasi')).toBeInTheDocument()
  })

  it('nama user pakai line-clamp-2 di container min-w-[160px] max-w-[240px]', () => {
    const user = {
      id: 1, name: 'Nama Panjang Sekali Untuk Uji Clamp', username: '@x',
      email: 'a@a.com', statusMember: 'Pending Verifikasi Pembayaran',
    }
    render(
      <VerifikasiPembayaranTable
        users={[user]}
        sortConfig={{}}
        onSort={() => {}}
        searchQuery=""
        subTab="menunggu"
      />
    )
    const nameEl = screen.getByText(user.name)
    expect(nameEl).toHaveClass('line-clamp-2')
    const container = nameEl.closest('div')
    expect(container).toHaveClass('min-w-[160px]', 'max-w-[240px]')
  })
})
