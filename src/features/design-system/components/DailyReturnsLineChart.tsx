"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { buildPaddedDomain } from "../lib/chart-domain";
import {
  SHARED_CHART_ACTIVE_DOT_RADIUS,
  createSharedTimeAxisConfig,
  SHARED_CHART_AXIS_LINE,
  SHARED_CHART_AXIS_TICK,
  SHARED_CHART_AXIS_WIDTH,
  SHARED_CHART_GRID_PROPS,
  SHARED_CHART_MARGIN,
  SHARED_CHART_PRIMARY_LINE_WIDTH,
  SHARED_CHART_SECONDARY_LINE_WIDTH,
  SHARED_CHART_TICK_LINE,
} from "./chart-styles";

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

const formatTooltipDate = (value: string) =>
  new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));

const formatAxisPercent = (value: number) =>
  new Intl.NumberFormat("pl-PL", {
    style: "percent",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    signDisplay: "exceptZero",
  }).format(value);

const buildYAxisTicks = (domain: readonly [number, number] | null) => {
  if (!domain) return undefined;

  const [min, max] = domain;
  if (!(Number.isFinite(min) && Number.isFinite(max))) return undefined;
  if (min >= 0 || max <= 0) return undefined;

  const segments = 4;
  const step = (max - min) / segments;
  if (!Number.isFinite(step) || step <= 0) return undefined;

  const ticks = Array.from({ length: segments + 1 }, (_, index) => min + step * index);
  ticks.push(0);

  const uniqueTicks = Array.from(new Set(ticks.map((tick) => tick.toFixed(8))))
    .map(Number)
    .sort((a, b) => a - b);

  return uniqueTicks;
};

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
      includeZero: true,
    }
  );
  const yTicks = buildYAxisTicks(yDomain);
  const timeAxisConfig = createSharedTimeAxisConfig(
    chartData.map((entry) => entry.label)
  );
  const legendItems = [
    ...activeComparisonLines.map((line) => ({
      id: line.id,
      label: line.label,
      color: line.color,
    })),
    { id: "value", label: "Zwrot skumulowany", color: "var(--chart-1)" },
  ];

  return (
    <div className="min-w-0 w-full space-y-3">
      {activeComparisonLines.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 text-[12px] text-muted-foreground">
          {legendItems.map((item) => (
            <div
              key={item.id}
              className="inline-flex items-center gap-2 rounded-md border border-border/70 bg-background px-2.5 py-1"
            >
              <span
                className="h-2.5 w-2.5 rounded-full ring-1 ring-background"
                style={{ backgroundColor: item.color }}
                aria-hidden="true"
              />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      ) : null}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <LineChart
            data={chartData}
            margin={SHARED_CHART_MARGIN}
          >
            <CartesianGrid {...SHARED_CHART_GRID_PROPS} />
            <XAxis
              dataKey="label"
              tickFormatter={(value) => timeAxisConfig.tickFormatter(String(value))}
              ticks={timeAxisConfig.ticks}
              tick={SHARED_CHART_AXIS_TICK}
              interval={timeAxisConfig.interval}
              minTickGap={timeAxisConfig.minTickGap}
              axisLine={SHARED_CHART_AXIS_LINE}
              tickLine={SHARED_CHART_TICK_LINE}
            />
            <YAxis
              domain={yDomain ?? ["auto", "auto"]}
              ticks={yTicks}
              tickFormatter={formatAxisPercent}
              tick={SHARED_CHART_AXIS_TICK}
              axisLine={SHARED_CHART_AXIS_LINE}
              tickLine={SHARED_CHART_TICK_LINE}
              width={SHARED_CHART_AXIS_WIDTH}
            />
            <ReferenceLine
              y={0}
              stroke="var(--foreground)"
              strokeOpacity={0.45}
              strokeWidth={1.5}
              strokeDasharray="4 3"
            />
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
              strokeWidth={SHARED_CHART_PRIMARY_LINE_WIDTH}
              dot={false}
              activeDot={{ r: SHARED_CHART_ACTIVE_DOT_RADIUS, fill: "var(--chart-1)" }}
            />
            {activeComparisonLines.map((line) => (
              <Line
                key={line.id}
                type={line.strokeStyle ?? "monotone"}
                dataKey={(entry) => entry.comparisons?.[line.id] ?? null}
                name={line.id}
                stroke={line.color}
                strokeWidth={SHARED_CHART_SECONDARY_LINE_WIDTH}
                dot={false}
                activeDot={{ r: SHARED_CHART_ACTIVE_DOT_RADIUS, fill: line.color }}
                connectNulls={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
