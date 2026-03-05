import { cookies } from "next/headers";
import { cacheLife, cacheTag } from "next/cache";

import { getStocksScreenerCards } from "@/features/stocks/server/get-stocks-screener-cards";
import { StocksScreenerInteractive } from "@/features/stocks/components/StocksScreenerInteractive";
import {
  STOCKS_SCREENER_CACHE_TAG,
  STOCKS_WATCHLIST_CACHE_TAG,
} from "@/features/stocks/server/cache-tags";
import { createClient } from "@/lib/supabase/server";

export default async function StocksScreenerSection() {
  const data = await getStocksScreenerSectionDataCached();

  return (
    <StocksScreenerInteractive
      cards={data.cards}
      favoriteProviderKeys={data.favoriteProviderKeys}
    />
  );
}

type StocksScreenerSectionData = Readonly<{
  cards: Awaited<ReturnType<typeof getStocksScreenerCards>>;
  favoriteProviderKeys: readonly string[];
}>;

const getStocksScreenerSectionDataCached =
  async (): Promise<StocksScreenerSectionData> => {
    "use cache: private";

    cacheLife("minutes");
    cacheTag(STOCKS_SCREENER_CACHE_TAG);
    cacheTag(STOCKS_WATCHLIST_CACHE_TAG);
    cacheTag("transactions:all");
    cacheTag("portfolio:all");

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const cards = await getStocksScreenerCards(supabase);
    const favoriteProviderKeys = cards
      .filter((card) => card.isFavorite)
      .map((card) => card.providerKey);

    return {
      cards,
      favoriteProviderKeys,
    };
  };
