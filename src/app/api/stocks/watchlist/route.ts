import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import {
  addStockToWatchlist,
  isStockWatchlistFavorite,
} from "@/features/stocks/server/stock-watchlist";
import { stockWatchlistUpsertSchema } from "@/features/stocks/server/stock-watchlist-schema";
import {
  getAuthenticatedSupabase,
  parseJsonBody,
  toErrorMessage,
} from "@/lib/http/route-handler";

export async function GET(request: Request) {
  const authResult = await getAuthenticatedSupabase();
  if (!authResult.ok) {
    return authResult.response;
  }

  const { searchParams } = new URL(request.url);
  const providerKey = searchParams.get("providerKey")?.trim() ?? "";
  if (!providerKey) {
    return NextResponse.json(
      { message: "Parametr providerKey jest wymagany." },
      { status: 400 }
    );
  }

  try {
    const isFavorite = await isStockWatchlistFavorite(
      authResult.supabase,
      providerKey
    );
    return NextResponse.json({ isFavorite }, { status: 200 });
  } catch (error) {
    const message = toErrorMessage(error);
    return NextResponse.json({ message }, { status: 400 });
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
    return NextResponse.json(
      { message: "Invalid input.", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  try {
    const result = await addStockToWatchlist(
      authResult.supabase,
      authResult.user.id,
      parsed.data
    );

    revalidatePath("/stocks");
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const message = toErrorMessage(error);
    return NextResponse.json({ message }, { status: 400 });
  }
}
