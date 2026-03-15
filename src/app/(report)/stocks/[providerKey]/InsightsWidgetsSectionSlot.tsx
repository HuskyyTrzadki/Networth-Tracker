import { cacheLife, cacheTag } from "next/cache";

import { getInstrumentCompaniesMarketCapMetrics } from "@/features/market-data/server/get-instrument-companiesmarketcap-metrics";
import { createPublicStocksSupabaseClient } from "@/features/stocks/server/create-public-stocks-supabase-client";
import { getFundamentalTimeSeriesCached } from "@/features/stocks/server/get-fundamental-time-series-cached";
import { getStockValuationHistory } from "@/features/stocks/server/get-stock-valuation-history";

import InsightsWidgetsSectionLazy from "./InsightsWidgetsSectionLazy";
import { buildCashDebtInsightWidget } from "./stock-report-cash-debt-insight";
import { buildEarningsInsightWidget } from "./stock-report-earnings-insight";
import { buildRevenueInsightWidget } from "./stock-report-revenue-insight";
import { buildSharesOutstandingInsightWidget } from "./stock-report-shares-outstanding-insight";
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
    cashHistory,
    debtHistory,
    sharesOutstandingHistory,
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
    getFundamentalTimeSeriesCached(
      supabase,
      providerKey,
      "cash_and_equivalents",
      REVENUE_LOOKBACK_START_DATE,
      { ttlMs: REVENUE_QUARTERLY_TTL_MS }
    ),
    getFundamentalTimeSeriesCached(
      supabase,
      providerKey,
      "total_debt",
      REVENUE_LOOKBACK_START_DATE,
      { ttlMs: REVENUE_QUARTERLY_TTL_MS }
    ),
    getFundamentalTimeSeriesCached(
      supabase,
      providerKey,
      "shares_outstanding",
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
    buildCashDebtInsightWidget({
      quarterlyCashEvents: cashHistory.filter(
        (event) => event.periodType === "POINT_IN_TIME"
      ),
      quarterlyDebtEvents: debtHistory.filter(
        (event) => event.periodType === "POINT_IN_TIME"
      ),
      annualCashEvents: cashHistory.filter(
        (event) => event.periodType === "POINT_IN_TIME_ANNUAL"
      ),
      annualDebtEvents: debtHistory.filter(
        (event) => event.periodType === "POINT_IN_TIME_ANNUAL"
      ),
    }),
    buildSharesOutstandingInsightWidget({
      quarterlyEvents: sharesOutstandingHistory.filter(
        (event) => event.periodType === "POINT_IN_TIME"
      ),
      annualEvents: sharesOutstandingHistory.filter(
        (event) => event.periodType === "POINT_IN_TIME_ANNUAL"
      ),
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
  let dynamicWidgets: readonly HistoricalInsightWidget[] = [];

  try {
    dynamicWidgets = await getInsightWidgetsCached(providerKey);
  } catch (error) {
    console.error("Failed to load stock insight widgets", {
      providerKey,
      error,
    });
  }

  return <InsightsWidgetsSectionLazy dynamicWidgets={dynamicWidgets} />;
}
