import { Loader2 } from "lucide-react";

// Every "still fetching" moment outside the first-load splash (Preloader)
// used to hand-roll its own Loader2 + label pair, each with its own
// slightly different wording/spacing. Centralised here so they read as
// one system — same mono/tracked-out label style the Preloader's own
// wordmark uses, just without the GSAP scramble: this one mounts and
// unmounts as often as a page refetches, so it has to be instant, not a
// splash. Colour isn't hardcoded — it inherits from whatever section it's
// dropped into (ink on paper pages, paper on the pink form pages).
export default function Loading({ label = "Memuat...", className = "" }) {
  return (
    <div
      role="status"
      className={`flex items-center gap-2 font-mono text-xs tracking-[0.15em] uppercase ${className}`}
    >
      <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      <span>{label}</span>
    </div>
  );
}
