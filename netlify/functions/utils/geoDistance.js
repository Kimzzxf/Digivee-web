const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const OSRM_URL = "https://router.project-osrm.org/route/v1/driving";
// Nominatim's usage policy requires a real identifying User-Agent (a bare
// fetch UA gets blocked) — this and OSRM's router.project-osrm.org are
// both the free PUBLIC demo instances: fine for occasional lookups (one
// admin checking an address, or a customer's own booking form), not built
// for real production traffic. If this ever needs to run at volume,
// self-hosting either service is the upgrade path — not more code here.
const USER_AGENT = "DigiveeApp/1.0 (internal ongkir tool)";
const FETCH_TIMEOUT_MS = 8000;

function httpError(message, status) {
  return Object.assign(new Error(message), { status });
}

// Saran Zona dari jarak tempuh (km) — backend-only, sengaja gak di
// src/lib biar gak ada jalan buat toleransinya ke-bundle ke frontend.
// Toleransi 10km cuma di batas atas Zona 2 (radius antar-jemput manual
// biasa digenepin, bukan pas di angka bulat) — Zona 1 & Zona 3 batas
// atasnya KETAT, gak ditoleransi:
//   0–10km  -> Zona 1 (self-pickup, ketat)
//   11–30km -> Zona 2 (batas dasar 20km, ditoleransi sampai 30km)
//   31–40km -> Zona 3 (batas dasar 40km, ketat, gak ditoleransi)
//   >40km   -> null, di luar jangkauan antar-jemput, admin putusin manual
function suggestZona(km) {
  if (km <= 10) return "1";
  if (km <= 30) return "2";
  if (km <= 40) return "3";
  return null;
}

async function geocode(query) {
  const url = `${NOMINATIM_URL}?format=jsonv2&limit=1&countrycodes=id&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT }, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  if (!res.ok) throw new Error(`Nominatim error ${res.status}`);
  const [hit] = await res.json();
  return hit ? { lat: Number(hit.lat), lon: Number(hit.lon), matched: hit.display_name } : null;
}

// Shared by both /admin/geocode-distance (admin's Catat Transaksi form)
// and /geocode-distance (public Sewa form) — same geocode+route lookup
// either way, only who's allowed to call it differs at the route layer.
// `coords`, kalau dikasih ({lat, lon} — dari GPS browser customer pas
// geocode alamat gagal, lihat routes/geocodeDistance.js), skip Nominatim
// sama sekali dan langsung pakai itu; alamat cuma dipakai buat pesan
// error kalau geocode-nya sendiri yang dijalanin.
// Throws with a `.status` for expected/user-facing failures (bad input,
// address not found) so callers can map it straight to an HTTP status;
// unexpected failures (Nominatim/OSRM down) throw plain and fall through
// to the route's generic fail() handler.
export async function distanceFromBase(alamat, kota, coords) {
  const baseLat = Number(process.env.DIGIVEE_BASE_LAT);
  const baseLon = Number(process.env.DIGIVEE_BASE_LNG);
  if (!Number.isFinite(baseLat) || !Number.isFinite(baseLon)) {
    throw httpError("DIGIVEE_BASE_LAT/DIGIVEE_BASE_LNG belum diisi di environment variables.", 500);
  }

  let dest;
  if (coords) {
    dest = { lat: coords.lat, lon: coords.lon, matched: null };
  } else {
    if (!alamat) throw httpError("Alamat kosong.", 400);
    // Full alamat first; kalau gak ketemu (nama tempat/blok spesifik gak ada
    // di OSM) DAN ada koma, retry sekali pake bagian sesudah koma pertama
    // doang — biasanya itu jalan/kelurahan, lebih general jadi lebih gampang
    // match. Gak ada koma = gak ada yang bisa di-strip, langsung gagal.
    dest = await geocode(`${alamat}, ${kota || "Karawang"}, Indonesia`);
    if (!dest && alamat.includes(",")) {
      const stripped = alamat.slice(alamat.indexOf(",") + 1).trim();
      dest = await geocode(`${stripped}, ${kota || "Karawang"}, Indonesia`);
    }
    if (!dest) throw httpError("Alamat tidak ketemu di peta, coba lebih spesifik.", 404);
  }

  const routeUrl = `${OSRM_URL}/${baseLon},${baseLat};${dest.lon},${dest.lat}?overview=false`;
  const routeRes = await fetch(routeUrl, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  if (!routeRes.ok) throw new Error(`OSRM error ${routeRes.status}`);
  const routeData = await routeRes.json();
  const meters = routeData?.routes?.[0]?.distance;
  if (!Number.isFinite(meters)) throw httpError("OSRM gagal ngitung rute ke alamat itu.", 502);

  const km = Math.round((meters / 1000) * 10) / 10;
  return { km, suggested_zona: suggestZona(km), matched_address: dest.matched };
}
