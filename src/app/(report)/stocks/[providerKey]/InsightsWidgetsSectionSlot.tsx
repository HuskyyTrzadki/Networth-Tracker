import { cacheLife, cacheTag } from "next/cache";

import { createPublicStocksSupabaseClient } from "@/features/stocks/server/create-public-stocks-supabase-client";
import { getFundamentalTimeSeriesCached } from "@/features/stocks/server/get-fundamental-time-series-cached";

import InsightsWidgetsSectionLazy from "./InsightsWidgetsSectionLazy";
import { buildRevenueInsightWidget } from "./stock-report-revenue-insight";

const REVENUE_LOOKBACK_START_DATE = "2010-01-01";
const REVENUE_WIDGET_CACHE_PROFILE = "minutes";
const REVENUE_QUARTERLY_TTL_MS = 12 * 60 * 60 * 1000;
const REVENUE_ANNUAL_TTL_MS = 6 * 60 * 60 * 1000;

const getRevenueInsightWidgetCached = async (providerKey: string) => {
  "use cache";

  cacheLife(REVENUE_WIDGET_CACHE_PROFILE);
  cacheTag(`stock:${providerKey}`);
  cacheTag(`stock:${providerKey}:fundamentals`);
  cacheTag(`stock:${providerKey}:insights:revenue`);

  const supabase = createPublicStocksSupabaseClient();
  const [quarterlyRevenue, annualRevenue] = await Promise.all([
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
  ]);

  return buildRevenueInsightWidget({
    quarterlyEvents: quarterlyRevenue.filter(
      (event) => event.periodType === "FLOW_QUARTERLY"
    ),
    annualEvents: annualRevenue.filter(
      (event) => event.periodType === "TTM_PROXY_ANNUAL"
    ),
  });
};

export default async function InsightsWidgetsSectionSlot({
  providerKey,
}: Readonly<{
  providerKey: string;
}>) {
  const revenueWidget = await getRevenueInsightWidgetCached(providerKey);

  return <InsightsWidgetsSectionLazy revenueWidget={revenueWidget} />;
}
