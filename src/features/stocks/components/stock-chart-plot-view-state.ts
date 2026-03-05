import type { ChartConfig } from "@/features/design-system/components/ui/chart";

import {
  OVERLAY_LINE_COLORS,
  toOverlayLineDataKey,
  type StockChartMode,
} from "./stock-chart-card-helpers";
import { buildNarrativeLabelLayout } from "./stock-chart-narrative-label-layout";
import type { StockChartEventMarker } from "./stock-chart-event-markers";
import type { VisibleTradeMarker } from "./stock-chart-card-view-model";
import { buildPositionedTradeMarkers } from "./stock-chart-trade-marker-layout";
import {
  buildStockChartEventMarkerPoints,
  type StockChartPlotDataPoint,
} from "./stock-chart-plot-events";
import type { StockChartOverlay, StockChartResponse } from "../server/types";

export type StockChartPlotAnimationState = Readonly<{
  isDisabled: boolean;
  chartDuration: number;
  overlayDuration: number;
  areaDuration: number;
}>;

const PRICE_LABEL = "Cena";

type PriceTrendDirection = "up" | "down" | "flat";

type ResolveAreaFillParams = Readonly<{
  priceTrendDirection: PriceTrendDirection;
  hasEnabledOverlays: boolean;
}>;

export const resolveStockChartPlotAnimationState = (
  isLoading: boolean,
  prefersReducedMotion: boolean
): StockChartPlotAnimationState => {
  const isDisabled = prefersReducedMotion || isLoading;

  return {
    isDisabled,
    chartDuration: isDisabled ? 0 : 180,
    overlayDuration: isDisabled ? 0 : 160,
    areaDuration: isDisabled ? 0 : 160,
  };
};

export const resolveStockChartAreaFillColor = ({
  priceTrendDirection,
  hasEnabledOverlays,
}: ResolveAreaFillParams) => {
  if (priceTrendDirection === "up") {
    return hasEnabledOverlays
      ? "rgba(95, 174, 112, 0.28)"
      : "rgba(95, 174, 112, 0.42)";
  }

  if (priceTrendDirection === "down") {
    return hasEnabledOverlays
      ? "rgba(208, 116, 109, 0.26)"
      : "rgba(208, 116, 109, 0.38)";
  }

  return hasEnabledOverlays
    ? "rgba(138, 138, 138, 0.18)"
    : "rgba(138, 138, 138, 0.28)";
};

type BuildViewStateParams = Readonly<{
  chart: StockChartResponse | null;
  chartData: readonly StockChartPlotDataPoint[];
  normalizedOverlays: readonly StockChartOverlay[];
  mode: StockChartMode;
  priceTrendDirection: PriceTrendDirection;
  priceLineColor: string;
  priceAxisDomainForChart: [number, number] | undefined;
  overlayAxisLabel: string | null;
  visibleTradeMarkers: readonly VisibleTradeMarker[];
  eventMarkers: readonly StockChartEventMarker[];
  chartWidth: number;
}>;

type StockChartOverlayLine = Readonly<{
  overlay: StockChartOverlay;
  lineDataKey: string;
  yAxisId: "price" | "overlay";
  type: "linear" | "stepAfter";
  color: string;
}>;

export type StockChartPlotViewState = Readonly<{
  areaBaseValue: number;
  areaFillColor: string;
  chartConfig: ChartConfig;
  chartCurrency: string;
  eventMarkerPoints: ReturnType<typeof buildStockChartEventMarkerPoints>;
  hasEnabledOverlays: boolean;
  mutableChartData: StockChartPlotDataPoint[];
  narrativeLabelLayout: ReturnType<typeof buildNarrativeLabelLayout>;
  overlayAxisLabelValue: string | undefined;
  overlayLines: readonly StockChartOverlayLine[];
  positionedTradeMarkers: ReturnType<typeof buildPositionedTradeMarkers>;
}>;

const truncateNarrativeLabel = (label: string) =>
  label.length > 26 ? `${label.slice(0, 26)}...` : label;

const buildStockChartConfig = (
  normalizedOverlays: readonly StockChartOverlay[],
  priceLineColor: string
): ChartConfig =>
  normalizedOverlays.reduce<ChartConfig>(
    (acc, overlay) => {
      acc[overlay] = {
        label: overlay,
        color: OVERLAY_LINE_COLORS[overlay],
      };

      return acc;
    },
    {
      price: {
        label: PRICE_LABEL,
        color: priceLineColor,
      },
    }
  );

const buildOverlayLines = (
  chart: StockChartResponse,
  normalizedOverlays: readonly StockChartOverlay[],
  mode: StockChartMode
): readonly StockChartOverlayLine[] =>
  normalizedOverlays
    .filter((overlay) => chart.hasOverlayData[overlay])
    .map((overlay) => ({
      overlay,
      lineDataKey: toOverlayLineDataKey(overlay, mode),
      yAxisId: mode === "trend" ? "overlay" : "price",
      type: overlay === "epsTtm" ? "stepAfter" : "linear",
      color: OVERLAY_LINE_COLORS[overlay],
    }));

export const buildStockChartPlotViewState = ({
  chart,
  chartData,
  normalizedOverlays,
  mode,
  priceTrendDirection,
  priceLineColor,
  priceAxisDomainForChart,
  overlayAxisLabel,
  visibleTradeMarkers,
  eventMarkers,
  chartWidth,
}: BuildViewStateParams): StockChartPlotViewState => {
  const hasEnabledOverlays = normalizedOverlays.some(
    (overlay) => chart?.hasOverlayData[overlay] === true
  );

  const eventMarkerPoints = buildStockChartEventMarkerPoints(
    chartData,
    eventMarkers,
    priceAxisDomainForChart
  );

  const positionedTradeMarkers = buildPositionedTradeMarkers({
    markers: visibleTradeMarkers,
    chartData,
    priceAxisDomain: priceAxisDomainForChart,
    plotWidth: Math.max(chartWidth - 96, 0),
  });

  return {
    areaBaseValue: priceAxisDomainForChart?.[0] ?? 0,
    areaFillColor: resolveStockChartAreaFillColor({
      priceTrendDirection,
      hasEnabledOverlays,
    }),
    chartConfig: buildStockChartConfig(normalizedOverlays, priceLineColor),
    chartCurrency: chart?.currency ?? "USD",
    eventMarkerPoints,
    hasEnabledOverlays,
    mutableChartData: [...chartData],
    narrativeLabelLayout: buildNarrativeLabelLayout(
      eventMarkerPoints,
      truncateNarrativeLabel
    ),
    overlayAxisLabelValue: overlayAxisLabel ?? undefined,
    overlayLines: chart ? buildOverlayLines(chart, normalizedOverlays, mode) : [],
    positionedTradeMarkers,
  };
};
