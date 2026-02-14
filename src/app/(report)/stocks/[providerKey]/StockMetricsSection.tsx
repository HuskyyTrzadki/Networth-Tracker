import { cacheLife, cacheTag } from "next/cache";

import { getStockValuationSummaryCached } from "@/features/stocks";
import { StockMetricsGrid } from "@/features/stocks/components/StockMetricsGrid";
import { createPublicStocksSupabaseClient } from "@/features/stocks/server/create-public-stocks-supabase-client";

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
  const summary = await getStockSummaryCached(providerKey);

  return <StockMetricsGrid summary={summary} currency={metricCurrency} />;
}
