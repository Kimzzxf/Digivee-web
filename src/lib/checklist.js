// Kelengkapan standar 1 unit kamera Digivee saat ini. Cuma 1 unit → 1 daftar
// tetap cukup, gak butuh per-unit config. Sesuaikan array ini kalau
// aksesorisnya beda dari yang dicantumin di sini.
export const CHECKLIST_ITEMS = ["Body Kamera", "Baterai", "Charger", "Memory Card", "Lensa", "Tas/Pouch", "Strap"];

// Dipanggil sekali pas transaksi dibuat — semua item mulai `ok: true`
// (dianggap lengkap & mulus), baru diverifikasi ulang admin pas unit
// balik (lihat LaporanEditFields "Cek Kelengkapan Saat Kembali").
export function defaultChecklist() {
  return CHECKLIST_ITEMS.map((item) => ({ item, ok: true }));
}
