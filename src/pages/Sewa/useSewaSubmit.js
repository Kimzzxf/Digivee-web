import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import { formatRupiah } from "../../lib/hpp";
import { useNotification } from "../../components/NotificationProvider";
import { formatTanggalId } from "./sewaHelpers";

// Admin's WhatsApp number for order confirmation — there's no payment
// gateway wired up yet, so "Lanjutkan ke Pembayaran" hands the order recap
// off to WA for manual confirmation. Set VITE_ADMIN_WA_NUMBER in .env to the
// real number (format: 62xxxxxxxxxxx, no leading 0 or +).
const ADMIN_WA_NUMBER = import.meta.env.VITE_ADMIN_WA_NUMBER || "6281234567890";

export function useSewaSubmit({ form, promo, distanceHint }) {
  const navigate = useNavigate();
  const { success, error: notifyError } = useNotification();
  const { customer, nama, alamat, meetPointNote, meetPointId, durationId, meetPoint, duration,
    tanggalPickup, tanggalReturn, jamPickup, jamReturn, jumlah, dp,
    loyaltyChoice, validate, setError } = form;
  const { promoLabel, promoAmount, bonusMenit, jumlahSetelahPromo, waktuReturnUsulan } = promo;

  return async function handleConfirm(e) {
    e.preventDefault();
    const err = validate();
    if (err) return setError(err);
    setError("");

    // Best-effort: save the booking as a "Pending" transaction so admin
    // finds it already filled in and just flips it to Booked (once DP
    // proof comes in on WA) and later Ongoing/Completed — instead of
    // re-typing everything into "Catat Transaksi". If this fails for any
    // reason, don't block the WA handoff itself (that's still the real
    // confirmation flow); just let admin know they'll need to record this
    // one manually.
    if (customer?.id) {
      try {
        await api.post(
          `/customers/${customer.id}/transactions/pending`,
          {
            meet_point_id: meetPointId,
            duration_id: durationId,
            tanggal_sewa: tanggalPickup,
            tanggal_kembali: tanggalReturn,
            jam_pickup: jamPickup,
            jam_kembali: jamReturn,
            loyalty_choice: loyaltyChoice,
            alamat,
            titik_meet_point: meetPointNote,
            // Jarak km yang udah kehitung dari hint pas milih Meet Point
            // (lihat useAddressDistanceHint) — dipake ulang di sini biar gak
            // geocode 2x, disimpen buat hitungHPP() di sisi admin.
            jarak_km: distanceHint?.jarak?.km ?? null,
          },
          { customer: true },
        );
      } catch {
        notifyError(
          "Draft transaksi otomatis gagal kesimpen — lanjut aja ke WA, nanti dicatat manual sama admin.",
        );
      }
    }

    const lines = [
      "Halo MinV! Aku mau konfirmasi sewa:",
      `Nama: ${nama}`,
      `Alamat: ${alamat}`,
      `Meet Point: ${meetPoint.label}`,
      `Durasi: ${duration.label}`,
      `Pickup: ${formatTanggalId(tanggalPickup)} pukul ${jamPickup} WIB`,
      `Return: ${formatTanggalId(tanggalReturn)} pukul ${jamReturn} WIB`,
      `Jumlah: ${formatRupiah(jumlah)}`,
      ...(promoAmount
        ? [
            `Promo: ${promoLabel} (−${formatRupiah(promoAmount)})`,
            `Jumlah setelah promo: ${formatRupiah(jumlahSetelahPromo)}`,
          ]
        : []),
      ...(bonusMenit && waktuReturnUsulan
        ? [
            `Promo: ${promoLabel}`,
            `Usulan return baru: ${formatTanggalId(waktuReturnUsulan.date)} pukul ${waktuReturnUsulan.time} WIB (dari ${formatTanggalId(tanggalReturn)} pukul ${jamReturn} WIB)`,
          ]
        : []),
      `DP (50%): ${formatRupiah(promoAmount ? Math.round(jumlahSetelahPromo * 0.5) : dp)}`,
    ];
    const waUrl = `https://wa.me/${ADMIN_WA_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`;
    success(
      promoAmount || bonusMenit
        ? `Pesanan siap — ${promoLabel} ikut disertakan. Lanjutkan konfirmasi di WhatsApp.`
        : "Pesanan siap. Lanjutkan konfirmasi & pembayaran DP di WhatsApp.",
    );
    // Buka WA di tab baru buat konfirmasi & bayar DP, terus form ini
    // otomatis "tertutup" — customer diarahkan ke Profile-nya sendiri biar
    // langsung lihat pesanan ini (status Pending) nongol di Riwayat Sewa,
    // gak perlu balik manual dari /sewa.
    window.open(waUrl, "_blank", "noopener,noreferrer");
    navigate("/profile");
  };
}
