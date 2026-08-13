import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CustomEase } from "gsap/CustomEase";
import { useGSAP } from "@gsap/react";

// Registering here (module scope, runs once on first import) instead of
// inside a component effect means every file that does
// `import { gsap, ScrollTrigger, useGSAP } from "../lib/gsap"` gets the
// plugins already wired up, the same way lib/lenis.js sets up Lenis once
// for the whole app. useGSAP is registered as a plugin too (GSAP's own
// recommendation) so it always resolves against this exact gsap
// instance instead of risking a second copy.
gsap.registerPlugin(ScrollTrigger, CustomEase, useGSAP);

// Same curve as the site's CSS `cubic-bezier(0.16, 1, 0.3, 1)` transitions
// (.press-btn / .surface-hover / .row-hover / .editorial-img in
// index.css) — CustomEase accepts a plain cubic-bezier 4-number string
// directly, so this makes every GSAP-driven scroll reveal settle with
// the exact same "quiet, no overshoot" feel as the rest of the UI
// instead of GSAP's default power-curve eases looking subtly different
// side-by-side with the CSS-driven hovers/presses.
CustomEase.create("siteEase", "0.16, 1, 0.3, 1");

// Google Fonts (index.html) load with `display=swap`: the page first paints
// with a fallback font, then swaps to Fraunces / Space Grotesk / JetBrains
// Mono once they arrive. That swap changes text metrics and reflows the
// height of everything below it — but every ScrollTrigger in the app
// (WhyDigivee's pin, useScrollReveal's fade-ins) has already cached its
// trigger/pin start+end pixel positions by the time that happens. Without
// this, those cached positions go stale the moment the fonts swap in, so
// pins/reveals fire at the wrong scroll position — they can look like
// they're "not working" even though they ran, just at the wrong spot.
// A single refresh once fonts are actually ready re-measures everything
// against final layout. Window `load` covers images/other late layout
// shifts the same way.
if (typeof document !== "undefined") {
  const refresh = () => ScrollTrigger.refresh();
  if (document.fonts?.ready) {
    document.fonts.ready.then(refresh);
  }
  window.addEventListener("load", refresh, { once: true });
}

export { gsap, ScrollTrigger, useGSAP };
