"use client";

import { useReducer } from "react";

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
import {
  buildStockChartNotice,
  buildVisibleLegendItems,
  isStockChartEventRangeEligible,
  isStockChartTenYearUnavailable,
  resolveInitialFundamentalSelection,
  resolveStockChartResourceState,
  resolveStockTradeMarkers,
} from "./stock-chart-card-view-state";
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
import { useStockChartRangeStore } from "./use-stock-chart-range-store";
import type {
  StockChartOverlay,
  StockChartResponse,
  StockTradeMarker,
} from "../server/types";

type Props = Readonly<{
  providerKey: string;
  initialChart: StockChartResponse;
  initialTradeMarkers: readonly StockTradeMarker[];
}>;

export function StockChartCard({
  providerKey,
  initialChart,
  initialTradeMarkers,
}: Props) {
  const { range, setRange } = useStockChartRangeStore(
    providerKey,
    initialChart.requestedRange
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

  const { chart, lastKnownChart } = resolveStockChartResourceState({
    fetchedChart: chartResource.data,
    initialChart,
    isLoading: chartResource.isLoading,
    isInitialState,
  });
  const chartForStatus = chart ?? lastKnownChart;
  const isLoading = chartResource.isLoading;
  const isTenYearUnavailable = isStockChartTenYearUnavailable(chartForStatus);
  const isEventRangeEligible = isStockChartEventRangeEligible(chartForStatus.resolvedRange);

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

  const tradeMarkers = resolveStockTradeMarkers(
    tradeMarkersResource.data,
    initialTradeMarkers
  );
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

  const chartNotice = buildStockChartNotice({
    coverageWarnings,
    mode,
    requestedRange: chartForStatus.requestedRange,
    resolvedRange: chartForStatus.resolvedRange,
  });

  return (
    <section className="space-y-4 border-b border-dashed border-black/15 pb-6">
      <StockChartCardHeader
        direction={priceTrend.direction}
        changePercent={priceTrend.changePercent}
        rangeLabel={chartForStatus.resolvedRange}
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

          {isLoading ? (
            <div className="inline-flex items-center gap-2 text-[11px] text-muted-foreground">
              <LoaderCircle className="size-3.5 animate-spin" />
              Laduje wykres dla {range}...
            </div>
          ) : null}

          {chartResource.errorMessage ? (
            <p className="text-sm text-loss">{chartResource.errorMessage}</p>
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
            showNarrativeLabels={showNarration && hasVisibleEvents}
            isLoading={isLoading}
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

          <StockChartLegend items={legendItems} />

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
