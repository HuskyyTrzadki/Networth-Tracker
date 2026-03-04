import { NextResponse } from "next/server";

import { listStockTradeMarkers } from "@/features/stocks/server/list-stock-trade-markers";
import { apiError, apiFromUnknownError } from "@/lib/http/api-error";
import {
  getAuthenticatedSupabase,
} from "@/lib/http/route-handler";

const decodeProviderKey = (rawProviderKey: string): string | null => {
  try {
    const decoded = decodeURIComponent(rawProviderKey).trim();
    return decoded.length > 0 ? decoded : null;
  } catch {
    return null;
  }
};

export async function GET(
  _request: Request,
  context: Readonly<{ params: Promise<{ providerKey: string }> }>
) {
  const authResult = await getAuthenticatedSupabase();
  if (!authResult.ok) {
    return authResult.response;
  }

  const { providerKey: rawProviderKey } = await context.params;
  const providerKey = decodeProviderKey(rawProviderKey);
  if (!providerKey) {
    return apiError({
      status: 400,
      code: "VALIDATION_ERROR",
      message: "Invalid providerKey.",
    });
  }

  try {
    const markers = await listStockTradeMarkers(authResult.supabase, providerKey);
    return NextResponse.json({ markers }, { status: 200 });
  } catch (error) {
    return apiFromUnknownError({
      error,
      fallbackCode: "TRADE_MARKERS_LOAD_FAILED",
    });
  }
}
