import { cacheLife, cacheTag } from "next/cache";

import { getInstrumentRevenueGeoBreakdown } from "@/features/market-data/server/get-instrument-revenue-geo-breakdown";

import { createPublicStocksSupabaseClient } from "./create-public-stocks-supabase-client";

export const getPublicStockRevenueGeoCached = async (providerKey: string) => {
  "use cache";

  cacheLife("days");
  cacheTag(`stock:${providerKey}`);
  cacheTag(`stock:${providerKey}:revenue-geo`);

  try {
    const supabase = createPublicStocksSupabaseClient();
    return await getInstrumentRevenueGeoBreakdown(supabase, providerKey);
  } catch (error) {
    console.error("[stocks][revenue-geo] Failed to load cached geography", {
      providerKey,
      error,
    });
    return null;
  }
};
