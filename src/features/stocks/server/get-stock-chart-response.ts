import type { createClient } from "@/lib/supabase/server";

import { getInstrumentCompaniesMarketCapMetrics } from "@/features/market-data/server/get-instrument-companiesmarketcap-metrics";

import {
  buildOverlayCoverage,
  buildStockOverlaySeries,
} from "./build-stock-overlay-series";
import {
  fillOutsidePrimaryCoverage,
  mergeAnnualNumericHistory,
  pickYearEndValuesFromHistory,
} from "./annual-history-merge";
import { getFundamentalTimeSeriesCached } from "./get-fundamental-time-series-cached";
import { getStockChartSeries } from "./get-stock-chart-series";
import type {
  StockChartRange,
  StockChartOverlay,
  StockChartResponse,
  StockChartPoint,
} from "./types";

type SupabaseServerClient = ReturnType<typeof createClient>;

const extendOverlayMetric = (
  dates: readonly string[],
  points: readonly StockChartPoint[],
  options: Readonly<{
    metric: "pe" | "revenueTtm";
    fallbackAnnualHistory:
      | readonly import("@/features/market-data/server/companiesmarketcap/types").CompaniesMarketCapAnnualHistoryPoint[]
      | undefined;
  }>
) => {
  if (!options.fallbackAnnualHistory || options.fallbackAnnualHistory.length === 0) {
    return points.map((point) =>
      options.metric === "pe" ? point.pe : point.revenueTtm
    );
  }

  const primaryAnnualHistory = pickYearEndValuesFromHistory(points, {
    getDate: (point) => point.t.slice(0, 10),
    getValue: (point) =>
      options.metric === "pe" ? point.pe : point.revenueTtm,
  });
  const mergedAnnualHistory = mergeAnnualNumericHistory(
    primaryAnnualHistory,
    options.fallbackAnnualHistory
  );

  return fillOutsidePrimaryCoverage(
    dates,
    points.map((point) => (options.metric === "pe" ? point.pe : point.revenueTtm)),
    mergedAnnualHistory
  );
};

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
  const fallbackMetrics =
    activeOverlays.includes("pe") || activeOverlays.includes("revenueTtm")
      ? await getInstrumentCompaniesMarketCapMetrics(supabase, providerKey)
      : null;
  const yahooPoints = buildStockOverlaySeries(chartSeries.dailyPoints, {
    includePe: activeOverlays.includes("pe"),
    epsEvents,
    revenueEvents,
  });
  const dates = chartSeries.dailyPoints.map((point) => point.date);
  const peValues = activeOverlays.includes("pe")
    ? extendOverlayMetric(dates, yahooPoints, {
        metric: "pe",
        fallbackAnnualHistory: fallbackMetrics?.pe_ratio?.annualHistory,
      })
    : yahooPoints.map((point) => point.pe);
  const revenueTtmValues = activeOverlays.includes("revenueTtm")
    ? extendOverlayMetric(dates, yahooPoints, {
        metric: "revenueTtm",
        fallbackAnnualHistory: fallbackMetrics?.revenue?.annualHistory,
      })
    : yahooPoints.map((point) => point.revenueTtm);
  const points = yahooPoints.map((point, index) => ({
    ...point,
    pe: peValues[index] ?? null,
    peLabel: peValues[index] === null ? point.peLabel : null,
    revenueTtm: revenueTtmValues[index] ?? null,
  }));
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
