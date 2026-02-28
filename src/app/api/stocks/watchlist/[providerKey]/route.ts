import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { removeStockFromWatchlist } from "@/features/stocks/server/stock-watchlist";
import { getAuthenticatedSupabase, toErrorMessage } from "@/lib/http/route-handler";

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
    return NextResponse.json(
      { message: "Parametr providerKey jest wymagany." },
      { status: 400 }
    );
  }

  try {
    await removeStockFromWatchlist(authResult.supabase, providerKey);
    revalidatePath("/stocks");
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    const message = toErrorMessage(error);
    return NextResponse.json({ message }, { status: 400 });
  }
}
