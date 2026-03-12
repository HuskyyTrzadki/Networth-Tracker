"use client";

import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from "@/lib/recharts-dynamic";
import {
  ChartContainer,
  ChartTooltipContent,
  type ChartConfig,
} from "@/features/design-system/components/ui/chart";
import { cn } from "@/lib/cn";

import type {
  InsightChartPoint,
  InsightWidget,
} from "./stock-insights-widget-types";
import {
  formatInsightAxisValue,
  formatInsightValue,
  truncateInsightPeriodLabel,
} from "./stock-insights-widget-view";

export default function InsightWidgetChart({
  widget,
  points,
  expanded,
  reducedMotion,
}: Readonly<{
  widget: InsightWidget;
  points: readonly InsightChartPoint[];
  expanded: boolean;
  reducedMotion: boolean;
}>) {
  const chartHeight = expanded ? 320 : 152;
  const animationDuration = reducedMotion ? 0 : expanded ? 540 : 360;
  const isDenseSeries = points.length > (expanded ? 24 : 12);
  const chartConfig = widget.series.reduce<ChartConfig>((acc, series) => {
    acc[series.key] = {
      label: series.label,
      color: series.color,
    };
    return acc;
  }, {});

  return (
    <div className={cn("w-full", expanded ? "h-[320px]" : "h-[152px]")}>
      <ChartContainer config={chartConfig} className="h-full w-full">
        <ResponsiveContainer width="100%" height={chartHeight}>
          <ComposedChart
            data={[...points]}
            margin={
              expanded
                ? { top: 16, right: 12, bottom: 8, left: 4 }
                : { top: 10, right: 6, bottom: 8, left: 0 }
            }
          >
            <CartesianGrid
              stroke="var(--border)"
              strokeOpacity={0.42}
              strokeDasharray="4 6"
              vertical={false}
            />
            <XAxis
              dataKey="period"
              tickFormatter={truncateInsightPeriodLabel}
              tick={{
                fill: "var(--muted-foreground)",
                fontSize: 10,
              }}
              axisLine={{ stroke: "var(--border)", strokeOpacity: 0.55 }}
              tickLine={false}
              interval={isDenseSeries ? "preserveStartEnd" : 0}
              minTickGap={expanded ? (isDenseSeries ? 28 : 12) : 16}
            />
            <YAxis
              width={expanded ? 62 : 52}
              tickFormatter={(value: string | number) =>
                formatInsightAxisValue(Number(value), widget.valueFormat)
              }
              tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
              axisLine={{ stroke: "var(--border)", strokeOpacity: 0.55 }}
              tickLine={false}
            />
            <ChartTooltip
              cursor={{
                stroke: "var(--report-rule)",
                strokeDasharray: "3 3",
                strokeOpacity: 0.55,
              }}
              content={
                <ChartTooltipContent
                  formatter={(value, name) => {
                    const series = widget.series.find((entry) => entry.label === name);
                    return [
                      formatInsightValue(
                        Number(value),
                        series?.valueFormat ?? widget.valueFormat
                      ),
                      name,
                    ];
                  }}
                  indicator="line"
                />
              }
            />

            {widget.series.map((series) => {
              if (series.layer === "bar") {
                return (
                  <Bar
                    key={series.key}
                    dataKey={series.key}
                    name={series.label}
                    fill={series.color}
                    stackId={series.stackId}
                    barSize={expanded ? 22 : 14}
                    radius={[3, 3, 0, 0]}
                    isAnimationActive={!reducedMotion}
                    animationDuration={animationDuration}
                    animationEasing="ease-out"
                  />
                );
              }

              if (series.layer === "line") {
                return (
                  <Line
                    key={series.key}
                    dataKey={series.key}
                    name={series.label}
                    stroke={series.color}
                    strokeWidth={2.1}
                    dot={false}
                    connectNulls={false}
                    isAnimationActive={!reducedMotion}
                    animationDuration={animationDuration}
                    animationEasing="ease-out"
                  />
                );
              }

              return (
                <Area
                  key={series.key}
                  dataKey={series.key}
                  name={series.label}
                  type="monotone"
                  stroke={series.color}
                  strokeWidth={2.1}
                  fill={series.color}
                  fillOpacity={0.18}
                  isAnimationActive={!reducedMotion}
                  animationDuration={animationDuration}
                  animationEasing="ease-out"
                />
              );
            })}
          </ComposedChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}
