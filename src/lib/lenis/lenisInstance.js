import Lenis from "lenis";
import { gsap, ScrollTrigger } from "../gsap";

// Single Lenis instance for the whole app (every route, not just Landing),
// created once at boot instead of inside a React effect — Lenis smooths
// the page's real, native scroll rather than hijacking it with CSS
// transforms like the old Locomotive Scroll setup did, so it doesn't need
// a container ref/element at all and plain anchor links + CSS
// `position: sticky` both keep working untouched. Creating it here (called
// from main.jsx before the app renders) also means it's already ready by
// the time any page's mount effect wants to scroll to a hash/target — no
// "wait for onReady" dance needed anymore.
let lenis = null;

const prefersReducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Other lenis/ modules read the current instance through this instead of
// importing the module-level variable directly.
export function getLenis() {
  return lenis;
}

export function initLenis() {
  if (lenis || prefersReducedMotion || typeof window === "undefined") return lenis;

  lenis = new Lenis({
    // Bumped up from 1.1s. The old expo-out curve below front-loads ~88%
    // of the motion into the first 30% of its duration, so most of the
    // travel happened in one quick burst with only a barely-visible tail
    // — that's what read as "snappy" next to reference sites like
    // elementis.co. A longer duration + the gentler curve below spreads
    // the motion out into a heavier, more gradual glide.
    duration: 1.8,
    // Quart ease-out instead of expo-out: still decisive (not sluggish),
    // but reaches ~76% at 30% of the duration instead of expo's ~88% —
    // enough of a difference to feel like a trailing glide rather than a
    // jump-then-settle.
    easing: (t) => 1 - Math.pow(1 - t, 4),
    // Slightly softens how far a single wheel tick moves the target so
    // continuous scrolling reads as one fluid motion rather than a series
    // of visible little jumps stitched together.
    wheelMultiplier: 0.85,
    smoothWheel: true,
    // Lenis only smooths mouse-wheel/trackpad input by default —
    // `syncTouch` is what turns on the same eased duration/easing curve
    // for touch (phones/tablets), which is off by default. Without it,
    // touch scrolling falls back to the browser's raw native scroll:
    // instant, no easing at all, which is exactly why the smooth-scroll
    // "animation" reads as missing/nonexistent when tried on a real
    // phone (e.g. the deployed Netlify link) even though it feels fine
    // with a mouse on desktop. `syncTouchLerp` keeps the touch feel
    // responsive rather than laggy despite the smoothing.
    syncTouch: true,
    syncTouchLerp: 0.075,
    // Lenis defaults to autoRaf: true, which spins up its OWN internal
    // requestAnimationFrame loop. Combined with the gsap.ticker.add() call
    // below (which also calls lenis.raf() every frame), that means every
    // frame gets processed TWICE by two independent, unsynced rAF loops —
    // the exact cause of stuttery/non-smooth scroll and ScrollTrigger pins
    // that visibly lag or desync from the actual scroll position. GSAP's
    // ticker must be the single loop driving Lenis, so autoRaf is turned
    // off here.
    autoRaf: false,
  });

  // Keep ScrollTrigger's cached trigger/pin positions synced to Lenis's
  // virtual scroll position. ScrollTrigger listens for the native
  // `scroll` event by default, which Lenis never dispatches (it scrolls
  // via rAF + transform, not real scrollTop) — without this, every
  // ScrollTrigger in the app (WhyDigivee's row reveals, PriceTable's
  // stagger-in, PromoSection's cards, etc.) would fire a frame or more
  // late, or read a stale scroll position.
  lenis.on("scroll", ScrollTrigger.update);

  // Run Lenis off GSAP's ticker instead of its own requestAnimationFrame
  // loop, so Lenis's smoothing and any GSAP tween/ScrollTrigger scrub are
  // driven by the exact same frame clock. Two independent rAF loops
  // (Lenis's own + GSAP's ticker) drift a frame apart under load and show
  // up as visible jitter between the smooth-scroll motion and whatever
  // GSAP is animating on top of it.
  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  // GSAP's ticker normally "catches up" instantly after a stalled
  // tab/long task — fine for an isolated tween, but it would yank Lenis's
  // scroll position along with it. Disabled so a stall just resumes
  // smoothly instead of snapping the page.
  gsap.ticker.lagSmoothing(0);

  return lenis;
}
