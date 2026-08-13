import { useEffect, useRef, useState } from "react";
import { gsap, useGSAP } from "../lib/gsap";
import { stopScroll, startScroll } from "../lib/lenis";

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const WORD = "DIGIVEE";
// Classic scramble-reveal charset — symbols mixed in with letters read as
// "noise" rather than almost-words, which is what actually sells the
// glitch-into-place effect (elementis.co's own splash does the same:
// mid-reveal frames show odd glyphs standing in for not-yet-locked
// letters, not other real letters).
const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&*+=-";

// First-load splash — elementis.co's actual move (per reference screenshots):
// no counter, no progress bar, just the wordmark assembling itself out of
// scrambled characters, left-to-right with a little per-letter randomness so
// it doesn't resolve as one uniform sweep. Once settled, the same ink
// curtain RevealImage uses on every photo wipes it away top-to-bottom, just
// run once at full-viewport scale. Plays on every real page load (refresh
// included) — it lives outside <Routes> in App.jsx so client-side route
// changes never remount it, only a real reload does.

export default function Preloader() {
  const [display, setDisplay] = useState(WORD);
  const [done, setDone] = useState(false);
  const rootRef = useRef(null);
  const textRef = useRef(null);

  // Lenis needs its own stop()/start(), not just CSS overflow — see the
  // .lenis-stopped comment in index.css, this is the case it was left
  // ready for. Cleanup fires the moment `done` flips true, right as the
  // curtain finishes, so scroll unlocks exactly when the page appears.
  useEffect(() => {
    if (done) return;
    document.documentElement.classList.add("lenis-stopped");
    stopScroll();
    return () => {
      document.documentElement.classList.remove("lenis-stopped");
      startScroll();
    };
  }, [done]);

  useGSAP(() => {
    if (done) return;
    if (prefersReducedMotion()) {
      setDone(true);
      return;
    }

    // Each letter locks onto its final character at its own point along
    // the timeline (staggered left→right + jitter) instead of all letters
    // resolving on the same frame — that's what makes mid-animation frames
    // show a mix of solved and still-scrambling letters.
    const lockAt = WORD.split("").map(
      (_, i) => 0.1 + (i / WORD.length) * 0.55 + Math.random() * 0.2,
    );
    const state = { p: 0 };

    gsap
      .timeline({
        onComplete: () => {
          setDone(true);
        },
      })
      .to(state, {
        p: 1,
        duration: 1.2,
        ease: "none",
        onUpdate: () => {
          setDisplay(
            WORD.split("")
              .map((ch, i) =>
                state.p >= lockAt[i]
                  ? ch
                  : SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)],
              )
              .join(""),
          );
        },
        onComplete: () => setDisplay(WORD),
      })
      .to(textRef.current, { opacity: 0, y: -12, duration: 0.4, ease: "siteEase" }, "+=0.35")
      .to(rootRef.current, { scaleY: 0, transformOrigin: "bottom", duration: 1.05, ease: "siteEase" }, "-=0.1");
  }, []);

  if (done) return null;

  return (
    <div
      ref={rootRef}
      role="status"
      aria-label="Memuat halaman"
      className="fixed inset-0 z-[300] bg-pink flex items-center justify-center will-change-transform"
    >
      <span
        ref={textRef}
        className="font-body font-semibold text-paper text-2xl md:text-4xl tracking-[0.3em] pl-[0.3em]"
      >
        {display}
      </span>
    </div>
  );
}
