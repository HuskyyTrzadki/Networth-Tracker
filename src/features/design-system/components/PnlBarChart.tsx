"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "@/lib/recharts-dynamic";
import { TrendTooltipRow, TrendTooltipShell } from "./chart-tooltip";

type Point = Readonly<{
  label: string;
  pnl: number;
}>;

type Props = Readonly<{
  data: readonly Point[];
  height?: number;
}>;

export function PnlBarChart({ data, height = 240 }: Props) {
  const chartData = [...data];
  const formatNumber = (value: number) =>
    new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 2 }).format(value);

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer>
        <BarChart
          data={chartData}
          margin={{ top: 12, right: 8, bottom: 0, left: 0 }}
        >
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            tick={{ fill: "var(--muted-foreground)", fillOpacity: 0.85, fontSize: 11 }}
            axisLine={{ stroke: "var(--border)" }}
            tickLine={{ stroke: "var(--border)" }}
          />
          <YAxis
            tick={{ fill: "var(--muted-foreground)", fillOpacity: 0.85, fontSize: 11 }}
            axisLine={{ stroke: "var(--border)" }}
            tickLine={{ stroke: "var(--border)" }}
            width={56}
          />
          <Tooltip
            cursor={{ fill: "var(--muted)" }}
            content={({ active, label, payload }) => {
              if (!active || !payload || payload.length === 0) {
                return null;
              }

              const value = payload[0]?.value;
              if (typeof value !== "number") {
                return null;
              }

              return (
                <TrendTooltipShell label={String(label ?? "—")}>
                  <TrendTooltipRow label="P&L" value={formatNumber(value)} />
                </TrendTooltipShell>
              );
            }}
          />
          <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
            {chartData.map((entry) => (
              <Cell
                key={entry.label}
                fill={entry.pnl >= 0 ? "var(--profit)" : "var(--loss)"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
