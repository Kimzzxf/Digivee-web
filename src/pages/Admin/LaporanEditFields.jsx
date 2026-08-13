import { Check, X } from "lucide-react";
import HourMinuteSelect from "../../components/HourMinuteSelect";
import { ADMIN_HOURS, combineDateTime, splitWibDateTime } from "../../lib/time";
import { STATUS_ORDER, statusChangePatch } from "../../lib/status";
import { DENDA_ALASAN, DENDA_LABEL, dendaSuggestion } from "../../lib/denda";
import JarakChecker from "./JarakChecker";

// Bottom-lined to match the Sewa form's FIELD style (sewaHelpers.js) —
// same transparent/border-b treatment, just ink-colored instead of paper
// since this modal sits on the white admin surface, not the pink hero.
const cls = "w-full px-0 py-2.5 bg-transparent border-0 border-b border-ink/20 text-ink outline-none transition-colors focus:border-pink";

function Field({ label, width = "flex-1", children }) {
  return (
    <div className={width}>
      <label className="font-bold block mb-1">{label}</label>
      {children}
    </div>
  );
}

export default function LaporanEditFields({ editForm, set }) {
  const createdParts = splitWibDateTime(editForm.created_at);
  function setCreatedAt(dateStr, jamStr) {
    const d = combineDateTime(dateStr, jamStr);
    set({ created_at: d ? d.toISOString() : "" });
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3">
        <Field label="Alamat"><input value={editForm.alamat} onChange={(e) => set({ alamat: e.target.value })} className={cls} /></Field>
        <Field label="Kota"><input value={editForm.kota} onChange={(e) => set({ kota: e.target.value })} className={cls} /></Field>
      </div>

      <Field label="Titik Meet Point">
        <input
          value={editForm.titik_meet_point}
          onChange={(e) => set({ titik_meet_point: e.target.value })}
          className={cls}
          placeholder="Titik ketemuan (dipake buat HPP, bukan alamat)"
        />
      </Field>

      <JarakChecker
        alamat={editForm.titik_meet_point}
        kota={editForm.kota}
        savedKm={editForm.jarak_km}
        onKm={(km) => set({ jarak_km: km })}
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <Field label="Zona">
          <select value={editForm.zona} onChange={(e) => set({ zona: e.target.value })} className={cls}>
            <option value="1">Zona 1</option>
            <option value="2">Zona 2</option>
            <option value="3">Zona 3</option>
          </select>
        </Field>
        <Field label="Status">
          <select value={editForm.status} onChange={(e) => set(statusChangePatch(e.target.value))} className={cls}>
            {STATUS_ORDER.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Field label="Dibuat (Analytics)">
          <div className="flex gap-2">
            <input
              type="date"
              value={createdParts.date}
              onChange={(e) => setCreatedAt(e.target.value, createdParts.time)}
              className={cls}
            />
            <div className="w-full max-w-[9.5rem]">
              <HourMinuteSelect
                value={createdParts.time}
                onChange={(v) => setCreatedAt(createdParts.date, v)}
                hours={ADMIN_HOURS}
                variant="lined"
              />
            </div>
          </div>
        </Field>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Field label="Tgl Sewa"><input type="date" value={editForm.tanggal_sewa} onChange={(e) => set({ tanggal_sewa: e.target.value })} className={cls} /></Field>
        <Field label="Tgl Kembali"><input type="date" value={editForm.tanggal_kembali} onChange={(e) => set({ tanggal_kembali: e.target.value })} className={cls} /></Field>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Field label="Jam Pickup">
          <HourMinuteSelect
            value={editForm.jam_pickup}
            onChange={(v) => set({ jam_pickup: v })}
            hours={ADMIN_HOURS}
            clearable
            variant="lined"
          />
        </Field>
        <Field label="Jam Kembali">
          <HourMinuteSelect
            value={editForm.jam_kembali}
            onChange={(v) => set({ jam_kembali: v })}
            hours={ADMIN_HOURS}
            clearable
            variant="lined"
          />
        </Field>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Field label="Biaya"><input type="number" value={editForm.biaya} onChange={(e) => set({ biaya: e.target.value })} className={cls} /></Field>
        <Field label="Denda"><input type="number" value={editForm.denda} onChange={(e) => set({ denda: e.target.value })} className={cls} /></Field>
        <Field label="PAYMENT %" width="w-full sm:w-24"><input type="number" value={editForm.payment_percent} onChange={(e) => set({ payment_percent: e.target.value })} className={cls} /></Field>
      </div>

      {Number(editForm.denda) > 0 && (
        <Field label="Alasan Denda">
          <select
            value={editForm.denda_alasan}
            onChange={(e) => {
              const alasan = e.target.value;
              const suggestion = dendaSuggestion(alasan);
              set(suggestion !== null ? { denda_alasan: alasan, denda: String(suggestion) } : { denda_alasan: alasan });
            }}
            className={cls}
          >
            {DENDA_ALASAN.map((a) => (
              <option key={a} value={a}>{DENDA_LABEL[a]}</option>
            ))}
          </select>
        </Field>
      )}

      {editForm.checklist?.length > 0 && (
        <div>
          <label className="font-bold block mb-1">Cek Kelengkapan Saat Kembali</label>
          <div className="flex flex-wrap gap-2">
            {editForm.checklist.map((c, i) => (
              <button
                key={c.item}
                type="button"
                onClick={() => {
                  const next = editForm.checklist.map((x, xi) => (xi === i ? { ...x, ok: !x.ok } : x));
                  set({ checklist: next });
                }}
                className={`press-btn flex items-center gap-1.5 px-3 py-1 rounded-full border font-mono text-xs font-bold transition-colors ${
                  c.ok ? "border-ink/15 text-ink/60 hover:border-ink/30 hover:text-ink" : "bg-pink border-pink text-white"
                }`}
              >
                {c.ok ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} {c.item}
              </button>
            ))}
          </div>
          <p className="font-mono text-[10px] text-ink/50 mt-1">Klik item yang hilang/rusak, lalu isi Denda + Alasan Denda di atas.</p>
        </div>
      )}
    </>
  );
}
