import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import {
  STOCKS_SCREENER_CACHE_TAG,
  STOCKS_WATCHLIST_CACHE_TAG,
} from "@/features/stocks/server/cache-tags";
import { removeStockFromWatchlist } from "@/features/stocks/server/stock-watchlist";
import { apiError, apiFromUnknownError } from "@/lib/http/api-error";
import { getAuthenticatedSupabase } from "@/lib/http/route-handler";

type Params = Promise<{
  providerKey: string;
}>;

const decodeProviderKey = (raw: string): string => {
  try {
    return decodeURIComponent(raw).trim();
  } catch {
    return raw.trim();
  }
};

export async function DELETE(
  _request: Request,
  context: Readonly<{ params: Params }>
) {
  const authResult = await getAuthenticatedSupabase();
  if (!authResult.ok) {
    return authResult.response;
  }

  const params = await context.params;
  const providerKey = decodeProviderKey(params.providerKey);
  if (!providerKey) {
    return apiError({
      status: 400,
      code: "PROVIDER_KEY_REQUIRED",
      message: "Parametr providerKey jest wymagany.",
    });
  }

  try {
    await removeStockFromWatchlist(authResult.supabase, providerKey);
    revalidateTag(STOCKS_WATCHLIST_CACHE_TAG, "max");
    revalidateTag(STOCKS_SCREENER_CACHE_TAG, "max");
    revalidatePath("/stocks");
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    return apiFromUnknownError({
      error,
      fallbackCode: "WATCHLIST_REMOVE_FAILED",
    });
  }
}
