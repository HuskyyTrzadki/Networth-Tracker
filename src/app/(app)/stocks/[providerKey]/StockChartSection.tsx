import { cookies } from "next/headers";

import { getStockChartResponse } from "@/features/stocks";
import { StockChartCard } from "@/features/stocks/components/StockChartCard";
import { createClient } from "@/lib/supabase/server";

export default async function StockChartSection({
  providerKey,
}: Readonly<{
  providerKey: string;
}>) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const initialChart = await getStockChartResponse(supabase, providerKey, "1M", false);

  return <StockChartCard providerKey={providerKey} initialChart={initialChart} />;
}
