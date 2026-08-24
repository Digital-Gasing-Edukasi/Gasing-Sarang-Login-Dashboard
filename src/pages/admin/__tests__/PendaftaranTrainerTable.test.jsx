import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PendaftaranTrainerTable } from '../PendaftaranTrainerTable'

// DB-006 fix: badge status dulu ignore item.isActive ({expired ? 'Berakhir' : 'Aktif'}),
// sekarang harus cek isActive juga -> 'Non-Aktif' saat isActive=false & belum expired.
// Urutan prioritas: expired menang di atas isActive.
describe('PendaftaranTrainerTable - badge status', () => {
  const base = {
    id: 1,
    nama: 'Pelatihan A',
    url: '',
    threadId: '',
    periode: 'Jan 2026',
    batasWaktu: null, // no deadline -> never expired
  }

  it('isActive=true, expired=false -> badge "Aktif"', () => {
    render(
      <PendaftaranTrainerTable
        data={[{ ...base, isActive: true }]}
        onToggleStatus={() => {}}
        onDelete={() => {}}
        searchQuery=""
      />
    )
    expect(screen.getByText('Aktif')).toBeInTheDocument()
    expect(screen.queryByText('Non-Aktif')).toBeNull()
    expect(screen.queryByText('Berakhir')).toBeNull()
  })

  it('isActive=false, expired=false -> badge "Non-Aktif" (bug asli: dulu salah jadi "Aktif")', () => {
    render(
      <PendaftaranTrainerTable
        data={[{ ...base, isActive: false }]}
        onToggleStatus={() => {}}
        onDelete={() => {}}
        searchQuery=""
      />
    )
    expect(screen.getByText('Non-Aktif')).toBeInTheDocument()
    expect(screen.queryByText('Aktif')).toBeNull()
    expect(screen.queryByText('Berakhir')).toBeNull()
  })

  it('expired=true & isActive=true -> badge "Berakhir" (expired prioritas di atas isActive)', () => {
    render(
      <PendaftaranTrainerTable
        data={[{ ...base, isActive: true, batasWaktu: '2020-01-01T00:00:00Z' }]}
        onToggleStatus={() => {}}
        onDelete={() => {}}
        searchQuery=""
      />
    )
    expect(screen.getByText('Berakhir')).toBeInTheDocument()
    expect(screen.queryByText('Aktif')).toBeNull()
    expect(screen.queryByText('Non-Aktif')).toBeNull()
  })

  it('expired=true & isActive=false -> badge "Berakhir"', () => {
    render(
      <PendaftaranTrainerTable
        data={[{ ...base, isActive: false, batasWaktu: '2020-01-01T00:00:00Z' }]}
        onToggleStatus={() => {}}
        onDelete={() => {}}
        searchQuery=""
      />
    )
    expect(screen.getByText('Berakhir')).toBeInTheDocument()
    expect(screen.queryByText('Aktif')).toBeNull()
    expect(screen.queryByText('Non-Aktif')).toBeNull()
  })
})
