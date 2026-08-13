import { useRef, useState } from "react";
import { gsap, useGSAP } from "../../lib/gsap";
import { ITEMS, prefersReducedMotion } from "./whyDigiveeItems";

// elementis.co's signature move — pin the section and scrub a horizontal
// image track against vertical scroll (their "Innovation" section: pinned
// numbered header + a row of images that scrolls sideways as you scroll
// down). Runs on every breakpoint — Lenis already runs with `syncTouch` on
// (see lib/lenis.js), so touch scroll is smoothed and kept in sync with
// ScrollTrigger the same way mouse/trackpad scroll is, and the pin+scrub
// behaves the same on phones as on desktop.
export function useShowcaseScrub() {
  const [active, setActive] = useState(0);
  const sectionRef = useRef(null);
  const viewportRef = useRef(null);
  const trackRef = useRef(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const track = trackRef.current;
      const viewport = viewportRef.current;
      const section = sectionRef.current;
      if (!track || !viewport || !section) return;

      const getScrollDistance = () => Math.max(0, track.scrollWidth - viewport.offsetWidth);

      const tween = gsap.to(track, {
        x: () => -getScrollDistance(),
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => `+=${getScrollDistance()}`,
          scrub: 0.6,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            setActive(Math.min(ITEMS.length - 1, Math.floor(self.progress * ITEMS.length)));
          },
        },
      });

      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
      };
    },
    { scope: sectionRef }
  );

  return { active, sectionRef, viewportRef, trackRef };
}
