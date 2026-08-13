import { useEffect, useRef, useState } from "react";
import { startScroll, stopScroll } from "../../lib/lenis";

// lock page scroll while the full-screen menu is open. `overflow: hidden`
// handles real native scroll (and iOS rubber-banding), but Lenis drives
// scroll independently of that via its own rAF loop, so it also needs to
// be stopped/started directly or the page keeps scrolling underneath the
// overlay.
function useScrollLock(open) {
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    if (open) {
      stopScroll();
    } else {
      startScroll();
    }
    return () => {
      document.body.style.overflow = "";
      startScroll();
    };
  }, [open]);
}

// Hide-on-scroll-down / reveal-on-scroll-up. Deliberately NOT "only show
// again once you're back near the top" — that made the navbar basically
// unreachable on a long page.
//
// Uses the browser's plain native `scroll` event + `window.scrollY`
// directly — not a custom wrapper around Lenis's own event API. Lenis
// smooths the page's REAL native scroll position rather than faking it
// with a CSS transform, so the browser keeps firing genuine `scroll`
// events the whole time Lenis is easing — this works no matter what's
// driving the scroll (wheel, trackpad, touch drag, scrollbar drag,
// keyboard).
//
// Reveals on ANY upward change, no matter how small. Concealing still
// needs a real accumulated downward distance (CONCEAL_AT) so a tiny
// downward wobble doesn't hide it.
export function useNavbarScroll(open) {
  useScrollLock(open);
  const [hiddenNav, setHiddenNav] = useState(false);
  // Past the header's own height = "scrolled". Header is transparent (sits
  // over the hero) only while this is false; once you've scrolled past it,
  // every reveal (scroll-up) shows the solid bg instead, never transparent
  // again until you're back at the very top.
  const [scrolled, setScrolled] = useState(false);
  const headerRef = useRef(null);

  useEffect(() => {
    // The full-screen menu's hamburger/X is the only way to close it, and
    // body scroll is locked while it's open — so just keep the header put.
    if (open) {
      setHiddenNav(false);
      return;
    }

    let lastY = window.scrollY || window.pageYOffset || 0;
    let downAccum = 0;
    const CONCEAL_AT = 10; // px of accumulated downward movement to hide it

    function handleScroll() {
      const y = window.scrollY || window.pageYOffset || 0;
      const headerHeight = headerRef.current?.offsetHeight ?? 76;
      const delta = y - lastY;
      lastY = y;
      setScrolled(y > headerHeight);

      if (y <= headerHeight) {
        downAccum = 0;
        setHiddenNav(false);
        return;
      }

      if (delta < 0) {
        downAccum = 0;
        setHiddenNav(false);
      } else if (delta > 0) {
        downAccum += delta;
        if (downAccum > CONCEAL_AT) {
          setHiddenNav(true);
          downAccum = 0;
        }
      }
    }

    handleScroll(); // sync initial state — page can load already scrolled (refresh, back-nav)
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [open]);

  return { headerRef, hiddenNav, scrolled };
}
