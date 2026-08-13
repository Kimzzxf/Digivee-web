import { useState, useEffect } from "react";
import { api } from "../../lib/api";

// Tombol "Hitung jarak dari Digivee" + hasil km, dipake di form Catat
// Transaksi DAN form Edit Transaksi (koreksi jarak kalau alamat kepencet
// salah / geocode awal gagal). `onKm` dipanggil dengan km (atau null)
// buat nyimpen ke form.jarak_km si parent — itu yang dikirim ke API dan
// dipake hitungHPP(). `savedKm` = jarak_km yang udah kesimpen sebelumnya
// (dari row transaksi pas edit), ditampilin selama belum di-hitung ulang
// di sesi ini.
export default function JarakChecker({ alamat, kota, savedKm, onKm }) {
  const [jarak, setJarak] = useState(null); // { km, suggested_zona, matched_address } | { error } | null
  const [checking, setChecking] = useState(false);

  // Alamat diedit -> hasil cek lama udah gak relevan, jangan nampilin
  // km yang mungkin buat alamat sebelumnya.
  useEffect(() => setJarak(null), [alamat]);

  async function hitungJarak() {
    setChecking(true);
    setJarak(null);
    try {
      const qs = new URLSearchParams({ alamat, kota: kota || "" });
      const data = await api.get(`/admin/geocode-distance?${qs}`, { admin: true });
      setJarak(data);
      onKm(data.km ?? null);
    } catch (err) {
      setJarak({ error: err.message });
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={hitungJarak}
        disabled={!alamat || checking}
        className="font-mono text-xs underline underline-offset-2 disabled:opacity-40"
      >
        {checking ? "Ngitung jarak..." : "Hitung jarak dari Digivee"}
      </button>
      {jarak?.error && <span className="font-mono text-xs">{jarak.error}</span>}
      {jarak?.km != null && (
        <span className="font-mono text-xs">
          ≈{jarak.km}km dari Digivee{jarak.suggested_zona ? ` — saran Zona ${jarak.suggested_zona}` : " — di luar jangkauan antar-jemput"} (dipakai buat HPP)
          {jarak.matched_address && ` · ${jarak.matched_address}`}
        </span>
      )}
      {!jarak && savedKm != null && (
        <span className="font-mono text-xs opacity-60">Jarak tersimpan: ≈{savedKm}km (dipakai buat HPP)</span>
      )}
    </div>
  );
}
