import { useState, useEffect, useCallback } from "react";
import { api } from "../../lib/api";
import { useNotification } from "../../components/NotificationProvider";

export default function useAdminTestimonials() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const { success, error: notifyError, confirmAction } = useNotification();

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.get("/admin/testimonials", { admin: true });
      setRows(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function setApproved(t, approved) {
    setBusyId(t.id);
    try {
      const updated = await api.patch(`/admin/testimonials/${t.id}`, { approved }, { admin: true });
      setRows((prev) => prev.map((r) => (r.id === t.id ? updated : r)));
      success(approved ? `Testimoni "${t.nama}" tampil di halaman utama.` : `Testimoni "${t.nama}" disembunyikan.`);
    } catch (err) {
      notifyError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function removeTestimonial(t) {
    const ok = await confirmAction({ title: `Hapus testimoni "${t.nama}"?`, message: "Nggak bisa dibatalkan.", confirmLabel: "Ya, hapus" });
    if (!ok) return;
    setBusyId(t.id);
    try {
      await api.del(`/admin/testimonials/${t.id}`, { admin: true });
      setRows((prev) => prev.filter((r) => r.id !== t.id));
      success(`Testimoni "${t.nama}" dihapus.`);
    } catch (err) {
      notifyError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  return { rows, loading, error, busyId, setApproved, removeTestimonial };
}
