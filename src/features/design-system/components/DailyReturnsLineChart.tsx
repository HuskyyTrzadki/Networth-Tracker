"use client";

import {
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Point = Readonly<{
  label: string;
  value: number;
}>;

type Props = Readonly<{
  data: readonly Point[];
  height?: number;
}>;

const formatPercent = (value: number) =>
  new Intl.NumberFormat("pl-PL", {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    signDisplay: "exceptZero",
  }).format(value);

export function DailyReturnsLineChart({
  data,
  height = 140,
}: Props) {
  const chartData = [...data];
  const count = chartData.length;
  const shouldShowTicks = count <= 16;
  const tick = shouldShowTicks
    ? { fill: "var(--muted-foreground)", fillOpacity: 0.85, fontSize: 11 }
    : false;
  const interval = shouldShowTicks ? 0 : Math.ceil(count / 8);

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer>
        <LineChart
          data={chartData}
          margin={{ top: 12, right: 8, bottom: 0, left: 8 }}
        >
          <XAxis
            dataKey="label"
            tick={tick}
            interval={interval}
            axisLine={false}
            tickLine={false}
          />
          <YAxis hide />
          <ReferenceLine y={0} stroke="var(--border)" strokeDasharray="3 3" />
          <Tooltip
            cursor={{ stroke: "var(--ring)" }}
            formatter={(value) => formatPercent(Number(value))}
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
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 3, fill: "var(--chart-1)" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
