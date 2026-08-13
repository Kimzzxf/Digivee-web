import { Star, Gift } from "lucide-react";
import { formatRupiah } from "../../lib/hpp";
import { LOYALTY_DISCOUNT } from "../../lib/discount";
import { formatDurasiMenit } from "../../lib/time";
import { formatTanggalId } from "./sewaHelpers";

export default function SewaPromoPanel({
  loyaltyBerlaku, loyaltyBisaDiskon, loyaltyBisaDurasi, loyaltyBonusMenit,
  loyaltyChoice, setLoyaltyChoice, bonusMenit, waktuReturnUsulan,
  promoLabel, promoAmount,
}) {
  if (loyaltyBerlaku && (loyaltyBisaDiskon || loyaltyBisaDurasi)) {
    return (
      <div className="rounded-lg bg-paper/10 border border-paper/30 px-4 py-3 font-mono text-xs space-y-2">
        <p className="font-bold flex items-center gap-1.5">
          <Star className="w-3.5 h-3.5" /> Poin loyalitas siap ditukar — pilih rewardnya:
        </p>
        <label
          className={`flex items-center gap-2 ${loyaltyBisaDiskon ? "cursor-pointer" : "opacity-40"}`}
        >
          <input
            type="radio"
            name="loyaltyChoice"
            checked={loyaltyChoice === "discount"}
            onChange={() => setLoyaltyChoice("discount")}
            disabled={!loyaltyBisaDiskon}
          />
          <span>Potongan harga {formatRupiah(LOYALTY_DISCOUNT)}</span>
        </label>
        <label
          className={`flex items-center gap-2 ${loyaltyBisaDurasi ? "cursor-pointer" : "opacity-40"}`}
        >
          <input
            type="radio"
            name="loyaltyChoice"
            checked={loyaltyChoice === "duration"}
            onChange={() => setLoyaltyChoice("duration")}
            disabled={!loyaltyBisaDurasi}
          />
          <span>
            Gratis +
            {loyaltyBisaDurasi ? formatDurasiMenit(loyaltyBonusMenit) : "?"}{" "}
            durasi sewa (+50%)
            {bonusMenit > 0 && waktuReturnUsulan && (
              <>
                {" "}
                — return jadi {formatTanggalId(waktuReturnUsulan.date)}{" "}
                pukul {waktuReturnUsulan.time} WIB
              </>
            )}
          </span>
        </label>
        <p className="text-[10px] text-paper/60">
          Ditotal &amp; dikonfirmasi admin pas chat WA.
        </p>
      </div>
    );
  }

  if (promoLabel && !loyaltyBerlaku) {
    return (
      <div className="rounded-lg bg-paper/10 border border-paper/30 px-4 py-2.5 font-mono text-xs flex items-start gap-1.5">
        <Gift className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span>
          {promoLabel} aktif — potongan {formatRupiah(promoAmount)}.
          Ditotal & dikonfirmasi admin pas chat WA.
        </span>
      </div>
    );
  }

  return null;
}
