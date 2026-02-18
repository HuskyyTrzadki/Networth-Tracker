import { cacheLife, cacheTag } from "next/cache";

import { getPublicStockSummaryCached, getStockChartResponse } from "@/features/stocks";
import { StockMetricsGrid } from "@/features/stocks/components/StockMetricsGrid";
import { createPublicStocksSupabaseClient } from "@/features/stocks/server/create-public-stocks-supabase-client";
import { buildPeValuationRangeContext } from "@/features/stocks/server/valuation-range-context";

export default async function StockMetricsSection({
  providerKey,
  metricCurrency,
}: Readonly<{
  providerKey: string;
  metricCurrency: string;
}>) {
  const [summary, peRangeChart] = await Promise.all([
    getPublicStockSummaryCached(providerKey),
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
