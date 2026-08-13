import { Loader2, Check, X, ArrowRightLeft } from "lucide-react";
import { splitWibDateTime, combineDateTime, ADMIN_HOURS } from "../../lib/time";
import HourMinuteSelect from "../../components/HourMinuteSelect";

// Bottom-lined to match LaporanEditFields.jsx / TransaksiFormFields.jsx —
// same transparent/border-b treatment used across the other admin modals.
const cls = "w-full px-0 py-2.5 bg-transparent border-0 border-b border-ink/20 text-ink outline-none transition-colors focus:border-pink";

function Field({ label, children }) {
  return (
    <div className="flex-1">
      <label className="font-bold block mb-1">{label}</label>
      {children}
    </div>
  );
}

export default function PelangganEditModal({ editForm, setEditForm, saving, conflict, rowMsg, onSave, onMerge, onClose }) {
  const set = (patch) => setEditForm({ ...editForm, ...patch });
  const createdParts = splitWibDateTime(editForm.created_at);
  function setCreatedAt(dateStr, jamStr) {
    const d = combineDateTime(dateStr, jamStr);
    set({ created_at: d ? d.toISOString() : "" });
  }

  return (
    <div className="modal-shell fixed inset-0 z-50 bg-ink/40">
      <div data-lenis-prevent className="edit-frame bg-paper rounded-lg w-full max-w-lg max-h-[85dvh] overflow-y-auto p-4 md:p-5 pop-in">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-lg">Edit Pelanggan</h3>
          <button onClick={onClose} className="press-btn p-1.5 border border-ink/15 bg-sand/60 hover:border-ink/30 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 font-mono text-xs">
          <Field label="Nama">
            <input value={editForm.nama} onChange={(e) => set({ nama: e.target.value })} className={cls} />
          </Field>
          <Field label="No WA">
            <input value={editForm.telp} onChange={(e) => set({ telp: e.target.value })} className={cls} />
          </Field>
          <Field label="Alamat">
            <input value={editForm.alamat} onChange={(e) => set({ alamat: e.target.value })} className={cls} placeholder="Belum diisi" />
          </Field>
          <Field label="Terdaftar">
            <div className="flex gap-2">
              <input type="date" value={createdParts.date} onChange={(e) => setCreatedAt(e.target.value, createdParts.time)} className={cls} />
              <div className="w-full max-w-[9.5rem]">
                <HourMinuteSelect value={createdParts.time} onChange={(v) => setCreatedAt(createdParts.date, v)} hours={ADMIN_HOURS} variant="lined" />
              </div>
            </div>
          </Field>

          {conflict && (
            <div className="bg-sand/60 border border-ink/15 rounded-lg p-3 pop-in">
              <p className="mb-2">
                Nomor ini udah dipakai <strong>{conflict.nama}</strong> ({conflict.transaction_count} transaksi).
              </p>
              <button
                disabled={saving}
                onClick={onMerge}
                className="press-btn w-full flex items-center justify-center gap-1 px-3 py-2 rounded-full bg-pink text-white font-bold hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                <ArrowRightLeft className="w-3.5 h-3.5 shrink-0" /> Gabungkan ke akun itu
              </button>
            </div>
          )}
          {rowMsg && !conflict && <p className="bg-pink/15 border border-pink/40 rounded-lg px-4 py-3">{rowMsg}</p>}

          <button
            disabled={saving}
            onClick={onSave}
            className="press-btn w-full py-3 bg-pink text-white font-body font-bold rounded-full flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Simpan Perubahan
          </button>
        </div>
      </div>
    </div>
  );
}
