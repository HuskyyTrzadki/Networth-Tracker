import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { getStockChartResponse } from "./get-stock-chart-response";
import { parseStockChartQuery } from "./parse-stock-chart-query";
import type { StockChartRange } from "./types";

type StockChartResponseMode = "public" | "private";

type GetStockChartHttpResponseArgs = Readonly<{
  request: Request;
  rawProviderKey: string;
  supabase: SupabaseClient;
  responseMode: StockChartResponseMode;
}>;

const PUBLIC_CACHE_CONTROL_BY_RANGE: Record<StockChartRange, string> = {
  "1D": "public, s-maxage=30, stale-while-revalidate=120",
  "1M": "public, s-maxage=300, stale-while-revalidate=1800",
  "3M": "public, s-maxage=300, stale-while-revalidate=1800",
  "6M": "public, s-maxage=300, stale-while-revalidate=1800",
  "1Y": "public, s-maxage=300, stale-while-revalidate=1800",
  "3Y": "public, s-maxage=300, stale-while-revalidate=1800",
  "5Y": "public, s-maxage=300, stale-while-revalidate=1800",
  "10Y": "public, s-maxage=300, stale-while-revalidate=1800",
  ALL: "public, s-maxage=1800, stale-while-revalidate=86400",
};

const PRIVATE_CACHE_CONTROL = "private, no-store";

const toSuccessHeaders = (
  mode: StockChartResponseMode,
  requestedRange: StockChartRange,
  resolvedRange: StockChartRange
) =>
  mode === "public"
    ? {
        "Cache-Control": PUBLIC_CACHE_CONTROL_BY_RANGE[requestedRange],
        "X-Cache-Policy": "public-edge",
        "X-Requested-Range": requestedRange,
        "X-Resolved-Range": resolvedRange,
      }
    : {
        "Cache-Control": PRIVATE_CACHE_CONTROL,
        "X-Cache-Policy": "private-no-store",
        "X-Requested-Range": requestedRange,
        "X-Resolved-Range": resolvedRange,
      };

export async function getStockChartHttpResponse({
  request,
  rawProviderKey,
  supabase,
  responseMode,
}: GetStockChartHttpResponseArgs) {
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
    // Backend service call: load cache-first chart + overlay DTO in one place.
    const response = await getStockChartResponse(
      supabase,
      providerKey,
      query.range,
      query.overlays
    );

    return NextResponse.json(response, {
      status: 200,
      headers: toSuccessHeaders(
        responseMode,
        response.requestedRange,
        response.resolvedRange
      ),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { message },
      {
        status: 500,
        headers: { "Cache-Control": PRIVATE_CACHE_CONTROL },
      }
    );
  }
}
