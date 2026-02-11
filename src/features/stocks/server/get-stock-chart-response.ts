import type { createClient } from "@/lib/supabase/server";

import { buildPeOverlaySeries } from "./build-pe-overlay-series";
import { getEpsTtmEventsCached } from "./get-eps-ttm-events-cached";
import { getStockChartSeries } from "./get-stock-chart-series";
import type {
  StockChartRange,
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
    pe: null,
    peLabel: null,
  }));

export async function getStockChartResponse(
  supabase: SupabaseServerClient,
  providerKey: string,
  range: StockChartRange,
  includePe: boolean
): Promise<StockChartResponse> {
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
      points: toDefaultPoints(chartSeries.intradayPoints),
    };
  }

  const baselinePoints = toDefaultPoints(
    chartSeries.dailyPoints.map((point) => ({
      time: point.time,
      price: point.price,
    }))
  );

  if (!includePe || chartSeries.dailyPoints.length === 0) {
    return {
      providerKey,
      requestedRange: chartSeries.requestedRange,
      resolvedRange: chartSeries.resolvedRange,
      timezone: chartSeries.timezone,
      currency: chartSeries.currency,
      hasIntraday: false,
      hasPe: false,
      points: baselinePoints,
    };
  }

  const periodStartDate = chartSeries.dailyPoints[0].date;
  const epsEvents = await getEpsTtmEventsCached(
    supabase,
    providerKey,
    periodStartDate
  );

  if (epsEvents.length === 0) {
    return {
      providerKey,
      requestedRange: chartSeries.requestedRange,
      resolvedRange: chartSeries.resolvedRange,
      timezone: chartSeries.timezone,
      currency: chartSeries.currency,
      hasIntraday: false,
      hasPe: false,
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
    hasPe: true,
    points: buildPeOverlaySeries(chartSeries.dailyPoints, epsEvents),
  };
}
