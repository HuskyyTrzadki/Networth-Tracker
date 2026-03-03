import type { createClient } from "@/lib/supabase/server";

import { buildStockValuationHistory } from "./build-stock-valuation-history";
import { getFundamentalTimeSeriesCached } from "./get-fundamental-time-series-cached";
import { getStockChartSeries } from "./get-stock-chart-series";
import type { StockChartRange, StockValuationHistoryPoint } from "./types";

type SupabaseServerClient = ReturnType<typeof createClient>;

export type StockValuationHistory = Readonly<{
  requestedRange: StockChartRange;
  resolvedRange: StockChartRange;
  points: readonly StockValuationHistoryPoint[];
}>;

export async function getStockValuationHistory(
  supabase: SupabaseServerClient,
  providerKey: string,
  range: Extract<StockChartRange, "5Y">
): Promise<StockValuationHistory> {
  const chartSeries = await getStockChartSeries(supabase, providerKey, range);
  const periodStartDate = chartSeries.dailyPoints[0]?.date ?? new Date().toISOString().slice(0, 10);

  const [epsEvents, revenueEvents, sharesOutstandingEvents, bookValueEvents] =
    await Promise.all([
      getFundamentalTimeSeriesCached(supabase, providerKey, "eps_ttm", periodStartDate),
      getFundamentalTimeSeriesCached(supabase, providerKey, "revenue_ttm", periodStartDate),
      getFundamentalTimeSeriesCached(
        supabase,
        providerKey,
        "shares_outstanding",
        periodStartDate
      ),
      getFundamentalTimeSeriesCached(supabase, providerKey, "book_value", periodStartDate),
    ]);

  return {
    requestedRange: chartSeries.requestedRange,
    resolvedRange: chartSeries.resolvedRange,
    points: buildStockValuationHistory(chartSeries.dailyPoints, {
      epsEvents,
      revenueEvents,
      sharesOutstandingEvents,
      bookValueEvents,
    }),
  };
}
