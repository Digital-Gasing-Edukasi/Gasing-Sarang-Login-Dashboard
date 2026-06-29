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
//   trainingRegionId,             // region pelatihan pertama
//   schoolName,
//   invalid: ['name', ...],       // daftar key field yang salah (lihat FIELD_DEFS)
//   notes: { name: 'pesan', ... } // opsional: pesan bubble custom per field
// }

// Registry field yang bisa ditandai salah. Satu sumber kebenaran untuk
// RejectModal (checklist) dan FixDataPage (bubble error).
export const FIELD_DEFS = [
  { key: 'name',      label: 'Nama Lengkap' },
  { key: 'username',  label: 'Username' },
  { key: 'email',     label: 'Email' },
  { key: 'birthdate', label: 'Tanggal Lahir' },
  { key: 'region',    label: 'Lokasi Saat Ini' },
  { key: 'training',  label: 'Data Pelatihan Gasing' },
  { key: 'school',    label: 'Sekolah Asal' },
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
