import { Star, Users, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { IMAGES } from "../lib/editorialImages";
import { getSession } from "../lib/customer";
import Parallax from "./Parallax";
import RevealImage from "./RevealImage";
import SplitHeading from "./SplitHeading";
import Button from "./Button";
import useScrollReveal from "../hooks/useScrollReveal";

const PROGRAMS = [
  {
    icon: Star,
    kicker: "Program 01",
    title: "Poin Setia",
    desc: "Tiap sewa, kamu dapet 1 poin. Kumpulin 4 poin, pilih: gratis tambahan waktu sewa (+50% durasi) atau potongan Rp15.000.",
    image: IMAGES.promoPoin,
  },
  {
    icon: Users,
    kicker: "Program 02",
    title: "Ajak Teman",
    desc: "Ajak temenmu pakai QR di kartu loyalitasmu. Kalian berdua dapet potongan Rp15.000 buat sewa berikutnya.",
    image: IMAGES.promoReferral,
  },
];

// Each promo card gets its own scroll-triggered reveal (rather than one
// shared stagger across the section) because the two cards sit far apart —
// a single trigger anchored to the section would fire the second card's
// animation long before it's anywhere near the viewport. Pulled into its
// own component so useScrollReveal (a hook) can be called once per card
// without landing inside PROGRAMS.map's callback, which would break
// React's rules of hooks.
//
// Full-bleed split panel (elementis.co reference): photo and copy each
// take a flush half with no gutter, copy panel is solid ink/white so it
// reads as its own surface rather than a card floating on the page.
function PromoCard({ program, imageFirst }) {
  const revealRef = useScrollReveal({ y: 72, scale: 0.95, duration: 1.2 });
  const [firstWord, ...restWords] = program.title.split(" ");

  return (
    <div ref={revealRef}>
      <Parallax as="div" speed={imageFirst ? 0.5 : 0.7} className="grid md:grid-cols-2">
        <div className={`${imageFirst ? "md:order-1" : "md:order-2"} h-[360px] md:h-[600px]`}>
          <RevealImage curtain="ink" scaleFrom={1.2} className="editorial-img h-full">
            <img src={program.image.src} alt={program.image.alt} loading="lazy" />
          </RevealImage>
        </div>

        <div
          className={`${imageFirst ? "md:order-2" : "md:order-1"} flex flex-col justify-center h-[360px] md:h-[600px] px-8 md:px-16 py-12`}
        >
          <div className="flex items-center gap-2 mb-8">
            <program.icon className="w-5 h-5 text-paper/70" strokeWidth={1.5} />
            <span className="kicker text-paper/70">{program.kicker}</span>
          </div>
          <h3 className="font-display text-3xl md:text-5xl mb-6 tracking-tight leading-[1.1]">
            <span className="text-pink">{firstWord}</span>{" "}
            {restWords.join(" ")}
          </h3>
          <p className="font-body text-base text-paper/70 leading-relaxed max-w-md">{program.desc}</p>
        </div>
      </Parallax>
    </div>
  );
}

export default function PromoSection() {
  return (
    <section data-status-color="ink" className="py-28 md:py-36 bg-ink text-paper">
      <div className="px-5 md:px-8 mb-16">
        <Parallax as="div" speed={0.3} className="flex items-baseline gap-4">
          <span className="kicker text-pink">04</span>
          <SplitHeading
            as="h2"
            text="Promo"
            className="font-display text-5xl md:text-7xl tracking-tight"
          />
        </Parallax>
      </div>

      <div className="space-y-4 md:space-y-6">
        {PROGRAMS.map((program, i) => (
          <PromoCard key={program.title} program={program} imageFirst={i % 2 === 0} />
        ))}
      </div>

      <div className="px-5 md:px-8 mt-16">
        <Parallax as="div" speed={0.4} className="inline-block">
          <Button as={Link} to={getSession() ? "/profile" : "/login"} icon={ArrowUpRight}>
            Buat Kartu Loyalitas
          </Button>
        </Parallax>
      </div>
    </section>
  );
}
