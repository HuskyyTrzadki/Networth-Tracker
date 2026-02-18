import { cacheLife, cacheTag } from "next/cache";

import { createPublicStocksSupabaseClient } from "./create-public-stocks-supabase-client";
import { getStockValuationSummaryCached } from "./get-stock-valuation-summary-cached";

export const getPublicStockSummaryCached = async (providerKey: string) => {
  "use cache";

  cacheLife("hours");
  cacheTag(`stock:${providerKey}`);
  cacheTag(`stock:${providerKey}:summary`);

  const supabase = createPublicStocksSupabaseClient();
  return getStockValuationSummaryCached(supabase, providerKey);
};
