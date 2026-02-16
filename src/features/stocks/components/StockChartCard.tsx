"use client";

import { useState } from "react";

import { useKeyedAsyncResource } from "@/features/common/hooks/use-keyed-async-resource";
import { Button } from "@/features/design-system/components/ui/button";
import { Checkbox } from "@/features/design-system/components/ui/checkbox";
import { cn } from "@/lib/cn";
import { LoaderCircle } from "lucide-react";

import { getStockChart } from "../client/get-stock-chart";
import { getStockTradeMarkers } from "../client/get-stock-trade-markers";
import {
  OVERLAY_CONTROL_LABELS,
  OVERLAY_KEYS,
  buildOverlayAxisMeta,
  buildLegendItems,
  buildPriceAxisDomain,
  buildChartData,
  buildCoverageWarnings,
  getNextOverlaySelection,
  normalizeOverlaysForMode,
  toOverlayRequestKey,
  type StockChartMode,
} from "./stock-chart-card-helpers";
import { buildMockChartEventMarkers } from "./stock-chart-event-markers";
import { StockChartPlot } from "./StockChartPlot";
import { getPriceTrendColor, resolveStockPriceTrend } from "./stock-chart-trend";
import {
  formatChangePercent,
  resolveVisibleTradeMarkers,
} from "./stock-chart-card-view-model";
import {
  STOCK_CHART_RANGES,
  type StockChartOverlay,
  type StockChartRange,
  type StockChartResponse,
  type StockTradeMarker,
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
  const [showEarningsEvents, setShowEarningsEvents] = useState(false);
  const [showNewsEvents, setShowNewsEvents] = useState(false);
  const [showUserTradeEvents, setShowUserTradeEvents] = useState(false);
  const [showGlobalNewsEvents, setShowGlobalNewsEvents] = useState(false);

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
  const tradeMarkersResource = useKeyedAsyncResource<readonly StockTradeMarker[]>({
    requestKey: providerKey,
    load: (signal) => getStockTradeMarkers(providerKey, signal),
    getErrorMessage: () => "",
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
  const isEventRangeEligible = ["3Y", "5Y", "10Y", "ALL"].includes(
    (chart ?? lastKnownChart).resolvedRange
  );

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
  const priceTrend = resolveStockPriceTrend(chartData.map((point) => point.price));
  const priceLineColor = getPriceTrendColor(priceTrend.direction);
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
  const priceAxisDomainForChart = priceAxisDomain
    ? ([priceAxisDomain[0], priceAxisDomain[1]] as [number, number])
    : undefined;
  const overlayAxisDomainForChart = overlayAxisMeta.domain
    ? ([overlayAxisMeta.domain[0], overlayAxisMeta.domain[1]] as [number, number])
    : undefined;
  const visibleTradeMarkers = chart
    ? resolveVisibleTradeMarkers(tradeMarkersResource.data ?? [], chart.points)
    : [];
  const eventMarkers = isEventRangeEligible
    ? buildMockChartEventMarkers(chartData, {
      includeEarnings: showEarningsEvents,
      includeNews: showNewsEvents,
      includeUserTrades: showUserTradeEvents,
      includeGlobalNews: showGlobalNewsEvents,
    })
    : [];

  return (
    <section className="space-y-4 border-b border-dashed border-[color:var(--report-rule)] pb-5">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-2xl font-semibold tracking-tight">Wykres ceny</h2>
        <p
          className={cn(
            "text-xs font-semibold",
            priceTrend.direction === "up" && "text-[color:var(--profit)]",
            priceTrend.direction === "down" && "text-[color:var(--loss)]",
            priceTrend.direction === "flat" && "text-muted-foreground"
          )}
        >
          Zmiana zakresu: {formatChangePercent(priceTrend.changePercent)}
        </p>
      </header>

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
              Surowe
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
            <span className="text-xs text-muted-foreground/70">|</span>
            <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <Checkbox
                checked={isEventRangeEligible ? showEarningsEvents : false}
                onCheckedChange={(checked) => {
                  if (!isEventRangeEligible) return;
                  setShowEarningsEvents(checked === true);
                }}
                disabled={!isEventRangeEligible}
              />
              Wyniki (konsensus vs raport)
            </label>
            <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <Checkbox
                checked={isEventRangeEligible ? showNewsEvents : false}
                onCheckedChange={(checked) => {
                  if (!isEventRangeEligible) return;
                  setShowNewsEvents(checked === true);
                }}
                disabled={!isEventRangeEligible}
              />
              Wazne wydarzenia
            </label>
            <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <Checkbox
                checked={isEventRangeEligible ? showUserTradeEvents : false}
                onCheckedChange={(checked) => {
                  if (!isEventRangeEligible) return;
                  setShowUserTradeEvents(checked === true);
                }}
                disabled={!isEventRangeEligible}
              />
              BUY/SELL uzytkownika (mock)
            </label>
            <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <Checkbox
                checked={isEventRangeEligible ? showGlobalNewsEvents : false}
                onCheckedChange={(checked) => {
                  if (!isEventRangeEligible) return;
                  setShowGlobalNewsEvents(checked === true);
                }}
                disabled={!isEventRangeEligible}
              />
              Wazne wydarzenia globalne
            </label>
          </div>
        ) : null}

        {mode === "raw" ? (
          <p className="text-xs text-muted-foreground">
            W trybie Surowe mozna porownac tylko jeden overlay naraz (PE lub EPS
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

        <StockChartPlot
          chart={chart}
          chartData={chartData}
          normalizedOverlays={normalizedOverlays}
          mode={mode}
          priceTrendDirection={priceTrend.direction}
          priceLineColor={priceLineColor}
          showOverlayAxis={showOverlayAxis}
          priceAxisDomainForChart={priceAxisDomainForChart}
          overlayAxisDomainForChart={overlayAxisDomainForChart}
          overlayAxisLabel={overlayAxisMeta.label}
          visibleTradeMarkers={visibleTradeMarkers}
          eventMarkers={eventMarkers}
          isLoading={isLoading}
        />

        {chart !== null &&
        normalizedOverlays.some((overlay) => !chart.hasOverlayData[overlay]) ? (
          <p className="text-xs text-muted-foreground">
            Część overlayów jest niedostępna dla tej spółki lub zakresu danych.
          </p>
        ) : null}

      </div>
    </section>
  );
}
