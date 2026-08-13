import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { formatRupiah, totalBiaya, hitungHPP, keuntungan as keuntunganOf } from "../../lib/hpp";

// Brand palette (see tailwind.config.js) — revenue in the accent pink, HPP
// (cost) muted so it reads as "the thing being subtracted", keuntungan as a
// dark line riding on top since it's the number that actually matters.
const COLOR_REVENUE = "#FF8DA1";
const COLOR_HPP = "#A3B19B";
const COLOR_KEUNTUNGAN = "#3A4032";

// Min px per bucket so bars never shrink to unreadable slivers on a phone.
// Bulanan/Tahunan/Custom can each carry many buckets once history piles
// up — instead of squeezing them into the viewport (illegible) or
// truncating to "recent only" (silently hides data), the chart scrolls
// horizontally past this width. Mingguan stays within one month (≤6
// buckets) so it never needs to scroll.
const MIN_BAR_WIDTH = 52;

function pad2(n) {
  return String(n).padStart(2, "0");
}

function currentMonthStr() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
}

// Buckets by `created_at` (always set) rather than `tanggal_sewa` (can be
// null on Pending rows) — every row lands in exactly one bucket.
function bucketKey(dateStr, mode) {
  const d = new Date(dateStr);
  if (mode === "year") return `${d.getFullYear()}`;
  if (mode === "month") return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
  // Day groups by calendar day — same local-getters reasoning as the week
  // bucket below applies here too.
  if (mode === "day") return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  const mondayOffset = (d.getDay() + 6) % 7; // 0 = Monday
  const monday = new Date(d);
  monday.setDate(d.getDate() - mondayOffset);
  // Local getters, not toISOString() — toISOString() goes through UTC, and
  // WIB is UTC+7, so two transactions in the same week could round-trip to
  // different UTC calendar days (e.g. one at 11pm, one at 2am) and get
  // split into two week-buckets instead of summed into one. Same bug class
  // as the calendar fix in sewaHelpers.js, just here it double-counts a
  // week's revenue instead of mis-dating a booking.
  return `${monday.getFullYear()}-${pad2(monday.getMonth() + 1)}-${pad2(monday.getDate())}`;
}

function bucketLabel(key, mode) {
  if (mode === "year") return key;
  if (mode === "month") {
    const [y, m] = key.split("-").map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString("id-ID", { month: "short", year: "2-digit" });
  }
  return new Date(key + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

// "5000000" -> "5jt", "850000" -> "850rb" — compact axis ticks so big
// Rupiah numbers don't force the Y axis wide or overlap each other.
function formatRupiahCompact(n) {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${+(n / 1_000_000).toFixed(1)}jt`;
  if (abs >= 1_000) return `${Math.round(n / 1000)}rb`;
  return String(n);
}

const TICK_STYLE = { fontFamily: "'Cabinet Grotesk', sans-serif", fontSize: 10, fill: "#3A4032", fillOpacity: 0.6 };
const MODE_LABEL = { week: "Mingguan", month: "Bulanan", year: "Tahunan", custom: "Custom" };

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="edit-frame bg-paper px-3 py-2">
      <p className="font-mono text-[10px] font-bold mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="font-mono text-[10px]" style={{ color: p.color }}>
          {p.name}: {formatRupiah(p.value)}
        </p>
      ))}
    </div>
  );
}

// `rows` should already be the same revenue-eligible set the summary cards
// use (Pending excluded) — see useLaporan's `revenueRows` — so the chart
// and the totals above it always agree.
export default function AnalyticsChart({ rows }) {
  const [mode, setMode] = useState("month");
  const [weekMonth, setWeekMonth] = useState(currentMonthStr);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const isCustom = mode === "custom";
  const isWeek = mode === "week";

  // Custom has no bucket size of its own — "ambil keseluruhan" means it
  // shouldn't hide data behind a fixed granularity either, so it picks
  // day/week/month automatically from however wide the selected (or full,
  // if unset) range actually is, same idea as the other three tabs each
  // owning one calendar unit (week/month/year).
  const customGranularity = useMemo(() => {
    if (!isCustom) return null;
    const timestamps = rows.map((r) => r.created_at).filter(Boolean).map((d) => new Date(d).getTime());
    const fromTs = customFrom ? new Date(customFrom).getTime() : Math.min(...timestamps);
    const toTs = customTo ? new Date(customTo).getTime() : Math.max(...timestamps);
    if (!Number.isFinite(fromTs) || !Number.isFinite(toTs)) return "day";
    const spanDays = (toTs - fromTs) / 86_400_000;
    if (spanDays <= 31) return "day";
    if (spanDays <= 180) return "week";
    return "month";
  }, [isCustom, rows, customFrom, customTo]);

  const bucketMode = isCustom ? customGranularity : mode;

  const buckets = useMemo(() => {
    const sums = new Map();
    for (const r of rows) {
      if (!r.created_at) continue;
      // Mingguan is weeks-within-a-month, not "last N weeks" — pick a
      // month first, then break it into weeks.
      if (isWeek && bucketKey(r.created_at, "month") !== weekMonth) continue;
      if (isCustom) {
        const dayKey = bucketKey(r.created_at, "day");
        if ((customFrom && dayKey < customFrom) || (customTo && dayKey > customTo)) continue;
      }
      const key = bucketKey(r.created_at, bucketMode);
      const acc = sums.get(key) || { revenue: 0, hpp: 0, keuntungan: 0 };
      acc.revenue += totalBiaya(r);
      acc.hpp += hitungHPP(r.zona, r.jarak_km);
      acc.keuntungan += keuntunganOf(r);
      sums.set(key, acc);
    }
    // No slice-to-recent-N here on purpose: Bulanan/Tahunan/Custom all
    // show every bucket that has data (previously capped at the last
    // 6 months, which is why "Bulanan" only ever showed the current
    // year once history passed 6 months). Readability on a long history
    // comes from the horizontal-scroll width below instead of hiding data.
    return [...sums.keys()]
      .sort()
      .map((key) => ({ key, label: bucketLabel(key, bucketMode), ...sums.get(key) }));
  }, [rows, isWeek, weekMonth, isCustom, bucketMode, customFrom, customTo]);

  const hasData = buckets.some((b) => b.revenue || b.hpp || b.keuntungan);
  const chartMinWidth = buckets.length * MIN_BAR_WIDTH;

  return (
    <div className="edit-frame bg-paper p-3 mb-4 md:p-4 md:mb-6">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <span className="font-mono text-xs font-bold">Revenue vs HPP vs Keuntungan</span>
        <div className="flex gap-1 flex-wrap">
          {["week", "month", "year", "custom"].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`press-btn px-3 py-1 rounded-full border font-mono text-[10px] font-bold transition-colors ${
                mode === m ? "bg-pink border-pink text-white" : "border-ink/15 text-ink/60 hover:border-ink/30 hover:text-ink"
              }`}
            >
              {MODE_LABEL[m]}
            </button>
          ))}
        </div>
      </div>

      {isWeek && (
        <div className="flex flex-wrap items-center gap-2 mb-4 -mt-2">
          <input
            type="month"
            value={weekMonth}
            max={currentMonthStr()}
            onChange={(e) => setWeekMonth(e.target.value)}
            className="px-2 py-1 rounded-lg border border-ink/15 bg-paper font-mono text-[10px] outline-none focus:border-pink"
          />
        </div>
      )}

      {isCustom && (
        <div className="flex flex-wrap items-center gap-2 mb-4 -mt-2">
          <input
            type="date"
            value={customFrom}
            max={customTo || undefined}
            onChange={(e) => setCustomFrom(e.target.value)}
            className="px-2 py-1 rounded-lg border border-ink/15 bg-paper font-mono text-[10px] outline-none focus:border-pink"
          />
          <span className="font-mono text-[10px] opacity-50">s/d</span>
          <input
            type="date"
            value={customTo}
            min={customFrom || undefined}
            onChange={(e) => setCustomTo(e.target.value)}
            className="px-2 py-1 rounded-lg border border-ink/15 bg-paper font-mono text-[10px] outline-none focus:border-pink"
          />
          <span className="font-mono text-[10px] opacity-40">
            {customFrom || customTo ? "" : "kosong = seluruh data"}
          </span>
        </div>
      )}

      {!hasData ? (
        <p className="font-mono text-xs opacity-60 py-6 text-center">Belum ada data buat periode ini.</p>
      ) : (
        <div className="overflow-x-auto -mx-3 px-3 md:mx-0 md:px-0" data-lenis-prevent>
          {/* data-lenis-prevent — same reasoning as PelangganTable/LaporanTable:
              without it, Lenis's syncTouch swallows the horizontal drag on
              phones (it reads any touch move as page-scroll input), so wider
              charts were unscrollable — full width just never reachable — on
              mobile even though a mouse-wheel/trackpad drag worked fine on
              desktop. */}
          <div style={{ minWidth: chartMinWidth > 0 ? `${chartMinWidth}px` : "100%" }}>
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={buckets} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                <CartesianGrid stroke="#3A4032" strokeOpacity={0.08} vertical={false} />
                <XAxis dataKey="label" tick={TICK_STYLE} axisLine={{ stroke: "#3A4032", strokeOpacity: 0.15 }} tickLine={false} />
                <YAxis
                  tick={TICK_STYLE}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={formatRupiahCompact}
                  width={40}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "#3A4032", fillOpacity: 0.04 }} />
                <Legend wrapperStyle={{ ...TICK_STYLE, fontWeight: 700 }} />
                <Bar dataKey="revenue" name="Revenue" fill={COLOR_REVENUE} radius={0} maxBarSize={28} />
                <Bar dataKey="hpp" name="HPP" fill={COLOR_HPP} radius={0} maxBarSize={28} />
                <Line dataKey="keuntungan" name="Keuntungan" stroke={COLOR_KEUNTUNGAN} strokeWidth={2} dot={{ r: 2 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
