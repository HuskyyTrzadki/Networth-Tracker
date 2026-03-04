import { createPublicStocksSupabaseClient } from "@/features/stocks/server/create-public-stocks-supabase-client";
import { getStockChartHttpResponse } from "@/features/stocks/server/get-stock-chart-http-response";
import { withRateLimit } from "@/lib/http/rate-limit";

export async function GET(
  request: Request,
  context: Readonly<{ params: Promise<{ providerKey: string }> }>
) {
  const rateLimit = withRateLimit(request, {
    id: "api:public-stock-chart",
    limit: 120,
    windowMs: 60_000,
  });
  if (!rateLimit.ok) {
    return rateLimit.response;
  }

  const supabase = createPublicStocksSupabaseClient();
  const { providerKey: rawProviderKey } = await context.params;

  const response = await getStockChartHttpResponse({
    request,
    rawProviderKey,
    supabase,
    responseMode: "public",
  });

  Object.entries(rateLimit.headers).forEach(([name, value]) => {
    response.headers.set(name, value);
  });

  return response;
}
