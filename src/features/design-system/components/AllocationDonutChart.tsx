"use client";

import { useId } from "react";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "@/lib/recharts-dynamic";

export type DonutSlice = Readonly<{
  id: string;
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
}>;

export function AllocationDonutChart({
  data,
  height = 240,
  innerRadius = "62%",
  outerRadius = "88%",
}: Props) {
  const chartId = useId().replace(/:/g, "");
  const chartData = [...data];

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer>
        <PieChart>
          <defs>
            {chartData.map((slice, index) => {
              if (!slice.patternId || slice.patternId === "solid") return null;
              const patternKey = `${chartId}-${slice.id}-${index}`;
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
            nameKey="id"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={2}
            isAnimationActive
            animationDuration={650}
            animationEasing="ease-out"
          >
            {chartData.map((slice, index) => {
              const patternKey = `${chartId}-${slice.id}-${index}`;
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
          <Tooltip
            wrapperStyle={{ zIndex: 50 }}
            offset={16}
            content={({
              active,
              payload,
            }: {
              active?: boolean;
              payload?: Array<{ payload: DonutSlice; value: string | number }>;
            }) => {
              if (!active || !payload?.length) return null;
              const entry = payload[0];
              const dataPoint = entry.payload as DonutSlice;
              const label = dataPoint.tooltipLabel ?? dataPoint.id;
              const value =
                dataPoint.tooltipValue ??
                new Intl.NumberFormat("pl-PL", {
                  maximumFractionDigits: 2,
                }).format(Number(entry.value));

              return (
                <div
                  className="rounded-md border border-border/80 bg-popover px-3 py-2 text-[12px] shadow-[var(--shadow)]"
                  style={{ transform: "translate(12px, -12px)" }}
                >
                  <div className="font-medium text-foreground">{label}</div>
                  <div className="mt-1 font-mono text-[12px] tabular-nums text-muted-foreground">
                    {value}
                  </div>
                </div>
              );
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
