import { useRef } from "react";
import { gsap, useGSAP } from "../lib/gsap";

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Drop-in replacement for a plain `.editorial-img` wrapper — same markup
 * contract (pass the <img> as children, keep the `editorial-img` class on
 * className for the existing hairline/hover-zoom CSS), but the photo now
 * enters with elementis.co's signature move: an opaque curtain covers it,
 * then wipes away top-to-bottom while the photo itself settles from a
 * slight zoom down to its resting scale. Reads as a reveal, not a fade.
 *
 * The zoom-settle runs on an inner wrapper div, never on the <img> itself —
 * `.editorial-img:hover img` in index.css already drives its own
 * CSS-transition hover zoom, and GSAP setting an inline transform directly
 * on the <img> would permanently out-rank that CSS rule once the reveal
 * finishes, killing the hover effect for good. Keeping the two on separate
 * nodes lets both coexist.
 *
 * @param {"ink"|"paper"} [curtain="ink"] - curtain color, pick whichever
 *   sits behind/near this photo (paper on a paper section, ink on a photo
 *   that's itself dark-toned) so the wipe doesn't look like a mismatched flash
 * @param {number} [scaleFrom=1.2] - starting zoom on the photo; settles to 1
 * @param {number} [blurFrom=16] - starting blur in px on the photo, easing
 *   to 0 alongside the zoom-settle — reads as a rack-focus pull rather than
 *   just a zoom, the same "coming into focus" beat real editorial spreads
 *   use on a lead image. 0 disables.
 * @param {string} [start="top 78%"] - ScrollTrigger start position
 * @param {boolean} [once=false] - true plays once and stays; false
 *   (default) replays every time it scrolls past the trigger — curtain
 *   closes back over the photo on the way up, wipes open again coming
 *   back down
 */
export default function RevealImage({
  as: Tag = "div",
  className = "",
  curtain = "ink",
  scaleFrom = 1.2,
  blurFrom = 16,
  start = "top 78%",
  once = false,
  children,
  ...rest
}) {
  const wrapRef = useRef(null);
  const zoomRef = useRef(null);
  const curtainRef = useRef(null);

  useGSAP(
    () => {
      if (prefersReducedMotion() || !zoomRef.current || !curtainRef.current) return;

      gsap.set(zoomRef.current, {
        scale: scaleFrom,
        filter: blurFrom ? `blur(${blurFrom}px)` : "blur(0px)",
        transformOrigin: "center center",
      });
      gsap.set(curtainRef.current, { scaleY: 1, transformOrigin: "bottom" });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: wrapRef.current,
          start,
          toggleActions: once ? "play none none none" : "play reverse play reverse",
        },
      });

      tl.to(curtainRef.current, {
        scaleY: 0,
        duration: 1.05,
        ease: "siteEase",
      }).to(
        zoomRef.current,
        { scale: 1, filter: "blur(0px)", duration: 1.7, ease: "siteEase" },
        "<0.05",
      );

      return () => tl.scrollTrigger?.kill();
    },
    { scope: wrapRef },
  );

  return (
    <Tag ref={wrapRef} className={`relative overflow-hidden ${className}`} {...rest}>
      <div ref={zoomRef} className="w-full h-full will-change-transform">
        {children}
      </div>
      <div
        ref={curtainRef}
        aria-hidden="true"
        className={`absolute inset-0 z-10 pointer-events-none ${
          curtain === "paper" ? "bg-paper" : "bg-ink"
        }`}
      />
    </Tag>
  );
}
