// Jam operasional COD Digivee: 09.00–20.00 WIB. Satu sumber buat dropdown
// jam pickup/return di form booking customer (Sewa.jsx) DAN di form
// transaksi admin (Admin.jsx), biar slotnya konsisten di semua tempat.
export const OPERATIONAL_START = "09:00";
export const OPERATIONAL_END = "20:00";

// WIB gak punya DST — offsetnya tetap +7 jam dari UTC, gak pernah geser.
// Dipakai sebagai satu-satunya sumber kebenaran waktu di bawah, biar
// hasilnya SAMA baik dijalanin di browser (biasanya udah WIB) maupun di
// Netlify function (jalan di UTC secara default) — sebelumnya kode ini
// pakai `new Date("...")` polos yang parse jam sebagai timezone lokal si
// runtime, jadi bener di browser tapi salah 7 jam pas dijalanin di server.
const WIB_OFFSET_MINUTES = 7 * 60;
export const WIB_TIME_ZONE = "Asia/Jakarta";

function pad2(n) {
  return String(n).padStart(2, "0");
}

// Instant (Date/ISO) -> wall-clock WIB { date: "YYYY-MM-DD", time: "HH:MM" }.
// Shared by addMinutesToDateTime below and splitWibDateTime — same
// getUTC*-after-shifting trick as the rest of this file, so it's correct
// regardless of the runtime's own timezone (browser or Netlify function).
function wibParts(date) {
  const wib = new Date(date.getTime() + WIB_OFFSET_MINUTES * 60000);
  return {
    date: `${wib.getUTCFullYear()}-${pad2(wib.getUTCMonth() + 1)}-${pad2(wib.getUTCDate())}`,
    time: `${pad2(wib.getUTCHours())}:${pad2(wib.getUTCMinutes())}`,
  };
}

// Dipakai HourMinuteSelect.jsx — jam & menit dua dropdown terpisah,
// bukan satu list "HH:MM" per menit kayak sebelumnya (611 opsi dalam
// satu select itu sendiri yang bikin UX-nya lambat dipakai).
//
// Booking customer dibatasin jam operasional: 09-20.
export const OPERATIONAL_HOURS = Array.from({ length: 12 }, (_, i) => pad2(9 + i));
// Transaksi admin gak dibatasin jam operasional (bisa dicatat manual di
// luar jam COD) — urutan 00-23 naik biasa.
export const ADMIN_HOURS = Array.from({ length: 24 }, (_, i) => pad2(i));
// Menit sama di semua konteks: 00-59.
export const MINUTES = Array.from({ length: 60 }, (_, i) => pad2(i));

// Gabungin tanggal ("YYYY-MM-DD") + jam ("HH:MM") WIB jadi objek Date yang
// nunjuk ke instant UTC yang bener — dipakai buat ngitung selisih waktu
// (countdown/overdue di Admin panel) DAN jadwal reminder di Netlify
// function (reminder-check.js). Dihitung manual pakai WIB_OFFSET_MINUTES
// biar hasilnya konsisten di server maupun browser. Balikin null kalau
// tanggal/jamnya kosong atau nggak valid.
export function combineDateTime(dateStr, jamStr) {
  if (!dateStr) return null;
  const [y, mo, d] = dateStr.split("-").map(Number);
  const [h, mi] = (jamStr || "00:00").split(":").map(Number);
  if (!y || !mo || !d || Number.isNaN(h) || Number.isNaN(mi)) return null;
  const utcMs = Date.UTC(y, mo - 1, d, h, mi) - WIB_OFFSET_MINUTES * 60000;
  return new Date(utcMs);
}

// "630" -> "10 Jam 30 Menit", "1440" -> "1 Hari", "2160" -> "1 Hari 12 Jam"
// — dipakai buat nampilin bonus durasi loyalitas (lihat lib/discount.js)
// dengan satuan yang paling gampang dibaca, apa pun besarnya durasinya.
export function formatDurasiMenit(totalMinutes) {
  const total = Math.max(0, Math.round(Number(totalMinutes) || 0));
  if (total === 0) return "0 Menit";
  const hari = Math.floor(total / 1440);
  const jam = Math.floor((total % 1440) / 60);
  const menit = total % 60;
  const parts = [];
  if (hari) parts.push(`${hari} Hari`);
  if (jam) parts.push(`${jam} Jam`);
  if (menit) parts.push(`${menit} Menit`);
  return parts.join(" ");
}

// Gabungin tanggal+jam, tambahin sejumlah menit, terus pecah lagi balik
// jadi { date: "YYYY-MM-DD", time: "HH:MM" } — dipakai buat ngitung
// usulan tanggal & jam kembali baru sesudah bonus durasi loyalitas
// diterapin (lihat Sewa.jsx & Admin.jsx). Balikin null kalau tanggal
// dasarnya kosong/nggak valid.
export function addMinutesToDateTime(dateStr, jamStr, minutesToAdd) {
  const base = combineDateTime(dateStr, jamStr);
  if (!base) return null;
  return wibParts(new Date(base.getTime() + (Number(minutesToAdd) || 0) * 60000));
}

// Instant (Date/ISO/string) -> { date: "YYYY-MM-DD", time: "HH:MM" } WIB —
// the inverse of combineDateTime, raw (not localized) so it drops straight
// into a date input + HourMinuteSelect pair (see LaporanEditFields' "Dibuat
// (Analytics)" field). Balikin { date: "", time: "" } kalau instant-nya
// kosong/nggak valid.
export function splitWibDateTime(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (!date || Number.isNaN(d.getTime())) return { date: "", time: "" };
  return wibParts(d);
}

// Format Date -> string WIB 24 jam, dipakai di semua tempat yang nampilin
// timestamp asli (created_at/"Diajukan" di Laporan, Pelanggan, Riwayat
// Sewa, CSV export) — root cause dari bug "jam 12:00 WIB muncul jadi
// 00:00": toLocaleDateString/toLocaleTimeString tanpa `timeZone` ikut
// timezone device yang mangku, bukan WIB. Balikin "-" kalau datenya
// kosong/nggak valid.
export function formatWibDate(date, opts) {
  const d = date instanceof Date ? date : new Date(date);
  if (!date || Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("id-ID", { timeZone: WIB_TIME_ZONE, ...opts });
}

export function formatWibTime(date, opts) {
  const d = date instanceof Date ? date : new Date(date);
  if (!date || Number.isNaN(d.getTime())) return "-";
  return d.toLocaleTimeString("id-ID", {
    timeZone: WIB_TIME_ZONE,
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    ...opts,
  });
}

export function formatWibDateTime(date, opts) {
  const d = date instanceof Date ? date : new Date(date);
  if (!date || Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("id-ID", { timeZone: WIB_TIME_ZONE, hour12: false, ...opts });
}
