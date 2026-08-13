import { Check, Pencil, Trash2, KeyRound, AlertTriangle } from "lucide-react";
import { formatWibDateTime } from "../../lib/time";
import { needsAddress, toLocalPhone } from "../../lib/customer";
import { Th, Td } from "./shared";

const iconBtn = "press-btn p-1.5 rounded-full border border-ink/15 bg-sand/60 hover:border-ink/30 transition-colors";

export default function PelangganTable({ rows, actions }) {
  const { startEdit, removeCustomer, resetPin } = actions;

  return (
    // data-lenis-prevent — same reasoning as the Laporan table.
    <div className="overflow-x-auto edit-frame bg-paper" data-lenis-prevent>
      <table className="w-full font-mono text-xs min-w-[860px]">
        <thead>
          <tr className="bg-ink text-paper text-left">
            <Th>Nama</Th>
            <Th>No WA</Th>
            <Th>Alamat</Th>
            <Th>PIN</Th>
            <Th>Transaksi</Th>
            <Th>Terdaftar</Th>
            <Th>Aksi</Th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-center py-6 opacity-60">Nggak ada pelanggan yang cocok.</td>
            </tr>
          ) : (
            rows.map((c) => (
              <tr key={c.id} className="border-t border-ink/10 align-top">
                <Td>{c.nama}</Td>
                <Td>{toLocalPhone(c.telp)}</Td>
                <Td className="whitespace-normal max-w-[180px]">
                  {needsAddress(c.alamat) ? (
                    <span className="inline-flex items-center gap-1 text-pink font-bold" title="Alamat belum lengkap — minta customer isi alamat lengkap">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      {c.alamat ? c.alamat : "Belum diisi"}
                    </span>
                  ) : (
                    c.alamat
                  )}
                </Td>
                <Td>{c.has_pin ? <Check className="w-3.5 h-3.5 text-ink/70" /> : "—"}</Td>
                <Td>{c.transaction_count}</Td>
                <Td>{formatWibDateTime(c.created_at)}</Td>
                <Td>
                  <div className="flex gap-1.5">
                    <button onClick={() => startEdit(c)} className={iconBtn} title="Edit">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    {c.has_pin && (
                      <button onClick={() => resetPin(c)} className={iconBtn} title="Reset PIN">
                        <KeyRound className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button onClick={() => removeCustomer(c)} className={iconBtn} title="Hapus">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </Td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
