"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { buildPaddedDomain } from "../lib/chart-domain";

type Point = Readonly<{
  label: string;
  value: number;
  comparisons?: Readonly<Record<string, number | null | undefined>>;
}>;

type ComparisonLine = Readonly<{
  id: string;
  label: string;
  color: string;
  strokeStyle?: "monotone" | "stepAfter";
}>;

type Props = Readonly<{
  data: readonly Point[];
  height?: number;
  comparisonLines?: readonly ComparisonLine[];
}>;

const formatPercent = (value: number) =>
  new Intl.NumberFormat("pl-PL", {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    signDisplay: "exceptZero",
  }).format(value);

const formatXAxisDate = (value: string) =>
  new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "short",
  }).format(new Date(value));

const formatTooltipDate = (value: string) =>
  new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));

export function DailyReturnsLineChart({
  data,
  height = 140,
  comparisonLines = [],
}: Props) {
  const chartData = [...data];
  const activeComparisonLines = comparisonLines.filter((line) =>
    chartData.some((entry) => {
      const value = entry.comparisons?.[line.id];
      return typeof value === "number" && Number.isFinite(value);
    })
  );
  const yDomain = buildPaddedDomain(
    chartData.flatMap((entry) => [
      entry.value,
      ...activeComparisonLines.map((line) => entry.comparisons?.[line.id] ?? null),
    ]),
    {
      paddingRatio: 0.15,
      minAbsolutePadding: 0.0025,
    }
  );
  const count = chartData.length;
  const shouldShowTicks = count <= 16;
  const tick = shouldShowTicks
    ? { fill: "var(--muted-foreground)", fillOpacity: 0.85, fontSize: 11 }
    : false;
  const interval = shouldShowTicks ? 0 : Math.ceil(count / 8);

  return (
    <div className="min-w-0 w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <LineChart
          data={chartData}
          margin={{ top: 12, right: 8, bottom: 0, left: 8 }}
        >
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            tickFormatter={(value) => formatXAxisDate(String(value))}
            tick={tick}
            interval={interval}
            axisLine={false}
            tickLine={false}
          />
          <YAxis hide domain={yDomain ?? ["auto", "auto"]} />
          <ReferenceLine y={0} stroke="var(--border)" strokeDasharray="3 3" />
          <Tooltip
            cursor={{ stroke: "var(--ring)" }}
            labelFormatter={(value) => formatTooltipDate(String(value))}
            formatter={(value, name) => [
              formatPercent(Number(value)),
              name === "value"
                ? "Zwrot skumulowany"
                : activeComparisonLines.find((line) => line.id === name)?.label ?? String(name),
            ]}
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              boxShadow: "var(--shadow)",
              color: "var(--popover-foreground)",
            }}
            labelStyle={{ color: "var(--muted-foreground)" }}
            itemStyle={{ color: "var(--popover-foreground)" }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="var(--chart-1)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 3, fill: "var(--chart-1)" }}
          />
          {activeComparisonLines.map((line) => (
            <Line
              key={line.id}
              type={line.strokeStyle ?? "monotone"}
              dataKey={(entry) => entry.comparisons?.[line.id] ?? null}
              name={line.id}
              stroke={line.color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3, fill: line.color }}
              connectNulls={false}
            />
          ))}
          {activeComparisonLines.length > 0 ? (
            <Legend
              verticalAlign="top"
              align="left"
              wrapperStyle={{ fontSize: 11, color: "var(--muted-foreground)" }}
              formatter={(value) =>
                value === "value"
                  ? "Zwrot skumulowany"
                  : (activeComparisonLines.find((line) => line.id === value)?.label ?? value)
              }
            />
          ) : null}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
