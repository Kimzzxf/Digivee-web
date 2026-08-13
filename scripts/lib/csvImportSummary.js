export function printSummary(stats) {
  const { imported, importedWithRealPhone, skippedDuplicate, skippedNoName, defaultedZona, customersTouched, mangledPhones, sumTotalBiaya } = stats;

  console.log("─".repeat(50));
  console.log(`[OK]   Transaksi diimpor        : ${imported}`);
  console.log(`[INFO] Customer disentuh        : ${customersTouched.size}`);
  console.log(`[INFO] ...pakai WA asli         : ${importedWithRealPhone} (langsung connected, tinggal set PIN)`);
  console.log(`[SKIP] Dilewatin (dobel)        : ${skippedDuplicate}`);
  if (skippedNoName) console.log(`[SKIP] Dilewatin (no nama)      : ${skippedNoName}`);
  if (defaultedZona) console.log(`[WARN] Zona di-default ke "1"   : ${defaultedZona} baris (HPP/margin cuma perkiraan)`);
  if (mangledPhones.length) {
    console.log(`[WARN] Nomor WA mencurigakan (dilewatin, diimpor pakai telp placeholder): ${mangledPhones.length} baris`);
    for (const m of mangledPhones) {
      console.log(`   - No Order ${m.orderNo} (${m.nama}): "${m.telpRaw}" — ${m.reason}`);
    }
    console.log(`   Biasanya gara-gara kolom "telp" nggak di-format Text dulu sebelum diketik di Excel.`);
    console.log(`   Perbaiki manual nomornya lewat Admin → tab Pelanggan (cari "legacy-<nama>"), atau`);
    console.log(`   format kolom telp sebagai Text di CSV-nya, isi ulang, terus jalanin ulang scriptnya.`);
  }
  console.log(`[SUM]  Total biaya+denda        : Rp${sumTotalBiaya.toLocaleString("id-ID")}`);
  console.log("   (bandingin ke baris TOTAL di CSV asli buat sanity check)");
  console.log("─".repeat(50));
}
