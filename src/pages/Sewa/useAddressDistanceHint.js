import { useState } from "react";
import { api } from "../../lib/api";

// Advisory "kira-kira Zona berapa" + jarak, sekarang dari ALAMAT CUSTOMER
// (motor jalan ke situ) — dipanggil sekali pas Alamat field di-blur, bukan
// tiap ketikan (public Nominatim/OSRM instance, jangan digebuk tiap
// keystroke).
export function useAddressDistanceHint() {
  const [jarak, setJarak] = useState(null); // { km, suggested_zona, matched_address } | { error } | null
  const [checking, setChecking] = useState(false);

  async function fetchJarak(params) {
    setChecking(true);
    try {
      const qs = new URLSearchParams(params);
      setJarak(await api.get(`/geocode-distance?${qs}`));
    } catch (err) {
      setJarak({ error: err.message });
    } finally {
      setChecking(false);
    }
  }

  async function checkJarak(alamat) {
    if (!alamat?.trim()) {
      setJarak(null);
      return;
    }
    fetchJarak({ alamat });
  }

  // Fallback pas geocode alamat gagal (typo / gak ada di OSM) — pakai GPS
  // browser langsung, skip Nominatim sama sekali. Backend tetep butuh
  // OSRM buat rute+km, cuma titik asalnya dari sini bukan dari geocode.
  function checkJarakFromGPS() {
    if (!navigator.geolocation) {
      setJarak({ error: "Browser kamu gak dukung deteksi lokasi." });
      return;
    }
    setChecking(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => fetchJarak({ lat: coords.latitude, lon: coords.longitude }),
      () => {
        setChecking(false);
        setJarak({ error: "Gagal ambil lokasi — izinkan akses lokasi dulu, atau isi alamat manual." });
      },
    );
  }

  return { jarak, checking, checkJarak, checkJarakFromGPS, resetJarak: () => setJarak(null) };
}
