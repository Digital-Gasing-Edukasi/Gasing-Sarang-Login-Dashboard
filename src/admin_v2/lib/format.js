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

// Backend sends ENGLISH month names ("October", "December", ...); display
// uses Indonesian abbreviations ("Okt", "Des", ...). Indonesian spellings
// kept as aliases for tolerance.
const ID_MONTH_ABBR = {
  January: "Jan",
  Januari: "Jan",
  February: "Feb",
  Februari: "Feb",
  March: "Mar",
  Maret: "Mar",
  April: "Apr",
  May: "Mei",
  Mei: "Mei",
  June: "Jun",
  Juni: "Jun",
  July: "Jul",
  Juli: "Jul",
  August: "Agu",
  Agustus: "Agu",
  September: "Sep",
  October: "Okt",
  Oktober: "Okt",
  November: "Nov",
  December: "Des",
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

// Date → "02 Okt 2026 13:54" (Indonesian abbrev months, local timezone).
export function formatDateTime(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return FALLBACK_TEXT;
  const day = String(d.getDate()).padStart(2, "0");
  const monthName = ID_MONTHS[d.getMonth()];
  const abbr = ID_MONTH_ABBR[monthName] ?? monthName.slice(0, 3);
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${day} ${abbr} ${d.getFullYear()} ${hours}:${minutes}`;
}

// Milliseconds → "HH:MM:SS", floored at zero (never negative).
export function formatCountdown(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = String(Math.floor(total / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const seconds = String(total % 60).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}
