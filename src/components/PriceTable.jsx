import { MEET_POINTS, formatK } from "../lib/pricelist";
import { IMAGES } from "../lib/editorialImages";
import Parallax from "./Parallax";
import RevealImage from "./RevealImage";
import SplitHeading from "./SplitHeading";
import useScrollReveal from "../hooks/useScrollReveal";

// A flat 10-row list (Zona 1) reads as a spec sheet, not a rate card. The
// data already carries a real split — `days: 0` is a same-day rental priced
// flat, `days > 0` is priced per night away — so group on that instead of
// inventing a category. Collapses to a single unlabeled group when a zone
// doesn't actually mix the two (Zona 3 is all per-hari), so the label only
// shows up where it's actually distinguishing something.
function groupDurations(durations) {
  const perJam = durations.filter((d) => d.days === 0);
  const perHari = durations.filter((d) => d.days > 0);
  if (perJam.length && perHari.length) {
    return [
      { label: "Per Jam", items: perJam },
      { label: "Per Hari", items: perHari },
    ];
  }
  return [{ label: null, items: durations }];
}

export default function PriceTable() {
  // Fires once when the grid scrolls into view, staggering each of the
  // 3 meet-point columns in after the last. Lives on a plain wrapper div
  // around each <Parallax>, not on the <Parallax> element itself — GSAP
  // and Framer Motion would otherwise both try to drive that element's
  // `transform: translateY`, and only one of them would win each frame.
  // y/scale bumped up from the old 36px/no-scale — a bigger rise plus a
  // slight zoom-settle (0.96 -> 1) gives each column real arrival weight
  // instead of a gentle drift into place.
  const gridRef = useScrollReveal({ y: 60, scale: 0.96, duration: 1.2, stagger: 0.15 });

  return (
    <section className="px-5 md:px-8 py-28 md:py-36">
      <div className="flex items-end justify-between gap-4 md:gap-8 mb-16">
        <Parallax as="div" speed={0.3} className="flex items-baseline gap-4">
          <span className="kicker text-pink">03</span>
          <SplitHeading
            as="h2"
            text="Price List"
            className="font-display text-5xl md:text-7xl tracking-tight"
          />
        </Parallax>

        {/* small asymmetric accent photo — breaks the pure-typography rhythm,
            mirrors the magazine habit of tucking a detail shot beside a rubric.
            Scales down (not hidden) on mobile so it stays readable as a
            corner detail instead of colliding with the oversized heading. */}
        <Parallax as="div" speed={0.7} distance={100} className="shrink-0">
          <RevealImage
            curtain="paper"
            scaleFrom={1.3}
            className="editorial-img w-16 h-24 md:w-32 md:h-44 border border-ink/10 shadow-editorial"
          >
            <img src={IMAGES.priceAccent.src} alt={IMAGES.priceAccent.alt} loading="lazy" />
          </RevealImage>
          {/* photo caption — the magazine habit of never letting a lead image
              sit unlabeled. Right-aligned under the frame, same width, so it
              reads as this photo's own credit line rather than a stray
              sentence. */}
          <p className="font-display italic text-[0.65rem] md:text-xs text-smoke mt-2 text-right">
            Fig. 01 — Detail digicam.
          </p>
        </Parallax>
      </div>

      {/* deck — one-line narrative hook before the numbers start, the same
          "heading, then a sentence of context" beat WhyDigivee opens with,
          so Price List doesn't drop straight into a spec sheet. */}
      <Parallax
        as="p"
        speed={0.4}
        className="font-display italic text-lg md:text-xl text-ink/70 max-w-xl mb-14 leading-relaxed"
      >
        Tiga titik jemput, satu tarif jujur — pilih yang paling dekat, sisanya kami yang antar.
      </Parallax>

      <div ref={gridRef} className="grid md:grid-cols-[5fr_4fr_3fr] gap-y-14 md:gap-y-0">
        {MEET_POINTS.map((group, gi) => (
          <div
            key={group.id}
            className={[
              gi > 0 && "md:border-l md:border-ink/10 md:pl-10",
              gi < MEET_POINTS.length - 1 && "md:pr-10",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <Parallax as="div" speed={0.5 + gi * 0.25}>
              {/* folio number — same "kicker + numeral" device as the section's
                  own "03" heading, stepped down a level to mark each zone as
                  its own entry rather than just a column. */}
              <div className="flex items-baseline gap-3 mb-0.5">
                <span className="font-display italic text-pink text-2xl md:text-3xl leading-none">
                  {String(gi + 1).padStart(2, "0")}
                </span>
                <p className="font-body font-bold text-lg">{group.label}</p>
              </div>
              <p className="kicker text-smoke mb-6">
                {group.sub}
                {/* zone-specific footnote reference — only Zona 3 carries a
                    rule that isn't already stated in its own row (the >40km
                    hand-off), so only it gets a marker back to the footnote. */}
                {group.id === "zona3" && <sup className="text-pink">*</sup>}
              </p>
              {groupDurations(group.durations).map((cluster, ci) => (
                <div key={cluster.label || "flat"} className={ci > 0 ? "mt-5 pt-5 border-t border-ink/10" : undefined}>
                  {cluster.label && <p className="kicker text-ink/35 mb-2">{cluster.label}</p>}
                  <ul>
                    {cluster.items.map((d) => (
                      <li
                        key={d.id}
                        className="row-hover flex items-baseline gap-2 py-3 font-body text-sm"
                      >
                        <span className="text-ink/80 whitespace-nowrap">{d.label}</span>
                        {/* dotted leader — the menu-card device that reads as
                            "rate card" instead of a web pricing grid. Sits 3px
                            above baseline so the dots line up with the text,
                            not the row's bottom edge. */}
                        <span
                          className="flex-1 border-b border-dotted border-ink/25 -translate-y-[3px]"
                          aria-hidden="true"
                        />
                        <span className="font-display font-semibold text-ink text-base tabular-nums">
                          {formatK(d.price)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </Parallax>
          </div>
        ))}
      </div>

      <Parallax
        as="p"
        speed={0.2}
        className="kicker text-smoke mt-16 pt-6 rule-hair max-w-lg leading-relaxed"
      >
        Harga sudah termasuk card reader. Jaminan wajib identitas asli (KTP/SIM/KTM).{" "}
        <span className="text-pink">*</span> Di atas 40km, hubungi admin.
      </Parallax>
    </section>
  );
}
