"use client";

import {
  Line,
  LineChart,
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
  benchmarkValue?: number | null;
}>;

type Props = Readonly<{
  data: readonly Point[];
  height?: number;
  benchmarkLabel?: string;
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
  benchmarkLabel = "Benchmark",
}: Props) {
  const chartData = [...data];
  const yDomain = buildPaddedDomain(
    chartData.flatMap((entry) => [entry.value, entry.benchmarkValue]),
    {
      paddingRatio: 0.15,
      minAbsolutePadding: 0.0025,
    }
  );
  const hasBenchmark = chartData.some(
    (entry) =>
      typeof entry.benchmarkValue === "number" &&
      Number.isFinite(entry.benchmarkValue)
  );
  const count = chartData.length;
  const shouldShowTicks = count <= 16;
  const tick = shouldShowTicks
    ? { fill: "var(--muted-foreground)", fillOpacity: 0.85, fontSize: 11 }
    : false;
  const interval = shouldShowTicks ? 0 : Math.ceil(count / 8);

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer>
        <LineChart
          data={chartData}
          margin={{ top: 12, right: 8, bottom: 0, left: 8 }}
        >
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
              name === "benchmarkValue" ? benchmarkLabel : "Zwrot skumulowany",
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
          {hasBenchmark ? (
            <Line
              type="stepAfter"
              dataKey="benchmarkValue"
              stroke="var(--chart-3)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3, fill: "var(--chart-3)" }}
              connectNulls={false}
            />
          ) : null}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
