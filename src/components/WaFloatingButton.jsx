import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { supportWaUrl } from "../lib/contact";
import { WhatsAppIcon } from "./SocialIcons";
import { ADMIN_PATH } from "../lib/adminPath";

// Hide while the page is actively scrolling, reveal again once it settles
// — not direction-based (compare Navbar/useNavbarScroll), just "is scroll
// happening right now". Plain native `scroll` + a reset-on-every-event
// timeout is enough; no need for a library, and this fires correctly
// under Lenis too since Lenis smooths real scroll rather than faking it.
function useScrollIdle(delay = 400) {
  const [scrolling, setScrolling] = useState(false);
  useEffect(() => {
    const timer = { current: null };
    function handleScroll() {
      setScrolling(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setScrolling(false), delay);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(timer.current);
    };
  }, [delay]);
  return scrolling;
}

// Hidden on the form pages — both already end in their own full-width
// submit CTA (see SewaSummary / LoginPinStep etc.), and the fixed bubble
// sitting on top of that after scroll settles is the thing being avoided
// here, not just mid-scroll.
const FORM_PATHS = ["/login", "/sewa"];

// Always-reachable WA contact bubble on every customer-facing page.
// Hidden on /admin — dashboard's own UI is dense enough without a fixed
// bubble floating over tables/modals.
export default function WaFloatingButton() {
  const { pathname } = useLocation();
  const scrolling = useScrollIdle();
  // Entrance fade folded into the same opacity/transform transition the
  // scroll-hide below uses (was a separate `pop-in` CSS animation — its
  // fill-mode:both holds opacity/transform at their end values forever,
  // which beats a transition on those same properties, so the scroll-hide
  // toggle below could never actually make the button disappear).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (FORM_PATHS.includes(pathname) || pathname === ADMIN_PATH) return null;

  const hidden = scrolling || !mounted;

  return (
    <a
      href={supportWaUrl()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat WhatsApp Digivee"
      title="Chat via WhatsApp"
      // Slide on the x-axis (own width, via translate-x-full) instead of the
      // old drop-and-fade — hidden reads as exiting off the right edge,
      // reveal as sliding back in from there. Same siteEase curve
      // (cubic-bezier(0.16,1,0.3,1)) the rest of the site's slides/reveals
      // use (menu overlay links, editorial image wipes, header hide/show).
      // wa-fab (index.css) carries the actual transition — .press-btn's own
      // `transition:` shorthand doesn't include opacity and overrides
      // arbitrary Tailwind transition-[...] classes wholesale.
      className={`press-btn wa-fab fixed bottom-5 right-5 z-[170] h-11 pl-3.5 pr-4 flex items-center gap-2 rounded-[999px] text-paper shadow-soft backdrop-blur-md bg-ink/85 border border-white/10 ${
        hidden ? "opacity-0 translate-x-full pointer-events-none" : "opacity-100 translate-x-0"
      }`}
    >
      <WhatsAppIcon className="w-5 h-5 shrink-0" />
      <span className="font-body font-normal text-sm whitespace-nowrap">Chat WhatsApp</span>
    </a>
  );
}
