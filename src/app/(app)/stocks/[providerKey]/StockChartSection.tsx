import { unstable_cache } from "next/cache";

import { getStockChartResponse } from "@/features/stocks";
import { StockChartCard } from "@/features/stocks/components/StockChartCard";
import { createPublicStocksSupabaseClient } from "@/features/stocks/server/create-public-stocks-supabase-client";

const getInitialStockChartCached = unstable_cache(
  async (providerKey: string) => {
    // Server-side first paint: cache the default 1M chart payload across requests.
    const supabase = createPublicStocksSupabaseClient();
    return getStockChartResponse(supabase, providerKey, "1M", []);
  },
  ["stocks-initial-chart-1m"],
  { revalidate: 300 }
);

export default async function StockChartSection({
  providerKey,
}: Readonly<{
  providerKey: string;
}>) {
  const initialChart = await getInitialStockChartCached(providerKey);

  return <StockChartCard providerKey={providerKey} initialChart={initialChart} />;
}
