import { FIELD } from "./sewaHelpers";
import { outOfRangeWaUrl } from "../../lib/contact";
import { WhatsAppIcon } from "../../components/SocialIcons";

export default function SewaBasicFields({
  nama, setNama, alamat, setAlamat, onAlamatBlur,
  meetPointId, handleMeetPointChange, meetPoint,
  durationId, handleDurationChange,
  distanceHint,
}) {
  return (
    <>
      <div>
        <label className="font-mono text-xs font-bold block mb-1">Nama</label>
        <input
          value={nama}
          onChange={(e) => setNama(e.target.value)}
          className={FIELD}
          placeholder="Nama kamu"
          required
        />
      </div>

      <div>
        <label className="font-mono text-xs font-bold block mb-1">Alamat</label>
        <input
          value={alamat}
          onChange={(e) => setAlamat(e.target.value)}
          onBlur={onAlamatBlur}
          className={FIELD}
          placeholder="Alamat lengkap buat antar/jemput"
          required
        />
        {distanceHint?.checking && (
          <p className="font-mono text-xs text-paper/60 mt-1">Ngecek zona...</p>
        )}
        {distanceHint?.jarak?.error && (
          <div className="font-mono text-xs text-paper/60 mt-1">
            <p>
              Alamat gak ketemu di peta. Coba isi sesuai yang ada di OpenStreetMap — misalnya nama kecamatan/kelurahan.
            </p>
            <button
              type="button"
              onClick={() => distanceHint.checkJarakFromGPS()}
              disabled={distanceHint.checking}
              className="underline underline-offset-2 text-paper/80 mt-1 disabled:opacity-40"
            >
              Gunakan lokasi saya
            </button>
          </div>
        )}
        {distanceHint?.jarak?.km != null && (
          <div className="font-mono text-xs text-paper/60 mt-1">
            <p>
              ≈{distanceHint.jarak.km}km dari Digivee
              {distanceHint.jarak.suggested_zona
                ? ` — Zona ${distanceHint.jarak.suggested_zona}${
                    distanceHint.jarak.suggested_zona === "1" ? " (bisa self pickup)" : ""
                  }`
                : " — lokasi kamu di luar zona 40km"}
            </p>
            {distanceHint.jarak.matched_address && (
              <p className="text-paper/40 mt-0.5">Ketemu: {distanceHint.jarak.matched_address}</p>
            )}
            {!distanceHint.jarak.suggested_zona && (
              <a
                href={outOfRangeWaUrl(alamat, distanceHint.jarak.km)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-1.5 underline underline-offset-2 text-paper/80"
              >
                <WhatsAppIcon className="w-3.5 h-3.5" />
                Chat MinV di WA yaa
              </a>
            )}
          </div>
        )}
        {meetPointId !== "zona1" && (
          <button
            type="button"
            onClick={() => handleMeetPointChange("zona1")}
            className="font-mono text-xs underline text-paper/70 mt-1"
          >
            Ambil sendiri di toko (Zona 1)
          </button>
        )}
      </div>

      <div>
        <label className="font-mono text-xs font-bold block mb-1">
          Durasi Sewa
        </label>
        <select
          value={durationId}
          onChange={(e) => handleDurationChange(e.target.value)}
          disabled={!meetPoint}
          className={`${FIELD} disabled:opacity-40`}
          required
        >
          <option value="" disabled>
            {meetPoint ? "Pilih durasi..." : "Isi alamat dulu ya"}
          </option>
          {meetPoint?.durations.map((d) => (
            <option key={d.id} value={d.id}>
              {d.label}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
