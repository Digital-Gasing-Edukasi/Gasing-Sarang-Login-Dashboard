import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LoginStatusModal } from '../LoginStatusModal'

// Modal revision_required (shared DecisionModal dengan rejected): titles
// sebagai list + tombol Log Out / Daftar Ulang.

const META = {
  reasonCode: 'revision_required',
  message: 'Your account verification requires revisions before it can be approved',
  fields: [
    {
      field: 'tanggalLahir',
      title: 'Tanggal Lahir Tidak Sesuai',
      description: 'Pastikan tanggal lahir yang kamu daftarkan sesuai data diri kamu.',
    },
  ],
}

describe('LoginStatusModal — revision_required', () => {
  it('menampilkan titles sebagai list + tombol', () => {
    render(<LoginStatusModal type="revision_required" meta={META} onClose={() => {}} onReregister={() => {}} />)

    expect(screen.getByText('Akun Belum Dapat Disetujui')).toBeInTheDocument()
    expect(screen.getByText('Tanggal Lahir Tidak Sesuai')).toBeInTheDocument()
    expect(screen.getByText('Alasan penolakan:')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Daftar Ulang' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Log Out' })).toBeInTheDocument()
  })

  it('tombol Daftar Ulang → onReregister, Log Out → onClose', () => {
    const onClose = vi.fn()
    const onReregister = vi.fn()
    render(<LoginStatusModal type="revision_required" meta={META} onClose={onClose} onReregister={onReregister} />)

    fireEvent.click(screen.getByRole('button', { name: 'Daftar Ulang' }))
    expect(onReregister).toHaveBeenCalledTimes(1)
    expect(onClose).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Log Out' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('tanpa fields → list tidak dirender, modal tidak crash', () => {
    render(<LoginStatusModal type="revision_required" meta={{ message: 'Perbaiki datamu.' }} onClose={() => {}} onReregister={() => {}} />)

    expect(screen.queryByText('Alasan penolakan:')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Daftar Ulang' })).toBeInTheDocument()
  })
})
