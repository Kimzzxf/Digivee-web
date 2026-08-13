import { hitungHPP, totalBiaya, keuntungan, marginPercent, lamaSewaFormatted } from "../../lib/hpp";
import { getMeetPoint } from "../../lib/pricelist";
import { formatWibDateTime } from "../../lib/time";

export function exportLaporanCSV(filtered) {
  const header = [
    "No", "Penyewa", "Telp", "Alamat", "Meet Point", "Kota", "Zona", "Tgl Sewa", "Jam Pickup", "Tgl Kembali", "Jam Kembali",
    "Lama Sewa (Hari,Jam)", "Biaya", "Denda", "Total Biaya", "HPP", "Keuntungan", "Margin %", "Payment %", "Status", "Dibuat",
  ];
  const lines = filtered.map((r, i) => [
    i + 1,
    r.customers?.nama || "",
    r.customers?.telp || "",
    r.alamat || "",
    r.titik_meet_point || getMeetPoint(`zona${r.zona}`)?.label || "",
    r.kota || "",
    `Zona ${r.zona}`,
    r.tanggal_sewa || "",
    r.jam_pickup || "",
    r.tanggal_kembali || "",
    r.jam_kembali || "",
    lamaSewaFormatted(r) ?? "",
    r.biaya || 0,
    r.denda || 0,
    totalBiaya(r),
    hitungHPP(r.zona, r.jarak_km),
    keuntungan(r),
    marginPercent(r) + "%",
    (r.payment_percent || 100) + "%",
    r.status || "",
    r.created_at ? formatWibDateTime(r.created_at) : "",
  ]);
  const csv = [header, ...lines].map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `laporan-digivee-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
