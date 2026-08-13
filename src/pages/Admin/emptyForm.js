export const EMPTY_FORM = {
  alamat: "",
  titik_meet_point: "",
  kota: "",
  zona: "1",
  // Jarak asli (km, satu arah) dari hasil "Hitung jarak dari Digivee" —
  // ini yang dipake hitungHPP() kalau ada, lihat TransaksiFormFields.jsx.
  jarak_km: null,
  tanggal_sewa: "",
  tanggal_kembali: "",
  jam_pickup: "",
  jam_kembali: "",
  biaya: "",
  denda: "0",
  denda_alasan: "none",
  payment_percent: "100",
  status: "Completed",
  diskon: 0,
  diskon_alasan: "none",
  // Lokal doang, GAK dikirim ke API — cuma dipake biar tombol "Batalkan"
  // tau berapa menit yang harus digeser balik dari tanggal_kembali/jam_kembali
  // kalau reward-nya kemarin dipilih "bonus durasi" (bukan potongan harga).
  loyalty_bonus_minutes_applied: 0,
};
