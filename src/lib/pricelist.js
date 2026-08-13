// Single source of truth buat "Meet Point" + "Durasi Sewa" + harga jual.
// PriceTable.jsx (landing) dan Sewa.jsx (form booking) sama-sama pakai data
// dari sini, biar harga yang ditampilkan ke customer nggak pernah beda-beda
// antara landing page dan form sewa.
//
// CATATAN: penomoran Zona 1/2/3 + id (zona1/zona2/zona3) di sini SEKARANG
// SAMA PERSIS dengan yang di lib/hpp.js & Admin panel (dulu sempat beda:
// landing pakai "Short Rent" / "Zona 1 & 2" / "Zona 3", sementara Admin
// pakai Zona 1/2/3 — bikin bingung pas dibandingin). Sekarang konsisten:
// - Zona 1 = Short Rent, self-pickup di lokasi Digivee.
// - Zona 2 = antar-jemput 0–20KM.
// - Zona 3 = antar-jemput 20–40KM.

export const MEET_POINTS = [
  {
    id: "zona1",
    label: "Zona 1 — Self Pickup",
    sub: "Self-pickup di lokasi Digivee",
    durations: [
      { id: "10m", label: "10 Menit", price: 10000, days: 0, minutes: 10 },
      { id: "20m", label: "20 Menit", price: 15000, days: 0, minutes: 20 },
      { id: "30m", label: "30 Menit", price: 20000, days: 0, minutes: 30 },
      { id: "1j", label: "1 Jam", price: 25000, days: 0, minutes: 60 },
      { id: "3j", label: "3 Jam", price: 50000, days: 0, minutes: 180 },
      // Durasi lebih panjang, tetep self-pickup (gak ada ongkos motor),
      // makanya lebih murah dari Zona 2 buat durasi yang sama — tapi
      // semuanya udah di atas ambang batas HPP(35.700)+diskon(15.000)
      // biar promo loyalitas/referral beneran bisa kepakai di Zona 1.
      { id: "6j", label: "6 Jam", price: 60000, days: 0, minutes: 360 },
      { id: "12j", label: "12 Jam", price: 80000, days: 0, minutes: 720 },
      { id: "1h", label: "1 Hari", price: 90000, days: 1, minutes: 1440 },
      { id: "2h", label: "2 Hari", price: 110000, days: 2, minutes: 2880 },
      { id: "3h", label: "3 Hari", price: 150000, days: 3, minutes: 4320 },
    ],
  },
  {
    id: "zona2",
    label: "Zona 2 — Antar Jemput",
    sub: "10–20KM · Gratis Ongkir",
    durations: [
      { id: "6j", label: "6 Jam", price: 80000, days: 0, minutes: 360 },
      { id: "12j", label: "12 Jam", price: 90000, days: 0, minutes: 720 },
      { id: "1h", label: "1 Hari", price: 110000, days: 1, minutes: 1440 },
      { id: "2h", label: "2 Hari", price: 140000, days: 2, minutes: 2880 },
      { id: "3h", label: "3 Hari", price: 180000, days: 3, minutes: 4320 },
    ],
  },
  {
    id: "zona3",
    label: "Zona 3 — Antar Jemput",
    sub: "20–40KM · Gratis Ongkir · Min. 1 Hari",
    durations: [
      { id: "1h", label: "1 Hari", price: 135000, days: 1, minutes: 1440 },
      { id: "2h", label: "2 Hari", price: 160000, days: 2, minutes: 2880 },
      { id: "3h", label: "3 Hari", price: 200000, days: 3, minutes: 4320 },
    ],
  },
];

export function getMeetPoint(id) {
  return MEET_POINTS.find((m) => m.id === id) || null;
}

export function getDuration(meetPointId, durationId) {
  const mp = getMeetPoint(meetPointId);
  if (!mp) return null;
  return mp.durations.find((d) => d.id === durationId) || null;
}

// Canned "titik ketemuan" note per meet point — auto-fills the Sewa
// form's location field on selection instead of asking customers to
// type a full delivery address (there isn't one, COD happens at these
// fixed spots).
export const MEET_POINT_NOTES = {
  zona1: "Cibuaya/Tirtajaya",
  zona2: "Mixue Rengasdengklok dan sekitarnya",
  zona3: "KCP Mall dan sekitarnya",
};

// "80000" -> "80K" — matches the shorthand already used on the landing page
// price list.
export function formatK(n) {
  return Math.round((n || 0) / 1000) + "K";
}
