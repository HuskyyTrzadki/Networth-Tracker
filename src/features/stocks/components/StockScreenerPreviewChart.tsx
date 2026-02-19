"use client";

import { Line, LineChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "@/lib/recharts-dynamic";

import { cn } from "@/lib/cn";

export type StockScreenerPreviewPoint = Readonly<{
  date: string;
  price: number;
}>;

const formatXAxisTick = (value: string) => {
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("pl-PL", {
    day: "numeric",
    month: "short",
  }).format(date);
};

const buildPriceFormatter = (currency: string) => {
  if (!currency || currency === "-") {
    return (value: number) => `${value.toFixed(0)}`;
  }

  const formatter = new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });

  return (value: number) => formatter.format(value);
};

export function StockScreenerPreviewChart({
  data,
  currency,
  className,
}: Readonly<{
  data: readonly StockScreenerPreviewPoint[];
  currency: string;
  className?: string;
}>) {
  const safeData =
    data.length >= 2
      ? data
      : [
          { date: "1970-01-01", price: 0 },
          { date: "1970-01-02", price: 0 },
        ];
  const minPrice = Math.min(...safeData.map((point) => point.price));
  const maxPrice = Math.max(...safeData.map((point) => point.price));
  const pad = minPrice === maxPrice ? Math.max(Math.abs(minPrice) * 0.02, 1) : (maxPrice - minPrice) * 0.08;
  const domain: [number, number] = [minPrice - pad, maxPrice + pad];
  const formatPriceTick = buildPriceFormatter(currency);
  const chartData = [...safeData];

  return (
    <div className={cn("h-full w-full", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.35} />
          <XAxis
            dataKey="date"
            tickFormatter={formatXAxisTick}
            tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
            tickLine={false}
            axisLine={{ stroke: "var(--border)", strokeOpacity: 0.5 }}
            minTickGap={18}
          />
          <YAxis
            domain={domain}
            width={56}
            tickFormatter={formatPriceTick}
            tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
            tickLine={false}
            axisLine={{ stroke: "var(--border)", strokeOpacity: 0.5 }}
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke="var(--chart-1)"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
