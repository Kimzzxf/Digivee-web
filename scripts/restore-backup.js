// Restore dari file JSON yang dikirim db-backup.js ke Telegram tiap malam
// (lihat netlify/functions/db-backup.js).
//
// Upsert by _id, BUKAN insertMany — aman dijalanin berkali-kali atau di
// atas data yang sebagian udah ada: dokumen yang udah ada isinya
// ke-overwrite balik ke isi backup, yang belum ada kebuat baru. Ga pernah
// ngehapus dokumen yang ga ada di file backup-nya (restore selektif,
// bukan wipe-and-replace).
//
// Cara pakai:
//   1) Download file digivee-backup-YYYY-MM-DD.json dari chat Telegram admin.
//   2) node --env-file=.env scripts/restore-backup.js digivee-backup-2026-08-11.json --dry-run
//   3) Cek ringkasannya, baru jalanin tanpa --dry-run buat beneran nulis.

import { readFileSync } from "fs";
import { connectDB } from "../netlify/functions/utils/db.js";
import Customer from "../netlify/functions/models/Customer.js";
import Transaction from "../netlify/functions/models/Transaction.js";

async function restoreCollection(Model, docs, dryRun) {
  for (const doc of docs) {
    const { _id, ...fields } = doc;
    console.log(`${dryRun ? "[dry-run] " : ""}upsert ${Model.modelName} ${_id}`);
    if (!dryRun) {
      await Model.updateOne({ _id }, { $set: fields }, { upsert: true });
    }
  }
  return docs.length;
}

async function main() {
  const filePath = process.argv[2];
  const dryRun = process.argv.includes("--dry-run");
  if (!filePath) {
    console.error("Pakai: node --env-file=.env scripts/restore-backup.js digivee-backup-*.json [--dry-run]");
    process.exit(1);
  }

  const dump = JSON.parse(readFileSync(filePath, "utf-8"));
  await connectDB();

  const customerCount = await restoreCollection(Customer, dump.customers || [], dryRun);
  const transactionCount = await restoreCollection(Transaction, dump.transactions || [], dryRun);

  console.log(
    `\n${dryRun ? "Akan direstore" : "Direstore"}: ${customerCount} customers, ${transactionCount} transactions (backup dari ${dump.exportedAt}).`
  );
  process.exit(0);
}

main().catch((err) => {
  console.error("Restore gagal:", err);
  process.exit(1);
});
