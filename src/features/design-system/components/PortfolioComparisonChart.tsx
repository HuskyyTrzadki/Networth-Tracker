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
} from "@/lib/recharts-dynamic";

import { buildPaddedDomain } from "../lib/chart-domain";
import {
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
const axisValueFormatter = (value: number) =>
  new Intl.NumberFormat("pl-PL", {
    maximumFractionDigits: 0,
  }).format(value);
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
    <div className="space-y-2 rounded-md border border-border/80 bg-popover p-3 text-[12px] text-popover-foreground shadow-[var(--shadow)]">
      <div className="text-muted-foreground/90">
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
  const timeAxisConfig = createSharedTimeAxisConfig(
    chartData.map((entry) => entry.label)
  );
  const xTicks = timeAxisConfig.ticks ? [...timeAxisConfig.ticks] : undefined;
  const yDomain = buildPaddedDomain(
    chartData.flatMap((entry) => [entry.portfolioValue, entry.investedCapital]),
    {
      paddingRatio: 0.12,
      minAbsolutePadding: 1,
      includeZero: true,
    }
  );
  const yAxisDomain = yDomain
    ? ([yDomain[0], yDomain[1]] as [number, number])
    : (["auto", "auto"] as [string, string]);

  return (
    <div className="min-w-0 w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <LineChart
          data={chartData}
          margin={SHARED_CHART_MARGIN}
        >
          <CartesianGrid {...SHARED_CHART_GRID_PROPS} />
          <XAxis
            dataKey="label"
            tickFormatter={(value: string | number) =>
              timeAxisConfig.tickFormatter(String(value))
            }
            ticks={xTicks}
            tick={SHARED_CHART_AXIS_TICK}
            interval={timeAxisConfig.interval}
            minTickGap={timeAxisConfig.minTickGap}
            axisLine={SHARED_CHART_AXIS_LINE}
            tickLine={SHARED_CHART_TICK_LINE}
          />
          <YAxis
            domain={yAxisDomain}
            tickFormatter={axisValueFormatter}
            tick={SHARED_CHART_AXIS_TICK}
            axisLine={SHARED_CHART_AXIS_LINE}
            tickLine={SHARED_CHART_TICK_LINE}
            width={SHARED_CHART_AXIS_WIDTH}
          />
          <ReferenceLine
            y={0}
            stroke="var(--foreground)"
            strokeOpacity={0.35}
            strokeWidth={1.25}
            strokeDasharray="4 3"
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
            strokeWidth={SHARED_CHART_PRIMARY_LINE_WIDTH}
            dot={false}
            connectNulls={false}
          />
          {hasInvestedCapital ? (
            <Line
              type="stepAfter"
              dataKey="investedCapital"
              stroke="var(--chart-1)"
              strokeWidth={SHARED_CHART_SECONDARY_LINE_WIDTH}
              dot={false}
              connectNulls={false}
            />
          ) : null}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
