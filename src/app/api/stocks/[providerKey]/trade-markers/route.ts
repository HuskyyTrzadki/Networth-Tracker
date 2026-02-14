import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { listStockTradeMarkers } from "@/features/stocks/server/list-stock-trade-markers";
import { createClient } from "@/lib/supabase/server";

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
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: authData, error: authError } = await supabase.auth.getUser();
  const user = authData?.user ?? null;
  if (authError || !user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { providerKey: rawProviderKey } = await context.params;
  const providerKey = decodeProviderKey(rawProviderKey);
  if (!providerKey) {
    return NextResponse.json({ message: "Invalid providerKey." }, { status: 400 });
  }

  try {
    const markers = await listStockTradeMarkers(supabase, providerKey);
    return NextResponse.json({ markers }, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load stock trade markers.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
