"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
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

type Point = Readonly<{
  label: string;
  value: number;
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

export function PortfolioAreaChart({
  data,
  height = 240,
  valueFormatter = defaultValueFormatter,
  labelFormatter = defaultLabelFormatter,
}: Props) {
  const chartData = [...data];
  const chartConfig = {
    value: {
      label: "Wartość",
      color: "var(--chart-1)",
    },
  } satisfies ChartConfig;

  return (
    <div className="w-full" style={{ height }}>
      <ChartContainer config={chartConfig} className="h-full w-full">
        <ResponsiveContainer>
          <AreaChart
            data={chartData}
            margin={{ top: 12, right: 8, bottom: 0, left: 0 }}
          >
            <defs>
              <linearGradient id="portfolioFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-value)" stopOpacity={0.14} />
                <stop offset="100%" stopColor="var(--color-value)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
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
              cursor={{ stroke: "var(--ring)" }}
              content={
                <ChartTooltipContent
                  formatter={(value) => valueFormatter(Number(value))}
                  labelFormatter={(value) => labelFormatter(String(value ?? "—"))}
                  indicator="line"
                />
              }
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="var(--color-value)"
              strokeWidth={2.5}
              fill="url(#portfolioFill)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}
