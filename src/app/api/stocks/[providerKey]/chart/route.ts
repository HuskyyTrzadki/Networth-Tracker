import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getStockChartHttpResponse } from "@/features/stocks/server/get-stock-chart-http-response";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  context: Readonly<{ params: Promise<{ providerKey: string }> }>
) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: authData, error: authError } = await supabase.auth.getUser();
  const user = authData?.user ?? null;
  if (authError || !user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { providerKey: rawProviderKey } = await context.params;
  return getStockChartHttpResponse({
    request,
    rawProviderKey,
    supabase,
    responseMode: "private",
  });
}
