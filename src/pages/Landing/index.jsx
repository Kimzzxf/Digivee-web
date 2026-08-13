import { useLocation, useNavigate } from "react-router-dom";
import { getSession } from "../../lib/customer";
import WhyDigivee from "../../components/WhyDigivee";
import PriceTable from "../../components/PriceTable";
import PromoSection from "../../components/PromoSection";
import Marquee from "../../components/Marquee";
import TestimonialSection from "../../components/TestimonialSection";
import { useLandingScrollHash } from "./useLandingScrollHash";
import LandingHero from "./LandingHero";
import LandingFooter from "./LandingFooter";

export default function Landing() {
  const location = useLocation();
  const navigate = useNavigate();
  useLandingScrollHash(location, navigate);

  // Logged in -> straight to the rental form. Logged out -> login first,
  // then bounce back to /sewa once they're in.
  function handleMulaiSewa() {
    if (getSession()) navigate("/sewa");
    else navigate("/login?next=%2Fsewa");
  }

  return (
    <div>
      <LandingHero onMulaiSewa={handleMulaiSewa} />

      <WhyDigivee />

      <div id="pricelist">
        <PriceTable />
      </div>

      {/* quiet close on the Price List spread — same section-bracket habit
          as the dark/lg marquee before the footer CTA, toned down to light/sm
          so it reads as a closing rule, not another headline. */}
      <Marquee
        items={["Zona 1 — Self Pickup", "Zona 2 — Antar Jemput", "Zona 3 — Antar Jemput"]}
        variant="light"
        size="sm"
      />

      <div id="promo">
        <PromoSection />
      </div>

      <div id="testimoni">
        <TestimonialSection />
      </div>

      {/* marquee break before the closing CTA — echoes elementis.co's
          "Sustainable Retreat" band right before its own "Take the First
          Step" form section */}
      <div data-status-color="ink">
        <Marquee items={["Sewa Sekarang", "Momen Ga Nunggu"]} variant="dark" size="lg" />
      </div>

      <LandingFooter onMulaiSewa={handleMulaiSewa} />
    </div>
  );
}
