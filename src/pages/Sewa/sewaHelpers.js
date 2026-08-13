// Shared field styling — transparent, bottom-border-only, white text/border
// for the pink full-bleed form surface (matches the hero's paper-on-pink
// treatment instead of sitting in its own bg-paper card).
export const FIELD =
  "w-full px-0 py-2.5 bg-transparent border-0 border-b border-paper/40 text-paper placeholder:text-paper/50 font-body outline-none transition-colors focus:border-paper";
export const FIELD_READONLY =
  "w-full px-0 py-2.5 bg-transparent border-0 border-b border-paper/20 text-paper/70 font-mono font-bold outline-none";

// Local-date formatter — NOT toISOString().slice(0, 10). toISOString()
// always goes through UTC, and WIB is UTC+7, so any local-midnight Date
// serialized that way silently lands on the PREVIOUS calendar day (always,
// not just an edge case): a 3-day rental starting Aug 7 was auto-filling
// Aug 9 as the return date instead of Aug 10. Same bug hit todayStr()
// between 00:00–06:59 WIB, when "now" in UTC is still yesterday.
function pad2(n) {
  return String(n).padStart(2, "0");
}
function toLocalDateStr(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function todayStr() {
  return toLocalDateStr(new Date());
}

export function addDays(dateStr, days) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return toLocalDateStr(d);
}

export function formatTanggalId(dateStr) {
  if (!dateStr) return "-";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
