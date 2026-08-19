import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TypedDeleteConfirmModal } from '../AccountActionModals'

// DB-006: modal konfirmasi hapus reuse pola ketik "DELETE" (dipakai jg buat
// Hapus Pelatihan pendaftaran-trainer). Submit disabled sampai teks persis DELETE.
describe('TypedDeleteConfirmModal', () => {
  it('tombol submit disabled sebelum ketik apapun', () => {
    render(
      <TypedDeleteConfirmModal
        title="Yakin Hapus Pelatihan Ini?"
        itemName="Pelatihan A"
        confirmLabel="Hapus Pelatihan"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    )
    expect(screen.getByRole('button', { name: 'Hapus Pelatihan' })).toBeDisabled()
  })

  it('tetap disabled kalau teks salah (lowercase "delete")', async () => {
    const ue = userEvent.setup()
    render(
      <TypedDeleteConfirmModal
        title="Yakin Hapus Pelatihan Ini?"
        itemName="Pelatihan A"
        confirmLabel="Hapus Pelatihan"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    )
    await ue.type(screen.getByPlaceholderText('DELETE'), 'delete')
    expect(screen.getByRole('button', { name: 'Hapus Pelatihan' })).toBeDisabled()
  })

  it('tetap disabled kalau teks mirip tapi bukan persis "DELETE" (mis. "DELETE ")', async () => {
    const ue = userEvent.setup()
    render(
      <TypedDeleteConfirmModal
        title="Yakin Hapus Pelatihan Ini?"
        itemName="Pelatihan A"
        confirmLabel="Hapus Pelatihan"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    )
    await ue.type(screen.getByPlaceholderText('DELETE'), 'DELETEX')
    expect(screen.getByRole('button', { name: 'Hapus Pelatihan' })).toBeDisabled()
  })

  it('enabled setelah ketik "DELETE" persis', async () => {
    const ue = userEvent.setup()
    render(
      <TypedDeleteConfirmModal
        title="Yakin Hapus Pelatihan Ini?"
        itemName="Pelatihan A"
        confirmLabel="Hapus Pelatihan"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    )
    await ue.type(screen.getByPlaceholderText('DELETE'), 'DELETE')
    expect(screen.getByRole('button', { name: 'Hapus Pelatihan' })).toBeEnabled()
  })

  it('klik Batalkan -> onCancel terpanggil, onConfirm TIDAK terpanggil', async () => {
    const ue = userEvent.setup()
    const onConfirm = vi.fn()
    const onCancel = vi.fn()
    render(
      <TypedDeleteConfirmModal
        title="Yakin Hapus Pelatihan Ini?"
        itemName="Pelatihan A"
        confirmLabel="Hapus Pelatihan"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    )
    await ue.type(screen.getByPlaceholderText('DELETE'), 'DELETE')
    await ue.click(screen.getByRole('button', { name: 'Batalkan' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('klik confirm setelah ketik DELETE -> onConfirm terpanggil', async () => {
    const ue = userEvent.setup()
    const onConfirm = vi.fn()
    render(
      <TypedDeleteConfirmModal
        title="Yakin Hapus Pelatihan Ini?"
        itemName="Pelatihan A"
        confirmLabel="Hapus Pelatihan"
        onConfirm={onConfirm}
        onCancel={() => {}}
      />
    )
    await ue.type(screen.getByPlaceholderText('DELETE'), 'DELETE')
    await ue.click(screen.getByRole('button', { name: 'Hapus Pelatihan' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })
})
