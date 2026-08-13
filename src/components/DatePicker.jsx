import { useEffect, useRef, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

const WEEKDAYS = ["Mg", "Sn", "Sl", "Rb", "Km", "Jm", "Sb"];
const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

function pad2(n) {
  return String(n).padStart(2, "0");
}

function toStr(y, m, d) {
  return `${y}-${pad2(m + 1)}-${pad2(d)}`;
}

function isBooked(dateStr, bookedRanges) {
  return bookedRanges.some((r) => dateStr >= r.start && dateStr <= r.end);
}

function formatId(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// Drop-in replacement for <input type="date"> — same value (string
// "YYYY-MM-DD") / onChange(dateStr) shape, so it slots into
// useSewaFieldHandlers.js without touching any handler. Native date
// inputs can't grey out individual days (the browser owns that UI), which
// is the whole reason this exists instead of just adding a `disabled`
// list of dates to an <input type="date">.
export default function DatePicker({ value, onChange, min, bookedRanges = [], disabled = false }) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => {
    const base = value || min || toStr(new Date().getFullYear(), new Date().getMonth(), 1);
    const [y, m] = base.split("-").map(Number);
    return { y, m: m - 1 };
  });
  const rootRef = useRef(null);

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

  function changeMonth(delta) {
    setViewDate(({ y, m }) => {
      const d = new Date(y, m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  }

  function pick(dateStr) {
    onChange(dateStr);
    setOpen(false);
  }

  const { y, m } = viewDate;
  const firstWeekday = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const cells = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  const todayStr = toStr(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        className="w-full px-0 py-2.5 bg-transparent border-0 border-b border-paper/40 text-paper font-body outline-none transition-colors focus:border-paper disabled:opacity-40 flex items-center justify-between gap-2 text-left"
      >
        <span className={value ? "" : "text-paper/50"}>
          {value ? formatId(value) : "Pilih tanggal..."}
        </span>
        <Calendar className="w-4 h-4 text-paper shrink-0" />
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-72 bg-ivory text-ink border border-ink/15 rounded-lg shadow-soft p-3">
          <div className="flex items-center justify-between mb-2">
            <button type="button" onClick={() => changeMonth(-1)} className="p-1 hover:text-pink" aria-label="Bulan sebelumnya">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-xs font-bold">
              {MONTHS[m]} {y}
            </span>
            <button type="button" onClick={() => changeMonth(1)} className="p-1 hover:text-pink" aria-label="Bulan berikutnya">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-1">
            {WEEKDAYS.map((w) => (
              <div key={w} className="text-center font-mono text-[10px] text-ink/50">
                {w}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              if (day === null) return <div key={`blank-${i}`} />;
              const dateStr = toStr(y, m, day);
              const blocked = (min && dateStr < min) || isBooked(dateStr, bookedRanges);
              const selected = dateStr === value;
              const isToday = dateStr === todayStr;
              return (
                <button
                  key={dateStr}
                  type="button"
                  disabled={blocked}
                  onClick={() => pick(dateStr)}
                  title={blocked && isBooked(dateStr, bookedRanges) ? "Sudah dibooking" : undefined}
                  className={`aspect-square rounded-md font-mono text-xs flex items-center justify-center transition-colors ${
                    blocked
                      ? "text-ink/25 line-through cursor-not-allowed"
                      : selected
                        ? "bg-pink text-ink font-bold"
                        : isToday
                          ? "border border-pink/50 hover:bg-pink/15"
                          : "hover:bg-pink/15"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
