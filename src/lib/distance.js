// Saran Zona dari jarak tempuh (km). Ambang batasnya BUKAN 20/40 lurus —
// ada toleransi maks 10km di batas atas TIAP zona (radius antar-jemput
// manual biasa digenepin, bukan pas di angka bulat), sama-sama 10km:
//   0–30km  -> Zona 2 (batas dasar 20km, ditoleransi sampai 30km)
//   31–50km -> Zona 3 (batas dasar 40km, ditoleransi sampai 50km)
//   >50km   -> null, di luar jangkauan antar-jemput, admin putusin manual
// Dipakai oleh GET /admin/geocode-distance & GET /geocode-distance
// (netlify/functions/utils/geoDistance.js) buat kasih saran ke admin di
// form Catat Transaksi DAN ke customer di form Sewa publik.
export function suggestZona(km) {
  if (km <= 30) return "2";
  if (km <= 50) return "3";
  return null;
}

