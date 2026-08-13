import { useState } from "react";
import { User, Pencil, Check, X, Loader2 } from "lucide-react";
import { updateProfile, maskPhone } from "../../lib/customer";
import { useNotification } from "../../components/NotificationProvider";

const inputCls = "w-full px-3 py-2 rounded-lg border border-ink/15 bg-paper text-ink font-mono text-sm outline-none transition-colors focus:border-pink";
const btnBase = "press-btn px-4 py-2 rounded-full font-mono text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-60";

export default function ProfileDetails({ customer, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ nama: customer.nama, telp: customer.telp, alamat: customer.alamat || "" });
  const [saving, setSaving] = useState(false);
  const { success, error: notifyError } = useNotification();

  function startEdit() {
    setForm({ nama: customer.nama, telp: customer.telp, alamat: customer.alamat || "" });
    setEditing(true);
  }

  async function save() {
    setSaving(true);
    try {
      const updated = await updateProfile(customer.id, form.nama, form.telp, form.alamat);
      onUpdate((prev) => ({ ...prev, ...updated }));
      setEditing(false);
      success("Profil diperbarui.");
    } catch (err) {
      notifyError(err.message || "Gagal memperbarui profil.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="edit-frame p-5 md:p-6 mt-6 md:mt-0">
      <p className="kicker text-smoke mb-3 flex items-center gap-1.5">
        <User className="w-3.5 h-3.5" /> Detail Profil
      </p>

      {editing ? (
        <div className="space-y-3">
          <div>
            <label className="font-mono text-xs font-bold block mb-1">Nama</label>
            <input value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className="font-mono text-xs font-bold block mb-1">No WA</label>
            <input value={form.telp} onChange={(e) => setForm({ ...form, telp: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className="font-mono text-xs font-bold block mb-1">Alamat</label>
            <input value={form.alamat} onChange={(e) => setForm({ ...form, alamat: e.target.value })} className={inputCls} placeholder="Belum diisi" />
          </div>
          <div className="flex gap-2">
            <button disabled={saving || !form.nama.trim() || !form.telp.trim()} onClick={save} className={`${btnBase} bg-pink text-white hover:opacity-90`}>
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Simpan
            </button>
            <button disabled={saving} onClick={() => setEditing(false)} className={`${btnBase} border border-ink/15 bg-sand/60 hover:border-ink/30`}>
              <X className="w-3.5 h-3.5" /> Batal
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="font-mono text-sm space-y-1">
            <p>Nama: <span className="font-bold">{customer.nama}</span></p>
            <p>No WA: <span className="font-bold">{maskPhone(customer.telp)}</span></p>
            <p>Alamat: <span className="font-bold">{customer.alamat || "—"}</span></p>
          </div>
          <button onClick={startEdit} className={`${btnBase} border border-ink/15 bg-sand/60 hover:border-ink/30`}>
            <Pencil className="w-3.5 h-3.5" /> Edit
          </button>
        </div>
      )}
    </div>
  );
}
