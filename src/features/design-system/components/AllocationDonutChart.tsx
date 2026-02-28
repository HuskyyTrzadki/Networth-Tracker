"use client";

import { useId } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "@/lib/recharts-dynamic";
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/features/design-system/components/ui/chart";

export type DonutSlice = Readonly<{
  id: string;
  label?: string;
  value: number;
  color: string;
  patternId?: "solid" | "hatch" | "dots" | "cross" | "grid";
  tooltipLabel?: string;
  tooltipValue?: string;
}>;

type Props = Readonly<{
  data: readonly DonutSlice[];
  height?: number;
  innerRadius?: number | string;
  outerRadius?: number | string;
  showSliceLabels?: boolean;
}>;

const sanitizeSvgIdToken = (value: string) =>
  value
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

const donutLabelPercentFormatter = new Intl.NumberFormat("pl-PL", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const MIN_LABEL_SHARE = 0.045;
const MAX_DONUT_LABEL_LENGTH = 18;

const formatDonutLabelName = (value: unknown) => {
  const raw = typeof value === "string" ? value.trim() : String(value ?? "").trim();
  if (raw.length <= MAX_DONUT_LABEL_LENGTH) return raw;
  return `${raw.slice(0, MAX_DONUT_LABEL_LENGTH - 1)}…`;
};

const buildDonutLabel = (name: unknown, percent: unknown) => {
  if (typeof percent !== "number" || percent < MIN_LABEL_SHARE) return "";
  return `${formatDonutLabelName(name)}\n${donutLabelPercentFormatter.format(percent)}`;
};

export function AllocationDonutChart({
  data,
  height = 240,
  innerRadius = "62%",
  outerRadius = "88%",
  showSliceLabels = true,
}: Props) {
  const chartId = useId().replace(/:/g, "");
  const chartData = data.map((slice) => ({
    ...slice,
    label: slice.label ?? slice.id,
  }));
  const chartConfig = chartData.reduce<ChartConfig>((acc, slice) => {
    acc[slice.id] = {
      label: slice.label,
      color: slice.color,
    };
    return acc;
  }, {});

  return (
    <div className="w-full" style={{ height }}>
      <ChartContainer config={chartConfig} className="h-full w-full">
        <ResponsiveContainer>
          <PieChart>
            <defs>
              {chartData.map((slice, index) => {
                if (!slice.patternId || slice.patternId === "solid") return null;
                const idToken = sanitizeSvgIdToken(slice.id) || `slice-${index}`;
                const patternKey = `${chartId}-${idToken}-${index}`;
                return (
                  <pattern
                    key={patternKey}
                    id={patternKey}
                    width={12}
                    height={12}
                    patternUnits="userSpaceOnUse"
                  >
                    <rect width="12" height="12" fill={slice.color} />
                    {slice.patternId === "hatch" ? (
                      <path
                        d="M-3,3 l6,-6 M0,12 l12,-12 M9,15 l6,-6"
                        stroke="var(--foreground)"
                        strokeOpacity="0.3"
                        strokeWidth="1.2"
                      />
                    ) : null}
                    {slice.patternId === "dots" ? (
                      <>
                        <circle cx="3" cy="3" r="1.1" fill="var(--foreground)" fillOpacity="0.24" />
                        <circle cx="9" cy="9" r="1.1" fill="var(--foreground)" fillOpacity="0.24" />
                      </>
                    ) : null}
                    {slice.patternId === "cross" ? (
                      <>
                        <path d="M0 6h12" stroke="var(--foreground)" strokeOpacity="0.26" strokeWidth="1" />
                        <path d="M6 0v12" stroke="var(--foreground)" strokeOpacity="0.26" strokeWidth="1" />
                      </>
                    ) : null}
                    {slice.patternId === "grid" ? (
                      <>
                        <path d="M0 4h12 M0 8h12" stroke="var(--foreground)" strokeOpacity="0.18" strokeWidth="1" />
                        <path d="M4 0v12 M8 0v12" stroke="var(--foreground)" strokeOpacity="0.18" strokeWidth="1" />
                      </>
                    ) : null}
                  </pattern>
                );
              })}
            </defs>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="label"
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              paddingAngle={2}
              labelLine={showSliceLabels}
              label={
                showSliceLabels
                  ? ({ name, percent }) => buildDonutLabel(name, percent)
                  : false
              }
              isAnimationActive
              animationDuration={600}
              animationEasing="ease-out"
            >
              {chartData.map((slice, index) => {
                const idToken = sanitizeSvgIdToken(slice.id) || `slice-${index}`;
                const patternKey = `${chartId}-${idToken}-${index}`;
                return (
                  <Cell
                    key={slice.id}
                    fill={
                      slice.patternId && slice.patternId !== "solid"
                        ? `url(#${patternKey})`
                        : slice.color
                    }
                    stroke="var(--card)"
                  />
                );
              })}
            </Pie>
            <ChartTooltip
              wrapperStyle={{ zIndex: 50 }}
              offset={16}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const entry = payload[0];
                const dataPoint = entry.payload as DonutSlice | undefined;
                if (!dataPoint) return null;
                const label = dataPoint.tooltipLabel ?? dataPoint.id;
                const value =
                  dataPoint.tooltipValue ??
                  new Intl.NumberFormat("pl-PL", {
                    maximumFractionDigits: 2,
                  }).format(Number(entry.value));

                return (
                  <div
                    className="rounded-md border border-dashed border-border/70 bg-popover px-3 py-2 text-[12px] shadow-[var(--surface-shadow)]"
                    style={{ transform: "translate(12px, -12px)" }}
                  >
                    <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-foreground">
                      {label}
                    </div>
                    <div className="mt-1 font-mono text-[12px] tabular-nums text-muted-foreground">
                      {value}
                    </div>
                  </div>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}
