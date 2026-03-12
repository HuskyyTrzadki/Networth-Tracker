import type { createClient } from "@/lib/supabase/server";

import { getInstrumentDailyPricesCached, getInstrumentQuotesCached } from "@/features/market-data";
import { subtractIsoDays } from "@/features/market-data/server/lib/date-utils";
import { createAdminClient } from "@/lib/supabase/admin";
import type { StockWatchlistUpsertInput } from "./stock-watchlist-schema";

type SupabaseServerClient = ReturnType<typeof createClient>;

export type StockWatchlistRow = Readonly<{
  providerKey: string;
  symbol: string;
  name: string;
  currency: string;
  logoUrl: string | null;
  createdAt: string;
}>;

const mapRow = (
  row: Readonly<{
    provider_key: string;
    symbol: string;
    name: string;
    currency: string;
    logo_url: string | null;
    created_at: string;
  }>
): StockWatchlistRow => ({
  providerKey: row.provider_key,
  symbol: row.symbol,
  name: row.name,
  currency: row.currency,
  logoUrl: row.logo_url,
  createdAt: row.created_at,
});

export async function listStockWatchlist(
  supabase: SupabaseServerClient
): Promise<readonly StockWatchlistRow[]> {
  const { data, error } = await supabase
    .from("stock_watchlist")
    .select("provider_key,symbol,name,currency,logo_url,created_at")
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map(mapRow);
}

export async function isStockWatchlistFavorite(
  supabase: SupabaseServerClient,
  providerKey: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("stock_watchlist")
    .select("id")
    .eq("provider_key", providerKey)
    .limit(1)
    .maybeSingle();

  if (error) return false;
  return Boolean(data);
}

export async function addStockToWatchlist(
  supabase: SupabaseServerClient,
  userId: string,
  input: StockWatchlistUpsertInput
): Promise<Readonly<{ created: boolean }>> {
  const providerKey = input.providerKey.trim();
  const existing = await isStockWatchlistFavorite(supabase, providerKey);
  if (existing) {
    return { created: false };
  }

  const symbol = input.symbol.trim().toUpperCase();
  const currency = input.currency.trim().toUpperCase();

  const { error } = await supabase.from("stock_watchlist").insert({
    user_id: userId,
    provider_key: providerKey,
    symbol,
    name: input.name.trim(),
    currency,
    logo_url: input.logoUrl ?? null,
  });

  if (error) {
    throw new Error("Nie udało się dodać spółki do obserwowanych.");
  }

  try {
    const adminClient = createAdminClient();
    const nowIso = new Date().toISOString();

    const { data: instrumentRow, error: instrumentError } = await adminClient
      .from("instruments")
      .upsert(
        {
          provider: "yahoo",
          provider_key: providerKey,
          symbol,
          name: input.name.trim(),
          currency,
          exchange: null,
          region: null,
          logo_url: input.logoUrl ?? null,
          instrument_type: input.instrumentType ?? null,
          updated_at: nowIso,
        },
        { onConflict: "provider,provider_key" }
      )
      .select("id")
      .single();

    if (instrumentError || !instrumentRow?.id) {
      throw new Error("Nie udało się przygotować danych instrumentu.");
    }

    const quoteRequest = {
      instrumentId: instrumentRow.id,
      provider: "yahoo" as const,
      providerKey,
    };

    const quotesByInstrument = await getInstrumentQuotesCached(
      supabase,
      [quoteRequest],
      { ttlMs: 0 }
    );
    const quote = quotesByInstrument.get(instrumentRow.id) ?? null;
    if (!quote) {
      throw new Error("Brak aktualnego kursu dla wybranego instrumentu.");
    }

    const toDate = nowIso.slice(0, 10);
    const fromDate = subtractIsoDays(toDate, 31);
    const dailyByInstrument = await getInstrumentDailyPricesCached(
      supabase,
      [quoteRequest],
      toDate,
      {
        fetchRangeStart: fromDate,
        fetchRangeEnd: toDate,
      }
    );
    const latestDaily = dailyByInstrument.get(instrumentRow.id) ?? null;
    if (!latestDaily) {
      throw new Error("Brak danych dziennych dla wybranego instrumentu.");
    }
  } catch {
    await supabase.from("stock_watchlist").delete().eq("provider_key", providerKey);
    throw new Error(
      "Nie udało się pobrać danych rynkowych tej spółki. Spróbuj ponownie za chwilę."
    );
  }

  return { created: true };
}

export async function removeStockFromWatchlist(
  supabase: SupabaseServerClient,
  providerKey: string
): Promise<void> {
  const { error } = await supabase
    .from("stock_watchlist")
    .delete()
    .eq("provider_key", providerKey);

  if (error) {
    throw new Error("Nie udało się usunąć spółki z obserwowanych.");
  }
}
