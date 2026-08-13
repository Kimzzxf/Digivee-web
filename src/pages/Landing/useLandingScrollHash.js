import { useEffect } from "react";
import { scrollToTarget } from "../../lib/lenis";

// Arriving here either with a URL hash (someone pasted /#pricelist) or with
// a { scrollTo: "pricelist" } handed off by the Navbar (clicking a section
// link while on a different page) — Lenis is already initialized at app
// boot (see main.jsx), so this can just scroll on mount instead of waiting
// for an onReady callback like the old Locomotive setup did.
export function useLandingScrollHash(location, navigate) {
  useEffect(() => {
    const hash = location.hash?.replace("#", "") || location.state?.scrollTo;
    if (!hash) return;
    setTimeout(() => scrollToTarget(`#${hash}`), 150);
    if (location.state?.scrollTo) {
      navigate(location.pathname + location.hash, {
        replace: true,
        state: {},
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
