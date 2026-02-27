"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "@/lib/recharts-dynamic";
import { TrendTooltipRow, TrendTooltipShell } from "./chart-tooltip";

type Point = Readonly<{
  label: string;
  value: number;
}>;

type Props = Readonly<{
  data: readonly Point[];
  height?: number;
  valueFormatter?: (value: number) => string;
  labelFormatter?: (label: string) => string;
}>;

const defaultValueFormatter = (value: number) =>
  new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 2 }).format(value);

const defaultLabelFormatter = (label: string) => label;

export function PortfolioAreaChart({
  data,
  height = 240,
  valueFormatter = defaultValueFormatter,
  labelFormatter = defaultLabelFormatter,
}: Props) {
  const chartData = [...data];

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer>
        <AreaChart
          data={chartData}
          margin={{ top: 12, right: 8, bottom: 0, left: 0 }}
        >
          <defs>
            <linearGradient id="portfolioFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.14} />
              <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
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
            cursor={{ stroke: "var(--ring)" }}
            content={({ active, label, payload }) => {
              if (!active || !payload || payload.length === 0) {
                return null;
              }

              const rawValue = payload[0]?.value;
              if (typeof rawValue !== "number") {
                return null;
              }

              return (
                <TrendTooltipShell label={labelFormatter(String(label ?? "—"))}>
                  <TrendTooltipRow label="Wartość" value={valueFormatter(rawValue)} />
                </TrendTooltipShell>
              );
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="var(--chart-1)"
            strokeWidth={2.5}
            fill="url(#portfolioFill)"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
