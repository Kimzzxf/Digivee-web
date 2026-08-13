import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { NAV_LINKS, SOCIAL_LINKS } from "../../lib/navLinks";
import { InstagramIcon, WhatsAppIcon } from "../../components/SocialIcons";
import { useNavLinkClick } from "../../hooks/useNavLinkClick";

const SOCIAL_ICONS = { Instagram: InstagramIcon, Whatsapp: WhatsAppIcon };

// footer — elementis.co-style link grid on a flat brand-pink field: a
// contact block on the left, "Navigasi" + "Stay Connected" clusters on the
// right, both sourced from lib/navLinks.js (the same list the mobile menu
// uses) so the two never drift apart. No background photo — the pink
// field itself is the visual statement, same move the hero already makes.
export default function LandingFooter({ onMulaiSewa }) {
  const handleNavLinkClick = useNavLinkClick();

  return (
    <footer data-status-color="pink" className="relative w-full bg-pink text-paper">
      <div className="px-5 md:px-8 pt-20 md:pt-28 pb-8">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-16 md:gap-12">
          {/* brand + contact */}
          <div className="max-w-xs">
            <p className="font-display text-2xl uppercase tracking-[0.4em] mb-8">
              Digivee
            </p>
            <p className="kicker text-paper mb-3">Hubungi Kami</p>
            <div className="flex flex-col gap-1.5 font-body text-base mb-8">
              <a
                href={SOCIAL_LINKS.find((l) => l.label === "Whatsapp").href}
                target="_blank"
                rel="noopener noreferrer"
                className="press-btn w-fit hover:opacity-70 transition-opacity"
              >
                Chat Admin — WhatsApp
              </a>
              <a
                href={SOCIAL_LINKS.find((l) => l.label === "Instagram").href}
                target="_blank"
                rel="noopener noreferrer"
                className="press-btn w-fit hover:opacity-70 transition-opacity"
              >
                @digivee_krw
              </a>
            </div>
            <button
              onClick={onMulaiSewa}
              className="btn-outline btn-outline--paper press-btn group inline-flex items-center gap-2 px-5 py-2.5 font-body font-bold text-sm"
            >
              Sewa Sekarang
              <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>
          </div>

          {/* navigasi + stay connected */}
          <div className="flex gap-16 sm:gap-24">
            <div>
              <p className="kicker text-paper mb-5">Navigasi</p>
              <nav className="flex flex-col gap-2">
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={(e) => handleNavLinkClick(e, link.href)}
                    className="press-btn w-fit font-display text-2xl md:text-3xl leading-tight tracking-tight underline decoration-transparent decoration-2 underline-offset-4 hover:decoration-paper transition-[text-decoration-color]"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
            </div>

            <div>
              <p className="kicker text-paper mb-5">Stay Connected</p>
              <div className="flex items-center gap-3">
                {SOCIAL_LINKS.map((link) => {
                  const Icon = SOCIAL_ICONS[link.label];
                  return (
                    <a
                      key={link.label}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={link.label}
                      title={link.label}
                      className="press-btn shrink-0 hover:opacity-70 transition-opacity"
                    >
                      <Icon className="w-5 h-5" />
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 md:mt-20 pt-6 border-t border-paper/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs text-paper">
          <span>© {new Date().getFullYear()} DIGIVEE. All Rights Reserved.</span>
          <div className="flex items-center gap-4">
            <Link to="/syarat-ketentuan" className="press-btn hover:opacity-70 transition-opacity underline">
              Syarat &amp; Ketentuan
            </Link>
            <span>Cibuaya, Karawang</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
