import { Camera } from "lucide-react";
import { STATUS_STYLE } from "../../lib/status";
import { formatWibDate, formatWibDateTime } from "../../lib/time";

const ZONE_LABEL = { 1: "Zona 1", 2: "Zona 2", 3: "Zona 3" };

function StatusBadge({ status }) {
  return (
    <span className={`kicker px-2 py-0.5 rounded-full shrink-0 ${STATUS_STYLE[status] || "bg-sand text-ink"}`}>
      {status || "-"}
    </span>
  );
}

function formatTanggalJam(tanggal, jam) {
  if (!tanggal) return "-";
  const tgl = formatWibDate(tanggal);
  return jam ? `${tgl} · ${jam} WIB` : tgl;
}

function formatDiajukan(createdAt) {
  if (!createdAt) return "-";
  return formatWibDateTime(createdAt, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function ProfileTransactionHistory({ transactions }) {
  return (
    <>
      <h2 className="font-display text-xl mt-10 mb-4">Riwayat Sewa</h2>
      {transactions.length === 0 ? (
        <p className="font-mono text-sm text-ink/60">Belum ada transaksi tercatat.</p>
      ) : (
        <ul className="space-y-2">
          {transactions.map((t) => (
            <li key={t.id} className="edit-frame p-4 font-mono text-sm">
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="flex items-center gap-2 font-bold">
                  <Camera className="w-4 h-4" /> {ZONE_LABEL[t.zona] || "ZONA ?"}
                </span>
                <StatusBadge status={t.status} />
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-ink/70">
                <div>
                  <span className="block text-ink/40 mb-0.5">Pickup</span>
                  {formatTanggalJam(t.tanggal_sewa, t.jam_pickup)}
                </div>
                <div>
                  <span className="block text-ink/40 mb-0.5">Kembali</span>
                  {formatTanggalJam(t.tanggal_kembali, t.jam_kembali)}
                </div>
                <div className="col-span-2">
                  <span className="block text-ink/40 mb-0.5">Diajukan</span>
                  {formatDiajukan(t.created_at)}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
