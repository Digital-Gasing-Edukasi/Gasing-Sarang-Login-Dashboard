import { describe, it, expect } from 'vitest'
import { mapToManajemen, mapToSessionParticipant, VERIFIED_STATUS } from '../mappers'

// Prioritas 1 (CRITICAL): parseManajemenStatus bug fix — REVISE(2) harus masuk
// 'Ditolak', bukan nyasar ke default 'Disetujui'. parseManajemenStatus tidak
// diexport, jadi dites lewat mapToManajemen(u).accountStatus (kontrak publik).
describe('parseManajemenStatus (via mapToManajemen.accountStatus)', () => {
  it('REVISE(2) -> Ditolak (bug fix utama)', () => {
    const u = { id: 1, verifiedStatus: VERIFIED_STATUS.REVISE }
    expect(mapToManajemen(u).accountStatus).toBe('Ditolak')
  })

  it('REVISE string "revise" -> Ditolak', () => {
    const u = { id: 2, verifiedStatus: 'revise' }
    expect(mapToManajemen(u).accountStatus).toBe('Ditolak')
  })

  it('REJECTED(-1) tetap Ditolak (regresi guard)', () => {
    const u = { id: 3, verifiedStatus: VERIFIED_STATUS.REJECTED }
    expect(mapToManajemen(u).accountStatus).toBe('Ditolak')
  })

  it('APPROVED(1) normal tetap Disetujui (guard fix ga kebablasan)', () => {
    const u = { id: 4, verifiedStatus: VERIFIED_STATUS.APPROVED }
    expect(mapToManajemen(u).accountStatus).toBe('Disetujui')
  })

  it('deletion menang di atas REVISE (prioritas flag tetap jalan)', () => {
    const u = { id: 5, verifiedStatus: VERIFIED_STATUS.REVISE, deletionPending: true }
    expect(mapToManajemen(u).accountStatus).toBe('Baru Dihapus')
  })

  it('suspended menang di atas REVISE', () => {
    const u = { id: 6, verifiedStatus: VERIFIED_STATUS.REVISE, suspended: true }
    expect(mapToManajemen(u).accountStatus).toBe('Ditangguhkan')
  })
})

// verifiedStatus mentah dibawa apa adanya — dipakai ManajemenTable/AdminDashboardPage
// buat bedain REJECTED(-1) vs REVISE(2) di tab Ditolak (guard "Setujui Akun": REVISE
// ga punya endpoint approve langsung di kontrak).
describe('mapToManajemen — verifiedStatus passthrough (dipakai guard Setujui Akun)', () => {
  it('REVISE(2) -> verifiedStatus tetap 2', () => {
    const u = { id: 7, verifiedStatus: VERIFIED_STATUS.REVISE }
    expect(mapToManajemen(u).verifiedStatus).toBe(2)
  })

  it('REJECTED(-1) -> verifiedStatus tetap -1', () => {
    const u = { id: 8, verifiedStatus: VERIFIED_STATUS.REJECTED }
    expect(mapToManajemen(u).verifiedStatus).toBe(-1)
  })
})

// DB-005 #4 — mapToSessionParticipant(): row dari GET
// /admin/training-histories/sessions/:id/participants (tabel
// training_session_participants). Status BE: active | nonactive | unreg
// (unreg = belum terdaftar / email invalid, tanpa userId).
describe('mapToSessionParticipant', () => {
  it('status active -> langganan "Aktif", userId ke-mapping', () => {
    const p = { userId: 11, name: 'Budi', email: 'budi@x.com', status: 'active' }
    const row = mapToSessionParticipant(p)
    expect(row).toMatchObject({ userId: 11, name: 'Budi', email: 'budi@x.com', status: 'active', langganan: 'Aktif' })
  })

  it('status nonactive -> langganan "Non-Aktif"', () => {
    const p = { userId: 12, name: 'Sari', email: 'sari@x.com', status: 'nonactive' }
    const row = mapToSessionParticipant(p)
    expect(row.langganan).toBe('Non-Aktif')
    expect(row.userId).toBe(12)
  })

  it('status unreg (tanpa userId, cuma email) -> langganan "Belum Terdaftar", userId null', () => {
    const p = { email: 'belum@x.com', status: 'unreg' }
    const row = mapToSessionParticipant(p)
    expect(row.langganan).toBe('Belum Terdaftar')
    expect(row.userId).toBeFalsy()
    expect(row.email).toBe('belum@x.com')
  })

  it('status kosong tapi ada p.user (nested) -> fallback nonactive + userId dari p.user.id', () => {
    const p = { user: { id: 21, name: 'Nested User', email: 'nested@x.com' } }
    const row = mapToSessionParticipant(p)
    expect(row.status).toBe('nonactive')
    expect(row.userId).toBe(21)
    expect(row.name).toBe('Nested User')
  })
})
