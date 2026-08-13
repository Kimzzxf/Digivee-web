import { useState } from "react";
import { Download, ClipboardList, ScanLine } from "lucide-react";
import Loading from "../../components/Loading";
import {
  STATUS_ORDER,
  STATUS_LABEL,
  statusChangePatch,
} from "../../lib/status";
import { Pagination, SortSelect, PAGE_SIZE } from "./shared";
import LaporanTable from "./LaporanTable";
import LaporanEditModal from "./LaporanEditModal";
import QrScanModal from "./QrScanModal";
import { useNotification } from "../../components/NotificationProvider";
import { exportLaporanCSV } from "./laporanCsv";
import useLaporan, { LAPORAN_SORT_OPTIONS } from "./useLaporan";

const ZONA_OPTIONS = [
  { value: "all", label: "Semua Zona" },
  { value: "1", label: "Zona 1" },
  { value: "2", label: "Zona 2" },
  { value: "3", label: "Zona 3" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "Semua Status" },
  ...STATUS_ORDER.map((s) => ({ value: s, label: STATUS_LABEL[s] })),
];

export default function Laporan() {
  const {
    loading,
    error,
    rows,
    filtered,
    paged,
    zonaFilter,
    setZonaFilter,
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
    page,
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
  } = useLaporan();
  const [scanning, setScanning] = useState(false);
  const { error: notifyError } = useNotification();

  // Admin scans a customer's loyalty-card QR to close out their rental:
  // find their Ongoing row (any zona/status filter the admin currently has
  // applied doesn't matter — search the full unfiltered list) and open it
  // pre-flipped to Completed, same as manually picking that in the STATUS
  // dropdown. Saving from there is the existing edit flow — the backend
  // already applies loyalty/referral side effects when status hits
  // Completed, so nothing extra is needed here.
  function handleScan(customerId) {
    setScanning(false);
    const row = rows.find(
      (r) => r.customer_id === customerId && r.status === "Ongoing",
    );
    if (!row) {
      notifyError("Nggak ada order Ongoing buat customer ini.");
      return;
    }
    openEdit(row);
    setEditForm((f) => ({ ...f, ...statusChangePatch("Completed") }));
  }

  if (loading) {
    return (
      <div className="py-10">
        <Loading label="Memuat laporan..." />
      </div>
    );
  }

  if (error) {
    return (
      <p className="font-mono text-xs bg-pink/15 border border-pink/40 rounded-lg inline-block px-4 py-3">
        {error}
      </p>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <ClipboardList className="w-4 h-4" />
        <SortSelect
          value={zonaFilter}
          onChange={setZonaFilter}
          options={ZONA_OPTIONS}
        />
        <SortSelect
          value={statusFilter}
          onChange={setStatusFilter}
          options={STATUS_OPTIONS}
        />
        <SortSelect
          value={sortBy}
          onChange={setSortBy}
          options={LAPORAN_SORT_OPTIONS}
          className="ml-auto"
        />
        <button
          onClick={() => setScanning(true)}
          className="press-btn px-4 py-1.5 rounded-full border-3 border-ink text-ink font-mono text-xs font-bold flex items-center gap-1 hover:bg-ink hover:text-paper transition-colors"
        >
          <ScanLine className="w-3.5 h-3.5" /> SCAN QR
        </button>
        <button
          onClick={() => exportLaporanCSV(filtered)}
          className="press-btn px-4 py-1.5 rounded-full bg-ink text-paper font-mono text-xs font-bold flex items-center gap-1 hover:opacity-90 transition-opacity"
        >
          <Download className="w-3.5 h-3.5" /> EXPORT CSV
        </button>
      </div>

      <LaporanTable
        rows={paged}
        startIndex={(page - 1) * PAGE_SIZE}
        onEdit={openEdit}
        onDelete={deleteRow}
      />
      <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />

      {scanning && (
        <QrScanModal onScan={handleScan} onClose={() => setScanning(false)} />
      )}

      {editingRow && (
        <LaporanEditModal
          editingRow={editingRow}
          editForm={editForm}
          setEditForm={setEditForm}
          savingEdit={savingEdit}
          editMsg={editMsg}
          onSave={saveEditRow}
          onClose={() => setEditingRow(null)}
        />
      )}
    </div>
  );
}
