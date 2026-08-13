import { useEffect, useState } from "react";
import { Star, Instagram } from "lucide-react";
import { getPublicTestimonials } from "../lib/testimonial";
import Parallax from "./Parallax";
import SplitHeading from "./SplitHeading";
import useScrollReveal from "../hooks/useScrollReveal";

// Horizontal card row via native CSS scroll-snap — no carousel library,
// no GSAP scrub (WhyDigivee's pinned/scrubbed track is overkill for a
// handful of quote cards). Same "overflow-x-auto on mobile" idea
// WhyDigivee's own [data-lenis-prevent] row already relies on.
export default function TestimonialSection() {
  const [testimonials, setTestimonials] = useState(null); // null = loading
  const revealRef = useScrollReveal({ y: 40, stagger: 0.08 });

  useEffect(() => {
    getPublicTestimonials()
      .then(setTestimonials)
      .catch(() => setTestimonials([]));
  }, []);

  // Nothing to show yet (still loading) or genuinely empty — skip the
  // whole section rather than render an empty shell or fake seed data.
  if (!testimonials || testimonials.length === 0) return null;

  return (
    <section className="px-5 md:px-8 py-28 md:py-36">
      <Parallax as="div" speed={0.3} className="flex items-baseline gap-4 mb-14">
        <span className="kicker text-pink">05</span>
        <SplitHeading
          as="h2"
          text="Kata Mereka"
          className="font-display text-5xl md:text-7xl tracking-tight"
        />
      </Parallax>

      <div
        ref={revealRef}
        data-lenis-prevent
        className="flex gap-5 overflow-x-auto snap-x snap-mandatory pb-4 -mx-5 px-5 md:-mx-8 md:px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {testimonials.map((t) => (
          <article
            key={t.id}
            className="frame snap-start shrink-0 w-[280px] md:w-[340px] p-6 flex flex-col"
          >
            <div className="flex items-center gap-1 mb-4 text-pink">
              <Star className="w-4 h-4 fill-current" strokeWidth={1.5} />
              <span className="font-display font-semibold text-lg leading-none">{t.rating_average}</span>
              <span className="kicker text-ink/30">/10</span>
            </div>

            {t.photos?.length > 0 && (
              <div className="flex gap-1.5 mb-4">
                {t.photos.slice(0, 3).map((url) => (
                  <img key={url} src={url} alt="" className="w-12 h-12 rounded-lg object-cover" />
                ))}
              </div>
            )}

            <p className="font-display italic text-base md:text-lg leading-relaxed text-ink/85 mb-6 flex-1">
              "{t.text}"
            </p>

            <p className="font-body font-bold text-sm">{t.nama}</p>
            {t.instagram_username && (
              <a
                href={`https://instagram.com/${t.instagram_username}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 font-mono text-xs text-ink/50 hover:text-pink transition-colors mb-2"
              >
                <Instagram className="w-3 h-3" strokeWidth={1.5} />@{t.instagram_username}
              </a>
            )}
            <p className={`kicker text-smoke ${t.instagram_username ? "" : "mt-2"}`}>
              Pelayanan {t.rating_pelayanan} · Kamera {t.rating_kondisi_kamera} · Proses {t.rating_proses_sewa}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
