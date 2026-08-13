import { useRef } from "react";
import { gsap, useGSAP } from "../lib/gsap";

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Splits `text` into words, each sitting in its own overflow-hidden mask,
 * and scroll-reveals them rising up from below the mask (yPercent 120 -> 0)
 * with a stagger — elementis.co's big section headings never just fade in,
 * they get cut off by a mask and climb into place. Plain fade/rise
 * (useScrollReveal) reads as gentle; this reads as an entrance.
 *
 * Only for plain-text headings. For a heading with mixed inline markup
 * (an italic accent span, a manual <br/>) don't reach for this — split it
 * by hand at the call site instead, same masking technique but composed
 * around the JSX you already have.
 *
 * @param {string} text - the heading's full text, split on spaces
 * @param {keyof JSX.IntrinsicElements} [as="h2"] - element tag to render
 * @param {number} [blur=8] - starting blur in px on each word, easing to 0
 *   as it climbs into place — matches the rack-focus pull RevealImage's
 *   photos and useScrollReveal's fades already use, so the big section
 *   headings arrive with the same "coming into focus" weight. 0 disables.
 * @param {number} [stagger=0.06] - seconds between each word's start
 * @param {string} [start="top 85%"] - ScrollTrigger start position
 * @param {boolean} [once=false] - true plays once and stays; false
 *   (default) replays every time it scrolls past the trigger
 */
export default function SplitHeading({
  text,
  as: Tag = "h2",
  className = "",
  blur = 8,
  stagger = 0.06,
  start = "top 85%",
  once = false,
  ...rest
}) {
  const ref = useRef(null);
  const words = text.split(" ");

  useGSAP(
    () => {
      if (!ref.current || prefersReducedMotion()) return;
      const targets = ref.current.querySelectorAll(".word-inner");
      if (!targets.length) return;

      gsap.fromTo(
        targets,
        { yPercent: 120, filter: blur ? `blur(${blur}px)` : "blur(0px)" },
        {
          yPercent: 0,
          filter: "blur(0px)",
          duration: 1,
          stagger,
          ease: "siteEase",
          scrollTrigger: {
            trigger: ref.current,
            start,
            toggleActions: once ? "play none none none" : "play reverse play reverse",
          },
        },
      );
    },
    { scope: ref },
  );

  return (
    <Tag ref={ref} className={className} {...rest}>
      {words.map((word, i) => (
        <span
          key={i}
          className="inline-block overflow-hidden align-top pb-[0.1em] mb-[-0.1em]"
        >
          <span className="word-inner inline-block">
            {word}
            {i < words.length - 1 ? "\u00A0" : ""}
          </span>
        </span>
      ))}
    </Tag>
  );
}
