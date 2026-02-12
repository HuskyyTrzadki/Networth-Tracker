import { cacheLife, cacheTag } from "next/cache";

import { getStockValuationSummaryCached } from "@/features/stocks";
import { StockMetricsGrid } from "@/features/stocks/components/StockMetricsGrid";
import { createPublicStocksSupabaseClient } from "@/features/stocks/server/create-public-stocks-supabase-client";

async function getStockSummaryCached(providerKey: string) {
  "use cache";
  // Summary metrics change slower than prices, so longer cache window is safe.
  cacheLife({ stale: 3600, revalidate: 3600, expire: 86400 });
  cacheTag(`stock:${providerKey}:summary`);

  const supabase = createPublicStocksSupabaseClient();
  return getStockValuationSummaryCached(supabase, providerKey);
}

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
