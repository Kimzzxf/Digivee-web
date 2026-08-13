import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

// Replaces Locomotive's `data-scroll` / `data-scroll-speed="X"` parallax —
// same semantics (speed < 1 lags behind the real scroll, higher speed
// moves more) but driven by Framer Motion's scroll progress against this
// element's own viewport pass, which works fine now that Lenis smooths
// real native scroll instead of transform-hijacking it.
//
// Wraps its children in a motion element with an inline `y` transform, so
// nest it *around* an existing `motion.div`/`motion.h1` (entrance
// animation) rather than adding it to the same element — two `y`
// transforms on one motion element fight each other.
export default function Parallax({
  speed = 0.5,
  as = "div",
  distance: distanceOverride,
  className,
  style,
  children,
  ...rest
}) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  // speed 1 = moves with scroll (no lag/offset), lower speed = larger lag.
  // Base range is a deliberately small 60px — fine for kickers/buttons,
  // but a full-bleed/editorial photo drifting only ±30px barely registers
  // next to elementis.co's much heavier image parallax. Pass an explicit
  // `distance` (e.g. 160-220) on photo usages to scale just those up
  // without touching every small-text Parallax elsewhere on the page.
  const range = distanceOverride ?? 60;
  const distance = range * (1 - speed);
  const y = useTransform(scrollYProgress, [0, 1], [distance, -distance]);

  const MotionTag = motion[as] || motion.div;

  return (
    <MotionTag ref={ref} style={{ y, ...style }} className={className} {...rest}>
      {children}
    </MotionTag>
  );
}
