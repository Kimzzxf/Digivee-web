import { useLocation, useNavigate } from "react-router-dom";
import { scrollToTarget } from "../lib/lenis";

// Extracted from Navbar/index.jsx, which needed it for its "Beranda /
// Price List / Promo" links and now the footer reuses the exact same
// links (see lib/navLinks.js) — same click behaviour, one implementation.
//
// "/#pricelist" and "/#promo" need to work across a route change too
// (navigate to "/" first, *then* scroll), which a plain anchor jump can't
// do — so route everything through the router + Lenis's own scrollTo
// instead. `onBeforeNavigate` lets callers run something first (Navbar
// closes its mobile menu; the footer has nothing to close).
export function useNavLinkClick(onBeforeNavigate) {
  const navigate = useNavigate();
  const location = useLocation();

  return function handleNavLinkClick(e, href) {
    e.preventDefault();
    onBeforeNavigate?.();
    const [path, hash] = href.split("#");
    const targetPath = path || "/";

    if (!hash) {
      if (location.pathname !== targetPath) navigate(targetPath);
      scrollToTarget(0);
      return;
    }

    if (location.pathname === targetPath) {
      setTimeout(() => {
        if (!scrollToTarget(`#${hash}`)) {
          document.getElementById(hash)?.scrollIntoView({ behavior: "smooth" });
        }
      }, 350);
    } else {
      navigate(targetPath, { state: { scrollTo: hash } });
    }
  };
}
