import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { formatRupiah } from "../../lib/hpp";
import { FIELD_READONLY } from "./sewaHelpers";
import Button from "../../components/Button";

export default function SewaSummary({ duration, promoAmount, jumlahSetelahPromo, jumlah, dp }) {
  return (
    <>
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="font-mono text-xs font-bold block mb-1">
            Jumlah
          </label>
          <input
            value={
              duration
                ? formatRupiah(promoAmount ? jumlahSetelahPromo : jumlah)
                : "-"
            }
            disabled
            className={FIELD_READONLY}
          />
        </div>
        <div className="flex-1">
          <label className="font-mono text-xs font-bold block mb-1">
            DP (50%)
          </label>
          <input
            value={
              duration
                ? formatRupiah(
                    promoAmount ? Math.round(jumlahSetelahPromo * 0.5) : dp,
                  )
                : "-"
            }
            disabled
            className={FIELD_READONLY}
          />
        </div>
      </div>

      <label className="flex items-start gap-2.5 font-mono text-xs leading-relaxed">
        <input
          type="checkbox"
          required
          className="accent-pink w-4 h-4 mt-0.5 shrink-0"
        />
        Saya setuju dengan{" "}
        <Link to="/syarat-ketentuan" target="_blank" className="underline hover:opacity-70 transition-opacity">
          Syarat &amp; Ketentuan
        </Link>{" "}
        Digivee.
      </label>

      <Button type="submit" icon={ArrowUpRight} full>
        Lanjutkan ke Pembayaran
      </Button>
      <p className="font-mono text-[10px] text-paper/60 text-center leading-relaxed">
        Kamu bakal diarahkan ke WhatsApp admin buat konfirmasi & pembayaran
        DP.
      </p>
    </>
  );
}
