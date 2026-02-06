"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Point = Readonly<{
  label: string;
  portfolioValue: number | null;
  investedCapital: number | null;
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

function ComparisonTooltip({
  active,
  payload,
  label,
  valueFormatter,
  labelFormatter,
}: Readonly<{
  active?: boolean;
  payload?: readonly {
    payload: Point;
  }[];
  label?: string;
  valueFormatter: (value: number) => string;
  labelFormatter: (label: string) => string;
}>) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const point = payload[0]?.payload;
  if (!point) {
    return null;
  }

  const gainLoss =
    point.portfolioValue !== null && point.investedCapital !== null
      ? point.portfolioValue - point.investedCapital
      : null;

  return (
    <div className="space-y-2 rounded-md border border-border bg-popover p-3 text-xs text-popover-foreground shadow-sm">
      <div className="text-muted-foreground">
        {label ? labelFormatter(label) : "—"}
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: "var(--profit)" }}
              aria-hidden="true"
            />
            <span>Wartość portfela</span>
          </div>
          <span className="font-mono tabular-nums">
            {point.portfolioValue !== null
              ? valueFormatter(point.portfolioValue)
              : "—"}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: "var(--chart-1)" }}
              aria-hidden="true"
            />
            <span>Zainwestowany kapitał</span>
          </div>
          <span className="font-mono tabular-nums">
            {point.investedCapital !== null
              ? valueFormatter(point.investedCapital)
              : "—"}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-border pt-1">
          <span>Zysk/strata</span>
          <span className="font-mono tabular-nums">
            {gainLoss !== null ? valueFormatter(gainLoss) : "—"}
          </span>
        </div>
      </div>
    </div>
  );
}

export function PortfolioComparisonChart({
  data,
  height = 240,
  valueFormatter = defaultValueFormatter,
  labelFormatter = defaultLabelFormatter,
}: Props) {
  const chartData = [...data];
  const hasInvestedCapital = chartData.some(
    (entry) => entry.investedCapital !== null
  );

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer>
        <LineChart
          data={chartData}
          margin={{ top: 12, right: 8, bottom: 0, left: 0 }}
        >
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
            content={
              <ComparisonTooltip
                valueFormatter={valueFormatter}
                labelFormatter={labelFormatter}
              />
            }
          />
          <Line
            type="monotone"
            dataKey="portfolioValue"
            stroke="var(--profit)"
            strokeWidth={2.5}
            dot={false}
            connectNulls={false}
          />
          {hasInvestedCapital ? (
            <Line
              type="stepAfter"
              dataKey="investedCapital"
              stroke="var(--chart-1)"
              strokeWidth={2}
              dot={false}
              connectNulls={false}
            />
          ) : null}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
