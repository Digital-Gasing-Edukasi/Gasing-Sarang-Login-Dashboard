// Reject Nucleo: field definitions + payload builders for PATCH verify.

export const FIELD_DEFS = [
  { key: "tanggalLahir", label: "Tanggal Lahir" },
  { key: "lokasi", label: "Lokasi" },
  { key: "riwayatPelatihan", label: "Riwayat Pelatihan" },
  { key: "namaSekolah", label: "Nama Sekolah" },
  { key: "lainnya", label: "Lainnya" },
];

export const LAINNYA_KEY = "lainnya";

const isLainnya = (checkedKeys) => checkedKeys.includes(LAINNYA_KEY);

// Normal reason: "Tanggal lahir dan lokasi tidak sesuai dengan KTP".
export function buildReviseReason(checkedKeys) {
  const labels = FIELD_DEFS.filter((f) => checkedKeys.includes(f.key)).map((f) =>
    f.label.toLowerCase(),
  );
  if (labels.length === 0) return "";
  const head = labels.join(" dan ");
  return `${head.charAt(0).toUpperCase() + head.slice(1)} tidak sesuai dengan KTP`;
}

export function buildReviseFields(checkedKeys) {
  return checkedKeys.filter(
    (key) => key !== LAINNYA_KEY && FIELD_DEFS.some((f) => f.key === key),
  );
}

// Normal (revise) payload vs `lainnya` (permanent reject) payload.
export function buildVerifyPayload({ checkedKeys, customReason, firstTrainingSessionId }) {
  if (isLainnya(checkedKeys)) {
    return {
      status: "rejected",
      rejectedReason: customReason,
      firstTrainingSessionId,
    };
  }
  return {
    status: "revise",
    rejectedReason: buildReviseReason(checkedKeys),
    fieldsToRevise: buildReviseFields(checkedKeys),
  };
}

export function canSubmitReject({ checkedKeys, customReason }) {
  if (checkedKeys.length === 0) return false;
  if (isLainnya(checkedKeys)) return customReason.trim().length > 0;
  return true;
}

// `lainnya` is exclusive: picking it clears the rest, picking anything else
// clears it.
export function toggleRejectField(prevKeys, key) {
  if (key === LAINNYA_KEY) {
    return prevKeys.includes(LAINNYA_KEY) ? [] : [LAINNYA_KEY];
  }
  const rest = prevKeys.filter((k) => k !== LAINNYA_KEY);
  return rest.includes(key) ? rest.filter((k) => k !== key) : [...rest, key];
}
