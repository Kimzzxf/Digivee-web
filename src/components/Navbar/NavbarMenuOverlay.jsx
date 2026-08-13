import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { NAV_LINKS, SOCIAL_LINKS } from "../../lib/navLinks";

// Page links + the two external contact links, all in one list, same big
// treatment — Instagram/Whatsapp sit right after Promo instead of
// duplicated again in a small strip further down. Sourced from
// lib/navLinks.js, the same list the footer now renders too.
const LINKS = [
  ...NAV_LINKS,
  ...SOCIAL_LINKS.map((link) => ({ ...link, external: true })),
];

export default function NavbarMenuOverlay({
  open,
  loggedIn,
  onNavLinkClick,
  onCloseMenu,
  onLogout,
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="menu-overlay no-scrollbar"
          data-lenis-prevent
          initial={{ clipPath: "inset(0 0 100% 0)" }}
          animate={{ clipPath: "inset(0 0 0% 0)" }}
          exit={{ clipPath: "inset(0 0 100% 0)" }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="px-5 md:px-8 min-h-screen flex flex-col pt-[calc(4rem+env(safe-area-inset-top))] md:pt-[calc(5rem+env(safe-area-inset-top))]">
            {/* no separate close row here — the sticky header (which paints
                above this overlay) keeps its own hamburger button visible,
                morphed into an X, so there's a single obvious way to close */}
            <nav className="flex-1 flex flex-col justify-start gap-2 py-6">
              {LINKS.map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.6,
                    delay: 0.15 + i * 0.08,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="border-b border-ink/15 py-5 flex items-baseline gap-5"
                >
                  <span className="kicker text-pink">0{i + 1}</span>
                  <a
                    href={item.href}
                    target={item.external ? "_blank" : undefined}
                    rel={item.external ? "noopener noreferrer" : undefined}
                    onClick={
                      item.external
                        ? onCloseMenu
                        : (e) => onNavLinkClick(e, item.href)
                    }
                    className="menu-link font-display text-[13vw] sm:text-6xl md:text-7xl leading-none tracking-tight"
                  >
                    {item.label}
                  </a>
                </motion.div>
              ))}
            </nav>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="border-t border-ink/15 py-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6"
            >
              <div className="flex items-center gap-6">
                {loggedIn ? (
                  <div className="flex items-center gap-6">
                    <Link
                      to="/profile"
                      onClick={onCloseMenu}
                      className="press-btn group flex items-center gap-2 font-body font-bold text-sm text-ink hover:text-pink"
                    >
                      Profile Saya
                      <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </Link>
                    <button
                      onClick={onLogout}
                      className="press-btn font-mono text-xs text-ink/50 hover:text-pink"
                    >Keluar</button>
                  </div>
                ) : (
                  <Link
                    to="/login"
                    onClick={onCloseMenu}
                    className="press-btn group inline-flex items-center gap-2 font-body font-bold text-sm text-ink hover:text-pink w-fit"
                  >
                    Login / Buat Kartu
                    <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Link>
                )}
              </div>
              <p className="font-mono text-xs text-ink/45">Cibuaya, Karawang</p>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
