// src/lib/fixLink.js
// ─── Kontrak link "Perbaikan Data" (FE-only, self-contained di URL) ────────────
//
// Alur:
//   1. Admin menolak akun + mencentang field yang salah (RejectModal).
//   2. Backend mengirim email berisi link: <origin>/?fix=<payload>
//   3. <payload> = base64url(JSON) dari objek FixPayload di bawah.
//   4. FixDataPage men-decode payload, prefill form, dan menandai field invalid.
//
// FixPayload = {
//   uid,                          // id user (dikirim balik saat resubmit)
//   name, username, email,        // data akun
//   birthdate,                    // 'YYYY-MM-DD'
//   regionId, provinceId,         // lokasi saat ini
//   firstTrainingYear,            // number
//   firstTrainingMonth,           // number 1-12
//   lastTrainingSessionId,        // id session pelatihan
//   firstTrainingRegionId,        // region pelatihan pertama (nama kanonik; lihat SignUpPage)
//   schoolName,
//   invalid: ['birthdate', ...],  // daftar key field yang salah (lihat FIELD_DEFS)
//   notes: { name: 'pesan', ... } // opsional: pesan bubble custom per field
// }

// Registry field yang bisa ditandai salah oleh admin (checklist RejectModal).
// Key ini dikirim ke backend sebagai `fieldsToRevise` (opaque — FE yang menentukan
// artinya, lihat ADR-0003).
// Catatan:
//   - Identity (Nama/Username/Email) sengaja tidak ada: form perbaikan tidak
//     menampilkannya, jadi tidak boleh ditandai.
//   - 'lainnya' BUKAN field form user. Mencentangnya mengubah aksi jadi TOLAK FINAL
//     (status 'rejected'): memunculkan textarea "Catatan Tambahan" → rejectedReason,
//     dan checklist field lain diabaikan. Tanpa 'lainnya' = status 'revise'.
// Key HARUS sama dengan `reviseFields` yang dikembalikan backend (kosakata FE, dipakai
// admin saat kirim fieldsToRevise DAN user-side saat menandai field merah). Contoh
// respons backend: ["tanggalLahir","lokasi","riwayatPelatihan","namaSekolah"].
export const FIELD_DEFS = [
  { key: 'tanggalLahir',     label: 'Tanggal Lahir' },
  { key: 'lokasi',           label: 'Lokasi' },
  { key: 'riwayatPelatihan', label: 'Riwayat Pelatihan' },
  { key: 'namaSekolah',      label: 'Nama Sekolah' },
  { key: 'lainnya',          label: 'Lainnya' },
]

export const FIELD_LABEL = Object.fromEntries(FIELD_DEFS.map((f) => [f.key, f.label]))

// base64url unicode-safe (btoa/atob hanya latin1).
function toBase64Url(str) {
  const b64 = btoa(unescape(encodeURIComponent(str)))
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(b64url) {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/')
  const pad = b64.length % 4 ? '='.repeat(4 - (b64.length % 4)) : ''
  return decodeURIComponent(escape(atob(b64 + pad)))
}

export function encodeFixPayload(payload) {
  return toBase64Url(JSON.stringify(payload))
}

export function decodeFixPayload(token) {
  try {
    const obj = JSON.parse(fromBase64Url(token))
    if (!obj || typeof obj !== 'object' || !Array.isArray(obj.invalid)) return null
    return obj
  } catch {
    return null
  }
}

export function buildFixUrl(payload, origin = window.location.origin) {
  return `${origin}/?fix=${encodeFixPayload(payload)}`
}

// Pesan bubble default kalau admin tidak menulis catatan khusus.
export function defaultFieldMessage(key) {
  return `${FIELD_LABEL[key] || 'Data ini'} tidak sesuai. Mohon perbaiki.`
}
