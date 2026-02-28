import { cookies } from "next/headers";

import { getStocksScreenerCards } from "@/features/stocks";
import { StocksScreenerInteractive } from "@/features/stocks/components/StocksScreenerInteractive";
import { listStockWatchlist } from "@/features/stocks/server/stock-watchlist";
import { createClient } from "@/lib/supabase/server";

export default async function StocksScreenerSection() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const [cards, watchlist] = await Promise.all([
    getStocksScreenerCards(supabase),
    listStockWatchlist(supabase),
  ]);

  return (
    <StocksScreenerInteractive
      cards={cards}
      favoriteProviderKeys={watchlist.map((item) => item.providerKey)}
    />
  );
}
