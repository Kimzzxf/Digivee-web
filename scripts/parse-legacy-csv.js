// Step 1 of the legacy-data import: turn the raw "LAPORAN SEWA DIGIVEE" sheet
// export into a clean template CSV. It converts Indonesian dates/currency
// into plain values, skips empty placeholder rows and the TOTAL row — but it
// CANNOT invent phone numbers or zona (1/2/3), because the original sheet
// never tracked either. Those two columns come out blank; fill them in by
// hand (or with a lookup you already have) before running scripts/import-csv.js
// (step 2 — see that file for details).
//
// The output uses ";" as the column delimiter (not ","), because Excel with
// Indonesian regional settings treats "," as the *decimal* separator and
// expects ";" between columns — opening a comma-delimited CSV there dumps
// everything into a single column A instead of splitting it properly.
//
// Usage:
//   node scripts/parse-legacy-csv.js "path/to/Report-Digivee.csv" scripts/legacy-template.csv

import fs from "node:fs";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";

const BULAN = {
  januari: "01", februari: "02", maret: "03", april: "04",
  mei: "05", juni: "06", juli: "07", agustus: "08",
  september: "09", oktober: "10", november: "11", desember: "12",
};

function parseIndoDate(str) {
  if (!str || !str.trim()) return "";
  // e.g. "Selasa, Agustus 19, 2025"
  const m = str.trim().match(/^[^,]+,\s*([A-Za-zé]+)\s+(\d{1,2}),\s*(\d{4})$/);
  if (!m) return "";
  const [, bulanNama, tgl, tahun] = m;
  const bulan = BULAN[bulanNama.toLowerCase()];
  if (!bulan) return "";
  return `${tahun}-${bulan}-${tgl.padStart(2, "0")}`;
}

function parseRupiah(str) {
  if (!str || str.trim() === "-" || !str.trim()) return 0;
  const cleaned = str.replace(/Rp/i, "").trim().replace(/\./g, "").replace(",", ".");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? Math.round(n) : 0;
}

function parsePercent(str) {
  if (!str) return 100;
  const n = parseInt(str.replace("%", "").trim(), 10);
  return Number.isFinite(n) ? n : 100;
}

const [, , inputPath, outputPath] = process.argv;
if (!inputPath || !outputPath) {
  console.error("Usage: node scripts/parse-legacy-csv.js <input.csv> <output.csv>");
  process.exit(1);
}

const raw = fs.readFileSync(inputPath, "utf-8");
// The sheet export has 4 blank/title rows before the real header row.
const lines = raw.split(/\r?\n/);
const headerLineIdx = lines.findIndex((l) => l.startsWith("No Order"));
if (headerLineIdx === -1) {
  console.error("Gak nemu baris header 'No Order,...' di file ini. Format sheet-nya beda?");
  process.exit(1);
}
const csvBody = lines.slice(headerLineIdx).join("\n");

const rows = parse(csvBody, { columns: true, skip_empty_lines: true, trim: true });

const out = [];
let skippedEmpty = 0;
let skippedUnavailable = 0;
for (const row of rows) {
  const noOrder = (row["No Order"] || "").trim();
  const nama = (row["Penyewa"] || "").trim();
  const status = (row["Status"] || "").trim();
  if (!noOrder || noOrder.toUpperCase().startsWith("TOTAL")) continue;
  if (status.toLowerCase() === "unavailable") {
    // empty calendar slot in the original sheet, not a real booking
    skippedUnavailable++;
    continue;
  }
  if (!nama) {
    skippedEmpty++;
    continue; // placeholder row with no real booking
  }
  out.push({
    legacy_order_id: noOrder,
    nama,
    telp: "", // <-- ISI INI: nomor WA customer, "08xxx" atau "62xxx" sama-sama boleh (otomatis dirapihin)
    zona: "", // <-- ISI INI: 1, 2, atau 3 (lihat src/lib/hpp.js buat batas km-nya)
    alamat: (row["Alamat"] || "").trim(),
    kota: (row["Kota"] || "").trim(),
    tanggal_sewa: parseIndoDate(row["Tanggal Sewa"]),
    tanggal_kembali: parseIndoDate(row["Tanggal Kembali"]),
    biaya: parseRupiah(row["Biaya"]),
    denda: parseRupiah(row[" Denda"] ?? row["Denda"]),
    payment_percent: parsePercent(row["Payment"]),
    status: status || "Completed",
  });
}

const csvOut = stringify(out, { header: true, delimiter: ";" });
// UTF-8 BOM ("\uFEFF") so Excel auto-detects the encoding correctly instead
// of mangling accented characters — harmless for everything else that reads
// this file (Node's csv-parse skips it fine).
fs.writeFileSync(outputPath, "\uFEFF" + csvOut, "utf-8");

console.log(`[OK]   ${out.length} transaksi valid ditulis ke ${outputPath}`);
console.log(`   (${skippedEmpty} baris placeholder kosong, ${skippedUnavailable} slot kalender kosong di-skip)`);
console.log(`\n[WARN] Sebelum isi kolom "telp": klik kolom itu di Excel/Sheets, klik kanan →`);
console.log(`   Format Cells → Text (atau "Format > Number > Plain text" di Google Sheets),`);
console.log(`   BARU ketik nomornya. Kalau nggak, Excel bisa mangkas angka 0 di depan atau`);
console.log(`   ubah nomornya jadi notasi ilmiah (6.28123E+12) pas disimpen.`);
console.log(`\nLangkah berikutnya: buka ${outputPath}, isi kolom "telp" dan "zona" buat`);
console.log(`tiap baris (nomor WA asli = poin loyalitas customer itu langsung connected),`);
console.log(`simpan, lalu jalankan:`);
console.log(`  node --env-file=.env scripts/import-csv.js ${outputPath}`);
