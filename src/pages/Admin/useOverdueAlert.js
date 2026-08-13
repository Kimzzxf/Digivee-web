import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { combineDateTime } from "../../lib/time";

// Same overdue math ReturnCountdown does per-row, just checked here across
// ALL transactions (not just whatever page/filter Laporan happens to be
// showing) so admin sees it from any tab, not only after digging into
// Laporan. Polls every minute — an overdue rental doesn't need
// per-second precision, that's what ReturnCountdown's live ticker is for.
export function useOverdueAlert(enabled) {
  const [overdue, setOverdue] = useState([]);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    async function check() {
      try {
        const rows = await api.get("/admin/transactions", { admin: true });
        if (cancelled) return;
        const now = Date.now();
        setOverdue(
          (rows || []).filter((r) => {
            if (r.status !== "Ongoing") return false;
            const target = combineDateTime(r.tanggal_kembali, r.jam_kembali);
            return target && target.getTime() < now;
          })
        );
      } catch {
        // fail-silent, same as useBookedDates — a flaky poll just means
        // the banner stays at its last-known state instead of erroring
      }
    }

    check();
    const id = setInterval(check, 60000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [enabled]);

  return overdue;
}
