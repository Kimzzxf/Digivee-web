// Editorial photography used across the marketing pages (hero, Why Digivee,
// Price List, Promo, footer). These are free-to-use Unsplash License photos
// (https://unsplash.com/license — free for commercial use, no attribution
// required) standing in for real product/lifestyle photography. Swap the
// `src` values for actual Digivee shoots whenever they're ready; every
// component just imports from here, so there's one place to update.

import CameraImg from "../assets/Sony_Dsc_W510_Baby_Pink.jpg";
import PricelistImg from "../assets/Pricelist.jpg";
import PromoPoinImg from "../assets/Poin.jpg";

const unsplash = (id, w = 1600) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export const IMAGES = {
  // hero — person out in the world with a camera, matches "pinjam momen"
  hero: {
    src: CameraImg,
    alt: "Sony DSC-W510 Baby Pink",
  },
  // Why Digivee — camera resting next to printed photos, minimal/retro
  whyDigivee: {
    src: unsplash("photo-1510127034890-ba27508e9f1c", 1200),
    alt: "Kamera digicam diletakkan di samping hasil cetak foto",
  },
  // Price List — close detail shot of a compact camera, warm tone
  priceAccent: {
    src: PricelistImg,
    alt: "Detail close-up digicam vintage",
  },
  // Promo — Poin Setia: clean minimal camera detail, distinct from the shots above
  promoPoin: {
    src: PromoPoinImg,
    alt: "Detail close-up kamera film di atas meja kayu",
  },
  // Promo — Ajak Teman: group of friends at golden hour, matches "referral"
  promoReferral: {
    src: unsplash("photo-1511632765486-a01980e01a18", 1200),
    alt: "Sekumpulan teman merangkul saat golden hour",
  },
  // Footer — full-bleed closing image
  footer: {
    src: CameraImg,
    alt: "Sony DSC-W510 Baby Pink",
  },
};
