import { unstable_cache } from "next/cache";

import { getStockValuationSummaryCached } from "@/features/stocks";
import { StockMetricsGrid } from "@/features/stocks/components/StockMetricsGrid";
import { createPublicStocksSupabaseClient } from "@/features/stocks/server/create-public-stocks-supabase-client";

const getStockSummaryCached = unstable_cache(
  async (providerKey: string) => {
    // Server-side first paint: cache valuation summary snapshot for stock details.
    const supabase = createPublicStocksSupabaseClient();
    return getStockValuationSummaryCached(supabase, providerKey);
  },
  ["stocks-valuation-summary"],
  { revalidate: 3600 }
);

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
