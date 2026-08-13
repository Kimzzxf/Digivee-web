// The pinned horizontal scrub already tracks which panel is "current" via
// `active` (used for the 0X/05 counter) — reusing that same index here to
// scale the current panel up to full size/opacity while its neighbors
// shrink and dim is what makes the pin+scrub read as scroll driving
// something (a focus point moving through the row) instead of just a strip
// of equal-weight photos sliding sideways. Plain CSS transition (not GSAP)
// is enough since `active` only changes in discrete steps, not
// continuously — the transition just smooths each step.
export default function ShowcasePanel({ item, index, isActive }) {
  return (
    <div
      className={`editorial-img shadow-editorial border border-ink/10 relative shrink-0 w-[78vw] md:w-[420px] h-[64vh] mr-5 md:mr-8 last:mr-0 transition-[transform,opacity] duration-500 ease-out ${
        isActive ? "scale-100 opacity-100" : "scale-[0.91] opacity-50"
      }`}
    >
      <img src={item.image.src} alt={item.image.alt} loading="lazy" />
      <div className="absolute inset-0 bg-ink/50" />
      <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-between text-paper">
        <div className="flex items-start justify-between">
          <span className="font-display text-5xl md:text-6xl leading-none">0{index + 1}</span>
          <item.icon className="w-7 h-7 text-pink shrink-0" strokeWidth={1.3} />
        </div>
        <div>
          <p className="font-body font-bold text-xl md:text-2xl mb-2">{item.title}</p>
          <p className="font-body text-sm text-paper/75 leading-relaxed max-w-xs">{item.desc}</p>
        </div>
      </div>
    </div>
  );
}
