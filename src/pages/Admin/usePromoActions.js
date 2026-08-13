import { formatRupiah, lamaSewaMenit } from "../../lib/hpp";
import { loyaltyBonusMinutes } from "../../lib/discount";
import { formatDurasiMenit, addMinutesToDateTime } from "../../lib/time";
import { DISKON_LABEL } from "./PromoPanel";

export default function usePromoActions(form, setForm, notify) {
  const { promo: notifyPromo, info: notifyInfo } = notify;

  function terapkanDiskon(alasan, amount) {
    const biayaSaatIni = Number(form.biaya) || 0;
    setForm({ ...form, biaya: String(biayaSaatIni - amount), diskon: amount, diskon_alasan: alasan, loyalty_bonus_minutes_applied: 0 });
    notifyPromo(`${DISKON_LABEL[alasan] || "Promo"} diterapkan — potongan ${formatRupiah(amount)}.`);
  }

  // Reward loyalitas versi "bonus durasi": harga TETAP (diskon: 0), yang
  // digeser cuma tanggal_kembali/jam_kembali +X menit. diskon_alasan tetep
  // "loyalty" biar backend tetep nyatet cycle-nya ke-redeem.
  function terapkanLoyaltyDurasi() {
    const bonus = loyaltyBonusMinutes(lamaSewaMenit(form) ?? 0);
    const hasil = addMinutesToDateTime(form.tanggal_kembali, form.jam_kembali, bonus);
    setForm({
      ...form,
      tanggal_kembali: hasil ? hasil.date : form.tanggal_kembali,
      jam_kembali: hasil ? hasil.time : form.jam_kembali,
      diskon: 0,
      diskon_alasan: "loyalty",
      loyalty_bonus_minutes_applied: bonus,
    });
    notifyPromo(`Poin loyalitas diterapkan — bonus durasi +${formatDurasiMenit(bonus)}.`);
  }

  function batalkanDiskon() {
    const bonusTerpakai = Number(form.loyalty_bonus_minutes_applied) || 0;
    const hasil = bonusTerpakai ? addMinutesToDateTime(form.tanggal_kembali, form.jam_kembali, -bonusTerpakai) : null;
    setForm({
      ...form,
      biaya: String((Number(form.biaya) || 0) + (Number(form.diskon) || 0)),
      tanggal_kembali: hasil ? hasil.date : form.tanggal_kembali,
      jam_kembali: hasil ? hasil.time : form.jam_kembali,
      diskon: 0,
      diskon_alasan: "none",
      loyalty_bonus_minutes_applied: 0,
    });
    notifyInfo("Promo dibatalkan.");
  }

  return { terapkanDiskon, terapkanLoyaltyDurasi, batalkanDiskon };
}
