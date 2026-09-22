// Bangun prefill FixDataPage ("Daftar Ulang") dari respons session-status
// revision_required: { data: { fields: [{ field, title, description }] } } +
// profil user (hasil GET /profile/me) untuk nilai saat ini.
//
// Pemetaan field user MENGIKUTI normalizeRevise (aliran email /register/revise):
// regionId ← regionId/region.id, provinsi dilengkapi via regionsApi.get,
// tahun/bulan ← field datar firstTrainingYear/Month (fallback
// firstTrainingSession.startDate.unix), sesi ← ids (fallback lastTraining*).
//
// Bentuk keluaran mengikuti kosakata FixDataPage: identity (name/username/
// email dikirim ulang apa adanya), nilai prefill (birthdate/schoolName/
// region/province/pelatihan), serta penanda error { invalid, notes } yang
// dibaca initialErrors (disaring CORRECTABLE_KEYS di sana).
export function buildRevisionFixData(profile, fields = []) {
  const u = profile?.user || profile?.data || profile || {};
  const list = Array.isArray(fields) ? fields : [];

  const invalid = [];
  const notes = {};
  for (const f of list) {
    const key = f?.field;
    if (!key) continue;
    invalid.push(key);
    notes[key] = f.description || f.title || 'Data kurang sesuai.';
  }

  // Tahun/bulan pelatihan: field datar BE (firstTrainingYear/Month, month
  // 1-based) diutamakan; fallback ke firstTrainingSession.startDate.unix
  // (pola normalizeRevise) bila field datar kosong.
  let firstTrainingYear = u.firstTrainingYear ?? u.first_training_year ?? null;
  let firstTrainingMonth = u.firstTrainingMonth ?? u.first_training_month ?? null;
  const startUnix = (u.firstTrainingSession || u.lastTrainingSession)?.startDate?.unix;
  if ((firstTrainingYear == null || firstTrainingMonth == null) && startUnix) {
    const d = new Date(startUnix * 1000);
    if (firstTrainingYear == null) firstTrainingYear = d.getFullYear();
    if (firstTrainingMonth == null) firstTrainingMonth = d.getMonth() + 1; // 1-based
  }

  return {
    uid: u.uid ?? u.id ?? null,
    name: u.name || '',
    username: u.username || '',
    email: u.email || '',
    birthdate:
      u.birthdate && typeof u.birthdate === 'object'
        ? u.birthdate.date || ''
        : u.birthdate || '',
    schoolName: u.schoolName || u.school_name || '',
    // Respons tidak menyertakan provinsi — dilengkapi via regionsApi.get
    // (lihat efek resolve di FixDataPage, pola sama fetchRevisePrefill).
    provinceId: u.provinceId || u.province_id || u.region?.parentId || '',
    regionId: u.regionId || u.region_id || u.region?.id || '',
    firstTrainingYear,
    firstTrainingMonth,
    // Region pelatihan asal — dipakai FixDataPage untuk auto-cocokkan sesi
    // "Dimana" (profil tak membawa session id, hanya region + tahun).
    firstTrainingRegionId: u.firstTrainingRegionId ?? u.first_training_region_id ?? null,
    lastTrainingSessionId:
      u.lastTrainingSessionId ||
      u.firstTrainingSessionId ||
      u.firstTrainingSession?.id ||
      u.lastTrainingSession?.id ||
      '',
    invalid,
    notes,
  };
}
