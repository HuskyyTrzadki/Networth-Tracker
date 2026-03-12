import { cacheLife, cacheTag } from "next/cache";

import { getInstrumentCompaniesMarketCapMetrics } from "@/features/market-data/server/get-instrument-companiesmarketcap-metrics";
import { createPublicStocksSupabaseClient } from "@/features/stocks/server/create-public-stocks-supabase-client";
import { getFundamentalTimeSeriesCached } from "@/features/stocks/server/get-fundamental-time-series-cached";
import { getStockValuationHistory } from "@/features/stocks/server/get-stock-valuation-history";

import InsightsWidgetsSectionLazy from "./InsightsWidgetsSectionLazy";
import { buildEarningsInsightWidget } from "./stock-report-earnings-insight";
import { buildRevenueInsightWidget } from "./stock-report-revenue-insight";
import { buildValuationRatioInsightWidget } from "./stock-report-valuation-ratio-insight";
import type { HistoricalInsightWidget } from "./stock-insights-widget-types";

const REVENUE_LOOKBACK_START_DATE = "2010-01-01";
const REVENUE_WIDGET_CACHE_PROFILE = "minutes";
const REVENUE_QUARTERLY_TTL_MS = 12 * 60 * 60 * 1000;
const REVENUE_ANNUAL_TTL_MS = 6 * 60 * 60 * 1000;

const getInsightWidgetsCached = async (providerKey: string) => {
  "use cache";

  cacheLife(REVENUE_WIDGET_CACHE_PROFILE);
  cacheTag(`stock:${providerKey}`);
  cacheTag(`stock:${providerKey}:fundamentals`);
  cacheTag(`stock:${providerKey}:insights:revenue`);
  cacheTag(`stock:${providerKey}:insights:annual-fallback`);

  const supabase = createPublicStocksSupabaseClient();
  const [
    quarterlyRevenue,
    annualRevenue,
    quarterlyEarnings,
    valuationHistory,
    fallbackMetrics,
  ] = await Promise.all([
    getFundamentalTimeSeriesCached(
      supabase,
      providerKey,
      "total_revenue",
      REVENUE_LOOKBACK_START_DATE,
      { ttlMs: REVENUE_QUARTERLY_TTL_MS }
    ),
    getFundamentalTimeSeriesCached(
      supabase,
      providerKey,
      "revenue_ttm",
      REVENUE_LOOKBACK_START_DATE,
      { ttlMs: REVENUE_ANNUAL_TTL_MS }
    ),
    getFundamentalTimeSeriesCached(
      supabase,
      providerKey,
      "net_income",
      REVENUE_LOOKBACK_START_DATE,
      { ttlMs: REVENUE_QUARTERLY_TTL_MS }
    ),
    getStockValuationHistory(supabase, providerKey, "10Y"),
    getInstrumentCompaniesMarketCapMetrics(supabase, providerKey),
  ]);

  return [
    buildRevenueInsightWidget({
      quarterlyEvents: quarterlyRevenue.filter(
        (event) => event.periodType === "FLOW_QUARTERLY"
      ),
      annualEvents: annualRevenue.filter(
        (event) => event.periodType === "TTM_PROXY_ANNUAL"
      ),
      fallbackAnnualHistory: fallbackMetrics.revenue?.annualHistory,
    }),
    buildEarningsInsightWidget({
      quarterlyEvents: quarterlyEarnings.filter(
        (event) => event.periodType === "FLOW_QUARTERLY"
      ),
      fallbackAnnualHistory: fallbackMetrics.earnings?.annualHistory,
    }),
    buildValuationRatioInsightWidget({
      kind: "pe-ratio",
      historyPoints: valuationHistory.points,
      fallbackAnnualHistory: fallbackMetrics.pe_ratio?.annualHistory,
    }),
    buildValuationRatioInsightWidget({
      kind: "ps-ratio",
      historyPoints: valuationHistory.points,
      fallbackAnnualHistory: fallbackMetrics.ps_ratio?.annualHistory,
    }),
  ].filter((widget): widget is HistoricalInsightWidget => widget !== null);
};

export default async function InsightsWidgetsSectionSlot({
  providerKey,
}: Readonly<{
  providerKey: string;
}>) {
  const dynamicWidgets = await getInsightWidgetsCached(providerKey);

  return <InsightsWidgetsSectionLazy dynamicWidgets={dynamicWidgets} />;
}
