import { cookies } from "next/headers";

import { getStocksScreenerCards } from "@/features/stocks";
import { StockScreenerGrid } from "@/features/stocks/components/StockScreenerGrid";
import { createClient } from "@/lib/supabase/server";

export default async function StocksScreenerSection() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const cards = await getStocksScreenerCards(supabase);

  return <StockScreenerGrid cards={cards} />;
}
