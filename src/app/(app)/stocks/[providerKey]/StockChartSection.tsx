import { cacheLife, cacheTag } from "next/cache";

import { getStockChartResponse } from "@/features/stocks";
import { StockChartCard } from "@/features/stocks/components/StockChartCard";
import { createPublicStocksSupabaseClient } from "@/features/stocks/server/create-public-stocks-supabase-client";

async function getInitialStockChartCached(providerKey: string) {
  "use cache";
  // Public first-paint data: 1M chart can be cached and refreshed in the background.
  cacheLife({ stale: 300, revalidate: 300, expire: 1800 });
  cacheTag(`stock:${providerKey}:chart:1m`);

  const supabase = createPublicStocksSupabaseClient();
  return getStockChartResponse(supabase, providerKey, "1M", []);
}

export default async function StockChartSection({
  providerKey,
}: Readonly<{
  providerKey: string;
}>) {
  const initialChart = await getInitialStockChartCached(providerKey);

  return <StockChartCard providerKey={providerKey} initialChart={initialChart} />;
}
