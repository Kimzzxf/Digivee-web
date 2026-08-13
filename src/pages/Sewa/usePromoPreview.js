import {
  isDiscountEligible,
  loyaltyBonusMinutes,
  REFERRAL_DISCOUNT,
  LOYALTY_DISCOUNT,
} from "../../lib/discount";
import { formatDurasiMenit, addMinutesToDateTime } from "../../lib/time";

// Preview promo — final-nya tetap dikonfirmasi manual sama admin di WA
// (belum ada payment gateway), tapi ditampilin di sini biar customer tau
// dari awal, dan diikutin ke pesan WA biar admin ga lupa nerapin.
export function useSewaPromoPreview({ customer, meetPointId, duration, jumlah, loyaltyChoice, tanggalReturn, jamReturn }) {
  const zona = meetPointId.replace("zona", "");
  const referralSebagaiTeman =
    customer?.referred_by_customer && !customer?.referral_discount_used;
  const referralSebagaiPengajak =
    (customer?.referral_credits_available || 0) > 0;
  const loyaltySiapDitukar =
    (customer?.transaction_count || 0) >= 4 &&
    Math.floor((customer?.transaction_count || 0) / 4) >
      (customer?.loyalty_cycles_redeemed || 0);
  // Loyalitas cuma jadi promo yang "berlaku" kalau referral gak lebih
  // prioritas (referral & loyalty gak boleh numpuk di 1 transaksi).
  const loyaltyBerlaku =
    loyaltySiapDitukar && !referralSebagaiTeman && !referralSebagaiPengajak;
  // Bonus durasi sekarang berlaku buat SEMUA durasi sewa (menit/jam/hari),
  // bukan cuma yang harian — satu-satunya syarat ya durasinya udah dipilih.
  const loyaltyBisaDurasi = loyaltyBerlaku && Boolean(duration);
  const loyaltyBisaDiskon =
    loyaltyBerlaku && duration && isDiscountEligible(zona, jumlah, LOYALTY_DISCOUNT);
  const loyaltyBonusMenit = loyaltyBisaDurasi ? loyaltyBonusMinutes(duration.minutes) : 0;

  let promoLabel = null;
  let promoAmount = 0;
  let bonusMenit = 0;
  if (duration) {
    if (referralSebagaiTeman && isDiscountEligible(zona, jumlah, REFERRAL_DISCOUNT)) {
      promoLabel = "Diskon referral (baru diajak)";
      promoAmount = REFERRAL_DISCOUNT;
    } else if (referralSebagaiPengajak && isDiscountEligible(zona, jumlah, REFERRAL_DISCOUNT)) {
      promoLabel = "Kredit referral";
      promoAmount = REFERRAL_DISCOUNT;
    } else if (loyaltyBerlaku) {
      if (loyaltyChoice === "duration" && loyaltyBisaDurasi) {
        promoLabel = `Poin loyalitas — bonus durasi (+${formatDurasiMenit(loyaltyBonusMenit)})`;
        bonusMenit = loyaltyBonusMenit;
      } else if (loyaltyBisaDiskon) {
        promoLabel = "Poin loyalitas — potongan harga";
        promoAmount = LOYALTY_DISCOUNT;
      }
    }
  }
  const jumlahSetelahPromo = jumlah - promoAmount;
  const waktuReturnUsulan =
    bonusMenit && tanggalReturn ? addMinutesToDateTime(tanggalReturn, jamReturn, bonusMenit) : null;

  return {
    loyaltyBerlaku,
    loyaltyBisaDurasi,
    loyaltyBisaDiskon,
    loyaltyBonusMenit,
    promoLabel,
    promoAmount,
    bonusMenit,
    jumlahSetelahPromo,
    waktuReturnUsulan,
  };
}
