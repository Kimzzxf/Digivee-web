import HourMinuteSelect from "../../components/HourMinuteSelect";
import { ADMIN_HOURS } from "../../lib/time";
import { STATUS_ORDER, statusChangePatch } from "../../lib/status";
import { DENDA_ALASAN, DENDA_LABEL, dendaSuggestion } from "../../lib/denda";
import JarakChecker from "./JarakChecker";

// Bottom-lined to match LaporanEditFields.jsx / the Sewa form's FIELD
// style (sewaHelpers.js) — same transparent/border-b treatment.
const inputClass =
  "w-full px-0 py-2.5 bg-transparent border-0 border-b border-ink/20 text-ink font-mono text-sm outline-none transition-colors focus:border-pink";

function Field({ label, children }) {
  return (
    <div className="flex-1">
      <label className="font-mono text-xs font-bold block mb-1">{label}</label>
      {children}
    </div>
  );
}

export default function TransaksiFormFields({ form, setForm }) {
  const set = (patch) => setForm({ ...form, ...patch });

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3">
        <Field label="Alamat">
          <input
            value={form.alamat}
            onChange={(e) => set({ alamat: e.target.value })}
            className={inputClass}
          />
        </Field>
        <Field label="Kota">
          <input value={form.kota} onChange={(e) => set({ kota: e.target.value })} className={inputClass} />
        </Field>
      </div>

      <Field label="Titik Meet Point">
        <input
          value={form.titik_meet_point}
          onChange={(e) => set({ titik_meet_point: e.target.value })}
          className={inputClass}
          placeholder="Titik ketemuan (dipake buat HPP, bukan alamat)"
        />
      </Field>

      <JarakChecker
        alamat={form.titik_meet_point}
        kota={form.kota}
        savedKm={form.jarak_km}
        onKm={(km) => set({ jarak_km: km })}
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <Field label="Zona">
          <select value={form.zona} onChange={(e) => set({ zona: e.target.value })} className={inputClass}>
            <option value="1">Zona 1 — Short Rent (Self-pickup)</option>
            <option value="2">Zona 2 — Antar Jemput 0–20km</option>
            <option value="3">Zona 3 — Antar Jemput 20–40km</option>
          </select>
        </Field>
        <Field label="Status">
          <select
            value={form.status}
            onChange={(e) => set(statusChangePatch(e.target.value))}
            className={inputClass}
          >
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Field label="Tgl Sewa">
          <input type="date" value={form.tanggal_sewa} onChange={(e) => set({ tanggal_sewa: e.target.value })} className={inputClass} />
        </Field>
        <Field label="Tgl Kembali">
          <input type="date" value={form.tanggal_kembali} onChange={(e) => set({ tanggal_kembali: e.target.value })} className={inputClass} />
        </Field>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Field label="Jam Pickup">
          <HourMinuteSelect
            value={form.jam_pickup}
            onChange={(v) => set({ jam_pickup: v })}
            hours={ADMIN_HOURS}
            clearable
            variant="lined"
          />
        </Field>
        <Field label="Jam Kembali">
          <HourMinuteSelect
            value={form.jam_kembali}
            onChange={(v) => set({ jam_kembali: v })}
            hours={ADMIN_HOURS}
            clearable
            variant="lined"
          />
        </Field>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Field label="BIAYA (Rp)">
          <input type="number" value={form.biaya} onChange={(e) => set({ biaya: e.target.value })} className={inputClass} />
        </Field>
        <Field label="DENDA (Rp)">
          <input type="number" value={form.denda} onChange={(e) => set({ denda: e.target.value })} className={inputClass} />
        </Field>
        <div className="w-full sm:w-28">
          <label className="font-mono text-xs font-bold block mb-1">PAYMENT %</label>
          <input type="number" value={form.payment_percent} onChange={(e) => set({ payment_percent: e.target.value })} className={inputClass} />
        </div>
      </div>

      {Number(form.denda) > 0 && (
        <Field label="Alasan Denda">
          <select
            value={form.denda_alasan}
            onChange={(e) => {
              const alasan = e.target.value;
              const suggestion = dendaSuggestion(alasan);
              // Cuma auto-isi kalau field-nya ada rumus tetap (telat/hilang)
              // — "rusak" gak punya rumus, biarin apa yang udah diketik admin.
              set(suggestion !== null ? { denda_alasan: alasan, denda: String(suggestion) } : { denda_alasan: alasan });
            }}
            className={inputClass}
          >
            {DENDA_ALASAN.map((a) => (
              <option key={a} value={a}>
                {DENDA_LABEL[a]}
              </option>
            ))}
          </select>
        </Field>
      )}
    </>
  );
}
