// STEP 2 dari import data lama: masukin template CSV (hasil dari
// parse-legacy-csv.js, yang udah lo isi kolom "telp" & "zona"-nya) ke
// MongoDB.
//
// Cara pakai:
//   1) node scripts/parse-legacy-csv.js "Report-Digivee.csv" scripts/legacy-template.csv
//   2) Buka scripts/legacy-template.csv, isi kolom "telp" (nomor WA asli —
//      "08xxxxxxxxxx" ATAU "62xxxxxxxxxxx" sama-sama boleh, otomatis
//      dirapihin jadi format 62 pas diimpor) dan "zona" (1/2/3) buat tiap
//      baris yang lo tau datanya. Baris yang nggak lo isi tetep bisa
//      diimpor (lihat catatan di bawah), cuma nggak langsung "connected"
//      ke akun WA aslinya.
//   3) node --env-file=.env scripts/import-csv.js scripts/legacy-template.csv
//
// PENTING — baca sebelum jalanin:
// - PENTING BUAT KOLOM "telp": klik kolom itu di Excel/Sheets dulu → klik
//   kanan → Format Cells → Text, BARU ketik nomornya. Kalau kolomnya masih
//   ke-format sebagai angka biasa, Excel bisa mangkas angka 0 di depan
//   (jadi salah) atau ubah ke notasi ilmiah pas disimpen. Script ini
//   ngedeteksi & warning kedua kasus itu di ringkasan akhir — tapi lebih
//   aman dicegah dari awal daripada dibenerin belakangan.
// - Kolom pemisahnya otomatis kedeteksi (";" — default template & Excel
//   Indonesia — atau "," kalau lo save dari Google Sheets/Excel English),
//   jadi nggak masalah mau disave ulang pakai delimiter yang mana.
// - Kalau kolom "telp" di suatu baris LO ISI dengan nomor WA asli: baris itu
//   diimpor langsung ke akun customer dengan nomor itu (bikin baru kalau
//   belum ada). Begitu customer itu buka /login pakai WA yang sama, sistem
//   bakal nemuin akunnya (belum ada PIN) dan nyuruh dia bikin PIN baru —
//   abis itu histori sewa & poin loyalitasnya langsung muncul. Nggak perlu
//   merge manual lagi.
// - Kalau kolom "telp" di suatu baris LO KOSONGIN: baris itu tetep diimpor,
//   tapi ke customer sementara dengan telp palsu `legacy-<nama>` — bukan
//   akun yang bisa login. Kalau nanti lo tau nomor WA aslinya, tinggal edit
//   di tab "Pelanggan" admin panel: ganti telp-nya jadi nomor asli. Kalau
//   ternyata orang itu udah pernah daftar sendiri lewat web duluan (jadi
//   nomornya udah dipakai akun lain), panel bakal nawarin "Gabungkan ke akun
//   itu" — klik itu buat nyatuin histori sewa lama & akun barunya.
// - Kalau kolom "zona" kosong atau bukan 1/2/3, default ke Zona 1 (paling
//   murah) supaya nggak ngasal nebak — HPP/margin baris ini di Laporan admin
//   jadi cuma perkiraan kasar, bukan angka final. Biaya & denda aslinya
//   tetap kesimpen persis dari sheet, nggak kepengaruh.
// - Script ini aman dijalanin berkali-kali: transaksi yang udah pernah
//   diimpor (dicek dari legacy_order_id) nggak bakal dobel.

import { readFileSync } from "fs";
import { parse } from "csv-parse/sync";
import { connectDB } from "../netlify/functions/utils/db.js";
import { detectDelimiter } from "./lib/csvImportHelpers.js";
import { importRow } from "./lib/csvImportRow.js";
import { printSummary } from "./lib/csvImportSummary.js";

async function main() {
  const csvPath = process.argv[2];
  if (!csvPath) {
    console.error("Pakai: node --env-file=.env scripts/import-csv.js scripts/legacy-template.csv");
    console.error("(file template ini hasil dari scripts/parse-legacy-csv.js — lihat komentar di atas file ini)");
    process.exit(1);
  }

  const raw = readFileSync(csvPath, "utf-8");
  const delimiter = detectDelimiter(raw);
  const rows = parse(raw, { columns: true, skip_empty_lines: true, trim: true, delimiter, bom: true });

  await connectDB();

  const stats = {
    imported: 0,
    importedWithRealPhone: 0,
    skippedDuplicate: 0,
    skippedNoName: 0,
    defaultedZona: 0,
    customersTouched: new Set(),
    mangledPhones: [],
    sumTotalBiaya: 0,
  };

  for (const row of rows) {
    await importRow(row, stats);
  }

  printSummary(stats);
  process.exit(0);
}

main().catch((err) => {
  console.error("Import gagal:", err);
  process.exit(1);
});
