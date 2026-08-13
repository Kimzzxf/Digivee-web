// Aturan promo "Ajak Teman" & "Poin Loyalitas" yang udah dijanjiin di
// landing page (lihat WhyDigivee.jsx & PromoSection.jsx) — nilainya sama
// persis Rp15.000, tapi keduanya CUMA boleh dipotong kalau keuntungan
// transaksi sesudahnya masih nyisa minimal keuntunganFloor(zona) di bawah ini.
//
// Floor ini BUKAN buffer risiko kamera rusak/hilang — itu udah full
// ke-cover di FIX_COST (lihat hpp.js), sama di semua zona, gak peduli
// zona mana. Floor ini spesifik buat nutup KETIDAKPASTIAN ongkos motor:
// harga BBM naik, rute aktual meleset dari estimasi PP_KM, servis
// mendadak, dll — risiko yang cuma ada kalau motor toko beneran jalan.
// Makanya besarnya proporsional ke seberapa jauh motor jalan di zona itu,
// BUKAN angka flat:
// - Zona 1 (self-pickup, motor toko gak jalan sama sekali) -> 0. Gak ada
//   ongkos motor yang bisa "meleset dari estimasi" karena emang gak ada
//   estimasi ongkos motor buat zona ini dari awal.
// - Zona 2/3 (antar-jemput) -> tetep Rp10.000, buffer buat ketidakpastian
//   di atas estimasi PP_KM 34km/80km yang dipake hitungHPP.
//
// Referral & loyalty TIDAK boleh numpuk di 1 transaksi yang sama — admin
// panel cuma nunjukin satu-satu, dan cuma satu yang boleh diterapin.
import { hitungHPP } from "./hpp";

export const REFERRAL_DISCOUNT = 15000;
export const LOYALTY_DISCOUNT = 15000;
const MOTOR_RISK_FLOOR = { "1": 0, "2": 10000, "3": 10000 };

// Poin loyalitas boleh ditukar jadi SALAH SATU dari dua reward (bukan
// keduanya): potongan harga LOYALTY_DISCOUNT, atau tambahan durasi sewa
// gratis +50% (harga tetap, cuma tanggal/jam kembali digeser lebih jauh).
// Berlaku buat SEMUA durasi sewa — menit, jam, maupun hari — bukan cuma
// sewa harian. Dihitung di level MENIT (bukan hari) biar akurat buat
// durasi pendek juga, misalnya:
// - 1 Jam (60 menit)   -> bonus 30 Menit
// - 1 Hari (1440 menit) -> bonus 12 Jam (720 menit)
// - 3 Hari (4320 menit) -> bonus 1 Hari 12 Jam (2160 menit)
// Dibulatin ke ATAS ke menit terdekat (bukan ke bawah) biar customer
// nggak pernah dirugiin sama pembulatan.
export const LOYALTY_DURATION_BONUS_RATIO = 0.5;
export function loyaltyBonusMinutes(totalMinutes) {
  return Math.ceil((Number(totalMinutes) || 0) * LOYALTY_DURATION_BONUS_RATIO);
}

/** @param {"1"|"2"|"3"} zona */
export function keuntunganFloor(zona) {
  return MOTOR_RISK_FLOOR[zona] ?? MOTOR_RISK_FLOOR["2"];
}

/**
 * @param {"1"|"2"|"3"} zona
 * @param {number} biayaSaatIni - biaya yang lagi diketik admin (SEBELUM
 *   diskon ini dipotong)
 * @param {number} discountAmount
 */
export function isDiscountEligible(zona, biayaSaatIni, discountAmount) {
  const hpp = hitungHPP(zona);
  const keuntunganAfter = (Number(biayaSaatIni) || 0) - hpp - discountAmount;
  return keuntunganAfter >= keuntunganFloor(zona);
}
