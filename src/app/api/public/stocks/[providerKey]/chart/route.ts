import { createPublicStocksSupabaseClient } from "@/features/stocks/server/create-public-stocks-supabase-client";
import { getStockChartHttpResponse } from "@/features/stocks/server/get-stock-chart-http-response";

export async function GET(
  request: Request,
  context: Readonly<{ params: Promise<{ providerKey: string }> }>
) {
  const supabase = createPublicStocksSupabaseClient();
  const { providerKey: rawProviderKey } = await context.params;

  return getStockChartHttpResponse({
    request,
    rawProviderKey,
    supabase,
    responseMode: "public",
  });
}
