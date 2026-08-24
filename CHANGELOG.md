# Changelog

All notable changes to the Login Dashboard will be documented in this file.

## [Unreleased]

### Added
- **403 Forbidden handler at Login:** Added interceptor in `LoginPage.jsx` to catch 403 status code when a rejected user attempts to log in. The error message is parsed to extract the specific reasons for rejection and pass them to the `RejectedModal`.
- **Instructional text for rejected users:** Added the text `* Cek email anda untuk daftar ulang.` inside `RejectedModal` to guide rejected users to check their email for registration instructions.

### Changed
- **Account Verification Flow (Path 1):** Both final reject and revision requests now result in `verifiedStatus = -1` (Rejected) in the backend. 
- **Rejected Modal Actions:** Removed the "Daftar Ulang" (Re-register) button from the `RejectedModal` component. The "Log Out" button has been promoted to a primary, full-width action button.
- **Admin Dashboard Mappers:** Modified `parseManajemenStatus` in `mappers.js` to only map `verifiedStatus = -1` to the "Ditolak" (Rejected) tab. `verifiedStatus = 2` (Revise) is now reserved exclusively for payment rejection and is mapped under "Disetujui" (Approved) since the main account verification was successful.
- **Setujui Akun API Payload:** Adjusted the payload in `handleConfirmSetujuiAkun` (Admin Dashboard) to conditionally send `{ status: "unreject" }` without extra fields when approving an account that has a previous status of "Ditolak". If the account is being approved for the first time, it continues to send the full payload (`{ status: "approved", discourseGroupId, firstTrainingSessionId }`).
- **Case-insensitive verifiedStatus check:** Normalized `verifiedStatus` string values to lowercase in `loginGate.js` to handle both lowercase and uppercase variants (e.g. `'REJECTED'`) sent from the backend.
