import { useEffect, useRef, useState } from "react";
import { Check, Clock } from "lucide-react";
import { MINUTES } from "../lib/time";

// Closed-state button: matches whichever form this control sits in, not a
// look of its own — "underline" is the pink Sewa form's FIELD style
// (sewaHelpers.js), "lined" is the same bottom-border treatment but
// ink-colored for Admin's white surface (LaporanEditFields.jsx /
// TransaksiFormFields.jsx — both Admin forms are bottom-lined now, so the
// old boxed rounded-lg/border-ink variant has no callers left). Copied as
// literal strings rather than imported so this component doesn't reach
// into page-level files for styling constants.
const BUTTON = {
  underline:
    "w-full px-0 py-2.5 bg-transparent border-0 border-b border-paper/40 text-paper font-body outline-none transition-colors focus:border-paper",
  lined:
    "w-full px-0 py-2.5 bg-transparent border-0 border-b border-ink/20 text-ink font-mono text-sm outline-none transition-colors focus:border-pink",
};
const PLACEHOLDER = { underline: "text-paper/50", lined: "text-ink/40" };
const ICON_COLOR = { underline: "text-paper", lined: "text-ink/50" };

// Open panel: an iOS-style wheel picker. Apple documents this material for
// Apple platforms only (HIG → Materials) — there's no official web CSS for
// it, so this is a labeled approximation: native scroll-snap for the
// physics, a CSS mask for the top/bottom fade, and a fixed center band for
// the selection highlight. This is where the "iOS 26" ask actually lives —
// the trigger button above stays boring and matches its form on purpose.
const ITEM_H = 40; // px per row — must match the h-10 on each row below
const PAD_ROWS = 2; // rows of blank padding top/bottom so row 0 and the
// last row can still reach the center of the wheel

function Wheel({ items, value, disabledBefore, disabledAfter, onSettle }) {
  const ref = useRef(null);
  const timeoutRef = useRef(null);
  const touchedRef = useRef(false); // only commit on a real user gesture —
  // without this, the initial scroll-into-place on mount below would fire
  // handleScroll -> settle -> onChange on its own, silently writing a
  // default time the moment the panel opens, before the user picked
  // anything (a real risk on the Admin form's clearable fields).
  const initialIdx = value ? Math.max(0, items.indexOf(value)) : disabledBefore;
  const [activeIdx, setActiveIdx] = useState(initialIdx);

  useEffect(() => {
    ref.current.scrollTop = initialIdx * ITEM_H;
    // mount-only: this Wheel remounts fresh every time the panel opens
    // (see the `{open && (...)}` below), so there's nothing to re-sync on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cross-wheel min/max: when the hour wheel settles on a new value, the
  // minute wheel's disabledBefore/disabledAfter can shift (e.g. jam
  // return's min/max hour just changed). If the minute wheel's current
  // position falls outside the newly-valid range, walk it back in.
  useEffect(() => {
    if (activeIdx < disabledBefore) settle(disabledBefore);
    else if (activeIdx > disabledAfter) settle(disabledAfter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabledBefore, disabledAfter]);

  function settle(rawIdx) {
    let idx = Math.min(items.length - 1, Math.max(0, rawIdx));
    while (idx < items.length - 1 && idx < disabledBefore) idx++;
    while (idx > 0 && idx > disabledAfter) idx--;
    ref.current.scrollTo({ top: idx * ITEM_H, behavior: "smooth" });
    setActiveIdx(idx);
    onSettle(items[idx]);
  }

  function handleScroll() {
    const idx = Math.min(items.length - 1, Math.max(0, Math.round(ref.current.scrollTop / ITEM_H)));
    setActiveIdx(idx);
    if (!touchedRef.current) return;
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => settle(idx), 130);
  }

  function pick(i) {
    if (i < disabledBefore || i > disabledAfter) return;
    touchedRef.current = true;
    ref.current.scrollTo({ top: i * ITEM_H, behavior: "smooth" });
    // ponytail: commit directly instead of waiting for handleScroll's
    // settle — clicking a row that's already centered (e.g. the default
    // minute) produces zero scrollTop delta, so no "scroll" event ever
    // fires and the pick silently no-ops. Root cause of "harus discroll
    // dulu jam menitnya": a tap only registered when it happened to also
    // move the wheel.
    settle(i);
  }

  return (
    <div
      ref={ref}
      onScroll={handleScroll}
      onPointerDown={() => { touchedRef.current = true; }}
      data-lenis-prevent
      className="wheel-scroll h-[200px] w-16 overflow-y-auto snap-y snap-mandatory"
      style={{ paddingTop: PAD_ROWS * ITEM_H, paddingBottom: PAD_ROWS * ITEM_H }}
    >
      {items.map((it, i) => {
        const disabled = i < disabledBefore || i > disabledAfter;
        return (
          <button
            key={it}
            type="button"
            disabled={disabled}
            onClick={() => pick(i)}
            tabIndex={-1}
            className={`h-10 w-full flex items-center justify-center snap-center font-mono transition-all ${
              disabled
                ? "text-ink/15 cursor-not-allowed"
                : i === activeIdx
                  ? "text-ink text-lg font-bold scale-105"
                  : "text-ink/35 text-base"
            }`}
          >
            {it}
          </button>
        );
      })}
    </div>
  );
}

// Two wheel columns (jam + menit) that combine into one "HH:MM" value —
// same value/onChange contract as before, so callers don't change. Native
// <select> is gone: you can't get the iOS wheel feel out of a browser's
// own dropdown list, custom scroll-snap columns are the only honest way
// to get it.
//
// ponytail: h/m stay local state, not derived purely from `value` — same
// reason as before this rewrite (see CatatTransaksi.jsx's key-remount
// note) — a combined onChange only fires once BOTH wheels have settled,
// so a lone hour pick has nowhere else to live.
export default function HourMinuteSelect({
  value, onChange, hours, min, max, disabled = false, clearable = false, className = "",
  variant = "underline",
}) {
  const [open, setOpen] = useState(false);
  const [h, setH] = useState(() => value?.split(":")[0] || "");
  const [m, setM] = useState(() => value?.split(":")[1] || "");
  const rootRef = useRef(null);

  useEffect(() => {
    setH(value?.split(":")[0] || "");
    setM(value?.split(":")[1] || "");
  }, [value]);

  useEffect(() => {
    function onDocClick(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    }
    function onEsc(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  // ponytail: pick one wheel, get a value — the other wheel defaults
  // instead of blocking onChange. Root cause of "harus pilih menit dulu":
  // onChange used to require BOTH h and m already set, so picking hour
  // alone (the natural first move) silently did nothing until minute was
  // also touched. Default targets the nearest valid row so it never lands
  // on a disabled cell when min/max is active.
  function pickHour(newH) {
    setH(newH);
    const nextM = m || (newH === minH && minM ? minM : "00");
    setM(nextM);
    onChange(`${newH}:${nextM}`);
  }

  function pickMinute(newM) {
    setM(newM);
    const nextH = h || hours[hoursDisabledBefore];
    setH(nextH);
    onChange(`${nextH}:${newM}`);
  }

  function clear() {
    setH("");
    setM("");
    onChange("");
    setOpen(false);
  }

  // `min`/`max` are plain string compares, so they only work with
  // ascending lists (both OPERATIONAL_HOURS and ADMIN_HOURS run 00→23).
  const minH = min ? min.slice(0, 2) : null;
  const minM = min ? min.slice(3, 5) : null;
  const maxH = max ? max.slice(0, 2) : null;
  const maxM = max ? max.slice(3, 5) : null;
  const hoursDisabledBefore = minH ? hours.indexOf(minH) : 0;
  const hoursDisabledAfter = maxH ? hours.indexOf(maxH) : hours.length - 1;
  const minutesDisabledBefore = h && minH && h === minH && minM ? MINUTES.indexOf(minM) : 0;
  const minutesDisabledAfter =
    h && maxH && h === maxH && maxM ? MINUTES.indexOf(maxM) : MINUTES.length - 1;

  return (
    <div className={`relative ${className}`} ref={rootRef}>
      <button
        type="button"
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        className={`${BUTTON[variant]} disabled:opacity-40 flex items-center justify-between gap-2 text-left`}
      >
        <span className={h && m ? "" : PLACEHOLDER[variant]}>{h && m ? `${h}:${m}` : "Pilih jam..."}</span>
        <Clock className={`w-4 h-4 shrink-0 ${ICON_COLOR[variant]}`} />
      </button>

      {open && (
        <div className="absolute z-20 mt-1 bg-ivory text-ink border border-ink/15 rounded-[28px] shadow-soft p-3">
          <div className="flex items-center justify-between mb-1 px-1 gap-4">
            <span className="font-mono text-[10px] text-ink/50">Jam &amp; Menit</span>
            <button type="button" onClick={() => setOpen(false)} className="p-1 hover:text-pink" aria-label="Selesai">
              <Check className="w-4 h-4" />
            </button>
          </div>

          <div className="relative flex items-stretch justify-center">
            <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 h-10 rounded-[18px] bg-ink/[0.06] border-y border-ink/10" />
            <Wheel items={hours} value={h} disabledBefore={hoursDisabledBefore} disabledAfter={hoursDisabledAfter} onSettle={pickHour} />
            <div className="flex items-center px-1 font-mono text-lg text-ink/40 select-none">:</div>
            <Wheel items={MINUTES} value={m} disabledBefore={minutesDisabledBefore} disabledAfter={minutesDisabledAfter} onSettle={pickMinute} />
          </div>

          {clearable && (h || m) && (
            <button
              type="button"
              onClick={clear}
              className="mt-2 w-full text-center font-mono text-[10px] text-ink/50 hover:text-pink"
            >
              Kosongkan
            </button>
          )}
        </div>
      )}
    </div>
  );
}
