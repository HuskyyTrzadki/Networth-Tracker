"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "@/lib/recharts-dynamic";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/features/design-system/components/ui/chart";

type Point = Readonly<{
  label: string;
  pnl: number;
}>;

type Props = Readonly<{
  data: readonly Point[];
  height?: number;
}>;

export function PnlBarChart({ data, height = 240 }: Props) {
  const chartData = [...data];
  const formatNumber = (value: number) =>
    new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 2 }).format(value);
  const chartConfig = {
    pnl: {
      label: "P&L",
      color: "var(--chart-1)",
    },
  } satisfies ChartConfig;

  return (
    <div className="w-full" style={{ height }}>
      <ChartContainer config={chartConfig} className="h-full w-full">
        <ResponsiveContainer>
          <BarChart
            data={chartData}
            margin={{ top: 12, right: 8, bottom: 0, left: 0 }}
          >
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              tick={{ fill: "var(--muted-foreground)", fillOpacity: 0.85, fontSize: 11 }}
              axisLine={{ stroke: "var(--border)" }}
              tickLine={{ stroke: "var(--border)" }}
            />
            <YAxis
              tick={{ fill: "var(--muted-foreground)", fillOpacity: 0.85, fontSize: 11 }}
              axisLine={{ stroke: "var(--border)" }}
              tickLine={{ stroke: "var(--border)" }}
              width={56}
            />
            <ChartTooltip
              cursor={{ fill: "var(--muted)" }}
              content={
                <ChartTooltipContent
                  formatter={(value) => formatNumber(Number(value))}
                  indicator="line"
                />
              }
            />
            <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
              {chartData.map((entry) => (
                <Cell
                  key={entry.label}
                  fill={entry.pnl >= 0 ? "var(--profit)" : "var(--loss)"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}
