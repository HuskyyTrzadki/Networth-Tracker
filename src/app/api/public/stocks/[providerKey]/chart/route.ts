import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { getStockChartHttpResponse } from "@/features/stocks/server/get-stock-chart-http-response";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { tryCreateAdminClient } from "@/lib/supabase/admin";

const createPublicSupabaseClient = () => {
  const adminClient = tryCreateAdminClient();
  if (adminClient) {
    return adminClient;
  }

  // Public market-data route: no user session needed, use a stateless client.
  const { supabaseUrl, supabaseKey } = getSupabaseEnv();
  return createSupabaseClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });
};

export async function GET(
  request: Request,
  context: Readonly<{ params: Promise<{ providerKey: string }> }>
) {
  const supabase = createPublicSupabaseClient();
  const { providerKey: rawProviderKey } = await context.params;

  return getStockChartHttpResponse({
    request,
    rawProviderKey,
    supabase,
    responseMode: "public",
  });
}
