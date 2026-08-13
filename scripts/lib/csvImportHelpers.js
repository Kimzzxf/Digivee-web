export function normalizePhone(raw) {
  return String(raw || "")
    .replace(/[^0-9]/g, "")
    .replace(/^0/, "62");
}

// Catches the classic Excel gotcha: a long number typed into a cell that
// wasn't formatted as Text gets silently rewritten as scientific notation
// (e.g. "6.28123E+12") when the file is saved back to CSV. Importing that
// as-is would produce a garbage phone number, so treat it as "no phone"
// instead and flag it for a manual fix.
export function looksMangled(raw) {
  return /e[+-]?\d/i.test(raw) || /^\d+\.\d+$/.test(raw.trim());
}

// A second, sneakier Excel gotcha: typing "081234567890" into a cell that
// wasn't formatted as Text gets treated as a number, and numbers don't have
// leading zeros — so it silently becomes "81234567890" on save. That one
// digit is invisible in the CSV and normalizePhone() has no leading "0" left
// to replace with "62", so it'd import as a wrong, un-matchable number
// instead of erroring. A real Indonesian mobile number always normalizes to
// something starting with "62", so anything that doesn't is suspect.
export function looksLikeMissingLeadingDigit(normalized) {
  return normalized.length >= 9 && !normalized.startsWith("62");
}

export function slugify(nama) {
  return String(nama)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// The template's date columns are DD/MM/YYYY (Indonesian convention), but
// `new Date("19/08/2025")` parses slash-separated dates as US-style
// MM/DD/YYYY — so day 19 makes it Invalid Date, and worse, a day <= 12 like
// "05/09/2025" (5 Sept) silently becomes 9 May instead. Parse the DD/MM/YYYY
// parts explicitly instead of trusting the Date constructor's guess.
export function parseIndoDate(raw) {
  const s = String(raw || "").trim();
  if (!s) return null;
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  const date = new Date(Date.UTC(Number(yyyy), Number(mm) - 1, Number(dd)));
  return Number.isNaN(date.getTime()) ? null : date;
}

// Excel with Indonesian regional settings saves/expects ";" between columns
// (since "," is the decimal separator there); Google Sheets and US-locale
// Excel use ",". Rather than force one, just look at the header line and
// pick whichever delimiter actually splits it into multiple columns.
export function detectDelimiter(raw) {
  const headerLine = raw.split(/\r?\n/, 1)[0] || "";
  const semicolons = (headerLine.match(/;/g) || []).length;
  const commas = (headerLine.match(/,/g) || []).length;
  return semicolons > commas ? ";" : ",";
}
