import { cacheLife, cacheTag } from "next/cache";

import { getStockChartResponse } from "@/features/stocks";
import { StockChartCard } from "@/features/stocks/components/StockChartCard";
import { createPublicStocksSupabaseClient } from "@/features/stocks/server/create-public-stocks-supabase-client";

const getInitialStockChartCached = async (providerKey: string) => {
  "use cache";

  // First-paint stock chart can be stale briefly; client fetch still refreshes ranges on demand.
  cacheLife("minutes");
  cacheTag(`stock:${providerKey}`);
  cacheTag(`stock:${providerKey}:chart:1m`);

  const supabase = createPublicStocksSupabaseClient();
  return getStockChartResponse(supabase, providerKey, "1M", []);
};

export default async function StockChartSection({
  providerKey,
}: Readonly<{
  providerKey: string;
}>) {
  const initialChart = await getInitialStockChartCached(providerKey);

  return <StockChartCard providerKey={providerKey} initialChart={initialChart} />;
}
