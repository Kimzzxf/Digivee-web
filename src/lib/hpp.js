import { combineDateTime } from "./time";

const FIX_COST = 8000; // HPP kamera itu sendiri (harga pokok alat), flat di semua zona — beda dari ongkos motor di bawah, yang variatif per jarak.
const MOTOR_PER_KM = 700;
// Fallback doang buat transaksi yang gak punya jarak_km asli (data lama,
// zona dipilih manual tanpa "Hitung jarak", atau geocode gagal pas
// customer submit). Kalau jarak_km ada, itu yang dipake — AKTUAL, jarakKm*4
// (lihat hitungHPP di bawah). Kalau gak ada, WORST CASE: batas atas dasar
// zona + toleransi (kalau ada, lihat suggestZona di
// netlify/functions/utils/geoDistance.js) — bukan tebakan rata-rata, biar
// margin gak collapse pas jarak asli ternyata di ujung toleransi.
//   Zona 2: (20+10 toleransi)km x4 = 120
//   Zona 3: 40km x4 = 160 (gak ada toleransi buat zona 3)
const PP_KM = { 1: 0, 2: 120, 3: 160 };

// jarak_km = jarak SATU ARAH (Digivee -> titik meet point, BUKAN alamat
// rumah customer — motor jalan ke situ) hasil geocode di
// netlify/functions/utils/geoDistance.js, disimpen di transaksi pas dibuat
// (lihat TransaksiFormFields.jsx & customerPendingTransaction.js). Dikali 4,
// bukan 2 — motor jalan 2x pp: nganter kamera (pergi-pulang) + jemput balik
// pas sewa selesai (pergi-pulang lagi). Zona 1 (self-pickup) selalu 0 —
// motor toko emang gak jalan sama sekali, jadi jarak_km diabaikan walau
// kesimpen.
export function hitungHPP(zona, jarakKm) {
  const pp = zona !== "1" && Number.isFinite(jarakKm) ? jarakKm * 4 : (PP_KM[zona] ?? PP_KM["2"]);
  return Math.round(FIX_COST + pp * MOTOR_PER_KM);
}

export function totalBiaya(tx) {
  return Number(tx.biaya || 0) + Number(tx.denda || 0);
}

// Rupiah — ini keuntungan (revenue dikurang HPP), bukan margin. Margin
// adalah rasio-nya, lihat marginPercent di bawah.
export function keuntungan(tx) {
  return totalBiaya(tx) - hitungHPP(tx.zona, tx.jarak_km);
}

// Margin % yang benar = keuntungan / revenue (biaya total), bukan / HPP —
// itu markup, bukan margin.
export function marginPercent(tx) {
  const tb = totalBiaya(tx);
  if (!tb) return 0;
  return Math.round((keuntungan(tx) / tb) * 100);
}

export function lamaSewaMenit(tx) {
  const start = combineDateTime(tx.tanggal_sewa, tx.jam_pickup);
  const end = combineDateTime(tx.tanggal_kembali, tx.jam_kembali);
  if (!start || !end) return null;
  const menit = Math.round((end - start) / (1000 * 60));
  return menit < 0 ? 0 : menit;
}

// "3h,5j" — buat kolom Lama laporan admin. Presisi jam (pickup/kembali
// beneran, bukan cuma selisih tanggal kalender kayak dulu), tapi gak
// sampe menit — laporan gak butuh sedetail formatDurasiMenit (itu buat
// bonus durasi loyalitas di lib/time.js).
export function lamaSewaFormatted(tx) {
  const menit = lamaSewaMenit(tx);
  if (menit == null) return null;
  const hari = Math.floor(menit / 1440);
  const jam = Math.floor((menit % 1440) / 60);
  return `${hari}h,${jam}j`;
}

export function formatRupiah(n) {
  return "Rp" + Math.round(n || 0).toLocaleString("id-ID");
}

// Utilization Rate bulan berjalan — dari hari-hari yg udah lewat bulan ini
// (tanggal 1 s/d hari ini), berapa persen yang kameranya beneran dipake.
// Cuma hitung status Ongoing/Completed (Booked belum diambil, Pending/
// Cancelled gak pernah kepake beneran). Cuma 1 unit kamera saat ini
// (lihat checklist.js) jadi availableDays = hari kalender langsung, gak
// perlu dibagi jumlah unit.
// Tiap sewa di-clip ke window [tgl 1, hari ini] sebelum dihitung — jadi
// sewa yang mulai bulan lalu tapi nyambung ke bulan ini cuma nyumbang
// hari yang beneran jatuh bulan ini, dan sewa yang belum balik (Ongoing,
// tanggal_kembali di masa depan) gak ngitung hari yang belum kejadian.
export function monthlyUtilization(rows, now = new Date()) {
  const availableDays = now.getDate();
  const windowStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const windowEnd = new Date(now.getFullYear(), now.getMonth(), availableDays + 1); // exclusive

  const rentedDays = rows.reduce((sum, r) => {
    if (r.status !== "Ongoing" && r.status !== "Completed") return sum;
    if (!r.tanggal_sewa || !r.tanggal_kembali) return sum;
    const start = new Date(r.tanggal_sewa);
    const end = new Date(r.tanggal_kembali);
    const clippedStart = start < windowStart ? windowStart : start;
    const clippedEnd = end > windowEnd ? windowEnd : end;
    const days = Math.round((clippedEnd - clippedStart) / 86_400_000);
    return sum + (days > 0 ? days : 0);
  }, 0);

  // Safety cap, not the normal case — only bites if two Ongoing/Completed
  // rows overlap the same days (double-booking a single-camera business
  // shouldn't have, but bad data happens).
  const cappedRented = Math.min(rentedDays, availableDays);
  return {
    availableDays,
    rentedDays: cappedRented,
    utilizationPct: availableDays ? Math.round((cappedRented / availableDays) * 100) : 0,
  };
}

// Shared by Laporan and the Analytics tab — Pending rows excluded (no DP
// confirmed yet, not real revenue until admin marks it Completed) and
// Cancelled rows excluded (never happened, shouldn't count as revenue
// either). One place for this reduce so both tabs can't drift on what
// counts as "revenue".
export function summarizeRevenue(rows) {
  const revenueRows = rows.filter((r) => r.status !== "Pending" && r.status !== "Cancelled");
  const summary = revenueRows.reduce(
    (acc, r) => {
      acc.revenue += totalBiaya(r);
      acc.hpp += hitungHPP(r.zona, r.jarak_km);
      acc.keuntungan += keuntungan(r);
      return acc;
    },
    { revenue: 0, hpp: 0, keuntungan: 0 }
  );
  const avgMarginPct = summary.revenue ? Math.round((summary.keuntungan / summary.revenue) * 100) : 0;
  return { revenueRows, summary, avgMarginPct };
}
