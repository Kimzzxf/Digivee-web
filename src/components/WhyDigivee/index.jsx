import SplitHeading from "../SplitHeading";
import { ITEMS } from "./whyDigiveeItems";
import { useShowcaseScrub } from "./useShowcaseScrub";
import ShowcasePanel from "./ShowcasePanel";

export default function WhyDigivee() {
  const { active, sectionRef, viewportRef, trackRef } = useShowcaseScrub();
  const progressPct = ((active + 1) / ITEMS.length) * 100;

  return (
    <section ref={sectionRef} className="relative py-24 md:py-0 md:h-screen md:flex md:flex-col md:justify-center">
      <div className="px-5 md:px-8 w-full">
        <div className="flex items-end justify-between gap-4 mb-10 md:mb-14">
          <div className="flex items-baseline gap-4">
            <span className="kicker text-pink">02</span>
            <SplitHeading as="h2" text="Kenapa Digivee" className="font-display text-5xl md:text-7xl tracking-tight" />
          </div>
          <div className="flex items-center gap-2 kicker text-smoke">
            {/* the track moves on vertical page scroll (pinned + scrubbed,
                see useShowcaseScrub) on every breakpoint, not on a touch
                swipe — "Geser" implied a horizontal drag that was never the
                actual gesture, especially misleading on mobile. */}
            ( Terus Scroll <span className="text-pink">↓</span> )
          </div>
        </div>
      </div>

      {/* pinned viewport, GSAP-scrubbed horizontal track — same on every
          breakpoint, scroll-driven rather than manually dragged */}
      <div ref={viewportRef} className="overflow-hidden">
        <div ref={trackRef} className="flex w-max px-5 md:px-8">
          {ITEMS.map((item, i) => (
            <ShowcasePanel key={item.title} item={item} index={i} isActive={active === i} />
          ))}
        </div>
      </div>

      <div className="px-5 md:px-8 w-full mt-8 md:mt-12 flex items-center gap-4">
        <span className="font-display text-2xl md:text-3xl leading-none">0{active + 1}</span>
        <div className="flex-1 h-px bg-ink/15 relative overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-pink transition-[width] duration-300 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <span className="kicker text-smoke shrink-0">— 0{ITEMS.length}</span>
      </div>
    </section>
  );
}
