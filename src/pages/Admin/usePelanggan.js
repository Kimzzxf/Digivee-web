import { useState, useEffect, useCallback } from "react";
import { api } from "../../lib/api";
import { toLocalPhone } from "../../lib/customer";
import { useNotification } from "../../components/NotificationProvider";
import { PAGE_SIZE } from "./shared";

export const PELANGGAN_SORT_OPTIONS = [
  { value: "date_desc", label: "Terbaru" },
  { value: "date_asc", label: "Terlama" },
  { value: "name_asc", label: "Nama A-Z" },
  { value: "name_desc", label: "Nama Z-A" },
];

function sortRows(rows, sortBy) {
  const sorted = [...rows];
  switch (sortBy) {
    case "name_asc":
      return sorted.sort((a, b) => (a.nama || "").localeCompare(b.nama || ""));
    case "name_desc":
      return sorted.sort((a, b) => (b.nama || "").localeCompare(a.nama || ""));
    case "date_asc":
      return sorted.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    default:
      return sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }
}

export default function usePelanggan() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortBy, setSortByRaw] = useState("date_desc");
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ nama: "", telp: "", alamat: "", created_at: "" });
  const [saving, setSaving] = useState(false);
  const [conflict, setConflict] = useState(null); // { editingId, id, nama, telp, transaction_count }
  const [rowMsg, setRowMsg] = useState("");
  const { success, error: notifyError, confirmAction } = useNotification();

  const load = useCallback(async (query) => {
    setLoading(true);
    setError("");
    setPage(1);
    try {
      const data = await api.get(`/admin/customers${query ? `?q=${encodeURIComponent(query)}` : ""}`, { admin: true });
      setRows(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load("");
  }, [load]);

  function startEdit(c) {
    setEditingId(c.id);
    setEditForm({ nama: c.nama, telp: toLocalPhone(c.telp), alamat: c.alamat || "", created_at: c.created_at });
    setConflict(null);
    setRowMsg("");
  }

  function cancelEdit() {
    setEditingId(null);
    setConflict(null);
  }

  async function saveEdit(id) {
    setSaving(true);
    setRowMsg("");
    try {
      const updated = await api.patch(`/admin/customers/${id}`, editForm, { admin: true });
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...updated } : r)));
      setEditingId(null);
      setConflict(null);
      success("Data pelanggan diperbarui.");
    } catch (err) {
      if (err.status === 409 && err.payload?.conflict) {
        setConflict({ editingId: id, ...err.payload.conflict });
      } else {
        setRowMsg(err.message);
        notifyError(err.message);
      }
    } finally {
      setSaving(false);
    }
  }

  async function mergeInto(sourceId, targetId) {
    setSaving(true);
    setRowMsg("");
    try {
      await api.post("/admin/customers/merge", { sourceId, targetId }, { admin: true });
      setEditingId(null);
      setConflict(null);
      load(q);
      success("Akun pelanggan berhasil digabungkan.");
    } catch (err) {
      setRowMsg(err.message);
      notifyError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function removeCustomer(c) {
    const ok = await confirmAction({ title: `Hapus "${c.nama}"?`, message: "Cuma bisa kalau belum ada transaksinya.", confirmLabel: "Ya, hapus" });
    if (!ok) return;
    try {
      await api.del(`/admin/customers/${c.id}`, { admin: true });
      setRows((prev) => prev.filter((r) => r.id !== c.id));
      success(`"${c.nama}" dihapus dari daftar pelanggan.`);
    } catch (err) {
      notifyError(err.message);
    }
  }

  async function resetPin(c) {
    const ok = await confirmAction({ title: `Reset PIN "${c.nama}"?`, message: "Dia bakal disuruh bikin PIN baru pas login berikutnya.", confirmLabel: "Ya, reset" });
    if (!ok) return;
    try {
      await api.post(`/admin/customers/${c.id}/reset-pin`, {}, { admin: true });
      setRows((prev) => prev.map((r) => (r.id === c.id ? { ...r, has_pin: false } : r)));
      success(`PIN "${c.nama}" berhasil direset.`);
    } catch (err) {
      notifyError(err.message);
    }
  }

  const sorted = sortRows(rows, sortBy);
  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const paged = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return {
    q, setQ, rows: paged, loading, error, sortBy,
    setSortBy: (v) => { setSortByRaw(v); setPage(1); },
    page: safePage, pageCount, setPage,
    editingId, editForm, setEditForm, saving, conflict, rowMsg,
    load, startEdit, cancelEdit, saveEdit, mergeInto, removeCustomer, resetPin,
  };
}
