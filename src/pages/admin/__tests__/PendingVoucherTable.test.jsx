import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PendingVoucherTable } from '../PendingVoucherTable'

// Prioritas 3: line-clamp nama user + container width, sama kontrak dgn
// VerifikasiPembayaranTable.
describe('PendingVoucherTable', () => {
  it('nama user pakai line-clamp-2 di container min-w-[160px] max-w-[240px]', () => {
    const user = {
      id: 1, name: 'Nama Panjang Sekali Untuk Uji Clamp', username: '@x',
      email: 'a@a.com', voucherCode: 'ABC123',
    }
    render(
      <PendingVoucherTable
        users={[user]}
        sortConfig={{}}
        onSort={() => {}}
        onConfirm={() => {}}
        searchQuery=""
      />
    )
    const nameEl = screen.getByText(user.name)
    expect(nameEl).toHaveClass('line-clamp-2')
    const container = nameEl.closest('div')
    expect(container).toHaveClass('min-w-[160px]', 'max-w-[240px]')
  })
})
