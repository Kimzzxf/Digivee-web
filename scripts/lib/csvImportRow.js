import Customer from "../../netlify/functions/models/Customer.js";
import Transaction from "../../netlify/functions/models/Transaction.js";
import {
  normalizePhone,
  looksMangled,
  looksLikeMissingLeadingDigit,
  slugify,
  parseIndoDate,
} from "./csvImportHelpers.js";

// Imports one CSV row: skips no-name/duplicate rows, otherwise
// upserts the customer by phone and creates the transaction. Mutates
// `stats` in place so the caller can print one summary at the end.
export async function importRow(row, stats) {
  const nama = (row.nama || "").trim();
  if (!nama) {
    stats.skippedNoName++;
    return;
  }

  const orderNo = (row.legacy_order_id || "").trim();
  const already = orderNo ? await Transaction.findOne({ legacyOrderId: orderNo }) : null;
  if (already) {
    stats.skippedDuplicate++;
    return;
  }

  const telpRaw = (row.telp || "").trim();
  const mangled = Boolean(telpRaw) && looksMangled(telpRaw);
  const normalized = mangled ? "" : normalizePhone(telpRaw);
  const suspicious = Boolean(telpRaw) && !mangled && normalized && looksLikeMissingLeadingDigit(normalized);
  if (mangled) stats.mangledPhones.push({ orderNo, nama, telpRaw, reason: "notasi ilmiah" });
  if (suspicious) stats.mangledPhones.push({ orderNo, nama, telpRaw, reason: "kayaknya kurang awalan 0/62" });
  const hasRealPhone = !mangled && !suspicious && normalized.length >= 9;
  const telp = hasRealPhone ? normalized : `legacy-${slugify(nama)}`;

  let zona = String(row.zona || "").trim();
  if (!["1", "2", "3"].includes(zona)) {
    zona = "1";
    stats.defaultedZona++;
  }

  // upsert by telp — if this real WA number already has an account (e.g.
  // they registered on the web already), the existing account is reused
  // as-is (nama/pinHash/alamat untouched) and this transaction just attaches
  // to it. Only a brand-new customer gets alamat seeded from this row's
  // report address — they've got an order right here, so it's not blank.
  const alamat = row.alamat?.trim() || null;
  const customer = await Customer.findOneAndUpdate(
    { telp },
    { $setOnInsert: { nama, telp, alamat } },
    { upsert: true, new: true }
  );
  stats.customersTouched.add(telp);
  if (hasRealPhone) stats.importedWithRealPhone++;

  const biaya = Number(row.biaya) || 0;
  const denda = Number(row.denda) || 0;

  await Transaction.create({
    customerId: customer._id,
    zona,
    alamat,
    kota: row.kota?.trim() || null,
    tanggalSewa: parseIndoDate(row.tanggal_sewa),
    tanggalKembali: parseIndoDate(row.tanggal_kembali),
    biaya,
    denda,
    paymentPercent: Number(row.payment_percent) || 100,
    status: (row.status || "Completed").trim(),
    source: "legacy-csv",
    legacyOrderId: orderNo || null,
  });

  stats.sumTotalBiaya += biaya + denda;
  stats.imported++;
}
