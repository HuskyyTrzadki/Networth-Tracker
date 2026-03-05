import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import {
  addStockToWatchlist,
  isStockWatchlistFavorite,
} from "@/features/stocks/server/stock-watchlist";
import {
  STOCKS_SCREENER_CACHE_TAG,
  STOCKS_WATCHLIST_CACHE_TAG,
} from "@/features/stocks/server/cache-tags";
import { stockWatchlistUpsertSchema } from "@/features/stocks/server/stock-watchlist-schema";
import {
  apiError,
  apiFromUnknownError,
  apiValidationError,
} from "@/lib/http/api-error";
import {
  getAuthenticatedSupabase,
  parseJsonBody,
} from "@/lib/http/route-handler";

export async function GET(request: Request) {
  const authResult = await getAuthenticatedSupabase();
  if (!authResult.ok) {
    return authResult.response;
  }

  const { searchParams } = new URL(request.url);
  const providerKey = searchParams.get("providerKey")?.trim() ?? "";
  if (!providerKey) {
    return apiError({
      status: 400,
      code: "PROVIDER_KEY_REQUIRED",
      message: "Parametr providerKey jest wymagany.",
    });
  }

  try {
    const isFavorite = await isStockWatchlistFavorite(
      authResult.supabase,
      providerKey
    );
    return NextResponse.json({ isFavorite }, { status: 200 });
  } catch (error) {
    return apiFromUnknownError({
      error,
      request,
      fallbackCode: "WATCHLIST_STATUS_FAILED",
    });
  }
}

export async function POST(request: Request) {
  // Route handler: validate input, call the feature service, return JSON.
  const authResult = await getAuthenticatedSupabase();
  if (!authResult.ok) {
    return authResult.response;
  }

  const parsedBody = await parseJsonBody(request);
  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const parsed = stockWatchlistUpsertSchema.safeParse(parsedBody.body);
  if (!parsed.success) {
    return apiValidationError(parsed.error.issues, { request });
  }

  try {
    const result = await addStockToWatchlist(
      authResult.supabase,
      authResult.user.id,
      parsed.data
    );

    revalidateTag(STOCKS_WATCHLIST_CACHE_TAG, "max");
    revalidateTag(STOCKS_SCREENER_CACHE_TAG, "max");
    revalidatePath("/stocks");
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return apiFromUnknownError({
      error,
      request,
      fallbackCode: "WATCHLIST_ADD_FAILED",
    });
  }
}
