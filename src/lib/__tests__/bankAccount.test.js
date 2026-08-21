import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../api', () => ({
  subscriptionApi: { getBankAccounts: vi.fn() },
}))

import { fetchBankAccount, DEFAULT_BANK } from '../bankAccount'
import { subscriptionApi } from '../api'

describe('fetchBankAccount', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('parse bentuk resmi (bankName, accountNumber, accountHolderName) dari Postman collection', async () => {
    subscriptionApi.getBankAccounts.mockResolvedValue([
      { bankName: 'Bank Mandiri', accountNumber: '123', accountHolderName: 'Bank A' },
    ])
    expect(await fetchBankAccount()).toEqual({
      bankName: 'Bank Mandiri', accountNumber: '123', accountName: 'Bank A',
    })
  })

  it('parse bentuk dibungkus { data: [...] }', async () => {
    subscriptionApi.getBankAccounts.mockResolvedValue({
      data: [{ bankName: 'Bank BCA', accountNumber: '456', accountHolderName: 'Bank B' }],
    })
    expect(await fetchBankAccount()).toEqual({
      bankName: 'Bank BCA', accountNumber: '456', accountName: 'Bank B',
    })
  })

  it('parse bentuk objek tunggal (bukan array)', async () => {
    subscriptionApi.getBankAccounts.mockResolvedValue({
      bankName: 'Bank BNI', accountNumber: '789', accountHolderName: 'Bank C',
    })
    expect(await fetchBankAccount()).toEqual({
      bankName: 'Bank BNI', accountNumber: '789', accountName: 'Bank C',
    })
  })

  it('nama field snake_case juga kebaca', async () => {
    subscriptionApi.getBankAccounts.mockResolvedValue([
      { bank_name: 'Bank BRI', account_number: '321', account_holder_name: 'Bank D' },
    ])
    expect(await fetchBankAccount()).toEqual({
      bankName: 'Bank BRI', accountNumber: '321', accountName: 'Bank D',
    })
  })

  it('fallback nama field lama (accountName) kalau accountHolderName gak ada', async () => {
    subscriptionApi.getBankAccounts.mockResolvedValue([
      { accountNumber: '555', accountName: 'Bank E' },
    ])
    expect(await fetchBankAccount()).toEqual({
      bankName: DEFAULT_BANK.bankName, accountNumber: '555', accountName: 'Bank E',
    })
  })

  it('bankName hilang → fallback ke DEFAULT_BANK.bankName, accountNumber/accountName tetap dari respons', async () => {
    subscriptionApi.getBankAccounts.mockResolvedValue([
      { accountNumber: '999', accountHolderName: 'Bank F' },
    ])
    expect(await fetchBankAccount()).toEqual({
      bankName: DEFAULT_BANK.bankName, accountNumber: '999', accountName: 'Bank F',
    })
  })

  it('respons kosong/null → fallback DEFAULT_BANK', async () => {
    subscriptionApi.getBankAccounts.mockResolvedValue(null)
    expect(await fetchBankAccount()).toEqual(DEFAULT_BANK)
  })

  it('respons array kosong → fallback DEFAULT_BANK', async () => {
    subscriptionApi.getBankAccounts.mockResolvedValue([])
    expect(await fetchBankAccount()).toEqual(DEFAULT_BANK)
  })

  it('field wajib hilang (cuma accountNumber, tanpa nama pemilik) → fallback DEFAULT_BANK', async () => {
    subscriptionApi.getBankAccounts.mockResolvedValue([{ accountNumber: '123' }])
    expect(await fetchBankAccount()).toEqual(DEFAULT_BANK)
  })

  it('fetch throw error → fallback DEFAULT_BANK, tidak reject', async () => {
    subscriptionApi.getBankAccounts.mockRejectedValue(new Error('network down'))
    await expect(fetchBankAccount()).resolves.toEqual(DEFAULT_BANK)
  })
})
