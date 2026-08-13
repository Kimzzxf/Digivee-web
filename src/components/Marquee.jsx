// Reusable scrolling text ribbon — same infinite-loop marquee technique as
// the original ticker that used to live only above the hero, pulled out so
// it can repeat at different points in the page (elementis.co's habit of
// bracketing major sections with a slow text band, e.g. its top-of-hero
// "Wellness • Innovation • Nature • Community" ribbon and its mid-page
// "Sustainable Retreat" line before the closing CTA) without duplicating
// the loop markup + repeat-count math everywhere it's used.
//
// variant:
//   "light"   — paper bg, hairline border, smoke text (standalone divider)
//   "dark"    — ink bg, paper text (divider between light sections)
//   "overlay" — transparent bg, faint paper hairline (sits ON TOP of a
//               photo, e.g. inside the hero — see Landing.jsx)
// size:
//   "sm" — small tracked mono ticker (default)
//   "lg" — big italic display-font band
const VARIANTS = {
  light: "bg-paper border-ink/10 text-smoke",
  dark: "bg-ink border-ink text-paper/80",
  overlay: "bg-transparent border-paper/20 text-paper/80",
};

export default function Marquee({
  items,
  variant = "light",
  size = "sm",
  duration = size === "lg" ? 46 : 32,
  separator = "·",
  className = "",
}) {
  const isLg = size === "lg";

  return (
    <div
      className={`overflow-hidden border-y ${VARIANTS[variant]} ${
        isLg ? "py-6 md:py-9" : "py-2.5"
      } ${className}`}
    >
      <div
        className={`marquee-track ${
          isLg
            ? "font-display italic text-4xl md:text-6xl tracking-tight"
            : "font-mono text-xs tracking-widest"
        }`}
        style={{ animationDuration: `${duration}s` }}
      >
        {/* 10 loops (must stay an even number so the -50% translateX loop
            point lands on an identical repeat) — needs to be wide enough
            that each half alone still covers the widest desktop viewport. */}
        {Array.from({ length: 10 }).map((_, loop) => (
          <span key={loop} className="flex shrink-0">
            {items.map((item, i) => (
              <span
                key={`${loop}-${i}`}
                className={`whitespace-nowrap ${isLg ? "px-6 md:px-10" : "px-4"}`}
              >
                {item} <span className="text-pink not-italic">{separator}</span>
              </span>
            ))}
          </span>
        ))}
      </div>
    </div>
  );
}
