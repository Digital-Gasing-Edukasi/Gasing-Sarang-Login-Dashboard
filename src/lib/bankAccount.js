// src/lib/bankAccount.js
//
// Rekening tujuan transfer manual — sumber data dinamis dari master data BE
// (subscriptionApi.getBankAccounts(), endpoint publik GET /bank-accounts).
// Bentuk field dikonfirmasi dari komunitas-api.postman_collection (Bank
// Accounts > Admin - Create Bank Account): { bankName, accountNumber,
// accountHolderName, description, isActive }. GET /bank-accounts (publik)
// mengembalikan array bank account yang isActive=true — belum dikonfirmasi
// apakah dibungkus { data: [...] } atau array langsung, jadi parsing di sini
// tetap defensif untuk kedua bentuk + nama field lama sebagai fallback.
// Kalau fetch gagal atau bentuknya gak dikenali, fallback ke DEFAULT_BANK.
import { subscriptionApi } from "./api";

export const DEFAULT_BANK = {
  bankName: "Bank Mandiri",
  accountNumber: "1760007700071",
  accountName: "Yayasan Teknologi Indonesia Jaya",
};

function normalizeBankAccount(raw) {
  if (!raw) return null;
  const container = raw.data ?? raw.bankAccounts ?? raw.items ?? raw;
  const entry = Array.isArray(container) ? container[0] : container;
  if (!entry || typeof entry !== "object") return null;

  const bankName = entry.bankName ?? entry.bank_name ?? entry.bank;
  const accountNumber =
    entry.accountNumber ?? entry.account_number ?? entry.vaNumber ?? entry.number;
  // accountHolderName = nama field resmi (dikonfirmasi Postman collection).
  // accountName/bankAccountName/name dipertahankan sbg fallback kompatibilitas
  // kalau ada respons versi lama.
  const accountName =
    entry.accountHolderName ??
    entry.account_holder_name ??
    entry.accountName ??
    entry.account_name ??
    entry.bankAccountName ??
    entry.name;

  if (!accountNumber || !accountName) return null;
  return {
    bankName: bankName ? String(bankName) : DEFAULT_BANK.bankName,
    accountNumber: String(accountNumber),
    accountName: String(accountName),
  };
}

// Ambil rekening tujuan aktif. Selalu resolve (tidak pernah reject) —
// pemanggil cukup pakai hasilnya langsung, fallback sudah ditangani di sini.
export async function fetchBankAccount() {
  try {
    const raw = await subscriptionApi.getBankAccounts();
    return normalizeBankAccount(raw) || DEFAULT_BANK;
  } catch {
    return DEFAULT_BANK;
  }
}
