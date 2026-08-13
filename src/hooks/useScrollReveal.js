import { useRef } from "react";
import { gsap, useGSAP } from "../lib/gsap";

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Scroll-triggered entrance reveal (fade + rise) for one element, or a
 * staggered group when `stagger` is set. This is the "scroll-triggered"
 * half of the smooth-scroll/scroll-trigger/parallax stack — it wraps
 * GSAP's ScrollTrigger rather than Framer Motion's `whileInView` because
 * it can pin an exact trigger point (`start`) and sequence a stagger
 * across children in one timeline. For continuous scroll-linked drift
 * (the effect that moves *with* scroll position rather than firing once),
 * keep using the existing <Parallax> component (Framer Motion) instead —
 * the two compose fine as long as they're never on the *same* DOM node,
 * since both would otherwise fight over the element's transform. Nest
 * <Parallax> *inside* the element this hook's ref is attached to, not
 * around it.
 *
 * @param {object} [opts]
 * @param {number} [opts.y=52] - starting vertical offset in px (element
 *   rises from y to 0). Bumped up from an earlier 32px — at 32px the rise
 *   read as a gentle settle rather than an entrance; 52px is far enough to
 *   actually register as travel while scrolling.
 * @param {number} [opts.duration=1.1]
 * @param {number} [opts.scale=1] - starting scale (element grows from
 *   scale to 1 as it fades/rises in). 1 (default) disables it; something
 *   like 0.94 adds a subtle zoom-settle on top of the rise for extra
 *   weight — use on section headings/cards, not on small inline text
 *   where a scale pop reads as jumpy.
 * @param {number} [opts.blur=8] - starting blur in px, easing to 0 as the
 *   element settles — a rack-focus pull rather than a flat fade, the same
 *   "coming into focus" read RevealImage's photos already have. 0 disables.
 * @param {number} [opts.stagger=0] - seconds between each child's start;
 *   0 (default) animates the ref's own element, >0 animates
 *   `ref.current.children` instead
 * @param {string} [opts.start="top 85%"] - ScrollTrigger start position,
 *   in the usual "<trigger-edge> <scroller-edge>" syntax
 * @param {boolean} [opts.once=false] - true plays once and stays;
 *   false (default) replays every time it scrolls past the trigger, in
 *   either direction
 * @param {boolean} [opts.clearOnComplete=false] - remove the inline
 *   opacity/transform GSAP leaves behind once the reveal finishes,
 *   handing the element back to CSS/Tailwind classes. Needed for
 *   elements (like WhyDigivee's active-row dimming) whose opacity keeps
 *   changing afterward via a class — GSAP's inline style would otherwise
 *   permanently outrank that class.
 * @returns {React.RefObject} attach to the element (or the shared
 *   container, when using `stagger`) to reveal
 */
export default function useScrollReveal({
  y = 52,
  duration = 1.1,
  scale = 1,
  blur = 8,
  stagger = 0,
  start = "top 85%",
  once = false,
  clearOnComplete = false,
} = {}) {
  const ref = useRef(null);

  useGSAP(
    () => {
      if (!ref.current || prefersReducedMotion()) return;

      const targets = stagger ? ref.current.children : ref.current;
      if (stagger && targets.length === 0) return;

      gsap.fromTo(
        targets,
        { y, opacity: 0, scale, filter: blur ? `blur(${blur}px)` : "blur(0px)" },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          filter: "blur(0px)",
          duration,
          stagger,
          ease: "siteEase",
          scrollTrigger: {
            trigger: ref.current,
            start,
            toggleActions: once ? "play none none none" : "play reverse play reverse",
          },
          onComplete: clearOnComplete
            ? () => gsap.set(targets, { clearProps: "opacity,transform,filter" })
            : undefined,
        },
      );
    },
    { scope: ref },
  );

  return ref;
}
