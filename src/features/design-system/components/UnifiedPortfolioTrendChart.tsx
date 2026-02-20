"use client";

import { useId, type ReactNode } from "react";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "@/lib/recharts-dynamic";

import { buildPaddedDomain } from "../lib/chart-domain";
import {
  SHARED_CHART_ACTIVE_DOT_RADIUS,
  createSharedTimeAxisConfig,
  SHARED_CHART_AXIS_LINE,
  SHARED_CHART_AXIS_TICK,
  SHARED_CHART_AXIS_WIDTH,
  SHARED_CHART_GRID_PROPS,
  SHARED_CHART_MARGIN,
  SHARED_CHART_SECONDARY_LINE_WIDTH,
  SHARED_CHART_TICK_LINE,
} from "./chart-styles";

export type UnifiedTrendLine = Readonly<{
  id: string;
  label: string;
  color: string;
  strokeStyle?: "monotone" | "stepAfter";
}>;

export type UnifiedTrendPoint = Readonly<{
  label: string;
  primary: number | null;
  lines?: Readonly<Record<string, number | null | undefined>>;
}>;

type Variant = "value" | "performance";

type Props = Readonly<{
  data: readonly UnifiedTrendPoint[];
  variant?: Variant;
  primaryFormatter: (value: number) => string;
  yAxisFormatter: (value: number) => string;
  lines?: readonly UnifiedTrendLine[];
  tooltipLabelFormatter?: (label: string) => string;
  renderTooltip?: (args: Readonly<{
    point: UnifiedTrendPoint;
    label: string | null;
    primaryColor: string;
  }>) => ReactNode;
  showLegend?: boolean;
  showPrimaryInLegend?: boolean;
  yTickBuilder?: (domain: readonly [number, number] | null) => readonly number[] | undefined;
}>;

const EMPTY_LINES: readonly UnifiedTrendLine[] = [];
const defaultTooltipLabelFormatter = (label: string) => label;

const VARIANT_CONFIG = {
  value: {
    primaryLabel: "Wartość portfela",
    yPaddingRatio: 0.12,
    minAbsolutePadding: 1,
    referenceLineOpacity: 0.35,
    referenceLineWidth: 1.25,
  },
  performance: {
    primaryLabel: "Zwrot skumulowany",
    yPaddingRatio: 0.15,
    minAbsolutePadding: 0.0025,
    referenceLineOpacity: 0.45,
    referenceLineWidth: 1.5,
  },
} as const;

const PRIMARY_COLOR = "var(--chart-1)";
const NEGATIVE_PRIMARY_COLOR = "var(--loss)";
const PRIMARY_STROKE_WIDTH = 3;

type TrendTooltipShellProps = Readonly<{
  label: string | null;
  children: ReactNode;
}>;

export function TrendTooltipShell({ label, children }: TrendTooltipShellProps) {
  return (
    <div className="space-y-2 rounded-md border border-border/80 bg-popover p-3 text-[12px] text-popover-foreground shadow-[var(--shadow)]">
      <div className="text-muted-foreground/90">{label ?? "—"}</div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

type TrendTooltipRowProps = Readonly<{
  label: string;
  value: string;
  color?: string;
  bordered?: boolean;
}>;

export function TrendTooltipRow({
  label,
  value,
  color,
  bordered = false,
}: TrendTooltipRowProps) {
  return (
    <div
      className={
        bordered
          ? "flex items-center justify-between gap-4 border-t border-border pt-1"
          : "flex items-center justify-between gap-4"
      }
    >
      <div className="flex items-center gap-2">
        {color ? (
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: color }}
            aria-hidden="true"
          />
        ) : null}
        <span>{label}</span>
      </div>
      <span className="font-mono tabular-nums">{value}</span>
    </div>
  );
}

export function UnifiedPortfolioTrendChart({
  data,
  variant = "value",
  primaryFormatter,
  yAxisFormatter,
  lines = EMPTY_LINES,
  tooltipLabelFormatter = defaultTooltipLabelFormatter,
  renderTooltip,
  showLegend = false,
  showPrimaryInLegend = false,
  yTickBuilder,
}: Props) {
  const gradientId = useId().replace(/:/g, "");
  const chartData = [...data];
  const config = VARIANT_CONFIG[variant];
  const activeLines = lines.filter((line) =>
    chartData.some((entry) => {
      const value = entry.lines?.[line.id];
      return typeof value === "number" && Number.isFinite(value);
    })
  );
  const lastPrimaryValue =
    [...chartData]
      .reverse()
      .find((entry) => typeof entry.primary === "number" && Number.isFinite(entry.primary))
      ?.primary ?? null;
  const resolvedPrimaryColor =
    typeof lastPrimaryValue === "number" && lastPrimaryValue < 0
      ? NEGATIVE_PRIMARY_COLOR
      : PRIMARY_COLOR;
  const yDomain = buildPaddedDomain(
    chartData.flatMap((entry) => [
      entry.primary,
      ...activeLines.map((line) => entry.lines?.[line.id] ?? null),
    ]),
    {
      paddingRatio: config.yPaddingRatio,
      minAbsolutePadding: config.minAbsolutePadding,
      includeZero: true,
    }
  );
  const yTicks = yTickBuilder ? yTickBuilder(yDomain) : undefined;
  const resolvedYTicks = yTicks ? [...yTicks] : undefined;
  const timeAxisConfig = createSharedTimeAxisConfig(
    chartData.map((entry) => entry.label)
  );
  const xTicks = timeAxisConfig.ticks ? [...timeAxisConfig.ticks] : undefined;
  const yAxisDomain = yDomain
    ? ([yDomain[0], yDomain[1]] as [number, number])
    : (["auto", "auto"] as [string, string]);
  const legendItems = [
    ...(showPrimaryInLegend
      ? [{ id: "primary", label: config.primaryLabel, color: resolvedPrimaryColor }]
      : []),
    ...activeLines.map((line) => ({
      id: line.id,
      label: line.label,
      color: line.color,
    })),
  ];

  return (
    <div className="min-w-0 w-full h-full min-h-0">
      <div className="flex h-full min-h-0 flex-col gap-3">
        {showLegend && activeLines.length > 0 ? (
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

        <div className="min-h-0 flex-1">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <AreaChart data={chartData} margin={SHARED_CHART_MARGIN}>
              <defs>
                <linearGradient id={`trend-fill-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={resolvedPrimaryColor} stopOpacity={0.24} />
                  <stop offset="72%" stopColor={resolvedPrimaryColor} stopOpacity={0.07} />
                  <stop offset="100%" stopColor={resolvedPrimaryColor} stopOpacity={0} />
                </linearGradient>
              </defs>
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
                ticks={resolvedYTicks}
                tickFormatter={yAxisFormatter}
                tick={SHARED_CHART_AXIS_TICK}
                axisLine={SHARED_CHART_AXIS_LINE}
                tickLine={SHARED_CHART_TICK_LINE}
                width={SHARED_CHART_AXIS_WIDTH}
              />
              <ReferenceLine
                y={0}
                stroke="var(--foreground)"
                strokeOpacity={config.referenceLineOpacity}
                strokeWidth={config.referenceLineWidth}
                strokeDasharray="4 3"
              />
              <Tooltip
                cursor={{ stroke: "var(--ring)" }}
                content={({ active, payload, label }) => {
                  if (!active || !payload || payload.length === 0) return null;

                  const point = payload[0]?.payload as UnifiedTrendPoint | undefined;
                  if (!point) return null;
                  const formattedLabel = label
                    ? tooltipLabelFormatter(String(label))
                    : null;

                  if (renderTooltip) {
                    return renderTooltip({
                      point,
                      label: formattedLabel,
                      primaryColor: resolvedPrimaryColor,
                    });
                  }

                  return (
                    <TrendTooltipShell label={formattedLabel}>
                      <TrendTooltipRow
                        label={config.primaryLabel}
                        value={
                          point.primary !== null ? primaryFormatter(point.primary) : "—"
                        }
                        color={resolvedPrimaryColor}
                      />
                      {activeLines.map((line) => (
                        <TrendTooltipRow
                          key={line.id}
                          label={line.label}
                          value={
                            typeof point.lines?.[line.id] === "number"
                              ? primaryFormatter(point.lines[line.id] as number)
                              : "—"
                          }
                          color={line.color}
                        />
                      ))}
                    </TrendTooltipShell>
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey="primary"
                stroke={resolvedPrimaryColor}
                strokeWidth={PRIMARY_STROKE_WIDTH}
                fill={`url(#trend-fill-${gradientId})`}
                fillOpacity={1}
                dot={false}
                activeDot={{ r: SHARED_CHART_ACTIVE_DOT_RADIUS, fill: resolvedPrimaryColor }}
                connectNulls={false}
              />
              {activeLines.map((line) => (
                <Line
                  key={line.id}
                  type={line.strokeStyle ?? "monotone"}
                  dataKey={(entry: UnifiedTrendPoint) => entry.lines?.[line.id] ?? null}
                  name={line.id}
                  stroke={line.color}
                  strokeWidth={SHARED_CHART_SECONDARY_LINE_WIDTH}
                  dot={false}
                  activeDot={{ r: SHARED_CHART_ACTIVE_DOT_RADIUS, fill: line.color }}
                  connectNulls={false}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
