import { getLenis } from "./lenisInstance";

// Subscribe to scroll-position updates. Navbar's hide-on-scroll-down /
// reveal-on-scroll-up behaviour needs to react to Lenis's smoothed
// position rather than the raw wheel/touch delta, or the two would
// disagree about direction on a given frame. Falls back to the native
// `scroll` event when Lenis never initialized (reduced motion) — the
// browser is scrolling for real in that case, so it dispatches one.
//
// Also passes Lenis's `direction` (1 down / -1 up / 0 idle) alongside the
// position. `direction` flips the instant a new wheel/touch input arrives
// — it's the target the animation is heading toward — whereas the scroll
// position itself is still easing toward wherever the *previous* gesture
// left off. A caller that infers direction from consecutive position
// deltas ends up reacting to leftover momentum instead of the user's
// actual new gesture; reading `direction` directly avoids that lag.
// Returns an unsubscribe function.
export function onScroll(callback) {
  const lenis = getLenis();
  if (lenis) {
    const handler = (l) => callback(l.scroll, l.direction);
    lenis.on("scroll", handler);
    return () => lenis.off("scroll", handler);
  }
  const handler = () => callback(window.scrollY || window.pageYOffset || 0, 0);
  window.addEventListener("scroll", handler, { passive: true });
  handler();
  return () => window.removeEventListener("scroll", handler);
}

// Used to lock/unlock scrolling while a full-screen overlay (the mobile
// menu) is open. Setting `body { overflow: hidden }` alone does NOT stop
// Lenis — Lenis drives scroll itself via rAF + wheel/touch listeners, so
// it keeps scrolling the page underneath a CSS overflow lock. `lenis.stop()`
// / `lenis.start()` are Lenis's own pause/resume, and are what actually
// need to be called. Falls back to a no-op when Lenis never initialized
// (reduced motion) — the native `overflow: hidden` the caller also sets
// is enough to lock real browser scroll in that case.
export function stopScroll() {
  getLenis()?.stop();
}

export function startScroll() {
  getLenis()?.start();
}

// Used by Navbar / Landing to jump to a section (#pricelist, etc). Same
// name/signature as the old Locomotive helper so call sites didn't need
// to change, just the import path.
export function scrollToTarget(target, options = {}) {
  const lenis = getLenis();
  if (lenis) {
    lenis.scrollTo(target, { duration: 1.6, ...options });
    return true;
  }
  // Reduced-motion (Lenis never initialized) — plain native smooth scroll.
  // ScrollTrigger still works fine here since it falls back to listening
  // for the browser's real `scroll` event when Lenis isn't driving it.
  if (typeof target === "number") {
    window.scrollTo({ top: target, behavior: "smooth" });
    return false;
  }
  const el = typeof target === "string" ? document.querySelector(target) : target;
  el?.scrollIntoView({ behavior: "smooth" });
  return false;
}
