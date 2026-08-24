import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SetujuiAkunModal } from '../SetujuiAkunModal'

// Prioritas 5: refactor native <select> -> RoleSelect + Dropdown, dan onConfirm
// dipanggil dengan shape { discourseGroupId, firstTrainingSessionId, voucherCode }.
describe('SetujuiAkunModal', () => {
  const discourseGroups = [{ id: 5, name: 'TrainerUtama' }]
  const trainingSessions = [{ id: 7, name: 'Sesi A' }]
  const user = { id: 1, name: 'Budi', role: '', raw: {} }

  it('render pakai RoleSelect & Dropdown, bukan native <select>', () => {
    render(
      <SetujuiAkunModal
        user={user}
        discourseGroups={discourseGroups}
        trainingSessions={trainingSessions}
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    )
    // Native <select> harus tidak ada lagi.
    expect(document.querySelector('select')).toBeNull()
    expect(screen.getByText('Pilih role')).toBeInTheDocument()
    expect(screen.getByText('Pilih pelatihan')).toBeInTheDocument()
  })

  it('pilih role + pelatihan -> onConfirm dipanggil dengan shape yang benar', async () => {
    const ue = userEvent.setup()
    const onConfirm = vi.fn()
    render(
      <SetujuiAkunModal
        user={user}
        discourseGroups={discourseGroups}
        trainingSessions={trainingSessions}
        onConfirm={onConfirm}
        onCancel={() => {}}
      />
    )

    await ue.click(screen.getByText('Pilih role').closest('button'))
    await ue.click(screen.getByText('Trainer Utama'))

    await ue.click(screen.getByText('Pilih pelatihan').closest('button'))
    await ue.click(screen.getByText('Sesi A'))

    await ue.click(screen.getByRole('button', { name: 'Setujui' }))

    expect(onConfirm).toHaveBeenCalledTimes(1)
    const arg = onConfirm.mock.calls[0][0]
    expect(arg.discourseGroupId).toBe(5)
    expect(arg.firstTrainingSessionId).toBe('7')
    expect(typeof arg.voucherCode).toBe('string')
    expect(arg.voucherCode.startsWith('GASI')).toBe(true)
  })
})
