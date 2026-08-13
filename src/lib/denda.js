// Kategori denda + cara ngitung nominalnya.
//
// "telat" & "hilang" punya rumus tetap → bisa di-auto-suggest pas admin
// milih alasannya. "rusak" sengaja NGGAK punya rumus (nominal kerusakan
// beda-beda tiap kasus, tergantung part yang rusak) — admin isi manual.
export const DENDA_ALASAN = ["none", "telat", "rusak", "hilang"];

export const DENDA_LABEL = {
  none: "-",
  telat: "Keterlambatan",
  rusak: "Kerusakan unit",
  hilang: "Kehilangan unit",
};

// ISI SESUAI HARGA BELI/GANTI KAMERA — dipakai buat ngitung denda
// kehilangan (harga unit + 300rb). Masih 0 karena harga kameranya belum
// dikasih tau; auto-suggest kehilangan bakal keliatan aneh (cuma 300rb)
// sampe ini diisi.
export const HARGA_UNIT_KAMERA = 0;

// Cuma nyakup bracket yang udah dikasih tau (telat 1-3 jam = flat 10rb).
// Di luar 3 jam sengaja gak di-auto-suggest — jangan nebak angka yang
// belum ada aturannya, admin isi manual buat kasus itu.
export const DENDA_TELAT_1_3_JAM = 10000;

// null artinya "gak ada rumus, biarin admin isi manual" — beda dari 0.
export function dendaSuggestion(alasan) {
  if (alasan === "telat") return DENDA_TELAT_1_3_JAM;
  if (alasan === "hilang") return HARGA_UNIT_KAMERA + 300000;
  return null;
}
