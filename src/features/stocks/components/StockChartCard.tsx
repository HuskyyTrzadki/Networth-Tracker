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
import {
  OVERLAY_CONTROL_LABELS,
  OVERLAY_KEYS,
  OVERLAY_LINE_COLORS,
  buildOverlayAxisMeta,
  buildLegendItems,
  buildPriceAxisDomain,
  buildChartData,
  buildCoverageWarnings,
  formatEps,
  formatLabelDate,
  formatPe,
  formatPrice,
  formatRevenue,
  formatXAxisTick,
  getNextOverlaySelection,
  normalizeOverlaysForMode,
  toOverlayLineDataKey,
  toOverlayRequestKey,
  type StockChartMode,
} from "./stock-chart-card-helpers";
import {
  STOCK_CHART_RANGES,
  type StockChartOverlay,
  type StockChartRange,
  type StockChartResponse,
} from "../server/types";

type Props = Readonly<{
  providerKey: string;
  initialChart: StockChartResponse;
}>;

export function StockChartCard({ providerKey, initialChart }: Props) {
  const [range, setRange] = useState<StockChartRange>(initialChart.requestedRange);
  const [mode, setMode] = useState<StockChartMode>("trend");
  const [activeOverlays, setActiveOverlays] = useState<StockChartOverlay[]>(
    [...initialChart.activeOverlays]
  );

  const normalizedOverlays = normalizeOverlaysForMode(mode, activeOverlays);
  const initialOverlayKey = toOverlayRequestKey(initialChart.activeOverlays);
  const overlayKey = toOverlayRequestKey(normalizedOverlays);
  const isInitialState =
    range === initialChart.requestedRange && overlayKey === initialOverlayKey;
  const requestKey = isInitialState
    ? null
    : `${providerKey}|${range}|${overlayKey || "none"}`;

  const chartResource = useKeyedAsyncResource<StockChartResponse>({
    requestKey,
    load: (signal) => getStockChart(providerKey, range, normalizedOverlays, signal),
    getErrorMessage: (error) =>
      error instanceof Error ? error.message : "Nie udało się pobrać wykresu.",
    keepPreviousData: true,
  });

  const lastKnownChart = chartResource.data ?? initialChart;
  const shouldHideInitialFallback =
    chartResource.isLoading && chartResource.data === null && !isInitialState;
  const chart = shouldHideInitialFallback ? null : lastKnownChart;
  const isLoading = chartResource.isLoading;
  const isTenYearUnavailable =
    (chart ?? lastKnownChart).requestedRange === "10Y" &&
    (chart ?? lastKnownChart).resolvedRange !== "10Y";

  const isRangeDisabled = (rangeOption: StockChartRange) =>
    isLoading || (rangeOption === "10Y" && isTenYearUnavailable);

  const toggleOverlay = (overlay: StockChartOverlay, enabled: boolean) =>
    setActiveOverlays((current) =>
      getNextOverlaySelection(mode, current, overlay, enabled)
    );

  const switchMode = (nextMode: StockChartMode) => {
    setMode(nextMode);
    setActiveOverlays((current) => normalizeOverlaysForMode(nextMode, current));
  };

  const chartData = [...buildChartData(chart?.points ?? [])];
  const priceAxisDomain =
    chart !== null ? buildPriceAxisDomain(chart.resolvedRange, chartData) : undefined;

  const hasVisibleOverlayLines =
    chart !== null &&
    normalizedOverlays.some((overlay) => chart.hasOverlayData[overlay]);

  const coverageWarnings = chart
    ? buildCoverageWarnings(chart, normalizedOverlays)
    : [];
  const legendItems =
    chart !== null
      ? buildLegendItems(mode, normalizedOverlays, chart.hasOverlayData)
      : [];
  const overlayAxisMeta =
    chart !== null
      ? buildOverlayAxisMeta(
          mode,
          chartData,
          normalizedOverlays,
          chart.hasOverlayData
        )
      : { label: null, primaryOverlay: null, domain: undefined };
  const showOverlayAxis = mode === "trend" && hasVisibleOverlayLines;

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
              disabled={isRangeDisabled(rangeOption)}
              className={cn("h-8 min-w-11 rounded-md px-3 font-mono text-xs")}
            >
              {rangeOption}
            </Button>
          ))}

          <div className="ml-auto inline-flex rounded-md border border-border/70 p-0.5">
            <Button
              size="sm"
              type="button"
              variant={mode === "trend" ? "default" : "ghost"}
              onClick={() => switchMode("trend")}
              disabled={isLoading}
              className="h-7 rounded-sm px-2.5 text-xs"
            >
              Trend (100)
            </Button>
            <Button
              size="sm"
              type="button"
              variant={mode === "raw" ? "default" : "ghost"}
              onClick={() => switchMode("raw")}
              disabled={isLoading}
              className="h-7 rounded-sm px-2.5 text-xs"
            >
              Raw
            </Button>
          </div>
        </div>

        {(chart ?? lastKnownChart).resolvedRange !== "1D" ? (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {OVERLAY_KEYS.map((overlay) => (
              <label
                key={overlay}
                className="inline-flex items-center gap-2 text-xs text-muted-foreground"
              >
                <Checkbox
                  checked={normalizedOverlays.includes(overlay)}
                  onCheckedChange={(checked) =>
                    toggleOverlay(overlay, checked === true)
                  }
                  disabled={isLoading || (mode === "raw" && overlay === "revenueTtm")}
                />
                {OVERLAY_CONTROL_LABELS[overlay]}
              </label>
            ))}
          </div>
        ) : null}

        {mode === "raw" ? (
          <p className="text-xs text-muted-foreground">
            W trybie Raw można porównać tylko jeden overlay naraz (PE lub EPS
            TTM).
          </p>
        ) : null}

        {isLoading ? (
          <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            <LoaderCircle className="size-3.5 animate-spin" />
            Pobieram dane dla zakresu {range}...
          </div>
        ) : null}

        {(chart ?? lastKnownChart).requestedRange === "1D" &&
        (chart ?? lastKnownChart).resolvedRange !== "1D" ? (
          <p className="text-xs text-muted-foreground">
            Brak danych intraday. Pokazano zakres 1M.
          </p>
        ) : null}
        {(chart ?? lastKnownChart).requestedRange === "10Y" &&
        (chart ?? lastKnownChart).resolvedRange !== "10Y" ? (
          <p className="text-xs text-muted-foreground">
            Brak pełnej historii 10Y. Pokazano pełny dostępny zakres.
          </p>
        ) : null}

        {coverageWarnings.length > 0 ? (
          <p className="text-xs text-amber-700 dark:text-amber-300">
            Niepełne pokrycie danych: {coverageWarnings.join(" · ")}
          </p>
        ) : null}

        {chartResource.errorMessage ? (
          <p className="text-sm text-loss">{chartResource.errorMessage}</p>
        ) : null}

        {legendItems.length > 0 ? (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {legendItems.map((item) => (
              <span key={item.key} className="inline-flex items-center gap-1.5">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: item.color }}
                  aria-hidden="true"
                />
                {item.label}
              </span>
            ))}
          </div>
        ) : null}

        <div className="relative h-[340px] w-full min-w-0">
          {chart ? (
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
                  domain={priceAxisDomain}
                  tickFormatter={(value) =>
                    typeof value === "number"
                      ? new Intl.NumberFormat("pl-PL", {
                          maximumFractionDigits: 2,
                        }).format(value)
                      : ""
                  }
                  tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                  axisLine={{ stroke: "var(--border)", strokeOpacity: 0.5 }}
                  tickLine={false}
                  width={72}
                />
                {showOverlayAxis ? (
                  <YAxis
                    yAxisId="overlay"
                    orientation="right"
                    domain={overlayAxisMeta.domain}
                    label={
                      overlayAxisMeta.label
                        ? {
                            value: overlayAxisMeta.label,
                            angle: -90,
                            position: "insideRight",
                            style: {
                              fill: "var(--muted-foreground)",
                              fontSize: 11,
                            },
                          }
                        : undefined
                    }
                    tickFormatter={(value) =>
                      typeof value === "number"
                        ? new Intl.NumberFormat("pl-PL", {
                            maximumFractionDigits: 0,
                          }).format(value)
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

                    if (name === "peIndex" || name === "peRaw") {
                      if ((payload?.payload?.peLabel as string | null) === "N/M") {
                        return ["N/M", "PE"];
                      }
                      if ((payload?.payload?.peLabel as string | null) === "-") {
                        return ["-", "PE"];
                      }
                      return [formatPe(payload?.payload?.peRaw as number | null), "PE"];
                    }

                    if (name === "epsTtmIndex" || name === "epsTtmRaw") {
                      return [
                        formatEps(payload?.payload?.epsTtmRaw as number | null),
                        "EPS TTM",
                      ];
                    }

                    return [
                      formatRevenue(
                        payload?.payload?.revenueTtmRaw as number | null,
                        chart.currency
                      ),
                      "Revenue TTM",
                    ];
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
                  name="price"
                />
                {normalizedOverlays.map((overlay) => {
                  const lineDataKey = toOverlayLineDataKey(overlay, mode);
                  const hasData = chart.hasOverlayData[overlay];
                  if (!hasData) return null;

                  return (
                    <Line
                      key={overlay}
                      yAxisId={mode === "trend" ? "overlay" : "price"}
                      dataKey={lineDataKey}
                      type={overlay === "epsTtm" ? "stepAfter" : "linear"}
                      stroke={OVERLAY_LINE_COLORS[overlay]}
                      strokeWidth={2}
                      dot={false}
                      connectNulls={false}
                      isAnimationActive={false}
                      name={lineDataKey}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          ) : null}

          {chart === null ? (
            <div className="absolute inset-0 flex items-center justify-center rounded-lg border border-border/60 bg-card/60">
              <div className="inline-flex items-center gap-2 rounded-md border border-border/70 bg-card px-3 py-1.5 text-xs text-muted-foreground">
                <LoaderCircle className="size-3.5 animate-spin" />
                Odświeżam wykres
              </div>
            </div>
          ) : null}

          {chart !== null && isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-background/45 backdrop-blur-[1px]">
              <div className="inline-flex items-center gap-2 rounded-md border border-border/70 bg-card px-3 py-1.5 text-xs text-muted-foreground">
                <LoaderCircle className="size-3.5 animate-spin" />
                Odświeżam wykres
              </div>
            </div>
          ) : null}
        </div>

        {chart !== null &&
        normalizedOverlays.some((overlay) => !chart.hasOverlayData[overlay]) ? (
          <p className="text-xs text-muted-foreground">
            Część overlayów jest niedostępna dla tej spółki lub zakresu danych.
          </p>
        ) : null}
      </div>
    </ChartCard>
  );
}
