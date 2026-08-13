import { Search } from "lucide-react";
import Loading from "../../components/Loading";
import PelangganTable from "./PelangganTable";
import PelangganEditModal from "./PelangganEditModal";
import { Pagination, SortSelect } from "./shared";
import usePelanggan, { PELANGGAN_SORT_OPTIONS } from "./usePelanggan";

export default function Pelanggan() {
  const {
    q, setQ, rows, loading, error, sortBy, setSortBy, page, pageCount, setPage,
    editingId, editForm, setEditForm, saving, conflict, rowMsg, load, cancelEdit, saveEdit, mergeInto, ...actions
  } = usePelanggan();

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-4 md:mb-6 items-start">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            load(q);
          }}
          className="edit-frame bg-paper p-4 md:p-5 flex gap-2 flex-1 min-w-[260px]"
        >
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari nama atau no WA..."
            className="flex-1 px-3 py-2 rounded-lg border border-ink/15 bg-paper text-ink font-mono text-sm outline-none transition-colors focus:border-pink"
          />
          <button className="press-btn px-4 rounded-full bg-ink text-paper flex items-center gap-1 font-body font-bold text-sm hover:opacity-90 transition-opacity">
            <Search className="w-4 h-4" /> Cari
          </button>
        </form>
        <SortSelect value={sortBy} onChange={setSortBy} options={PELANGGAN_SORT_OPTIONS} className="mt-1" />
      </div>

      {loading ? (
        <div className="py-10">
          <Loading label="Memuat pelanggan..." />
        </div>
      ) : error ? (
        <p className="font-mono text-xs bg-pink/15 border border-pink/40 rounded-lg inline-block px-4 py-3">{error}</p>
      ) : (
        <>
          <PelangganTable rows={rows} actions={actions} />
          <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
        </>
      )}

      {editingId && (
        <PelangganEditModal
          editForm={editForm}
          setEditForm={setEditForm}
          saving={saving}
          conflict={conflict}
          rowMsg={rowMsg}
          onSave={() => saveEdit(editingId)}
          onMerge={() => mergeInto(editingId, conflict.id)}
          onClose={cancelEdit}
        />
      )}
    </div>
  );
}
