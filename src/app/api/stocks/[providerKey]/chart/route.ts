import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getStockChartResponse, STOCK_CHART_RANGES, type StockChartRange } from "@/features/stocks";
import { createClient } from "@/lib/supabase/server";

const isChartRange = (value: string): value is StockChartRange =>
  STOCK_CHART_RANGES.includes(value as StockChartRange);

const parseIncludePe = (value: string | null) => value === "1";

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
  const rangeRaw = url.searchParams.get("range")?.toUpperCase() ?? "1M";
  if (!isChartRange(rangeRaw)) {
    return NextResponse.json({ message: "Invalid chart range." }, { status: 400 });
  }

  const includePe = parseIncludePe(url.searchParams.get("includePe"));

  try {
    // Route handler: validate input, delegate to stock chart service, return DTO.
    const response = await getStockChartResponse(
      supabase,
      providerKey,
      rangeRaw,
      includePe
    );
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ message }, { status: 400 });
  }
}
