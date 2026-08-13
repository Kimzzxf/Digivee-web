import { CheckCircle2, AlertTriangle, Info, Gift } from "lucide-react";

let idCounter = 0;
export function nextId() {
  idCounter += 1;
  return idCounter;
}

// Every variant stays inside the existing earth-tone palette (ink / pink /
// paper / sand) instead of introducing red/green traffic-light colors —
// same convention the rest of the app already uses (e.g. the pink/15
// "attention" boxes doing double duty for both promo call-outs and error
// banners on Sewa/Login). Icon + copy carry the meaning, not new hues.
export const VARIANTS = {
  success: {
    Icon: CheckCircle2,
    iconWrap: "bg-ink text-paper",
    bar: "bg-ink",
    defaultTitle: "Berhasil",
  },
  error: {
    Icon: AlertTriangle,
    iconWrap: "bg-pink text-ink",
    bar: "bg-pink",
    defaultTitle: "Gagal",
  },
  promo: {
    Icon: Gift,
    iconWrap: "bg-pink text-ink",
    bar: "bg-pink",
    defaultTitle: "Promo diterapkan",
  },
  info: {
    Icon: Info,
    iconWrap: "bg-sand text-ink",
    bar: "bg-sand",
    defaultTitle: "Info",
  },
};
