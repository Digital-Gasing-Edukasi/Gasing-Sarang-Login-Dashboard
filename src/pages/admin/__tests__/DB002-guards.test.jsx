import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ManajemenTable } from '../ManajemenTable'
import { VerifikasiTable } from '../VerifikasiTable'
import { ManajemenControls } from '../TableControls'
import { Dropdown } from '../ConfirmModal'
import { SetujuiAkunModal } from '../SetujuiAkunModal'

// Prioritas 3: checkbox bulk-select DIHAPUS dari Manajemen Akun, TETAP ADA di
// Verifikasi Akun (VerifikasiTable). Guard 2 arah biar ga ada yang kebablasan kehapus.
describe('DB-002 #6 — checkbox bulk-select: hilang di Manajemen, tetap ada di Verifikasi', () => {
  const manajemenUser = { id: 1, name: 'Budi Manajemen', email: 'budi@x.com', accountStatus: 'Disetujui' }
  const verifikasiUser = { id: 2, name: 'Sari Verifikasi', email: 'sari@x.com', status: 'Pending' }

  it('ManajemenTable: TIDAK ada kolom checkbox (colSpan 19, header tanpa checkbox)', () => {
    render(
      <ManajemenTable
        users={[manajemenUser]}
        sortConfig={{}} onSort={() => {}} searchQuery=""
        activeFilter="Disetujui" onActionClick={() => {}}
      />
    )
    // Tidak ada <input type="checkbox"> maupun tombol toggle-select di baris manapun.
    expect(document.querySelectorAll('input[type="checkbox"]').length).toBe(0)
    const row = screen.getByText('Budi Manajemen').closest('tr')
    // Sel pertama baris = kolom Nama Pengguna langsung (bukan kolom checkbox).
    expect(within(row).getAllByRole('cell')[0].textContent).toContain('Budi Manajemen')
  })

  it('VerifikasiTable: checkbox bulk-select MASIH ADA (onToggleSelect terpanggil saat diklik)', async () => {
    const ue = userEvent.setup()
    const onToggleSelect = vi.fn()
    render(
      <VerifikasiTable
        users={[verifikasiUser]}
        sortConfig={{}} onSort={() => {}} searchQuery=""
        onApprove={() => {}} onReject={() => {}}
        selectedIds={[]} onToggleSelect={onToggleSelect}
        onToggleSelectAll={() => {}} allSelected={false}
      />
    )
    const row = screen.getByText('Sari Verifikasi').closest('tr')
    const selectBtn = within(row).getAllByRole('button')[0] // tombol checkbox = kolom pertama
    await ue.click(selectBtn)
    expect(onToggleSelect).toHaveBeenCalledWith(2)
  })
})

// Prioritas 4: filter drawer Manajemen — tombol "Terapkan" disabled kalau semua draft
// filter kosong, enabled begitu ada 1 dicentang.
describe('DB-002 — ManajemenControls filter drawer "Terapkan" disabled state', () => {
  function renderControls() {
    return render(
      <ManajemenControls
        activeFilter="Disetujui" onFilterChange={() => {}}
        selectedRoles={[]} onRolesChange={() => {}}
        selectedSubscriptions={[]} onSubscriptionsChange={() => {}}
        selectedPlans={[]} onPlansChange={() => {}}
        searchQuery="" onSearchChange={() => {}}
        onExport={() => {}}
      />
    )
  }

  it('Terapkan disabled saat semua draft filter kosong', async () => {
    const ue = userEvent.setup()
    renderControls()
    // Buka drawer filter (tombol ikon Filter, satu-satunya tanpa aria-label tapi
    // satu-satunya button di luar tab/search/export dengan className filter icon).
    const filterBtn = document.querySelector('button.shrink-0.shadow-sm')
    await ue.click(filterBtn)
    const terapkan = screen.getByText('Terapkan').closest('button')
    expect(terapkan).toBeDisabled()
  })

  it('Terapkan enabled begitu 1 filter draft dicentang', async () => {
    const ue = userEvent.setup()
    renderControls()
    const filterBtn = document.querySelector('button.shrink-0.shadow-sm')
    await ue.click(filterBtn)
    await ue.click(screen.getByText('Aktif')) // CheckRow Langganan "Aktif"
    const terapkan = screen.getByText('Terapkan').closest('button')
    expect(terapkan).not.toBeDisabled()
  })
})

// Prioritas 5: Dropdown "Nama Pelatihan" (dipakai ApproveModal/SetujuiAkunModal) diberi
// max-height lebih besar (~8 item scroll) + overflow-auto. Assert class-nya murah &
// bermakna (bukan cuma toBeDefined) — max-h-[320px] cukup buat ~8 baris @40px.
describe('DB-002 #5 — Dropdown pelatihan max-height + scroll', () => {
  it('panel opsi punya class max-h-[320px] overflow-auto', async () => {
    const ue = userEvent.setup()
    const options = Array.from({ length: 10 }, (_, i) => ({ value: i, label: `Sesi ${i}` }))
    render(<Dropdown value="" onChange={() => {}} options={options} placeholder="Pilih" />)
    await ue.click(screen.getByText('Pilih').closest('button'))
    const panel = screen.getByText('Sesi 0').closest('div[class*="max-h"]')
    expect(panel).not.toBeNull()
    expect(panel.className).toContain('max-h-[320px]')
    expect(panel.className).toContain('overflow-auto')
  })
})

// Prioritas 6: tombol "Salin" kode voucher di SetujuiAkunModal manggil onCopyVoucher
// (dipakai parent buat munculin toast konfirmasi — DB-002 #10).
describe('DB-002 #10 — SetujuiAkunModal salin voucher -> onCopyVoucher', () => {
  it('klik "Salin" -> onCopyVoucher dipanggil dgn kode voucher (prefix GASI)', async () => {
    const ue = userEvent.setup()
    const onCopyVoucher = vi.fn()
    const user = { id: 1, name: 'Budi', role: '', raw: {} }
    render(
      <SetujuiAkunModal
        user={user}
        onConfirm={() => {}} onCancel={() => {}}
        onCopyVoucher={onCopyVoucher}
      />
    )
    await ue.click(screen.getByText('Salin').closest('button'))
    expect(onCopyVoucher).toHaveBeenCalledTimes(1)
    const code = onCopyVoucher.mock.calls[0][0]
    expect(code.startsWith('GASI')).toBe(true)
  })
})
