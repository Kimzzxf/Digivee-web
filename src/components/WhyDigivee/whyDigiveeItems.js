import { Truck, CreditCard, ShieldCheck, Star, QrCode } from "lucide-react";
import { IMAGES } from "../../lib/editorialImages";

export const ITEMS = [
  {
    icon: Truck,
    title: "Gratis Ongkir 40KM",
    desc: "Kirim & jemput langsung ke lokasi kamu, dari Cibuaya sampai Karawang Kota.",
    image: IMAGES.hero,
  },
  {
    icon: CreditCard,
    title: "Include Aksesoris",
    desc: "Ga perlu sewa terpisah — tiap paket udah termasuk card reader, charger, dan memory card.",
    image: IMAGES.whyDigivee,
  },
  {
    icon: ShieldCheck,
    title: "Jaminan Cukup KTP",
    desc: "Identitas asli aja — KTP, SIM, atau kartu mahasiswa. Ga perlu jaminan uang atau barang lain.",
    image: IMAGES.priceAccent,
  },
  {
    icon: Star,
    title: "Poin Loyalitas",
    desc: "Tiap sewa nambah 1 poin. Kumpulin 4, tuker jadi tambahan waktu sewa atau potongan harga.",
    image: IMAGES.promoPoin,
  },
  {
    icon: QrCode,
    title: "Referral QR",
    desc: "Ajak temen pakai QR di kartu loyalitasmu — kalian berdua dapet potongan Rp15.000.",
    image: IMAGES.promoReferral,
  },
];

export const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
