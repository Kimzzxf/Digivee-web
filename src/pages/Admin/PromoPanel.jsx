import { Check, Gift, Star } from "lucide-react";
import { isDiscountEligible, loyaltyBonusMinutes, REFERRAL_DISCOUNT, LOYALTY_DISCOUNT } from "../../lib/discount";
import { formatRupiah, lamaSewaMenit } from "../../lib/hpp";
import { formatDurasiMenit } from "../../lib/time";
import { DiskonButton } from "./shared";

const DISKON_LABEL = {
  referral_baru: "Diskon referral (baru diajak)",
  referral_kredit: "Kredit referral",
  loyalty: "Poin loyalitas — potongan harga",
};

export default function PromoPanel({ customer, form, actions }) {
  const { terapkanDiskon, terapkanLoyaltyDurasi, batalkanDiskon } = actions;
  const diskonAktif = form.diskon_alasan !== "none";
  const referralSebagaiTeman = customer?.referred_by_customer && !customer?.referral_discount_used;
  const referralSebagaiPengajak = (customer?.referral_credits_available || 0) > 0;
  const loyaltySiapDitukar =
    (customer?.transaction_count || 0) >= 4 &&
    Math.floor((customer?.transaction_count || 0) / 4) > (customer?.loyalty_cycles_redeemed || 0);

  if (!referralSebagaiTeman && !referralSebagaiPengajak && !loyaltySiapDitukar && !diskonAktif) return null;

  const biaya = Number(form.biaya) || 0;
  const menit = lamaSewaMenit(form) ?? 0;

  return (
    <div className="rounded-lg border border-ink/15 bg-sand/40 px-3 py-2.5 md:px-4 md:py-3 space-y-2">
      <p className="font-mono text-[11px] font-bold">Promo</p>
      {diskonAktif ? (
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-xs flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 shrink-0" />
            {form.diskon_alasan === "referral_baru" && "Diskon referral (baru diajak)"}
            {form.diskon_alasan === "referral_kredit" && "Kredit referral dipakai"}
            {form.diskon_alasan === "loyalty" &&
              (form.loyalty_bonus_minutes_applied
                ? `Poin loyalitas ditukar — bonus durasi +${formatDurasiMenit(form.loyalty_bonus_minutes_applied)}`
                : "Poin loyalitas ditukar — potongan harga")}{" "}
            {Number(form.diskon) > 0 && `— potongan ${formatRupiah(Number(form.diskon))}`}
          </span>
          <button type="button" onClick={batalkanDiskon} className="shrink-0 font-mono text-[11px] underline">
            Batalkan
          </button>
        </div>
      ) : (
        <>
          {referralSebagaiTeman && (
            <DiskonButton
              icon={Gift}
              label={`Diajak oleh ${customer.referred_by_customer.nama} — diskon Rp15.000`}
              eligible={isDiscountEligible(form.zona, biaya, REFERRAL_DISCOUNT)}
              onClick={() => terapkanDiskon("referral_baru", REFERRAL_DISCOUNT)}
            />
          )}
          {referralSebagaiPengajak && (
            <DiskonButton
              icon={Gift}
              label={`Punya ${customer.referral_credits_available} kredit referral — diskon Rp15.000`}
              eligible={isDiscountEligible(form.zona, biaya, REFERRAL_DISCOUNT)}
              onClick={() => terapkanDiskon("referral_kredit", REFERRAL_DISCOUNT)}
            />
          )}
          {loyaltySiapDitukar && (
            <>
              <DiskonButton
                icon={Star}
                label="Poin loyalitas — potongan harga Rp15.000"
                eligible={isDiscountEligible(form.zona, biaya, LOYALTY_DISCOUNT)}
                onClick={() => terapkanDiskon("loyalty", LOYALTY_DISCOUNT)}
              />
              <DiskonButton
                icon={Star}
                label={`Poin loyalitas — bonus durasi +${menit > 0 ? formatDurasiMenit(loyaltyBonusMinutes(menit)) : "?"} (+50%)`}
                eligible={menit > 0}
                ineligibleReason="isi tgl sewa & kembali dulu"
                onClick={terapkanLoyaltyDurasi}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}

export { DISKON_LABEL };
