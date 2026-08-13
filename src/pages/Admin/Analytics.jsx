import Loading from "../../components/Loading";
import { formatRupiah } from "../../lib/hpp";
import { SummaryCard } from "./shared";
import AnalyticsChart from "./AnalyticsChart";
import AnalyticsBreakdowns from "./AnalyticsBreakdowns";
import useAnalytics from "./useAnalytics";

export default function Analytics() {
  const { loading, error, rows, revenueRows, summary, avgMarginPct, utilizationPct } = useAnalytics();

  if (loading) {
    return (
      <div className="py-10">
        <Loading label="Memuat analytics..." />
      </div>
    );
  }

  if (error) {
    return <p className="font-mono text-xs bg-pink/15 border border-pink/40 rounded-lg inline-block px-4 py-3">{error}</p>;
  }

  return (
    <div>
      {/* 2 cols on mobile instead of stacking 5 full-width cards tall —
          grid-cols-1 would work but leaves the phone screen mostly card,
          barely any chart visible without scrolling. */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4 md:mb-6">
        <SummaryCard label="Total Revenue" value={formatRupiah(summary.revenue)} />
        <SummaryCard label="Total HPP" value={formatRupiah(summary.hpp)} />
        <SummaryCard label="Total Keuntungan" value={formatRupiah(summary.keuntungan)} accent />
        <SummaryCard label="Rata-rata Margin" value={`${avgMarginPct}%`} />
        {/* col-span-2 on mobile — 5 cards in a 2-col grid strands this
            one alone in its own half-width row; full-width here reads as
            a clean closing row instead. */}
        <div className="col-span-2 sm:col-span-1">
          <SummaryCard label="Utilization Bulan Ini" value={`${utilizationPct}%`} />
        </div>
      </div>

      <AnalyticsChart rows={revenueRows} />
      <AnalyticsBreakdowns rows={rows} revenueRows={revenueRows} />
    </div>
  );
}
