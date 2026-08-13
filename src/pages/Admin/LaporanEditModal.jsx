import { Loader2, Check, X, Gift } from "lucide-react";
import { formatRupiah } from "../../lib/hpp";
import { EDIT_DISKON_LABELS, EDIT_DISKON_ICONS } from "./shared";
import LaporanEditFields from "./LaporanEditFields";

export default function LaporanEditModal({ editingRow, editForm, setEditForm, savingEdit, editMsg, onSave, onClose }) {
  const set = (patch) => setEditForm({ ...editForm, ...patch });
  const DiskonIcon = EDIT_DISKON_ICONS[editingRow.diskon_alasan] || Gift;

  return (
    <div className="modal-shell fixed inset-0 z-50 bg-ink/40">
      {/* data-lenis-prevent: this panel scrolls internally — without it
          Lenis captures the wheel/touch events meant for this modal. */}
      <div data-lenis-prevent className="edit-frame bg-paper rounded-lg w-full max-w-lg max-h-[85dvh] overflow-y-auto p-4 md:p-5 pop-in">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-lg">Edit Transaksi</h3>
          <button onClick={onClose} className="press-btn p-1.5 border border-ink/15 bg-sand/60 hover:border-ink/30 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="font-mono text-xs mb-3 opacity-70">
          {editingRow.customers?.nama} · {editingRow.customers?.telp}
        </p>

        {editingRow.diskon_alasan && editingRow.diskon_alasan !== "none" && (
          <div className="rounded-lg bg-pink/15 border border-pink/40 px-3 py-2 font-mono text-xs mb-3">
            <span className="inline-flex items-center gap-1.5">
              <DiskonIcon className="w-3.5 h-3.5 shrink-0" />
              {EDIT_DISKON_LABELS[editingRow.diskon_alasan] || editingRow.diskon_alasan}
              {editingRow.diskon > 0 && <> — potongan {formatRupiah(editingRow.diskon)}</>}
            </span>
            {editingRow.status !== "Completed" && (
              <p className="opacity-70 mt-1">Diterapkan ke akun customer (referral/loyalty) begitu status ini disimpan sebagai Completed.</p>
            )}
          </div>
        )}

        <div className="space-y-3 font-mono text-xs">
          <LaporanEditFields editForm={editForm} set={set} />

          {editMsg && <p className="bg-pink/15 border border-pink/40 rounded-lg px-4 py-3">{editMsg}</p>}

          <button
            disabled={savingEdit}
            onClick={onSave}
            className="press-btn w-full py-3 bg-pink text-white font-body font-bold rounded-full flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {savingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Simpan Perubahan
          </button>
        </div>
      </div>
    </div>
  );
}
