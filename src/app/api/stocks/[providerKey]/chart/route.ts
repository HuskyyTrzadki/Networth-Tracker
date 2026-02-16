import { getStockChartHttpResponse } from "@/features/stocks/server/get-stock-chart-http-response";
import { getAuthenticatedSupabase } from "@/lib/http/route-handler";

export async function GET(
  request: Request,
  context: Readonly<{ params: Promise<{ providerKey: string }> }>
) {
  const authResult = await getAuthenticatedSupabase();
  if (!authResult.ok) {
    return authResult.response;
  }

  const { providerKey: rawProviderKey } = await context.params;
  return getStockChartHttpResponse({
    request,
    rawProviderKey,
    supabase: authResult.supabase,
    responseMode: "private",
  });
}
