// One-off: fixes existing customers whose alamat is missing/incomplete
// (see needsAddress() in src/lib/customer.js — blank or just "Karawang")
// using the address from their own past order, straight from the CSV the
// admin Laporan tab exports (laporanCsv.js). Matches by phone number
// (same normalizePhone() the legacy importer uses) — never creates a
// customer or transaction, only patches Customer.alamat, and only when
// it's currently blank/"Karawang" so it can't clobber a real address
// someone already has on file.
//
// Cara pakai:
//   node --env-file=.env scripts/backfill-alamat.js laporan-digivee-2026-08-11.csv --dry-run
//   (cek dulu ringkasannya, baru jalanin tanpa --dry-run buat beneran nulis)

import { readFileSync } from "fs";
import { parse } from "csv-parse/sync";
import { connectDB } from "../netlify/functions/utils/db.js";
import { detectDelimiter, normalizePhone } from "./lib/csvImportHelpers.js";
import { needsAddress } from "../src/lib/customer.js";
import Customer from "../netlify/functions/models/Customer.js";

async function main() {
  const csvPath = process.argv[2];
  const dryRun = process.argv.includes("--dry-run");
  if (!csvPath) {
    console.error("Pakai: node --env-file=.env scripts/backfill-alamat.js laporan-digivee-*.csv [--dry-run]");
    process.exit(1);
  }

  const raw = readFileSync(csvPath, "utf-8");
  const delimiter = detectDelimiter(raw);
  const rows = parse(raw, { columns: true, skip_empty_lines: true, trim: true, delimiter, bom: true });

  await connectDB();

  let updated = 0, skippedFilled = 0, skippedNoAlamat = 0;
  const unmatched = [];

  for (const row of rows) {
    const alamat = (row["Alamat"] || "").trim();
    if (!alamat) { skippedNoAlamat++; continue; }

    const telp = normalizePhone(row["Telp"]);
    const customer = telp ? await Customer.findOne({ telp }) : null;
    if (!customer) { unmatched.push(`${row["Penyewa"]} (${row["Telp"]})`); continue; }

    if (!needsAddress(customer.alamat)) { skippedFilled++; continue; }

    console.log(`${dryRun ? "[dry-run] " : ""}${customer.nama}: "${customer.alamat || ""}" -> "${alamat}"`);
    if (!dryRun) {
      customer.alamat = alamat;
      await customer.save();
    }
    updated++;
  }

  console.log(`\n${dryRun ? "Akan diupdate" : "Diupdate"}: ${updated}`);
  console.log(`Udah ada alamat (dilewatin): ${skippedFilled}`);
  console.log(`Baris tanpa alamat: ${skippedNoAlamat}`);
  if (unmatched.length) {
    console.log(`Nggak ketemu customer-nya (${unmatched.length}):`);
    unmatched.forEach((u) => console.log(`  - ${u}`));
  }
  process.exit(0);
}

main().catch((err) => {
  console.error("Backfill gagal:", err);
  process.exit(1);
});
