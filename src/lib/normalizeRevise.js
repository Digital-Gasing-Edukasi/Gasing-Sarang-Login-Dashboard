// Normalisasi respons `POST /auth/revise` → bentuk prefill FixDataPage.
// TODO(verify): sesuaikan nama field dengan respons `/auth/revise` yang sebenarnya
// dan desain user-side final (contoh submit backend memakai teachingGrade, tanpa
// field training — lihat ADR-0003).
export function normalizeRevise(res) {
  const u = res?.user || res?.profile || res?.data || res || {};
  // reviseReason & reviseFields ada di top-level (sibling dari `user`).
  const fields = res?.reviseFields || u.reviseFields || u.fieldsToRevise || [];
  const reason = res?.reviseReason || u.reviseReason || "";

  // Tahun/bulan pelatihan: prefer field datar profil (firstTrainingYear/Month,
  // month 1-based); fallback ke firstTrainingSession.startDate.unix (pola lama)
  // bila field datar kosong.
  const startUnix = (u.firstTrainingSession || u.lastTrainingSession)?.startDate?.unix;
  let firstTrainingYear = u.firstTrainingYear ?? u.first_training_year ?? "";
  let firstTrainingMonth = u.firstTrainingMonth ?? u.first_training_month ?? "";
  if ((firstTrainingYear == null || firstTrainingMonth == null) && startUnix) {
    const d = new Date(startUnix * 1000);
    if (!firstTrainingYear) firstTrainingYear = d.getFullYear();
    if (!firstTrainingMonth) firstTrainingMonth = d.getMonth() + 1; // 1-based (FixDataPage mengurangi 1)
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
    // Region pelatihan pertama (kab/kota) — prefill "Daerah pelatihan pertama?".
    // Sesi pelatihan tak lagi dipakai (pengganti region), jadi field session
    // sengaja tidak diteruskan.
    firstTrainingRegionId: u.firstTrainingRegionId ?? u.first_training_region_id ?? null,
    schoolName: u.schoolName || "",
    // reviseFields (kosakata FE: tanggalLahir/lokasi/riwayatPelatihan/namaSekolah)
    invalid: Array.isArray(fields) ? fields : [],
    reviseReason: reason,
    notes: {},
  };
}
