import { cacheLife, cacheTag } from "next/cache";

import { getStockChartResponse, getStockValuationSummaryCached } from "@/features/stocks";
import { StockMetricsGrid } from "@/features/stocks/components/StockMetricsGrid";
import { createPublicStocksSupabaseClient } from "@/features/stocks/server/create-public-stocks-supabase-client";
import { buildPeValuationRangeContext } from "@/features/stocks/server/valuation-range-context";

const getStockSummaryCached = async (providerKey: string) => {
  "use cache";

  cacheLife("hours");
  cacheTag(`stock:${providerKey}`);
  cacheTag(`stock:${providerKey}:summary`);

  const supabase = createPublicStocksSupabaseClient();
  return getStockValuationSummaryCached(supabase, providerKey);
};

export default async function StockMetricsSection({
  providerKey,
  metricCurrency,
}: Readonly<{
  providerKey: string;
  metricCurrency: string;
}>) {
  const [summary, peRangeChart] = await Promise.all([
    getStockSummaryCached(providerKey),
    getStockPeRangeContextChartCached(providerKey),
  ]);
  const peContext = buildPeValuationRangeContext({
    summaryPeTtm: summary.peTtm,
    chart: peRangeChart,
  });

  return (
    <StockMetricsGrid
      summary={summary}
      currency={metricCurrency}
      peContext={peContext}
    />
  );
}

const getStockPeRangeContextChartCached = async (providerKey: string) => {
  "use cache";

  cacheLife("hours");
  cacheTag(`stock:${providerKey}`);
  cacheTag(`stock:${providerKey}:chart:5y:pe`);

  const supabase = createPublicStocksSupabaseClient();
  return getStockChartResponse(supabase, providerKey, "5Y", ["pe"]);
};
