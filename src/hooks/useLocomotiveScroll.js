import { useEffect, useRef } from "react";

// Locomotive Scroll moves the page with CSS transforms instead of real
// document scrolling, so a plain `<a href="#pricelist">` / native
// scrollIntoView() jumps to the wrong (untransformed) position — content
// is visually somewhere else, which is what shows up as a "blank" page
// until a refresh resets Locomotive's internal offset tracking. Anything
// that needs to jump to a section must go through Locomotive's own
// scrollTo(), so we keep a module-level reference to whichever instance is
// currently mounted (only Landing.jsx uses this hook) and expose a small
// helper other components (e.g. Navbar) can call directly.
let activeInstance = null;

export function scrollToTarget(target, options = {}) {
  if (activeInstance) {
    activeInstance.scrollTo(target, { duration: 800, ...options });
    return true;
  }
  return false;
}

/**
 * Initializes Locomotive Scroll on the given container ref.
 * Returns the ref to attach to the scroll container element.
 * Automatically destroys the instance on unmount and skips
 * smooth scroll entirely if the user prefers reduced motion.
 *
 * @param {{ onReady?: (instance: object|null) => void }} [opts]
 *   onReady fires once, after Locomotive has initialized (or immediately
 *   with `null` when reduced-motion skips it and native scroll applies
 *   instead) — used to handle an initial #hash / pending scroll target
 *   once the page is actually ready to be scrolled.
 */
export function useLocomotiveScroll(opts = {}) {
  const { onReady } = opts;
  const containerRef = useRef(null);
  const scrollInstance = useRef(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let mounted = true;

    (async () => {
      if (!containerRef.current) return;
      if (prefersReducedMotion) {
        // No Locomotive instance — the page scrolls natively, so hash
        // links / scrollIntoView already work as expected.
        onReady?.(null);
        return;
      }
      const LocomotiveScroll = (await import("locomotive-scroll")).default;
      if (!mounted || !containerRef.current) return;
      scrollInstance.current = new LocomotiveScroll({
        el: containerRef.current,
        smooth: true,
        multiplier: 0.85,
        lerp: 0.09,
      });
      activeInstance = scrollInstance.current;
      onReady?.(scrollInstance.current);
    })();

    return () => {
      mounted = false;
      if (activeInstance === scrollInstance.current) activeInstance = null;
      scrollInstance.current?.destroy();
    };
  }, []);

  return containerRef;
}
