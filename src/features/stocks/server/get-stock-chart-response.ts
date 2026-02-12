import type { createClient } from "@/lib/supabase/server";

import {
  buildOverlayCoverage,
  buildStockOverlaySeries,
} from "./build-stock-overlay-series";
import { getFundamentalTimeSeriesCached } from "./get-fundamental-time-series-cached";
import { getStockChartSeries } from "./get-stock-chart-series";
import type {
  StockChartRange,
  StockChartOverlay,
  StockChartResponse,
  StockChartPoint,
} from "./types";

type SupabaseServerClient = ReturnType<typeof createClient>;

const toDefaultPoints = (
  timesAndPrices: readonly { time: string; price: number | null }[]
): readonly StockChartPoint[] =>
  timesAndPrices.map((point) => ({
    t: point.time,
    price: point.price,
    epsTtm: null,
    revenueTtm: null,
    pe: null,
    peLabel: null,
  }));

const EMPTY_OVERLAY_AVAILABILITY = {
  pe: false,
  epsTtm: false,
  revenueTtm: false,
} as const;

const EMPTY_OVERLAY_COVERAGE = {
  pe: {
    firstPointDate: null,
    lastPointDate: null,
    completeForRequestedRange: false,
  },
  epsTtm: {
    firstPointDate: null,
    lastPointDate: null,
    completeForRequestedRange: false,
  },
  revenueTtm: {
    firstPointDate: null,
    lastPointDate: null,
    completeForRequestedRange: false,
  },
} as const;

export async function getStockChartResponse(
  supabase: SupabaseServerClient,
  providerKey: string,
  range: StockChartRange,
  overlays: readonly StockChartOverlay[]
): Promise<StockChartResponse> {
  const activeOverlays = Array.from(new Set(overlays));
  const chartSeries = await getStockChartSeries(supabase, providerKey, range);

  if (chartSeries.resolvedRange === "1D") {
    return {
      providerKey,
      requestedRange: chartSeries.requestedRange,
      resolvedRange: chartSeries.resolvedRange,
      timezone: chartSeries.timezone,
      currency: chartSeries.currency,
      hasIntraday: true,
      hasPe: false,
      activeOverlays: [],
      hasOverlayData: EMPTY_OVERLAY_AVAILABILITY,
      overlayCoverage: EMPTY_OVERLAY_COVERAGE,
      points: toDefaultPoints(chartSeries.intradayPoints),
    };
  }

  const baselinePoints = toDefaultPoints(
    chartSeries.dailyPoints.map((point) => ({
      time: point.time,
      price: point.price,
    }))
  );

  if (activeOverlays.length === 0 || chartSeries.dailyPoints.length === 0) {
    return {
      providerKey,
      requestedRange: chartSeries.requestedRange,
      resolvedRange: chartSeries.resolvedRange,
      timezone: chartSeries.timezone,
      currency: chartSeries.currency,
      hasIntraday: false,
      hasPe: false,
      activeOverlays,
      hasOverlayData: EMPTY_OVERLAY_AVAILABILITY,
      overlayCoverage: EMPTY_OVERLAY_COVERAGE,
      points: baselinePoints,
    };
  }

  const periodStartDate = chartSeries.dailyPoints[0].date;
  const shouldLoadEps =
    activeOverlays.includes("pe") || activeOverlays.includes("epsTtm");
  const shouldLoadRevenue = activeOverlays.includes("revenueTtm");
  const [epsEvents, revenueEvents] = await Promise.all([
    shouldLoadEps
      ? getFundamentalTimeSeriesCached(
          supabase,
          providerKey,
          "eps_ttm",
          periodStartDate
        )
      : Promise.resolve([]),
    shouldLoadRevenue
      ? getFundamentalTimeSeriesCached(
          supabase,
          providerKey,
          "revenue_ttm",
          periodStartDate
        )
      : Promise.resolve([]),
  ]);
  const points = buildStockOverlaySeries(chartSeries.dailyPoints, {
    includePe: activeOverlays.includes("pe"),
    epsEvents,
    revenueEvents,
  });
  const coverage = buildOverlayCoverage(points, periodStartDate);

  if (
    !coverage.hasOverlayData.pe &&
    !coverage.hasOverlayData.epsTtm &&
    !coverage.hasOverlayData.revenueTtm
  ) {
    return {
      providerKey,
      requestedRange: chartSeries.requestedRange,
      resolvedRange: chartSeries.resolvedRange,
      timezone: chartSeries.timezone,
      currency: chartSeries.currency,
      hasIntraday: false,
      hasPe: false,
      activeOverlays,
      hasOverlayData: coverage.hasOverlayData,
      overlayCoverage: coverage.overlayCoverage,
      points: baselinePoints,
    };
  }

  return {
    providerKey,
    requestedRange: chartSeries.requestedRange,
    resolvedRange: chartSeries.resolvedRange,
    timezone: chartSeries.timezone,
    currency: chartSeries.currency,
    hasIntraday: false,
    hasPe: coverage.hasOverlayData.pe,
    activeOverlays,
    hasOverlayData: coverage.hasOverlayData,
    overlayCoverage: coverage.overlayCoverage,
    points,
  };
}
