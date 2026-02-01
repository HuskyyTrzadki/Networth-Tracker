"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

export type DonutSlice = Readonly<{
  id: string;
  value: number;
  color: string;
  tooltipLabel?: string;
  tooltipValue?: string;
}>;

type Props = Readonly<{
  data: readonly DonutSlice[];
  height?: number;
}>;

export function AllocationDonutChart({ data, height = 240 }: Props) {
  const chartData = [...data];

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="id"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            isAnimationActive
            animationDuration={650}
            animationEasing="ease-out"
          >
            {chartData.map((slice) => (
              <Cell key={slice.id} fill={slice.color} stroke="var(--card)" />
            ))}
          </Pie>
          <Tooltip
            wrapperStyle={{ zIndex: 50 }}
            offset={16}
            content={({ active, payload }) => {
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
                  className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-sm"
                  style={{ transform: "translate(12px, -12px)" }}
                >
                  <div className="font-medium text-foreground">{label}</div>
                  <div className="mt-1 font-mono text-xs tabular-nums text-muted-foreground">
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
