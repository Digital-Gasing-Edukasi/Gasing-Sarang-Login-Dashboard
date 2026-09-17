import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useSuspendReasons } from '../useSuspendReasons'
import { adminApi } from '@/lib/api'

vi.mock('@/lib/api', () => ({
  adminApi: { getSuspendReasons: vi.fn() },
}))

const FIXTURE = [
  { code: 'spam', title: 'Terlalu banyak spam', desc: 'Akun kamu mengirim spam.' },
  { code: 'other', title: 'Lainnya', desc: 'Aktivitas tidak sesuai.' },
]

describe('useSuspendReasons (cache alasan suspend)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useSuspendReasons.getState().reset()
  })

  it('fetch sekali lalu cache — panggilan kedua tidak nembak API', async () => {
    adminApi.getSuspendReasons.mockResolvedValue(FIXTURE)

    await useSuspendReasons.getState().fetchReasons()
    await useSuspendReasons.getState().fetchReasons()

    expect(adminApi.getSuspendReasons).toHaveBeenCalledTimes(1)
    expect(useSuspendReasons.getState().reasons).toEqual(FIXTURE)
    expect(useSuspendReasons.getState().loaded).toBe(true)
  })

  it('respons terbungkus { data } tetap dinormalisasi ke array', async () => {
    adminApi.getSuspendReasons.mockResolvedValue({ data: FIXTURE })

    await useSuspendReasons.getState().fetchReasons()

    expect(useSuspendReasons.getState().reasons).toEqual(FIXTURE)
  })

  it('gagal → error tersimpan, retry bisa jalan lagi', async () => {
    adminApi.getSuspendReasons.mockRejectedValueOnce(new Error('jaringan putus'))
    await useSuspendReasons.getState().fetchReasons()
    expect(useSuspendReasons.getState().error).toBeInstanceOf(Error)
    expect(useSuspendReasons.getState().loaded).toBe(false)

    adminApi.getSuspendReasons.mockResolvedValueOnce(FIXTURE)
    await useSuspendReasons.getState().fetchReasons()
    expect(useSuspendReasons.getState().reasons).toEqual(FIXTURE)
    expect(useSuspendReasons.getState().error).toBeNull()
  })
})
