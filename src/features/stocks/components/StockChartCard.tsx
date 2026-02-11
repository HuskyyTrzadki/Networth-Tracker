"use client";

import { useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useKeyedAsyncResource } from "@/features/common/hooks/use-keyed-async-resource";
import { ChartCard } from "@/features/design-system";
import { Button } from "@/features/design-system/components/ui/button";
import { Checkbox } from "@/features/design-system/components/ui/checkbox";
import { cn } from "@/lib/cn";
import { LoaderCircle } from "lucide-react";

import { getStockChart } from "../client/get-stock-chart";
import { STOCK_CHART_RANGES, type StockChartRange, type StockChartResponse } from "../server/types";

const formatPrice = (value: number | null, currency: string | null) => {
  if (typeof value !== "number" || !Number.isFinite(value)) return "-";
  if (!currency) return value.toString();
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
};

const formatPe = (value: number | null) =>
  typeof value === "number" && Number.isFinite(value)
    ? new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 2 }).format(value)
    : "-";

const formatLabelDate = (value: string) =>
  new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: value.includes("T") ? "2-digit" : undefined,
    minute: value.includes("T") ? "2-digit" : undefined,
  }).format(new Date(value));

const formatXAxisTick = (value: string, range: StockChartRange) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  if (range === "1D") {
    return new Intl.DateTimeFormat("pl-PL", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  if (range === "1M" || range === "3M" || range === "6M") {
    return new Intl.DateTimeFormat("pl-PL", {
      day: "2-digit",
      month: "short",
      year: "2-digit",
    }).format(date);
  }

  return new Intl.DateTimeFormat("pl-PL", {
    month: "short",
    year: "numeric",
  }).format(date);
};

type Props = Readonly<{
  providerKey: string;
  initialChart: StockChartResponse;
}>;

export function StockChartCard({ providerKey, initialChart }: Props) {
  const [range, setRange] = useState<StockChartRange>(initialChart.requestedRange);
  const [includePe, setIncludePe] = useState(false);

  const isInitialState = range === initialChart.requestedRange && !includePe;
  const requestKey = isInitialState ? null : `${providerKey}|${range}|${includePe ? "1" : "0"}`;
  const chartResource = useKeyedAsyncResource<StockChartResponse>({
    requestKey,
    load: (signal) => getStockChart(providerKey, range, includePe, signal),
    getErrorMessage: (error) =>
      error instanceof Error ? error.message : "Nie udało się pobrać wykresu.",
    keepPreviousData: true,
  });
  const chart = chartResource.data ?? initialChart;
  const isLoading = chartResource.isLoading;
  const chartData = chart.points.map((point) => ({
    t: point.t,
    price: point.price,
    pe: point.pe,
    peLabel: point.peLabel,
  }));

  return (
    <ChartCard
      title="Wykres ceny"
      surface="subtle"
      className="rounded-2xl"
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {STOCK_CHART_RANGES.map((rangeOption) => (
            <Button
              key={rangeOption}
              size="sm"
              type="button"
              variant={range === rangeOption ? "default" : "outline"}
              onClick={() => setRange(rangeOption)}
              disabled={isLoading}
              className={cn("h-8 min-w-11 rounded-md px-3 font-mono text-xs")}
            >
              {rangeOption}
            </Button>
          ))}

          {chart.resolvedRange !== "1D" ? (
            <label className="ml-auto inline-flex items-center gap-2 text-xs text-muted-foreground">
              <Checkbox
                checked={includePe}
                onCheckedChange={(checked) => setIncludePe(checked === true)}
                disabled={isLoading}
              />
              Pokaż historyczne PE
            </label>
          ) : null}
        </div>

        {isLoading ? (
          <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            <LoaderCircle className="size-3.5 animate-spin" />
            Pobieram dane dla zakresu {range}...
          </div>
        ) : null}

        {chart.requestedRange === "1D" && chart.resolvedRange !== "1D" ? (
          <p className="text-xs text-muted-foreground">
            Brak danych intraday. Pokazano zakres 1M.
          </p>
        ) : null}

        {chartResource.errorMessage ? (
          <p className="text-sm text-loss">{chartResource.errorMessage}</p>
        ) : null}

        <div className="relative h-[340px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 18, left: 6, bottom: 8 }}>
              <CartesianGrid stroke="var(--border)" strokeOpacity={0.4} vertical={false} />
              <XAxis
                dataKey="t"
                tickFormatter={(value) =>
                  formatXAxisTick(String(value), chart.resolvedRange)
                }
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                axisLine={{ stroke: "var(--border)", strokeOpacity: 0.5 }}
                tickLine={false}
                minTickGap={26}
              />
              <YAxis
                yAxisId="price"
                tickFormatter={(value) =>
                  typeof value === "number"
                    ? new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 2 }).format(value)
                    : ""
                }
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                axisLine={{ stroke: "var(--border)", strokeOpacity: 0.5 }}
                tickLine={false}
                width={72}
              />
              {includePe && chart.hasPe ? (
                <YAxis
                  yAxisId="pe"
                  orientation="right"
                  tickFormatter={(value) =>
                    typeof value === "number"
                      ? new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 1 }).format(value)
                      : ""
                  }
                  tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                  axisLine={{ stroke: "var(--border)", strokeOpacity: 0.5 }}
                  tickLine={false}
                  width={58}
                />
              ) : null}
              <Tooltip
                cursor={{ stroke: "var(--ring)", strokeOpacity: 0.4 }}
                labelFormatter={(value) => formatLabelDate(String(value))}
                formatter={(value, name, payload) => {
                  if (name === "price") {
                    return [formatPrice(value as number | null, chart.currency), "Cena"];
                  }

                  if ((payload?.payload?.peLabel as string | null) === "N/M") {
                    return ["N/M", "PE"];
                  }

                  if ((payload?.payload?.peLabel as string | null) === "-") {
                    return ["-", "PE"];
                  }

                  return [formatPe(value as number | null), "PE"];
                }}
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                  color: "var(--popover-foreground)",
                }}
              />
              <Line
                yAxisId="price"
                dataKey="price"
                stroke="var(--chart-1)"
                strokeWidth={2.4}
                dot={false}
                connectNulls={false}
                isAnimationActive={false}
              />
              {includePe && chart.hasPe ? (
                <Line
                  yAxisId="pe"
                  dataKey="pe"
                  stroke="var(--chart-4)"
                  strokeWidth={2}
                  dot={false}
                  connectNulls={false}
                  isAnimationActive={false}
                />
              ) : null}
            </LineChart>
          </ResponsiveContainer>
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-background/45 backdrop-blur-[1px]">
              <div className="inline-flex items-center gap-2 rounded-md border border-border/70 bg-card px-3 py-1.5 text-xs text-muted-foreground">
                <LoaderCircle className="size-3.5 animate-spin" />
                Odświeżam wykres
              </div>
            </div>
          ) : null}
        </div>

        {includePe && !chart.hasPe ? (
          <p className="text-xs text-muted-foreground">
            PE niedostępne dla tej spółki lub zakresu danych.
          </p>
        ) : null}
      </div>
    </ChartCard>
  );
}
