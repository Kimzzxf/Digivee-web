import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

const EASE = [0.16, 1, 0.3, 1];

// hero — stripped down to exactly three things: the wordmark, the line,
// the button. No photo, no eyebrow, no description paragraph, one CTA —
// full brand-pink field standing in for the reference's full-bleed black
// card, DIGIVEE itself as the oversized centerpiece instead of a separate
// logo mark.
export default function LandingHero({ onMulaiSewa }) {
  const sectionRef = useRef(null);
  const [inView, setInView] = useState(true);

  // "Scroll to explore" only makes sense while the hero itself is on
  // screen — a plain IntersectionObserver on the section is enough to
  // toggle it, no need to reach for GSAP ScrollTrigger just for a
  // boolean.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.4,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      data-status-color="pink"
      className="relative w-full min-h-[calc(100dvh+4rem+env(safe-area-inset-top))] md:min-h-[calc(100dvh+5rem+env(safe-area-inset-top))] -mt-[calc(4rem+env(safe-area-inset-top))] md:-mt-[calc(5rem+env(safe-area-inset-top))] bg-pink flex flex-col items-center justify-center px-5 text-center overflow-hidden"
    >
      <h1 className="block overflow-hidden pb-[0.03em] mb-[-0.03em] w-full">
        <motion.span
          initial={{ y: "115%" }}
          animate={{ y: "0%" }}
          transition={{ duration: 1, ease: EASE }}
          className="block font-body uppercase text-paper text-[18vw] leading-none tracking-tight"
        >
          Digivee
        </motion.span>
      </h1>

      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.5, ease: EASE }}
        className="font-body italic text-paper text-2xl md:text-3xl mt-4 md:mt-6"
      >
        Capture more, Share more.
      </motion.p>

      <motion.button
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.65, ease: EASE }}
        onClick={onMulaiSewa}
        className="btn-outline btn-outline--paper press-btn group flex items-center gap-2 px-8 py-4 font-body font-bold mt-10 md:mt-12"
      >
        Mulai Sewa
        <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </motion.button>

      <div
        className={`fixed bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 transition-opacity duration-500 ${
          inView ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden={!inView}
      >
        <span className="font-mono text-[10px] tracking-[0.2em] md:text-xs md:tracking-[0.3em] uppercase text-paper/70 whitespace-nowrap">
          Scroll to explore
        </span>
        <span className="scroll-cue-line block w-px h-6 bg-paper/50" />
      </div>
    </section>
  );
}