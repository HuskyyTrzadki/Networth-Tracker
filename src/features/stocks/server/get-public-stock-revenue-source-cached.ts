import { cacheLife, cacheTag } from "next/cache";

import { getInstrumentRevenueSourceBreakdown } from "@/features/market-data/server/get-instrument-revenue-source-breakdown";

import { createPublicStocksSupabaseClient } from "./create-public-stocks-supabase-client";

export const getPublicStockRevenueSourceCached = async (providerKey: string) => {
  "use cache";

  cacheLife("days");
  cacheTag(`stock:${providerKey}`);
  cacheTag(`stock:${providerKey}:revenue-source`);

  try {
    const supabase = createPublicStocksSupabaseClient();
    return await getInstrumentRevenueSourceBreakdown(supabase, providerKey);
  } catch (error) {
    console.error("[stocks][revenue-source] Failed to load cached source breakdown", {
      providerKey,
      error,
    });
    return null;
  }
};
