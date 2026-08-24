import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RiwayatPelatihanTable } from '../RiwayatPelatihanTable'

// DB-005 #? — nama peserta pertama di-highlight (bg-blue-50/text-blue-700) +
// sisanya diringkas "N lainnya" pakai count DINAMIS (pesertaLainnya), bukan
// hardcode "50+".
const baseRow = {
  id: 1, nama: 'Pelatihan Gasing A', daerah: 'Kab. Bogor', tglMulai: '10 Jan 2026',
  lastUpdated: '10:00', lastUpdatedMs: 1,
}

describe('RiwayatPelatihanTable — highlight peserta pertama + label "N lainnya"', () => {
  it('nama peserta pertama tampil dengan style highlight (bg-blue-50/text-blue-700)', () => {
    const row = { ...baseRow, pesertaNama: 'Budi Santoso', pesertaLainnya: 3 }
    render(<RiwayatPelatihanTable data={[row]} searchQuery="" />)

    const nameEl = screen.getByText('Budi Santoso')
    expect(nameEl.className).toContain('bg-blue-50')
    expect(nameEl.className).toContain('text-blue-700')
  })

  it('label "N lainnya" pakai count aktual (pesertaLainnya), bukan hardcode "50+"', () => {
    const row = { ...baseRow, pesertaNama: 'Budi Santoso', pesertaLainnya: 7 }
    render(<RiwayatPelatihanTable data={[row]} searchQuery="" />)

    expect(screen.getByText('7 lainnya')).toBeInTheDocument()
    expect(screen.queryByText(/50\+/)).toBeNull()
  })

  it('pesertaLainnya beda (mis. 42) -> label ikut berubah jadi "42 lainnya" (bukti dinamis, bukan hardcode)', () => {
    const row = { ...baseRow, pesertaNama: 'Budi Santoso', pesertaLainnya: 42 }
    render(<RiwayatPelatihanTable data={[row]} searchQuery="" />)

    expect(screen.getByText('42 lainnya')).toBeInTheDocument()
  })

  it('pesertaLainnya = 0 -> label "lainnya" TIDAK muncul', () => {
    const row = { ...baseRow, pesertaNama: 'Budi Santoso', pesertaLainnya: 0 }
    render(<RiwayatPelatihanTable data={[row]} searchQuery="" />)

    expect(screen.queryByText(/lainnya/)).toBeNull()
  })

  it('belum ada peserta (pesertaNama "-") -> render tombol "Lihat peserta", bukan highlight kosong', () => {
    const row = { ...baseRow, pesertaNama: '-', pesertaLainnya: 0 }
    render(<RiwayatPelatihanTable data={[row]} searchQuery="" />)

    expect(screen.getByText('Lihat peserta')).toBeInTheDocument()
  })
})
