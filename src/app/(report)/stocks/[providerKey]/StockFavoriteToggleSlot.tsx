import { cacheLife, cacheTag } from "next/cache";
import { cookies } from "next/headers";

import { StockFavoriteToggleButton } from "@/features/stocks/components/StockFavoriteToggleButton";
import { isStockWatchlistFavorite } from "@/features/stocks/server/stock-watchlist";
import { STOCKS_WATCHLIST_CACHE_TAG } from "@/features/stocks/server/cache-tags";
import { createClient } from "@/lib/supabase/server";

type StockFavoriteToggleSlotProps = Readonly<{
  providerKey: string;
  symbol: string;
  name: string;
  currency: string;
  logoUrl: string | null;
}>;

const getFavoriteStatePrivateCached = async (providerKey: string): Promise<boolean> => {
  "use cache: private";

  cacheLife("minutes");
  cacheTag(STOCKS_WATCHLIST_CACHE_TAG);

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data, error } = await supabase.auth.getUser();
  const user = data.user ?? null;

  if (error || !user) {
    return false;
  }

  try {
    return await isStockWatchlistFavorite(supabase, providerKey);
  } catch {
    return false;
  }
};

export default async function StockFavoriteToggleSlot({
  providerKey,
  symbol,
  name,
  currency,
  logoUrl,
}: StockFavoriteToggleSlotProps) {
  const initialIsFavorite = await getFavoriteStatePrivateCached(providerKey);

  return (
    <StockFavoriteToggleButton
      initialIsFavorite={initialIsFavorite}
      providerKey={providerKey}
      symbol={symbol}
      name={name}
      currency={currency}
      logoUrl={logoUrl}
    />
  );
}
