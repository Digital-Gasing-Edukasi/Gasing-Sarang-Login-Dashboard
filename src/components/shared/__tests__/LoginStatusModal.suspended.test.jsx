import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LoginStatusModal } from '../LoginStatusModal'

// Regresi: SuspendedModal derive durasi dari meta.until (deriveDurationFromUntil)
// saat meta.duration tidak ada — backend (SuspendModal.jsx admin) cuma kirim
// suspendedUntil absolut, TIDAK PERNAH kirim object duration.

function futureISO(msFromNow) {
  return new Date(Date.now() + msFromNow).toISOString()
}

describe('LoginStatusModal — SuspendedModal duration derivation', () => {
  it('meta.duration TIDAK ADA, meta.until di masa depan → baris "Durasi tangguhan:" tampil, tidak kosong/NaN/negatif', () => {
    const until = futureISO(2 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000) // ~2 hari 3 jam lagi
    render(<LoginStatusModal type="suspended" meta={{ until, reason: 'Spam' }} onClose={() => {}} />)

    const label = screen.getByText('Durasi tangguhan:')
    const row = label.closest('div')
    const value = row.querySelector('span:last-child')

    expect(value.textContent.trim()).not.toBe('')
    expect(value.textContent).not.toMatch(/NaN/)
    expect(value.textContent).not.toMatch(/-\d/) // tidak ada angka negatif
    // 2 hari 3 jam → unit terbesar "Hari" (dan/atau "Jam") harus muncul.
    expect(value.textContent).toMatch(/Hari|Jam/)
  })

  it('meta.duration ADA & valid → dipakai apa adanya, TIDAK ditimpa hasil derive dari meta.until', () => {
    const until = futureISO(999 * 24 * 60 * 60 * 1000) // jauh beda dari duration eksplisit
    render(
      <LoginStatusModal
        type="suspended"
        meta={{ until, duration: { day: 5, hour: 0 }, reason: 'Spam' }}
        onClose={() => {}}
      />
    )

    const label = screen.getByText('Durasi tangguhan:')
    const value = label.closest('div').querySelector('span:last-child')
    expect(value.textContent.trim()).toBe('5 Hari')
  })

  it('meta.until sudah lewat (suspensi teknisnya sudah expired tapi modal masih tampil) → tidak crash; baris Durasi disembunyikan (derive null) sesuai implementasi saat ini', () => {
    const until = new Date(Date.now() - 60 * 60 * 1000).toISOString() // 1 jam lalu
    expect(() =>
      render(<LoginStatusModal type="suspended" meta={{ until, reason: 'Spam' }} onClose={() => {}} />)
    ).not.toThrow()

    // deriveDurationFromUntil balik null saat diff<=0 → durationLabel('') → dur falsy
    // → baris "Durasi tangguhan:" TIDAK dirender sama sekali (bukan nampilin negatif/NaN).
    expect(screen.queryByText('Durasi tangguhan:')).not.toBeInTheDocument()
    // Baris lain (Alasan, Ditangguhkan hingga) tetap ada, modal tidak rusak.
    expect(screen.getByText('Alasan:')).toBeInTheDocument()
    expect(screen.getByText('Ditangguhkan hingga:')).toBeInTheDocument()
  })

  it('bentuk baru session-status (reasons[]/liftedAt/duration object) → judul alasan, durasi & tanggal tampil', () => {
    const liftMs = Date.now() + 12 * 60 * 60 * 1000 + 59 * 60 * 1000 // ~12 jam 59 mnt lagi
    render(
      <LoginStatusModal
        type="suspended"
        meta={{
          reasonCode: 'suspended',
          reasons: [
            {
              code: 'divisive_action',
              title: 'Tindakan yang berpotensi menciptakan perpecahan di dalam Komunitas',
              desc: 'Akun kamu terdeteksi melakukan tindakan yang dapat memicu konflik.',
            },
          ],
          remarks: 'Akun kamu terdeteksi melakukan tindakan yang dapat memicu konflik.',
          liftedAt: {
            unix: Math.floor(liftMs / 1000),
            utc: { raw: new Date(liftMs).toISOString() },
            local: { raw: new Date(liftMs).toISOString() },
          },
          duration: { year: 0, month: 0, day: 0, hour: 12, min: 59, sec: 0 },
        }}
        onClose={() => {}}
      />
    )

    expect(
      screen.getByText('Tindakan yang berpotensi menciptakan perpecahan di dalam Komunitas')
    ).toBeInTheDocument()
    const durLabel = screen.getByText('Durasi tangguhan:')
    expect(durLabel.closest('div').querySelector('span:last-child').textContent).toMatch(/12 Jam 59 Menit/)
    const untilLabel = screen.getByText('Ditangguhkan hingga:')
    expect(untilLabel.closest('div').querySelector('span:last-child').textContent.trim()).not.toBe('-')
  })
})
