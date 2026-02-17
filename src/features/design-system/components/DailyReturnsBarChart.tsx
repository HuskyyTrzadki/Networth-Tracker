"use client";

import {
  Bar,
  BarChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "@/lib/recharts-dynamic";

type Point = Readonly<{
  label: string;
  value: number;
}>;

type Props = Readonly<{
  data: readonly Point[];
  height?: number;
  showZeroLine?: boolean;
}>;

const formatPercent = (value: number) =>
  new Intl.NumberFormat("pl-PL", {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    signDisplay: "exceptZero",
  }).format(value);

export function DailyReturnsBarChart({
  data,
  height = 120,
  showZeroLine = true,
}: Props) {
  const chartData = [...data];
  const count = chartData.length;

  // Keep bars legible for short ranges, and avoid turning into a solid block for long ones.
  const thresholds = [
    { max: 7, barSize: 34, gap: 2 },
    { max: 14, barSize: 26, gap: 2 },
    { max: 31, barSize: 18, gap: 1 },
  ];
  const threshold = thresholds.find((entry) => count <= entry.max);
  const barSize = threshold?.barSize ?? 10;
  const barCategoryGap = threshold?.gap ?? 0;
  const shouldShowTicks = count <= 12;
  const tick = shouldShowTicks
    ? { fill: "var(--muted-foreground)", fillOpacity: 0.85, fontSize: 11 }
    : false;
  const interval = shouldShowTicks ? 0 : Math.ceil(count / 8);

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer>
        <BarChart
          data={chartData}
          margin={{ top: 12, right: 8, bottom: 0, left: 8 }}
          barCategoryGap={barCategoryGap}
        >
          <XAxis
            dataKey="label"
            tick={tick}
            interval={interval}
            axisLine={false}
            tickLine={false}
          />
          <YAxis hide />
          {showZeroLine ? (
            <ReferenceLine y={0} stroke="var(--border)" strokeDasharray="3 3" />
          ) : null}
          <Tooltip
            cursor={{ fill: "var(--muted)" }}
            formatter={(value: string | number) => formatPercent(Number(value))}
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
          <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={barSize}>
            {chartData.map((entry) => (
              <Cell
                key={entry.label}
                fill={
                  entry.value > 0
                    ? "var(--profit)"
                    : entry.value < 0
                      ? "var(--loss)"
                      : "var(--muted-foreground)"
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
