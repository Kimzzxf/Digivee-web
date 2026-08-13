import { useState, useEffect, useCallback } from "react";
import { api } from "../../lib/api";
import { summarizeRevenue, monthlyUtilization } from "../../lib/hpp";

// Own fetch of the same /admin/transactions list Laporan uses — tabs
// render one at a time (see Admin/index.jsx), so there's no shared cache
// to hook into, this just mirrors useLaporan's own fetch. Deliberately
// unfiltered by zona/status: this tab is the bird's-eye total, slicing by
// zona/status is what the Laporan tab is for.
export default function useAnalytics() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get("/admin/transactions", { admin: true });
      setRows(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const { revenueRows, summary, avgMarginPct } = summarizeRevenue(rows);
  const { utilizationPct } = monthlyUtilization(rows);
  // `rows` (unfiltered, Pending/Cancelled included) exposed too — the
  // status breakdown chart needs the full funnel, not just revenue-eligible
  // rows.
  return { loading, error, rows, revenueRows, summary, avgMarginPct, utilizationPct };
}
