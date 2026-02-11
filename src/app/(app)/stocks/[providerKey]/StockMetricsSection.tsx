import { cookies } from "next/headers";

import { getStockValuationSummaryCached } from "@/features/stocks";
import { StockMetricsGrid } from "@/features/stocks/components/StockMetricsGrid";
import { createClient } from "@/lib/supabase/server";

export default async function StockMetricsSection({
  providerKey,
  metricCurrency,
}: Readonly<{
  providerKey: string;
  metricCurrency: string;
}>) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const summary = await getStockValuationSummaryCached(supabase, providerKey);

  return <StockMetricsGrid summary={summary} currency={metricCurrency} />;
}
