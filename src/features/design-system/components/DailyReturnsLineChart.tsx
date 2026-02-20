"use client";

import {
  UnifiedPortfolioTrendChart,
  type UnifiedTrendLine,
} from "./UnifiedPortfolioTrendChart";

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
  comparisonLines?: readonly ComparisonLine[];
}>;

const EMPTY_COMPARISON_LINES: readonly ComparisonLine[] = [];

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
  comparisonLines = EMPTY_COMPARISON_LINES,
}: Props) {
  const chartData = data.map((entry) => ({
    label: entry.label,
    primary: entry.value,
    lines: entry.comparisons,
  }));
  const activeComparisonLines: readonly UnifiedTrendLine[] = comparisonLines.filter((line) =>
    data.some((entry) => {
      const value = entry.comparisons?.[line.id];
      return typeof value === "number" && Number.isFinite(value);
    })
  );

  return (
    <div className="h-full min-h-0">
      <UnifiedPortfolioTrendChart
        data={chartData}
        variant="performance"
        primaryFormatter={formatPercent}
        yAxisFormatter={formatAxisPercent}
        lines={activeComparisonLines}
        tooltipLabelFormatter={formatTooltipDate}
        showLegend
        showPrimaryInLegend
        yTickBuilder={buildYAxisTicks}
      />
    </div>
  );
}
