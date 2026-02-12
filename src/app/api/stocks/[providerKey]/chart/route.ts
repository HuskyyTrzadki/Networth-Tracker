import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getStockChartResponse } from "@/features/stocks";
import { parseStockChartQuery } from "@/features/stocks/server/parse-stock-chart-query";
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
  const providerKey = rawProviderKey.trim();
  if (!providerKey) {
    return NextResponse.json({ message: "Missing providerKey." }, { status: 400 });
  }

  const url = new URL(request.url);
  const query = parseStockChartQuery(url.searchParams);
  if (!query.ok) {
    return NextResponse.json({ message: query.message }, { status: 400 });
  }

  try {
    // Route handler: validate input, delegate to stock chart service, return DTO.
    const response = await getStockChartResponse(
      supabase,
      providerKey,
      query.range,
      query.overlays
    );
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ message }, { status: 400 });
  }
}
