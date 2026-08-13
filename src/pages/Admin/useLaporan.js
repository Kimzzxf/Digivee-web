import { useState, useEffect, useCallback } from "react";
import { api } from "../../lib/api";
import { useNotification } from "../../components/NotificationProvider";
import { PAGE_SIZE } from "./shared";

export const LAPORAN_SORT_OPTIONS = [
  { value: "date_desc", label: "Order Terbaru" },
  { value: "date_asc", label: "Order Terlama" },
  { value: "name_asc", label: "Nama A-Z" },
  { value: "name_desc", label: "Nama Z-A" },
];

function sortRows(rows, sortBy) {
  const sorted = [...rows];
  switch (sortBy) {
    case "name_asc":
      return sorted.sort((a, b) =>
        (a.customers?.nama || "").localeCompare(b.customers?.nama || ""),
      );
    case "name_desc":
      return sorted.sort((a, b) =>
        (b.customers?.nama || "").localeCompare(a.customers?.nama || ""),
      );
    case "date_asc":
      return sorted.sort(
        (a, b) => new Date(a.created_at) - new Date(b.created_at),
      );
    default:
      return sorted.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at),
      );
  }
}

export default function useLaporan() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [zonaFilter, setZonaFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date_desc");
  const [page, setPage] = useState(1);
  const [editingRow, setEditingRow] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editMsg, setEditMsg] = useState("");
  const { success, error: notifyError, confirmAction } = useNotification();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get("/admin/transactions", { admin: true });
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

  function openEdit(r) {
    setEditingRow(r);
    setEditForm({
      zona: r.zona,
      jarak_km: r.jarak_km ?? null,
      alamat: r.alamat || "",
      titik_meet_point: r.titik_meet_point || "",
      kota: r.kota || "",
      tanggal_sewa: r.tanggal_sewa || "",
      tanggal_kembali: r.tanggal_kembali || "",
      jam_pickup: r.jam_pickup || "",
      jam_kembali: r.jam_kembali || "",
      biaya: r.biaya ?? 0,
      denda: r.denda ?? 0,
      denda_alasan: r.denda_alasan || "none",
      checklist: r.checklist || [],
      payment_percent: r.payment_percent ?? 100,
      status: r.status || "Completed",
      created_at: r.created_at || "",
    });
    setEditMsg("");
  }

  async function saveEditRow() {
    setSavingEdit(true);
    setEditMsg("");
    try {
      const updated = await api.patch(
        `/admin/transactions/${editingRow.id}`,
        editForm,
        { admin: true },
      );
      setRows((prev) =>
        prev.map((r) => (r.id === editingRow.id ? updated : r)),
      );
      setEditingRow(null);
      success("Perubahan transaksi tersimpan.");
    } catch (err) {
      setEditMsg(err.message);
      notifyError(err.message);
    } finally {
      setSavingEdit(false);
    }
  }

  async function deleteRow(r) {
    const ok = await confirmAction({
      title: "Hapus transaksi ini?",
      message: `${r.customers?.nama || "Transaksi ini"} · ${r.tanggal_sewa || "-"}. Nggak bisa dibalikin.`,
      confirmLabel: "Ya, hapus",
    });
    if (!ok) return;
    try {
      await api.del(`/admin/transactions/${r.id}`, { admin: true });
      setRows((prev) => prev.filter((x) => x.id !== r.id));
      success("Transaksi dihapus.");
    } catch (err) {
      notifyError(err.message);
    }
  }

  const filtered = sortRows(
    rows.filter(
      (r) =>
        (zonaFilter === "all" || r.zona === zonaFilter) &&
        (statusFilter === "all" || r.status === statusFilter),
    ),
    sortBy,
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const paged = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  return {
    loading,
    error,
    rows,
    filtered,
    paged,
    zonaFilter,
    setZonaFilter: (v) => {
      setZonaFilter(v);
      setPage(1);
    },
    statusFilter,
    setStatusFilter: (v) => {
      setStatusFilter(v);
      setPage(1);
    },
    sortBy,
    setSortBy: (v) => {
      setSortBy(v);
      setPage(1);
    },
    page: safePage,
    pageCount,
    setPage,
    editingRow,
    setEditingRow,
    editForm,
    setEditForm,
    savingEdit,
    editMsg,
    openEdit,
    saveEditRow,
    deleteRow,
  };
}
