// Normalisasi respons `POST /auth/revise` → bentuk prefill FixDataPage.
// TODO(verify): sesuaikan nama field dengan respons `/auth/revise` yang sebenarnya
// dan desain user-side final (contoh submit backend memakai teachingGrade, tanpa
// field training — lihat ADR-0003).
export function normalizeRevise(res) {
  const u = res?.user || res?.profile || res?.data || res || {};
  // reviseReason & reviseFields ada di top-level (sibling dari `user`).
  const fields = res?.reviseFields || u.reviseFields || u.fieldsToRevise || [];
  const reason = res?.reviseReason || u.reviseReason || "";

  // Tahun/bulan pelatihan diturunkan dari firstTrainingSession.startDate bila ada
  // (nama kanonik baru; lastTrainingSession dipertahankan sbg fallback respons lama).
  const startUnix = (u.firstTrainingSession || u.lastTrainingSession)?.startDate?.unix;
  let firstTrainingYear = "";
  let firstTrainingMonth = "";
  if (startUnix) {
    const d = new Date(startUnix * 1000);
    firstTrainingYear = String(d.getFullYear());
    firstTrainingMonth = d.getMonth() + 1; // 1-based (FixDataPage mengurangi 1)
  }

  return {
    uid: u.id,
    name: u.name || "",
    username: u.username || "",
    email: u.email || "",
    birthdate:
      u.birthdate && typeof u.birthdate === "object"
        ? u.birthdate.date || ""
        : u.birthdate || "",
    regionId: u.regionId || u.region?.id || "",
    // Respons revise tidak menyertakan provinsi — dilengkapi di boot (fetch detail region).
    provinceId: u.provinceId || u.region?.parentId || "",
    firstTrainingYear,
    firstTrainingMonth,
    lastTrainingSessionId: u.firstTrainingSessionId || u.firstTrainingSession?.id || u.lastTrainingSessionId || u.lastTrainingSession?.id || "",
    schoolName: u.schoolName || "",
    // reviseFields (kosakata FE: tanggalLahir/lokasi/riwayatPelatihan/namaSekolah)
    invalid: Array.isArray(fields) ? fields : [],
    reviseReason: reason,
    notes: {},
  };
}
