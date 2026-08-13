import { AlertTriangle, Pencil, Trash2 } from "lucide-react";
import { hitungHPP, formatRupiah, lamaSewaFormatted, keuntungan, marginPercent, totalBiaya } from "../../lib/hpp";
import { needsAddress } from "../../lib/customer";
import { getMeetPoint } from "../../lib/pricelist";
import { STATUS_STYLE } from "../../lib/status";
import { formatWibDate, formatWibTime } from "../../lib/time";
import { ReturnCountdown, BookedCountdown, Th, Td } from "./shared";

const COLUMNS = ["No", "Penyewa", "Alamat", "Meet Point", "Zona", "Tgl Sewa", "Tgl Kembali", "Lama", "Biaya", "Denda", "Total", "HPP", "Keuntungan", "Status", "Dibuat", "Countdown", "Aksi"];

export default function LaporanTable({ rows: filtered, startIndex = 0, onEdit, onDelete }) {
  return (
    // data-lenis-prevent: this table scrolls horizontally on its own —
    // without it, Lenis's touch smoothing intercepts the drag gesture for
    // the page's own vertical scroll instead.
    <div className="overflow-x-auto edit-frame bg-paper" data-lenis-prevent>
      <table className="w-full font-mono text-xs min-w-[1300px]">
        <thead>
          <tr className="bg-ink text-paper text-left">
            {COLUMNS.map((c) => (
              <Th key={c}>{c}</Th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr>
              <td colSpan={COLUMNS.length} className="text-center py-6 opacity-60">
                Belum ada transaksi.
              </td>
            </tr>
          ) : (
            filtered.map((r, i) => {
              const k = keuntungan(r);
              return (
                <tr key={r.id} className="border-t border-ink/10">
                  <Td>{startIndex + i + 1}</Td>
                  <Td>
                    {r.customers?.nama || "-"}
                    <div className="opacity-50">{r.customers?.telp}</div>
                  </Td>
                  <Td className="whitespace-normal max-w-[180px]">
                    {needsAddress(r.alamat) ? (
                      <span className="inline-flex items-center gap-1 text-pink font-bold" title="Alamat belum lengkap — minta customer isi alamat lengkap">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        {r.alamat || "-"}
                      </span>
                    ) : (
                      r.alamat
                    )}
                  </Td>
                  <Td className="whitespace-normal max-w-[160px]">{r.titik_meet_point || getMeetPoint(`zona${r.zona}`)?.label || "-"}</Td>
                  <Td>Zona {r.zona}</Td>
                  <Td>
                    {r.tanggal_sewa || "-"}
                    {r.jam_pickup && <div className="opacity-50">{r.jam_pickup} WIB</div>}
                  </Td>
                  <Td>
                    {r.tanggal_kembali || "-"}
                    {r.jam_kembali && <div className="opacity-50">{r.jam_kembali} WIB</div>}
                  </Td>
                  <Td>{lamaSewaFormatted(r) ?? "-"}</Td>
                  <Td>{formatRupiah(r.biaya)}</Td>
                  <Td>{formatRupiah(r.denda)}</Td>
                  <Td className="font-bold">{formatRupiah(totalBiaya(r))}</Td>
                  <Td>{formatRupiah(hitungHPP(r.zona, r.jarak_km))}</Td>
                  <Td style={{ color: k < 0 ? "#c0264d" : "inherit" }} className="font-bold">
                    {formatRupiah(k)} ({marginPercent(r)}%)
                  </Td>
                  <Td>
                    <span className={`kicker px-2 py-0.5 rounded-full inline-block ${STATUS_STYLE[r.status] || "bg-sand text-ink"}`}>{r.status || "-"}</span>
                  </Td>
                  <Td>
                    {r.created_at ? (
                      <>
                        {formatWibDate(r.created_at, { day: "numeric", month: "short", year: "numeric" })}
                        <div className="opacity-50">{formatWibTime(r.created_at)} WIB</div>
                      </>
                    ) : (
                      "-"
                    )}
                  </Td>
                  <Td>
                    {r.status === "Ongoing" ? (
                      <ReturnCountdown tanggalKembali={r.tanggal_kembali} jamKembali={r.jam_kembali} />
                    ) : r.status === "Booked" ? (
                      <BookedCountdown tanggalSewa={r.tanggal_sewa} nama={r.customers?.nama} telp={r.customers?.telp} />
                    ) : (
                      "-"
                    )}
                  </Td>
                  <Td>
                    <div className="flex gap-1.5">
                      <button onClick={() => onEdit(r)} className="press-btn p-1.5 rounded-full border border-ink/15 bg-sand/60 hover:border-ink/30 transition-colors" title="Edit">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => onDelete(r)} className="press-btn p-1.5 rounded-full border border-ink/15 bg-sand/60 hover:border-ink/30 transition-colors" title="Hapus">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </Td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
