"use client";
import { useReducer, useSyncExternalStore } from "react";
import { useKeyedAsyncResource } from "@/features/common/hooks/use-keyed-async-resource";
import { Card, CardContent } from "@/features/design-system/components/ui/card";
import { LoaderCircle } from "lucide-react";
import { getStockChart } from "../client/get-stock-chart";
import { getStockTradeMarkers } from "../client/get-stock-trade-markers";
import {
  buildOverlayAxisMeta,
  buildLegendItems,
  buildPriceAxisDomain,
  buildChartData,
  buildCoverageWarnings,
  normalizeOverlaysForMode,
  toOverlayRequestKey,
  type StockChartMode,
} from "./stock-chart-card-helpers";
import { buildMockChartEventMarkers } from "./stock-chart-event-markers";
import { StockChartPlot } from "./StockChartPlot";
import { getPriceTrendColor, resolveStockPriceTrend } from "./stock-chart-trend";
import { resolveVisibleTradeMarkers } from "./stock-chart-card-view-model";
import { StockChartCardHeader } from "./StockChartCardHeader";
import {
  createInitialUiState,
  isRangeDisabledOption,
  resolveNextModeOverlayState,
  resolveNextOverlayState,
  stockChartUiReducer,
} from "./stock-chart-card-state";
import { StockChartPrimaryControls } from "./StockChartPrimaryControls";
import { StockChartLayerControls } from "./StockChartLayerControls";
import { StockChartLegend } from "./StockChartLegend";
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
  initialTradeMarkers: readonly StockTradeMarker[];
}>;
type VisibleLegendItem = Readonly<{
  key: string;
  label: string;
  color: string;
  variant?: "solid" | "ring";
}>;

const buildVisibleLegendItems = ({
  baseLegendItems,
  showTradeMarkers,
  hasTradeMarkers,
  showCompanyEvents,
  showGlobalEvents,
  hasVisibleEvents,
}: Readonly<{
  baseLegendItems: readonly VisibleLegendItem[];
  showTradeMarkers: boolean;
  hasTradeMarkers: boolean;
  showCompanyEvents: boolean;
  showGlobalEvents: boolean;
  hasVisibleEvents: boolean;
}>) => {
  const items = [...baseLegendItems];

  if (showTradeMarkers && hasTradeMarkers) {
    items.push({
      key: "trade-markers",
      label: "Twoje transakcje",
      color: "var(--profit)",
      variant: "ring",
    });
  }

  if (hasVisibleEvents && showCompanyEvents) {
    items.push({
      key: "company-events",
      label: "Wydarzenia spolki",
      color: "#d97706",
    });
  }

  if (hasVisibleEvents && showGlobalEvents) {
    items.push({
      key: "global-events",
      label: "Wydarzenia globalne",
      color: "#0f766e",
    });
  }

  return items;
};

const resolveInitialFundamentalSelection = (
  activeOverlays: readonly StockChartOverlay[]
): StockChartOverlay[] => {
  if (activeOverlays.length > 0) {
    return [...activeOverlays];
  }

  return ["pe"];
};

const STOCK_CHART_RANGE_STORAGE_EVENT = "stock-chart-range-storage";

const readStoredRange = (
  storageKey: string,
  fallbackRange: StockChartRange
): StockChartRange => {
  if (typeof window === "undefined") {
    return fallbackRange;
  }

  const savedRange = window.localStorage.getItem(storageKey) as StockChartRange | null;
  if (savedRange && STOCK_CHART_RANGES.includes(savedRange)) {
    return savedRange;
  }

  return fallbackRange;
};

export function StockChartCard({
  providerKey,
  initialChart,
  initialTradeMarkers,
}: Props) {
  const rangeStorageKey = `stocks:chart-range:${providerKey}`;
  const range = useSyncExternalStore(
    (onStoreChange) => {
      const onStorage = (event: StorageEvent) => {
        if (event.key === rangeStorageKey) {
          onStoreChange();
        }
      };
      const onRangeStorage = (event: Event) => {
        const customEvent = event as CustomEvent<{ key?: string }>;
        if (customEvent.detail?.key === rangeStorageKey) {
          onStoreChange();
        }
      };

      window.addEventListener("storage", onStorage);
      window.addEventListener(STOCK_CHART_RANGE_STORAGE_EVENT, onRangeStorage);

      return () => {
        window.removeEventListener("storage", onStorage);
        window.removeEventListener(STOCK_CHART_RANGE_STORAGE_EVENT, onRangeStorage);
      };
    },
    () => readStoredRange(rangeStorageKey, initialChart.requestedRange),
    () => initialChart.requestedRange
  );
  const [uiState, dispatch] = useReducer(stockChartUiReducer, initialChart, createInitialUiState);
  const {
    mode,
    activeOverlays,
    showTradeMarkers,
    showCompanyEvents,
    showGlobalNewsEvents,
    showNarration,
  } = uiState;

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

  const toggleOverlay = (overlay: StockChartOverlay, enabled: boolean) =>
    dispatch({
      type: "set_active_overlays",
      payload: resolveNextOverlayState(mode, activeOverlays, overlay, enabled),
    });

  const switchMode = (nextMode: StockChartMode) => {
    dispatch({ type: "set_mode", payload: nextMode });
    dispatch({
      type: "set_active_overlays",
      payload: resolveNextModeOverlayState(nextMode, activeOverlays),
    });
  };

  const setRange = (nextRange: StockChartRange) => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(rangeStorageKey, nextRange);
    window.dispatchEvent(
      new CustomEvent<{ key: string }>(STOCK_CHART_RANGE_STORAGE_EVENT, {
        detail: { key: rangeStorageKey },
      })
    );
  };

  const chartData = [...buildChartData(chart?.points ?? [])];
  const priceTrend = resolveStockPriceTrend(chartData.map((point) => point.price));
  const priceLineColor = getPriceTrendColor(priceTrend.direction);
  const priceAxisDomain =
    chart !== null ? buildPriceAxisDomain(chart.resolvedRange, chartData) : undefined;

  const hasVisibleOverlayLines =
    chart !== null &&
    normalizedOverlays.some((overlay) => chart.hasOverlayData[overlay]);

  const coverageWarnings = chart ? buildCoverageWarnings(chart, normalizedOverlays) : [];
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
  const tradeMarkers =
    tradeMarkersResource.data === null
      ? initialTradeMarkers
      : tradeMarkersResource.data.length === 0 && initialTradeMarkers.length > 0
        ? initialTradeMarkers
        : tradeMarkersResource.data;
  const visibleTradeMarkers =
    showTradeMarkers && chart ? resolveVisibleTradeMarkers(tradeMarkers, chart.points) : [];

  const eventMarkers = isEventRangeEligible
    ? buildMockChartEventMarkers(chartData, {
        includeEarnings: showCompanyEvents,
        includeNews: showCompanyEvents,
        includeUserTrades: false,
        includeGlobalNews: showGlobalNewsEvents,
      })
    : [];
  const hasVisibleEvents = isEventRangeEligible && (showCompanyEvents || showGlobalNewsEvents);
  const legendItems = buildVisibleLegendItems({
    baseLegendItems:
      chart !== null
        ? buildLegendItems(mode, normalizedOverlays, chart.hasOverlayData)
        : [],
    showTradeMarkers,
    hasTradeMarkers: tradeMarkers.length > 0,
    showCompanyEvents,
    showGlobalEvents: showGlobalNewsEvents,
    hasVisibleEvents,
  });
  const fallbackNotice =
    (chart ?? lastKnownChart).requestedRange === "1D" &&
    (chart ?? lastKnownChart).resolvedRange !== "1D"
      ? "Brak danych intraday, wiec pokazujemy 1M."
      : (chart ?? lastKnownChart).requestedRange === "10Y" &&
          (chart ?? lastKnownChart).resolvedRange !== "10Y"
        ? "Brak pelnych 10 lat, wiec pokazujemy caly dostepny zakres."
        : null;
  const chartNotice = coverageWarnings.length > 0
    ? {
        tone: "warning" as const,
        text: `Niepelne dane: ${coverageWarnings.join(" · ")}`,
      }
    : mode === "raw"
      ? {
          tone: "muted" as const,
          text: "W trybie surowym pokazujemy jedna nakladke naraz.",
        }
      : fallbackNotice
        ? {
            tone: "muted" as const,
            text: fallbackNotice,
          }
        : null;

  return (
    <section className="space-y-4 border-b border-dashed border-black/15 pb-6">
      <StockChartCardHeader
        direction={priceTrend.direction}
        changePercent={priceTrend.changePercent}
        rangeLabel={(chart ?? lastKnownChart).resolvedRange}
      />

      <Card className="rounded-sm border-black/5 bg-white shadow-[0_1px_0_rgba(0,0,0,0.03),0_12px_32px_-24px_rgba(0,0,0,0.16)]">
        <CardContent className="space-y-3.5 p-6">
          <StockChartPrimaryControls
            range={range}
            mode={mode}
            isLoading={isLoading}
            onRangeChange={setRange}
            onModeChange={switchMode}
            isRangeDisabledOption={(rangeOption) =>
              isRangeDisabledOption(isLoading, isTenYearUnavailable, rangeOption)
            }
          />

          <StockChartLayerControls
            mode={mode}
            isLoading={isLoading}
            hasTradeMarkers={tradeMarkers.length > 0}
            activeOverlays={normalizedOverlays}
            showTradeMarkers={showTradeMarkers}
            onToggleTradeMarkers={(enabled) =>
              dispatch({ type: "set_show_trade_markers", payload: enabled })
            }
            onToggleOverlay={toggleOverlay}
            onSetFundamentalsEnabled={(enabled) =>
              dispatch({
                type: "set_active_overlays",
                payload: enabled ? resolveInitialFundamentalSelection(activeOverlays) : [],
              })
            }
          />

          {isLoading ? (
            <div className="inline-flex items-center gap-2 text-[11px] text-muted-foreground">
              <LoaderCircle className="size-3.5 animate-spin" />
              Laduje wykres dla {range}...
            </div>
          ) : null}

          {chartNotice ? (
            <p
              className={
                chartNotice.tone === "warning"
                  ? "text-[11px] text-amber-700 dark:text-amber-300"
                  : "text-[11px] text-muted-foreground"
              }
            >
              {chartNotice.text}
            </p>
          ) : null}

          {chartResource.errorMessage ? (
            <p className="text-sm text-loss">{chartResource.errorMessage}</p>
          ) : null}

          <StockChartLegend items={legendItems} />

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
            showNarrativeLabels={showNarration && hasVisibleEvents}
            isLoading={isLoading}
          />

          {chart !== null &&
          normalizedOverlays.some((overlay) => !chart.hasOverlayData[overlay]) ? (
            <p className="text-xs text-muted-foreground">
              Część overlayów jest niedostępna dla tej spółki lub zakresu danych.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}
