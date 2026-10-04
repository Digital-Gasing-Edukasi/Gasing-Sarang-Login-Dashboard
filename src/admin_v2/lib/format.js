const ID_MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const ID_MONTH_ABBR = {
  Januari: "Jan",
  Februari: "Feb",
  Maret: "Mar",
  April: "Apr",
  Mei: "Mei",
  Juni: "Jun",
  Juli: "Jul",
  Agustus: "Agu",
  September: "Sep",
  Oktober: "Okt",
  November: "Nov",
  Desember: "Des",
};

export const FALLBACK_TEXT = "—";

// firstTrainingYear + firstTrainingMonth → "Oktober 2024".
export function formatTrainingPeriod(year, month) {
  const m = Number(month);
  if (!year || !Number.isInteger(m) || m < 1 || m > 12) return FALLBACK_TEXT;
  return `${ID_MONTHS[m - 1]} ${year}`;
}

// "06 April 2026 00:00:00" → "06 Apr 2026".
export function formatShortDate(formatted) {
  if (!formatted) return FALLBACK_TEXT;
  const parts = String(formatted).split(" ");
  if (parts.length < 3) return String(formatted);
  const [day, month, year] = parts;
  const abbr = ID_MONTH_ABBR[month];
  if (!abbr) return `${day} ${month} ${year}`;
  return `${day} ${abbr} ${year}`;
}
