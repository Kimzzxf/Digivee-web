import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatRupiah, totalBiaya } from "../../lib/hpp";
import { getMeetPoint } from "../../lib/pricelist";
import { STATUS_ORDER, STATUS_LABEL } from "../../lib/status";

const ZONA_COLORS = { 1: "#A3B19B", 2: "#FF8DA1", 3: "#3A4032" };
const STATUS_COLOR = "#FF8DA1";
const TICK_STYLE = {
  fontFamily: "'Cabinet Grotesk', sans-serif",
  fontSize: 10,
  fill: "#3A4032",
  fillOpacity: 0.6,
};

function ZonaTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="edit-frame bg-paper px-3 py-2">
      <p className="font-mono text-[10px] font-bold">{p.name}</p>
      <p className="font-mono text-[10px]" style={{ color: p.payload.fill }}>
        {formatRupiah(p.value)}
      </p>
    </div>
  );
}

function StatusTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="edit-frame bg-paper px-3 py-2">
      <p className="font-mono text-[10px] font-bold">{label}</p>
      <p className="font-mono text-[10px]" style={{ color: STATUS_COLOR }}>
        {payload[0].value} transaksi
      </p>
    </div>
  );
}

export default function AnalyticsBreakdowns({ rows, revenueRows }) {
  const zonaData = useMemo(() => {
    const sums = new Map();
    for (const r of revenueRows) {
      sums.set(r.zona, (sums.get(r.zona) || 0) + totalBiaya(r));
    }
    return [...sums.entries()]
      .filter(([, value]) => value > 0)
      .map(([zona, value]) => ({
        name: getMeetPoint(`zona${zona}`)?.label || `Zona ${zona}`,
        value,
        fill: ZONA_COLORS[zona] || "#A3B19B",
      }));
  }, [revenueRows]);

  const statusData = useMemo(() => {
    const counts = new Map(STATUS_ORDER.map((s) => [s, 0]));
    for (const r of rows) {
      counts.set(r.status, (counts.get(r.status) || 0) + 1);
    }
    return STATUS_ORDER.map((s) => ({
      status: STATUS_LABEL[s],
      count: counts.get(s) || 0,
    }));
  }, [rows]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 md:mb-6">
      <div className="edit-frame bg-paper p-3 md:p-4">
        <span className="font-mono text-xs font-bold block mb-4">
          Revenue per Zona
        </span>
        {zonaData.length === 0 ? (
          <p className="font-mono text-xs opacity-60 py-6 text-center">
            Belum ada data.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={zonaData}
                dataKey="value"
                nameKey="name"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
              >
                {zonaData.map((d) => (
                  <Cell
                    key={d.name}
                    fill={d.fill}
                    stroke="#F4EAE1"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip content={<ZonaTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        )}
        {zonaData.length > 0 && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center mt-2">
            {zonaData.map((d) => (
              <span
                key={d.name}
                className="font-mono text-[10px] opacity-70 flex items-center gap-1.5"
              >
                <span
                  className="w-2 h-2 inline-block"
                  style={{ backgroundColor: d.fill }}
                />
                {d.name}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="edit-frame bg-paper p-3 md:p-4">
        <span className="font-mono text-xs font-bold block mb-4">
          Status Transaksi
        </span>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={statusData}
            layout="vertical"
            margin={{ top: 0, right: 12, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              stroke="#3A4032"
              strokeOpacity={0.08}
              horizontal={false}
            />
            <XAxis
              type="number"
              allowDecimals={false}
              tick={TICK_STYLE}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="status"
              tick={TICK_STYLE}
              axisLine={false}
              tickLine={false}
              width={70}
            />
            <Tooltip
              content={<StatusTooltip />}
              cursor={{ fill: "#3A4032", fillOpacity: 0.04 }}
            />
            <Bar
              dataKey="count"
              name="Jumlah"
              fill={STATUS_COLOR}
              radius={0}
              maxBarSize={18}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
