import { cacheLife, cacheTag } from "next/cache";
import { cookies } from "next/headers";

import { getStockChartResponse } from "@/features/stocks";
import { StockChartCard } from "@/features/stocks/components/StockChartCard";
import { createPublicStocksSupabaseClient } from "@/features/stocks/server/create-public-stocks-supabase-client";
import { listStockTradeMarkers } from "@/features/stocks/server/list-stock-trade-markers";
import { createClient } from "@/lib/supabase/server";

const getInitialStockChartCached = async (providerKey: string) => {
  "use cache";

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
  const [initialChart, initialTradeMarkers] = await Promise.all([
    getInitialStockChartCached(providerKey),
    getInitialTradeMarkers(providerKey),
  ]);

  return (
    <StockChartCard
      providerKey={providerKey}
      initialChart={initialChart}
      initialTradeMarkers={initialTradeMarkers}
    />
  );
}

const getInitialTradeMarkers = async (providerKey: string) => {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data, error } = await supabase.auth.getUser();
  const user = data.user ?? null;

  if (error || !user) {
    return [];
  }

  try {
    return await listStockTradeMarkers(supabase, providerKey);
  } catch {
    return [];
  }
};
